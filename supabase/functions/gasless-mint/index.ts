/**
 * Sovryn Minting Relayer — Supabase Edge Function.
 * Called by the app after Face Pulse + Fingerprint. Uses env vars for secrets.
 *
 * Secret Management: VIDA_MINTER_PRIVATE_KEY, VIDA_TOKEN_ADDRESS (Supabase Edge Function secrets).
 * Flow: Verify is_fully_verified → connect RSK_RPC_URL → gas check → sign mint tx → return Rootstock tx hash (Proof of Wealth).
 */

import { createClient } from 'npm:@supabase/supabase-js@2';
import { Contract, Wallet, JsonRpcProvider, parseUnits, formatEther } from 'npm:ethers@6';

const VIDA_MINT_ABI = [
  'function mint(address to, uint256 amount) external',
  'function mintTo(address recipient, uint256 amount) external',
  'function decimals() view returns (uint8)',
];

const RSK_RPC_DEFAULT = 'https://public-node.rsk.co';
const RSK_BLOCK_EXPLORER = 'https://explorer.rsk.co';
/** Minimum RBTC balance for relayer to pay gas (default 0.001 RBTC). */
const RELAYER_MIN_RBTC_DEFAULT = '0.001';

interface GaslessMintRequest {
  phone: string;
  recipientAddress: string;
}

interface GaslessMintResponse {
  ok: true;
  txHash: string;
  recipientAddress: string;
  /** Proof of Wealth: link to view tx on Rootstock explorer. */
  blockExplorerUrl: string;
  /** VIDA amount minted (e.g. 5.00). */
  amountMinted: string;
}
interface GaslessMintError {
  ok: false;
  error: string;
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors() });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as GaslessMintRequest;
    const phone = typeof body?.phone === 'string' ? body.phone.trim() : '';
    const recipientAddress = typeof body?.recipientAddress === 'string' ? body.recipientAddress.trim() : '';

    if (!phone || !recipientAddress) {
      return json({ ok: false, error: 'phone and recipientAddress required' }, 400);
    }

    // Secret Management: read from Supabase Edge Function secrets
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const privateKey = Deno.env.get('VIDA_MINTER_PRIVATE_KEY')?.trim();
    const vidaTokenAddress = Deno.env.get('VIDA_TOKEN_ADDRESS')?.trim();
    const rpcUrl = (Deno.env.get('RSK_RPC_URL') ?? RSK_RPC_DEFAULT).trim();
    const mintAmountRaw = Deno.env.get('VIDA_MINT_AMOUNT');
    const mintAmount = mintAmountRaw != null && mintAmountRaw !== '' ? Number(mintAmountRaw) : 5;
    const minRbtcStr = (Deno.env.get('RELAYER_MIN_RBTC') ?? RELAYER_MIN_RBTC_DEFAULT).trim();
    const adminAlertWebhook = Deno.env.get('ADMIN_ALERT_WEBHOOK_URL')?.trim();

    if (!supabaseUrl || !serviceRoleKey) {
      return json({ ok: false, error: 'Supabase config missing' }, 503);
    }
    if (!privateKey) {
      return json({ ok: false, error: 'VIDA_MINTER_PRIVATE_KEY not set' }, 503);
    }
    if (!vidaTokenAddress || vidaTokenAddress === '0x0000000000000000000000000000000000000000') {
      return json({ ok: false, error: 'VIDA_TOKEN_ADDRESS not set' }, 503);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Minting Trigger: verify user's is_fully_verified status in profiles (user_profiles)
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('is_fully_verified, vida_mint_tx_hash')
      .eq('phone_number', phone)
      .maybeSingle();

    if (profileError) {
      return json({ ok: false, error: profileError.message ?? 'Failed to load profile' }, 502);
    }
    if (!profile?.is_fully_verified) {
      return json({ ok: false, error: 'User is not fully verified (is_fully_verified must be true). Complete Face Pulse + Fingerprint first.' }, 403);
    }
    if (profile.vida_mint_tx_hash) {
      const existingUrl = `${RSK_BLOCK_EXPLORER}/tx/${profile.vida_mint_tx_hash}`;
      return json({
        ok: true,
        txHash: profile.vida_mint_tx_hash,
        recipientAddress,
        blockExplorerUrl: existingUrl,
        amountMinted: String(mintAmount),
      });
    }

    // Connect to RSK_RPC_URL and create signer from VIDA_MINTER_PRIVATE_KEY
    const provider = new JsonRpcProvider(rpcUrl);
    const signer = new Wallet(privateKey, provider);
    const relayerAddress = await signer.getAddress();

    // Gas Check: ensure Relayer Wallet has enough RBTC to pay the fee
    const balanceWei = await provider.getBalance(relayerAddress);
    const minWei = parseUnits(minRbtcStr, 18);
    if (balanceWei < minWei) {
      const balanceRbtc = formatEther(balanceWei);
      const alertPayload = {
        alert: 'RELAYER_GAS_LOW',
        relayerAddress,
        balanceRbtc,
        balanceWei: balanceWei.toString(),
        thresholdRbtc: minRbtcStr,
        message: `Sovryn Relayer low on RBTC. Balance: ${balanceRbtc} RBTC. Top up ${relayerAddress} to continue gasless mints.`,
      };
      if (adminAlertWebhook) {
        try {
          await fetch(adminAlertWebhook, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(alertPayload),
          });
        } catch (e) {
          console.error('[gasless-mint] Admin webhook failed:', e);
        }
      }
      try {
        await supabase.from('relayer_gas_alerts').insert({
          relayer_address: relayerAddress,
          balance_rbtc: balanceRbtc,
          threshold_rbtc: minRbtcStr,
          created_at: new Date().toISOString(),
        });
      } catch {
        // Table may not exist; ignore
      }
      return json(
        { ok: false, error: `Relayer wallet has insufficient RBTC for gas (balance: ${balanceRbtc} RBTC). Admin has been notified. Please try again later.` },
        503
      );
    }

    // Smart Contract Call: execute mint(recipient, amount) with VIDA_MINT_AMOUNT (5.00)
    const contract = new Contract(vidaTokenAddress, VIDA_MINT_ABI, signer);
    const decimals = await contract.decimals().catch(() => 18);
    const amountWei = parseUnits(String(mintAmount), Number(decimals));

    let tx: { hash: string; wait: () => Promise<{ hash: string }> };
    try {
      tx = await contract.mintTo(recipientAddress, amountWei);
    } catch {
      tx = await contract.mint(recipientAddress, amountWei);
    }

    const receipt = await tx.wait();
    const txHash = receipt?.hash ?? tx.hash;

    // Persist receipt
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        vida_mint_tx_hash: txHash,
        updated_at: new Date().toISOString(),
      })
      .eq('phone_number', phone);

    if (updateError) {
      const { data: rpcData } = await supabase.rpc('save_vida_mint_tx_hash', {
        p_phone_number: phone,
        p_tx_hash: txHash,
      });
      if (rpcData?.ok !== true) {
        console.warn('[gasless-mint] Could not save tx hash:', rpcData?.error ?? updateError.message);
      }
    }

    // Receipt: return Rootstock transaction hash for Proof of Wealth on block explorer
    const blockExplorerUrl = `${RSK_BLOCK_EXPLORER}/tx/${txHash}`;
    return json({
      ok: true,
      txHash,
      recipientAddress,
      blockExplorerUrl,
      amountMinted: String(mintAmount),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[gasless-mint]', msg);
    return json({ ok: false, error: msg }, 500);
  }
});

function cors(): HeadersInit {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

function json(body: GaslessMintResponse | GaslessMintError, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors() },
  });
}

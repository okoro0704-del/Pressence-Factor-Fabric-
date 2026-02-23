/**
 * Sovryn Gas Relayer — Supabase Edge Function
 * Provides RBTC gas for users who don't have enough for transactions
 * 
 * Called by: web/lib/sovryn/relayerGas.ts
 * Flow: Verify user → check relayer balance → send RBTC → return tx hash
 * 
 * Environment Variables (Supabase Edge Function Secrets):
 * - RELAYER_PRIVATE_KEY: Private key of the relayer wallet (has RBTC)
 * - RSK_RPC_URL: Rootstock RPC endpoint (default: https://public-node.rsk.co)
 * - GAS_DRIP_AMOUNT: Amount of RBTC to send per drip (default: 0.001)
 * - RELAYER_MIN_RBTC: Minimum RBTC balance for relayer (default: 0.01)
 */

import { Contract, Wallet, JsonRpcProvider, parseEther, formatEther } from 'npm:ethers@6';

const RSK_RPC_DEFAULT = 'https://public-node.rsk.co';
const GAS_DRIP_AMOUNT_DEFAULT = '0.001'; // 0.001 RBTC per drip
const RELAYER_MIN_RBTC_DEFAULT = '0.01'; // Keep at least 0.01 RBTC in relayer
const MIN_RBTC_FOR_GAS = '0.0001'; // User needs at least this much

interface RelayerGasRequest {
  phone: string;
  recipientAddress: string;
}

interface RelayerGasResponse {
  ok: true;
  txHash: string;
  amount: string;
  recipientAddress: string;
}

interface RelayerGasError {
  ok: false;
  error: string;
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors() });
  }

  if (req.method !== 'POST') {
    return json({ ok: false, error: 'Method not allowed' }, 405);
  }

  try {
    const body = (await req.json()) as RelayerGasRequest;
    const { phone, recipientAddress } = body;

    if (!phone?.trim() || !recipientAddress?.trim()) {
      return json({ ok: false, error: 'phone and recipientAddress required' }, 400);
    }

    // Validate recipient address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(recipientAddress)) {
      return json({ ok: false, error: 'Invalid recipient address format' }, 400);
    }

    // Get environment variables
    const relayerPrivateKey = Deno.env.get('RELAYER_PRIVATE_KEY')?.trim();
    if (!relayerPrivateKey) {
      return json({ ok: false, error: 'Relayer not configured (RELAYER_PRIVATE_KEY missing)' }, 503);
    }

    const rskRpcUrl = (Deno.env.get('RSK_RPC_URL') ?? RSK_RPC_DEFAULT).trim();
    const gasDripAmount = (Deno.env.get('GAS_DRIP_AMOUNT') ?? GAS_DRIP_AMOUNT_DEFAULT).trim();
    const minRbtcStr = (Deno.env.get('RELAYER_MIN_RBTC') ?? RELAYER_MIN_RBTC_DEFAULT).trim();

    // Connect to RSK
    const provider = new JsonRpcProvider(rskRpcUrl);
    const relayerWallet = new Wallet(relayerPrivateKey, provider);
    const relayerAddress = await relayerWallet.getAddress();

    // Check relayer balance
    const relayerBalance = await provider.getBalance(relayerAddress);
    const minBalance = parseEther(minRbtcStr);
    if (relayerBalance < minBalance) {
      const balanceRbtc = formatEther(relayerBalance);
      console.error(`[relayer-gas] Relayer wallet low on RBTC: ${balanceRbtc} RBTC`);
      return json(
        {
          ok: false,
          error: `Relayer wallet low on RBTC (${balanceRbtc} RBTC). Admin has been notified.`,
        },
        503
      );
    }

    // Check recipient balance - only drip if they have less than MIN_RBTC_FOR_GAS
    const recipientBalance = await provider.getBalance(recipientAddress);
    const minRbtcForGas = parseEther(MIN_RBTC_FOR_GAS);
    if (recipientBalance >= minRbtcForGas) {
      return json({
        ok: true,
        txHash: '',
        amount: '0',
        recipientAddress,
        message: 'Recipient already has sufficient gas',
      });
    }

    // Send gas drip
    const tx = await relayerWallet.sendTransaction({
      to: recipientAddress,
      value: parseEther(gasDripAmount),
    });

    // Wait for confirmation
    const receipt = await tx.wait();

    if (!receipt || receipt.status !== 1) {
      return json({ ok: false, error: 'Transaction failed' }, 500);
    }

    return json({
      ok: true,
      txHash: receipt.hash,
      amount: gasDripAmount,
      recipientAddress,
    });
  } catch (e) {
    const err = e as Error;
    console.error('[relayer-gas] Error:', err);
    return json({ ok: false, error: err.message ?? 'Gas drip failed' }, 500);
  }
});

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

function json(data: RelayerGasResponse | RelayerGasError | Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors(), 'Content-Type': 'application/json' },
  });
}


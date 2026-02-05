/**
 * PFF × Sovryn — Connect Supabase Verified status to Sovryn Smart Contract.
 * When is_fully_verified is TRUE, mint 5 VIDA to the derived RSK wallet and save transaction_hash to Supabase.
 */

import { Contract, Wallet, JsonRpcProvider, parseUnits } from 'ethers';
import { getSupabase } from '../supabase';
import { RSK_MAINNET, VIDA_TOKEN_ADDRESS, VIDA_MINT_AMOUNT } from './config';
import { deriveRSKWalletFromSeed } from './derivedWallet';

// Minimal ABI: mint(to, amount) or mintTo(recipient, amount). Adjust to actual Sovryn VIDA contract.
const VIDA_MINT_ABI = [
  'function mint(address to, uint256 amount) external',
  'function mintTo(address recipient, uint256 amount) external',
  'function decimals() view returns (uint8)',
];

export type MintVidaResult =
  | { ok: true; txHash: string; recipientAddress: string }
  | { ok: false; error: string };

/**
 * Mint 5 VIDA to the derived RSK wallet address and save transaction_hash to Supabase.
 * Uses recovery_seed_encrypted (decrypted locally) to derive the wallet; calls Sovryn contract; persists receipt.
 */
export async function mintVidaToken(phoneNumber: string): Promise<MintVidaResult> {
  const trimmed = phoneNumber?.trim();
  if (!trimmed) return { ok: false, error: 'Phone number required' };

  const derived = await deriveRSKWalletFromSeed(trimmed);
  if (!derived.ok) return { ok: false, error: derived.error };
  const recipientAddress = derived.address;

  const rpcUrl =
    (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_RSK_RPC_URL?.trim()) ||
    RSK_MAINNET.rpc;
  const minterKey =
    typeof process !== 'undefined' && process.env.VIDA_MINTER_PRIVATE_KEY?.trim();

  if (!minterKey) {
    return { ok: false, error: 'VIDA_MINTER_PRIVATE_KEY not configured' };
  }

  if (!VIDA_TOKEN_ADDRESS || VIDA_TOKEN_ADDRESS === '0x0000000000000000000000000000000000000000') {
    return { ok: false, error: 'VIDA token contract address not configured' };
  }

  try {
    const provider = new JsonRpcProvider(rpcUrl);
    const signer = new Wallet(minterKey, provider);
    const contract = new Contract(VIDA_TOKEN_ADDRESS, VIDA_MINT_ABI, signer);

    const decimals = await contract.decimals().catch(() => 18);
    const amountWei = parseUnits(VIDA_MINT_AMOUNT.toString(), Number(decimals));

    let tx: { hash: string; wait: () => Promise<{ hash: string }> };
    try {
      tx = await contract.mintTo(recipientAddress, amountWei);
    } catch {
      tx = await contract.mint(recipientAddress, amountWei);
    }

    const receipt = await tx.wait();
    const txHash = receipt?.hash ?? tx.hash;

    const supabase = getSupabase();
    if (supabase) {
      const { error } = await (supabase as any)
        .from('user_profiles')
        .update({
          vida_mint_tx_hash: txHash,
          updated_at: new Date().toISOString(),
        })
        .eq('phone_number', trimmed);
      if (error) {
        const { data: rpcData } = await (supabase as any).rpc('save_vida_mint_tx_hash', {
          p_phone_number: trimmed,
          p_tx_hash: txHash,
        });
        if (rpcData?.ok !== true) {
          console.warn('[mintVidaToken] Could not save receipt to Supabase:', rpcData?.error ?? error.message);
        }
      }
    }

    return { ok: true, txHash, recipientAddress };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

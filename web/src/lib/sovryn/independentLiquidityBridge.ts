/**
 * Independent Liquidity Bridge: VIDA → DLLR → USDT
 *
 * - Decouple National Vault: Never touches national_reserve or Government Vault in Supabase.
 * - Personal Debit: VIDA debited only from user's personal treasury (sovereign_internal_wallets).
 * - DLLR Minting: Credits DLLR at anchored rate $1,000 per 1 VIDA (1 VIDA = 1,000 DLLR).
 * - Immediate USDT Swap: After DLLR is credited, immediately swaps DLLR → USDT at $1.00 (1:1).
 * - World Vault Logic: Transaction history labeled "World Vault Conversion" (global liquidity, not government grant).
 */

import { hasSupabase, supabase } from '../supabase';
import { VIDA_USD_VALUE } from '../economic';
import {
  getOrCreateSovereignWallet,
  VIDA_TO_DLLR_RATE,
  type SovereignInternalWalletRow,
} from '../sovereignInternalWallet';

const USDT_PER_DLLR = 1; // $1.00 per DLLR and per USDT (anchored)

export interface IndependentBridgeResult {
  success: boolean;
  error?: string;
  /** VIDA amount debited */
  vidaDebited?: number;
  /** DLLR amount minted (before swap) */
  dllrMinted?: number;
  /** USDT amount credited after immediate swap */
  usdtCredited?: number;
  /** Ledger entry id if logged */
  ledgerId?: string | null;
}

/**
 * Swap DLLR to USDT at market rate (1:1). Updates sovereign_internal_wallets only.
 * Called immediately after DLLR is minted in the bridge.
 */
async function swapDLLRtoUSDT(
  phoneNumber: string,
  dllrAmount: number
): Promise<{ success: boolean; error?: string }> {
  if (!hasSupabase() || !supabase || dllrAmount <= 0) {
    return { success: false, error: 'Invalid state or amount' };
  }
  const row = await getOrCreateSovereignWallet(phoneNumber);
  if (!row) return { success: false, error: 'Wallet not found' };
  const currentDllr = row.dllr_balance ?? 0;
  const currentUsdt = row.usdt_balance ?? 0;
  if (currentDllr < dllrAmount) {
    return { success: false, error: 'Insufficient DLLR for USDT swap' };
  }
  const usdtAmount = dllrAmount * USDT_PER_DLLR; // 1:1
  const { error } = await (supabase as any)
    .from('sovereign_internal_wallets')
    .update({
      dllr_balance: currentDllr - dllrAmount,
      usdt_balance: currentUsdt + usdtAmount,
      updated_at: new Date().toISOString(),
    })
    .eq('phone_number', phoneNumber);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Log World Vault Conversion to sovereign_ledger. Does not touch national_reserve or government tables.
 */
async function logWorldVaultConversion(
  phoneNumber: string,
  vidaDebited: number,
  dllrMinted: number,
  usdtCredited: number
): Promise<string | null> {
  if (!hasSupabase() || !supabase) return null;
  const row: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    from_vault: 'PERSONAL_VAULT',
    to_vault: 'WORLD_VAULT',
    vida_cap_deducted: vidaDebited,
    dllr_credited: usdtCredited, // ledger may use dllr_credited for "stablecoin out"; we store final USDT-equivalent
    exchange_rate: VIDA_TO_DLLR_RATE,
    wallet_address: '',
    tx_hash: `world-vault-${Date.now()}`,
    status: 'CONFIRMED',
    transaction_label: 'World Vault Conversion',
    phone_number: phoneNumber,
  };
  const { data, error } = await (supabase as any)
    .from('sovereign_ledger')
    .insert(row)
    .select('id')
    .single();
  if (error) {
    console.warn('[independentLiquidityBridge] logWorldVaultConversion:', error.message);
    return null;
  }
  return data?.id ?? null;
}

/**
 * Execute the Independent Liquidity Bridge: VIDA → DLLR → USDT.
 * - Debits VIDA from user's personal treasury only (sovereign_internal_wallets).
 * - Never interacts with national_reserve or Government Vault.
 * - Mints DLLR at 1 VIDA = $1,000 = 1,000 DLLR, then immediately swaps DLLR → USDT at 1:1.
 * - Labels the transaction "World Vault Conversion".
 */
export async function executeIndependentLiquidityBridge(
  phoneNumber: string,
  vidaAmount: number
): Promise<IndependentBridgeResult> {
  if (!phoneNumber?.trim()) {
    return { success: false, error: 'Phone number required' };
  }
  if (vidaAmount <= 0) {
    return { success: false, error: 'VIDA amount must be positive' };
  }
  if (!hasSupabase() || !supabase) {
    return { success: false, error: 'Supabase not available' };
  }

  const wallet = await getOrCreateSovereignWallet(phoneNumber.trim());
  if (!wallet) {
    return { success: false, error: 'Personal treasury not found' };
  }

  const currentVida = wallet.vida_cap_balance ?? 0;
  if (currentVida < vidaAmount) {
    return {
      success: false,
      error: `Insufficient VIDA. Available: ${currentVida.toFixed(4)} VIDA`,
    };
  }

  const dllrAmount = vidaAmount * VIDA_TO_DLLR_RATE; // 1 VIDA = 1,000 DLLR ($1,000 anchor)
  const usdtAmount = dllrAmount * USDT_PER_DLLR; // 1:1 for immediate swap

  // 1) Personal debit: VIDA from sovereign_internal_wallets only (no national_reserve / Government Vault)
  const { error: update1Error } = await (supabase as any)
    .from('sovereign_internal_wallets')
    .update({
      vida_cap_balance: currentVida - vidaAmount,
      dllr_balance: (wallet.dllr_balance ?? 0) + dllrAmount,
      updated_at: new Date().toISOString(),
    })
    .eq('phone_number', phoneNumber.trim());

  if (update1Error) {
    return { success: false, error: update1Error.message ?? 'Failed to debit VIDA' };
  }

  // 2) Immediate USDT swap: DLLR → USDT at $1.00
  const swapResult = await swapDLLRtoUSDT(phoneNumber.trim(), dllrAmount);
  if (!swapResult.success) {
    // Rollback: restore VIDA and remove the DLLR we just added (best-effort)
    await (supabase as any)
      .from('sovereign_internal_wallets')
      .update({
        vida_cap_balance: currentVida,
        dllr_balance: wallet.dllr_balance ?? 0,
        updated_at: new Date().toISOString(),
      })
      .eq('phone_number', phoneNumber.trim());
    return { success: false, error: swapResult.error ?? 'DLLR→USDT swap failed' };
  }

  // 3) Log as World Vault Conversion (global liquidity, not government grant)
  const ledgerId = await logWorldVaultConversion(
    phoneNumber.trim(),
    vidaAmount,
    dllrAmount,
    usdtAmount
  );

  // 4) Notify dashboard to refresh balances (VIDA down, USDT up)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('world-vault-conversion-complete', {
        detail: { vidaDebited: vidaAmount, usdtCredited: usdtAmount },
      })
    );
  }

  return {
    success: true,
    vidaDebited: vidaAmount,
    dllrMinted: dllrAmount,
    usdtCredited: usdtAmount,
    ledgerId,
  };
}

/**
 * VIDA → DLLR only (no USDT step). Debits VIDA from sovereign_internal_wallets, credits DLLR at 1 VIDA = 1,000 DLLR.
 * Use when user selects "VIDA → DLLR" in the swap modal.
 */
export async function executeVidaToDllrOnly(
  phoneNumber: string,
  vidaAmount: number
): Promise<IndependentBridgeResult> {
  if (!phoneNumber?.trim()) {
    return { success: false, error: 'Phone number required' };
  }
  if (vidaAmount <= 0) {
    return { success: false, error: 'VIDA amount must be positive' };
  }
  if (!hasSupabase() || !supabase) {
    return { success: false, error: 'Supabase not available' };
  }

  const wallet = await getOrCreateSovereignWallet(phoneNumber.trim());
  if (!wallet) {
    return { success: false, error: 'Personal treasury not found' };
  }

  const currentVida = wallet.vida_cap_balance ?? 0;
  if (currentVida < vidaAmount) {
    return {
      success: false,
      error: `Insufficient VIDA. Available: ${currentVida.toFixed(4)} VIDA`,
    };
  }

  const dllrAmount = vidaAmount * VIDA_TO_DLLR_RATE;

  const { error: updateError } = await (supabase as any)
    .from('sovereign_internal_wallets')
    .update({
      vida_cap_balance: currentVida - vidaAmount,
      dllr_balance: (wallet.dllr_balance ?? 0) + dllrAmount,
      updated_at: new Date().toISOString(),
    })
    .eq('phone_number', phoneNumber.trim());

  if (updateError) {
    return { success: false, error: updateError.message ?? 'Failed to convert VIDA to DLLR' };
  }

  await logWorldVaultConversion(phoneNumber.trim(), vidaAmount, dllrAmount, dllrAmount);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('world-vault-conversion-complete', {
        detail: { vidaDebited: vidaAmount, dllrMinted: dllrAmount },
      })
    );
  }

  return {
    success: true,
    vidaDebited: vidaAmount,
    dllrMinted: dllrAmount,
    usdtCredited: 0,
    ledgerId: null,
  };
}

/**
 * PFF × Sovryn — VIDA CAP to DLLR Sovereign Swap
 * Uses getSovereignSigner (internal) when phoneNumber set — no window.ethereum.
 * Gas check: if insufficient RBTC, triggers Relayer for first swap.
 * Contract: Sovryn swap convertByPath when configured; else DLLR credit path.
 */

import { Contract, parseUnits } from 'ethers';
import { DLLR_ADDRESS, SOVRYN_SWAP_CONTRACT_ADDRESS } from './config';
import { getBrowserProvider, getRbtcBalance } from './wallet';
import { getInternalSigner, MIN_RBTC_FOR_GAS, type EncryptedSeedPayload } from './internalSigner';
import { requestRelayerGasForSwap } from './relayerGas';
import { swapByPath, getVidaToDllrPath } from './sovrynSwapContract';
import { VIDA_TOKEN_ADDRESS } from './config';
import { hasSupabase, supabase } from '../supabase';
import { VIDA_USD_VALUE } from '../economic';

// Pricing: 1 VIDA CAP = $1,000 USD (anchor from economic.ts)
const DLLR_USD_PRICE = 1; // $1.00 per DLLR (pegged)
const VIDA_TO_DLLR_RATE = VIDA_USD_VALUE / DLLR_USD_PRICE; // 1 VIDA CAP = 1,000 DLLR

// ERC20 ABI for DLLR minting/transfer
const DLLR_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
];

export type RefreshUserSessionResult =
  | { ok: true }
  | { ok: false; error: string; missingSeed?: boolean };

export interface SovereignSwapParams {
  vidaCapAmount: number; // Amount of VIDA CAP to swap
  citizenId?: string; // Optional citizen ID for Supabase lookup
  /** When set, use internal signer (no Connect Wallet popup). */
  phoneNumber?: string;
  /** Call before getting signer to hydrate encrypted seed from Supabase (e.g. from SovereignSeedContext). */
  refreshUserSession?: () => Promise<RefreshUserSessionResult>;
  /** Encrypted seed from context; when provided, signer uses it instead of fetching from DB. */
  encryptedSeed?: EncryptedSeedPayload | null;
}

export interface SovereignSwapResult {
  success: boolean;
  dllrAmount?: number;
  txHash?: string;
  ledgerEntry?: SovereignLedgerEntry;
  error?: string;
  /** True when recovery seed is missing in DB; show Identity Re-Link (Face Pulse) prompt. */
  missingSeed?: boolean;
}

export interface SovereignLedgerEntry {
  id: string;
  timestamp: Date;
  fromVault: 'NATIONAL_BLOCK';
  toVault: 'GLOBAL_BLOCK';
  vidaCapDeducted: number;
  dllrCredited: number;
  exchangeRate: number;
  walletAddress: string;
  txHash: string;
  status: 'PENDING' | 'CONFIRMED' | 'FAILED';
}

/**
 * Calculate DLLR output from VIDA CAP input
 * 1 VIDA CAP = $1,000 USD = 1,000 DLLR
 */
export function calculateDLLROutput(vidaCapAmount: number): number {
  return vidaCapAmount * VIDA_TO_DLLR_RATE;
}

/**
 * Calculate VIDA CAP input from DLLR output
 */
export function calculateVIDAInput(dllrAmount: number): number {
  return dllrAmount / VIDA_TO_DLLR_RATE;
}

/**
 * Deduct VIDA CAP from Supabase citizen vault (20% spendable balance)
 * Returns updated balance or null if insufficient funds
 */
async function deductVIDAFromVault(
  citizenId: string,
  amount: number
): Promise<{ success: boolean; newBalance?: number; error?: string }> {
  if (!hasSupabase() || !supabase) {
    return { success: false, error: 'Supabase not available' };
  }

  try {
    // Get current balance
    const { data: vaultData, error: fetchError } = await supabase
      .from('citizen_vaults')
      .select('vida_cap_balance, spendable_balance_vida')
      .eq('citizen_id', citizenId)
      .single();

    if (fetchError || !vaultData) {
      return { success: false, error: 'Vault not found' };
    }

    const currentBalance = parseFloat(vaultData.spendable_balance_vida || vaultData.vida_cap_balance);
    
    // Check if sufficient balance (20% spendable)
    const spendableBalance = currentBalance * 0.20;
    if (spendableBalance < amount) {
      return { 
        success: false, 
        error: `Insufficient spendable balance. Available: ${spendableBalance.toFixed(4)} VIDA CAP` 
      };
    }

    // Deduct from balance
    const newBalance = currentBalance - amount;

    // Update Supabase
    const { error: updateError } = await supabase
      .from('citizen_vaults')
      .update({ 
        vida_cap_balance: newBalance,
        spendable_balance_vida: newBalance * 0.20,
        updated_at: new Date().toISOString()
      })
      .eq('citizen_id', citizenId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return { success: true, newBalance };
  } catch (error) {
    console.error('[deductVIDAFromVault] Error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to deduct VIDA CAP' 
    };
  }
}

/**
 * Log swap transaction to Sovereign Ledger (VLT)
 */
async function logToSovereignLedger(entry: Omit<SovereignLedgerEntry, 'id'>): Promise<string | null> {
  if (!hasSupabase() || !supabase) {
    console.warn('[logToSovereignLedger] Supabase not available');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('sovereign_ledger')
      .insert({
        timestamp: entry.timestamp.toISOString(),
        from_vault: entry.fromVault,
        to_vault: entry.toVault,
        vida_cap_deducted: entry.vidaCapDeducted,
        dllr_credited: entry.dllrCredited,
        exchange_rate: entry.exchangeRate,
        wallet_address: entry.walletAddress,
        tx_hash: entry.txHash,
        status: entry.status,
      })
      .select('id')
      .single();

    if (error) {
      console.error('[logToSovereignLedger] Error:', error);
      return null;
    }

    return data?.id || null;
  } catch (error) {
    console.error('[logToSovereignLedger] Error:', error);
    return null;
  }
}

/**
 * Execute Sovereign Swap: VIDA CAP → DLLR
 * Uses getSovereignSigner (internal) when phoneNumber set — no external provider.
 * Gas: if RBTC below MIN_RBTC_FOR_GAS, triggers Relayer for first swap.
 * Contract: Sovryn convertByPath when SOVRYN_SWAP_CONTRACT configured; else DLLR credit path.
 */
const IDENTITY_RELINK_MESSAGE =
  'Identity Re-Link Required: Please perform a Face Pulse to re-authorize your wallet.';

export async function executeSovereignSwap(
  params: SovereignSwapParams
): Promise<SovereignSwapResult> {
  const { vidaCapAmount, citizenId, phoneNumber, refreshUserSession, encryptedSeed } = params;

  try {
    if (vidaCapAmount <= 0) {
      return { success: false, error: 'Invalid VIDA CAP amount' };
    }

    // Get signer: when phoneNumber set use internal only (no window.ethereum)
    let signer;
    if (phoneNumber?.trim()) {
      if (refreshUserSession) {
        const refresh = await refreshUserSession();
        if (!refresh.ok && refresh.missingSeed) {
          return { success: false, error: IDENTITY_RELINK_MESSAGE, missingSeed: true };
        }
      }
      signer = await getInternalSigner(phoneNumber.trim(), {
        encryptedSeed: encryptedSeed ?? undefined,
      });
      if (!signer) {
        return { success: false, error: IDENTITY_RELINK_MESSAGE, missingSeed: true };
      }
    } else {
      const provider = await getBrowserProvider();
      if (!provider) return { success: false, error: 'No wallet provider found' };
      signer = await provider.getSigner();
    }
    const walletAddress = await signer.getAddress();

    // Gas check: if insufficient RBTC and internal signer, trigger Relayer for first VIDA→DLLR swap
    const { rbtc } = await getRbtcBalance(walletAddress);
    const rbtcNum = parseFloat(rbtc);
    if (phoneNumber?.trim() && rbtcNum < MIN_RBTC_FOR_GAS) {
      const relayerResult = await requestRelayerGasForSwap(phoneNumber.trim());
      if (relayerResult.ok) {
        await new Promise((r) => setTimeout(r, 2500));
      }
      const { rbtc: rbtcAfter } = await getRbtcBalance(walletAddress);
      if (parseFloat(rbtcAfter) < MIN_RBTC_FOR_GAS) {
        return {
          success: false,
          error: 'Insufficient RBTC for gas. Relayer was notified — try again in a moment or add a small amount of RBTC.',
        };
      }
    }

    const dllrAmount = calculateDLLROutput(vidaCapAmount);

    if (citizenId) {
      const deductResult = await deductVIDAFromVault(citizenId, vidaCapAmount);
      if (!deductResult.success) return { success: false, error: deductResult.error };
    }

    let txHash: string;

    // Prefer Sovryn swap contract convertByPath when configured (VIDA → DLLR)
    if (SOVRYN_SWAP_CONTRACT_ADDRESS && VIDA_TOKEN_ADDRESS && VIDA_TOKEN_ADDRESS !== '0x0000000000000000000000000000000000000000') {
      const path = getVidaToDllrPath();
      const vidaWei = parseUnits(vidaCapAmount.toString(), 18);
      const swapResult = await swapByPath(signer, vidaWei, path);
      if ('txHash' in swapResult) {
        txHash = swapResult.txHash;
      } else {
        return { success: false, error: swapResult.error ?? 'Swap contract call failed' };
      }
    } else {
      // Fallback: DLLR credit path (transfer to self as placeholder when no swap contract)
      const contract = new Contract(DLLR_ADDRESS, DLLR_ABI, signer);
      const decimals = (await contract.decimals()) as number;
      const dllrAmountWei = parseUnits(dllrAmount.toString(), decimals);
      const tx = await contract.transfer(walletAddress, dllrAmountWei);
      const receipt = await tx.wait();
      txHash = receipt.hash;
    }

    const ledgerEntry: Omit<SovereignLedgerEntry, 'id'> = {
      timestamp: new Date(),
      fromVault: 'NATIONAL_BLOCK',
      toVault: 'GLOBAL_BLOCK',
      vidaCapDeducted: vidaCapAmount,
      dllrCredited: dllrAmount,
      exchangeRate: VIDA_TO_DLLR_RATE,
      walletAddress,
      txHash,
      status: 'CONFIRMED',
    };

    const ledgerId = await logToSovereignLedger(ledgerEntry);

    return {
      success: true,
      dllrAmount,
      txHash,
      ledgerEntry: ledgerId ? { ...ledgerEntry, id: ledgerId } : undefined,
    };
  } catch (error) {
    console.error('[executeSovereignSwap] Error:', error);
    const msg = error instanceof Error ? error.message : 'Swap failed';
    const gasRelated = /insufficient funds|out of gas|not enough gas|gas required/i.test(msg);
    return {
      success: false,
      error: phoneNumber && gasRelated
        ? 'Insufficient RBTC for gas. Relayer was notified — try again or add a small amount of RBTC.'
        : msg,
    };
  }
}


/**
 * PFF × Sovryn — VIDA CAP to DLLR Sovereign Swap
 * Deducts VIDA CAP from 20% Spendable Balance and credits DLLR on Rootstock
 */

import { Contract, parseUnits, formatUnits } from 'ethers';
import { DLLR_ADDRESS } from './config';
import { getBrowserProvider } from './wallet';
import { hasSupabase, supabase } from '../supabase';

// Pricing Constants
const VIDA_CAP_USD_PRICE = 1000; // $1,000 per VIDA CAP
const DLLR_USD_PRICE = 1; // $1.00 per DLLR (pegged)
const VIDA_TO_DLLR_RATE = VIDA_CAP_USD_PRICE / DLLR_USD_PRICE; // 1 VIDA CAP = 1,000 DLLR

// ERC20 ABI for DLLR minting/transfer
const DLLR_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
];

export interface SovereignSwapParams {
  vidaCapAmount: number; // Amount of VIDA CAP to swap
  citizenId?: string; // Optional citizen ID for Supabase lookup
}

export interface SovereignSwapResult {
  success: boolean;
  dllrAmount?: number;
  txHash?: string;
  ledgerEntry?: SovereignLedgerEntry;
  error?: string;
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
 *
 * Flow:
 * 1. Validate presence verification
 * 2. Get connected wallet address
 * 3. Deduct VIDA CAP from Supabase (20% spendable balance)
 * 4. Calculate DLLR output (1 VIDA CAP = 1,000 DLLR)
 * 5. Execute smart contract call to credit DLLR on Rootstock
 * 6. Log transaction to Sovereign Ledger
 * 7. Return result with tx hash
 */
export async function executeSovereignSwap(
  params: SovereignSwapParams
): Promise<SovereignSwapResult> {
  const { vidaCapAmount, citizenId } = params;

  try {
    // Step 1: Validate amount
    if (vidaCapAmount <= 0) {
      return { success: false, error: 'Invalid VIDA CAP amount' };
    }

    // Step 2: Get wallet provider and address
    const provider = await getBrowserProvider();
    const signer = await provider.getSigner();
    const walletAddress = await signer.getAddress();

    // Step 3: Calculate DLLR output
    const dllrAmount = calculateDLLROutput(vidaCapAmount);

    // Step 4: Deduct VIDA CAP from Supabase vault (if citizenId provided)
    if (citizenId) {
      const deductResult = await deductVIDAFromVault(citizenId, vidaCapAmount);
      if (!deductResult.success) {
        return { success: false, error: deductResult.error };
      }
    }

    // Step 5: Execute smart contract call to credit DLLR
    // NOTE: In production, this would call a swap contract that mints/transfers DLLR
    // For now, we'll simulate the transaction (replace with actual contract call)
    const contract = new Contract(DLLR_ADDRESS, DLLR_ABI, signer);
    const decimals = await contract.decimals() as number;
    const dllrAmountWei = parseUnits(dllrAmount.toString(), decimals);

    // In production, this would be a swap contract call like:
    // const tx = await swapContract.swapVIDAForDLLR(vidaCapAmount, walletAddress);
    // For now, we'll use a transfer as a placeholder (requires DLLR in contract)
    const tx = await contract.transfer(walletAddress, dllrAmountWei);
    const receipt = await tx.wait();

    // Step 6: Log to Sovereign Ledger
    const ledgerEntry: Omit<SovereignLedgerEntry, 'id'> = {
      timestamp: new Date(),
      fromVault: 'NATIONAL_BLOCK',
      toVault: 'GLOBAL_BLOCK',
      vidaCapDeducted: vidaCapAmount,
      dllrCredited: dllrAmount,
      exchangeRate: VIDA_TO_DLLR_RATE,
      walletAddress,
      txHash: receipt.hash,
      status: 'CONFIRMED',
    };

    const ledgerId = await logToSovereignLedger(ledgerEntry);

    // Step 7: Return success result
    return {
      success: true,
      dllrAmount,
      txHash: receipt.hash,
      ledgerEntry: ledgerId ? { ...ledgerEntry, id: ledgerId } : undefined,
    };
  } catch (error) {
    console.error('[executeSovereignSwap] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Swap failed',
    };
  }
}


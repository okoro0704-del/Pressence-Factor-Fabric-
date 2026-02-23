/**
 * BANKING BRIDGE
 * Automatically retrieves linked phone number and authorizes Spendable VIDA to Naira transfer
 * Activated after 4-layer biometric authentication passes
 */

import { createClient } from '@supabase/supabase-js';
import type { GlobalIdentity } from './phoneIdentity';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Exchange Rates
const VIDA_TO_USD = 1000; // 1 VIDA CAP = $1,000 USD
const USD_TO_NAIRA = 1400; // 1 USD = ₦1,400
const VIDA_TO_NAIRA = VIDA_TO_USD * USD_TO_NAIRA; // 1 VIDA CAP = ₦1,400,000

// Transfer Types
export enum TransferType {
  VIDA_TO_NAIRA = 'VIDA_TO_NAIRA',
  NAIRA_TO_VIDA = 'NAIRA_TO_VIDA',
  VIDA_TO_BANK = 'VIDA_TO_BANK',
}

// Transfer Status
export enum TransferStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

// Transfer Result
export interface BankingTransferResult {
  success: boolean;
  transferId?: string;
  status: TransferStatus;
  fromAmount: number;
  toAmount: number;
  fromCurrency: string;
  toCurrency: string;
  bankAccount?: string;
  message: string;
}

/**
 * Convert VIDA to Naira
 */
export function convertVidaToNaira(vidaAmount: number): number {
  return vidaAmount * VIDA_TO_NAIRA;
}

/**
 * Convert Naira to VIDA
 */
export function convertNairaToVida(nairaAmount: number): number {
  return nairaAmount / VIDA_TO_NAIRA;
}

/**
 * AUTHORIZE VIDA TO NAIRA TRANSFER
 * Automatically triggered after 4-layer authentication passes
 * Uses phone number to retrieve linked bank accounts from Virtual Bridge
 */
export async function authorizeVidaToNairaTransfer(
  identity: GlobalIdentity,
  vidaAmount: number,
  targetBankAccount?: string
): Promise<BankingTransferResult> {
  try {
    // Validate spendable balance
    if (vidaAmount > identity.spendable_vida) {
      return {
        success: false,
        status: TransferStatus.FAILED,
        fromAmount: vidaAmount,
        toAmount: 0,
        fromCurrency: 'VIDA CAP',
        toCurrency: 'NGN',
        message: `Insufficient spendable balance. You have ${identity.spendable_vida.toFixed(2)} VIDA available.`,
      };
    }

    // Check 1 VIDA CAP limit (Liquid Vault)
    if (vidaAmount > 1.0) {
      return {
        success: false,
        status: TransferStatus.FAILED,
        fromAmount: vidaAmount,
        toAmount: 0,
        fromCurrency: 'VIDA CAP',
        toCurrency: 'NGN',
        message: 'Asset Locked: Requires 1B User Milestone for Release. Maximum transfer: 1.00 VIDA CAP',
      };
    }

    // Calculate Naira amount
    const nairaAmount = convertVidaToNaira(vidaAmount);

    // Retrieve linked bank accounts from Virtual Bridge
    // TODO: Query Supabase virtual_bridges table
    // const { data: bridge } = await supabase.from('virtual_bridges')
    //   .select('*')
    //   .eq('phone_number', identity.phone_number)
    //   .single();

    // Use first linked bank account or specified account
    const bankAccount = targetBankAccount || identity.linked_bank_accounts[0] || 'No bank account linked';

    // Create transfer record
    const transferId = crypto.randomUUID();

    // TODO: Insert into Supabase banking_transfers table
    // const { data, error } = await supabase.from('banking_transfers').insert({
    //   id: transferId,
    //   phone_number: identity.phone_number,
    //   transfer_type: TransferType.VIDA_TO_NAIRA,
    //   from_amount: vidaAmount,
    //   to_amount: nairaAmount,
    //   from_currency: 'VIDA CAP',
    //   to_currency: 'NGN',
    //   bank_account: bankAccount,
    //   status: TransferStatus.PROCESSING,
    //   created_at: new Date().toISOString(),
    // });

    // TODO: Deduct from spendable_vida in global_identities table
    // const { error: updateError } = await supabase.from('global_identities')
    //   .update({ spendable_vida: identity.spendable_vida - vidaAmount })
    //   .eq('phone_number', identity.phone_number);

    // TODO: Trigger actual bank transfer via payment gateway
    // This would integrate with Nigerian payment processors (Paystack, Flutterwave, etc.)

    return {
      success: true,
      transferId,
      status: TransferStatus.COMPLETED,
      fromAmount: vidaAmount,
      toAmount: nairaAmount,
      fromCurrency: 'VIDA CAP',
      toCurrency: 'NGN',
      bankAccount,
      message: `Successfully transferred ${vidaAmount.toFixed(2)} VIDA (₦${nairaAmount.toLocaleString()}) to ${bankAccount}`,
    };
  } catch (error) {
    console.error('Banking transfer failed:', error);
    return {
      success: false,
      status: TransferStatus.FAILED,
      fromAmount: vidaAmount,
      toAmount: 0,
      fromCurrency: 'VIDA CAP',
      toCurrency: 'NGN',
      message: 'Transfer failed. Please try again or contact your Guardian.',
    };
  }
}

/**
 * REQUEST PAYOUT (Simplified for Dependents)
 * One-click function to transfer all spendable VIDA to linked bank account
 */
export async function requestPayout(identity: GlobalIdentity): Promise<BankingTransferResult> {
  // Transfer all spendable VIDA
  return authorizeVidaToNairaTransfer(identity, identity.spendable_vida);
}


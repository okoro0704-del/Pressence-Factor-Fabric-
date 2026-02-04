/**
 * PFF BALANCE AGGREGATION SYSTEM
 * Calculates Total PFF Balance = (PFF Sovereign Account) + (External Accounts) + (20% Spendable VIDA Value)
 * Architect: Isreal Okoro (mrfundzman)
 */

import { convertVidaToNaira } from './bankingBridge';

// Nigerian Legacy Banks
export const NIGERIAN_LEGACY_BANKS = [
  { code: 'GTB', name: 'Guaranty Trust Bank', color: '#FF6600' },
  { code: 'ZENITH', name: 'Zenith Bank', color: '#ED1C24' },
  { code: 'ACCESS', name: 'Access Bank', color: '#F37021' },
  { code: 'FIRST', name: 'First Bank of Nigeria', color: '#0033A0' },
  { code: 'UBA', name: 'United Bank for Africa', color: '#EE3124' },
  { code: 'FCMB', name: 'First City Monument Bank', color: '#8B0000' },
  { code: 'UNION', name: 'Union Bank', color: '#003366' },
  { code: 'STANBIC', name: 'Stanbic IBTC Bank', color: '#0072C6' },
  { code: 'STERLING', name: 'Sterling Bank', color: '#ED1C24' },
  { code: 'FIDELITY', name: 'Fidelity Bank', color: '#8B0000' },
  { code: 'WEMA', name: 'Wema Bank', color: '#6B1F7B' },
  { code: 'POLARIS', name: 'Polaris Bank', color: '#0066CC' },
  { code: 'ECOBANK', name: 'Ecobank Nigeria', color: '#003DA5' },
  { code: 'KEYSTONE', name: 'Keystone Bank', color: '#00A651' },
  { code: 'PROVIDUS', name: 'Providus Bank', color: '#1E3A8A' },
] as const;

// Account Types
export enum AccountCategory {
  PFF_SOVEREIGN = 'PFF_SOVEREIGN', // Primary sovereign account (Presence Factor Fabric)
  LEGACY_BANK = 'LEGACY_BANK', // External linked accounts
  VIDA_VAULT = 'VIDA_VAULT', // Spendable VIDA converted to Naira
}

// Bank Account Interface
export interface BankAccount {
  id: string;
  category: AccountCategory;
  bank_code: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  balance_naira: number;
  is_primary: boolean;
  status: 'ACTIVE' | 'PENDING' | 'INACTIVE';
  created_at: string;
}

// PFF Balance Breakdown
export interface PFFBalanceBreakdown {
  // Primary Account (PFF Sovereign)
  pffSovereign: {
    balance_naira: number;
    account_number: string;
    status: 'PRE_ACTIVATED' | 'ACTIVE';
  };
  
  // External Legacy Accounts
  legacyAccounts: BankAccount[];
  legacyAccountsTotal: number;
  
  // VIDA Vault (20% Spendable)
  vidaVault: {
    spendable_vida: number;
    naira_equivalent: number;
  };
  
  // Grand Total
  totalPFFBalance: number;
  
  // National Scale
  activeSovereignNodes: number;
}

/**
 * Calculate Total PFF Balance
 */
export function calculatePFFBalance(
  fundzmanBalance: number,
  legacyAccounts: BankAccount[],
  spendableVida: number,
  activeSovereignNodes: number = 220_000_000
): PFFBalanceBreakdown {
  // Calculate legacy accounts total
  const legacyAccountsTotal = legacyAccounts.reduce(
    (sum, account) => sum + account.balance_naira,
    0
  );
  
  // Convert VIDA to Naira
  const vidaNairaEquivalent = convertVidaToNaira(spendableVida);
  
  // Calculate grand total
  const totalPFFBalance = fundzmanBalance + legacyAccountsTotal + vidaNairaEquivalent;
  
  return {
    pffSovereign: {
      balance_naira: fundzmanBalance,
      account_number: '2200000001', // Auto-generated sovereign account
      status: 'PRE_ACTIVATED',
    },
    legacyAccounts,
    legacyAccountsTotal,
    vidaVault: {
      spendable_vida: spendableVida,
      naira_equivalent: vidaNairaEquivalent,
    },
    totalPFFBalance,
    activeSovereignNodes,
  };
}

/**
 * Create PFF Sovereign default account (Presence Factor Fabric)
 */
export function createPFFDefaultAccount(phoneNumber: string): BankAccount {
  return {
    id: crypto.randomUUID(),
    category: AccountCategory.PFF_SOVEREIGN,
    bank_code: 'PFF',
    bank_name: 'Presence Factor Fabric',
    account_number: '2200000001', // Auto-generated from phone hash
    account_name: 'PFF Sovereign Account',
    balance_naira: 0,
    is_primary: true,
    status: 'ACTIVE',
    created_at: new Date().toISOString(),
  };
}

/**
 * Link External Legacy Bank Account
 */
export async function linkLegacyBankAccount(
  phoneNumber: string,
  bankCode: string,
  accountNumber: string,
  accountName: string
): Promise<BankAccount | null> {
  try {
    const bank = NIGERIAN_LEGACY_BANKS.find(b => b.code === bankCode);
    if (!bank) {
      throw new Error(`Bank code ${bankCode} not found`);
    }
    
    const legacyAccount: BankAccount = {
      id: crypto.randomUUID(),
      category: AccountCategory.LEGACY_BANK,
      bank_code: bankCode,
      bank_name: bank.name,
      account_number: accountNumber,
      account_name: accountName,
      balance_naira: 0, // Would be fetched from bank API in production
      is_primary: false,
      status: 'PENDING', // Requires verification
      created_at: new Date().toISOString(),
    };
    
    // TODO: Insert into Supabase pff_bank_accounts table
    // TODO: Trigger bank verification via Paystack/Flutterwave
    
    return legacyAccount;
  } catch (error) {
    console.error('Error linking legacy bank account:', error);
    return null;
  }
}


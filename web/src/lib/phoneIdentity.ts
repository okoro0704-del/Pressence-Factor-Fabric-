/**
 * PHONE IDENTITY ENGINE
 * Phone Number as Primary Unique Identifier (Primary Key)
 * Maps phone numbers to Global Identity Hash and Virtual Bridge for banking
 * Uses singleton from @/lib/supabase to avoid Multiple GoTrueClient.
 */

import { getSupabase } from './supabase';

export const supabase = new Proxy({} as ReturnType<typeof getSupabase>, {
  get(_, prop: string) {
    return (getSupabase() as any)[prop];
  },
});

// Account Types
export enum AccountType {
  SOVEREIGN_OPERATOR = 'SOVEREIGN_OPERATOR', // Full-access business/active users
  DEPENDENT = 'DEPENDENT', // Simplified managed account (family/elderly)
  PROMOTED_SOVEREIGN = 'PROMOTED_SOVEREIGN', // Dependent who turned 18 and gained full control
}

// Global Identity Interface
export interface GlobalIdentity {
  id: string; // UUID
  phone_number: string; // Primary Key (E.164 format: +234...)
  global_identity_hash: string; // SHA-256 hash of phone number
  account_type: AccountType;
  full_name: string;
  date_of_birth?: string; // ISO 8601 date string (YYYY-MM-DD) - MANDATORY for family tree
  age_years?: number; // Calculated from DOB
  guardian_phone?: string; // For DEPENDENT accounts - links to Sovereign Operator
  spouse_phone?: string; // For family tree - links to spouse
  ancestral_root_phone?: string; // For nested sovereignty - links to family tree root
  virtual_bridge_id?: string; // Maps to traditional banking systems
  linked_bank_accounts: string[];
  vida_balance: number;
  spendable_vida: number; // 20% liquid
  locked_vida: number; // 80% locked until 1B users
  created_at: string;
  last_active: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING' | 'INACTIVE' | 'DECEASED';
  promoted_at?: string; // When dependent became sovereign (auto-promotion)
  promotion_triggered_by?: 'AUTO_AGE_18' | 'MANUAL';
}

// Virtual Bridge for Banking Integration
export interface VirtualBridge {
  id: string;
  phone_number: string;
  bank_account_numbers: string[];
  bank_names: string[];
  account_names: string[];
  bridge_status: 'ACTIVE' | 'PENDING' | 'INACTIVE';
  created_at: string;
}

/**
 * Generate Global Identity Hash from Phone Number
 * Uses SHA-256 to create a unique, deterministic hash
 */
export async function generateIdentityHash(phoneNumber: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(phoneNumber);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Validate Phone Number (E.164 format)
 * Example: +2348012345678 (Nigeria)
 */
export function validatePhoneNumber(phoneNumber: string): boolean {
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phoneNumber);
}

/**
 * Link Phone Number to Bank Accounts (Virtual Bridge)
 * Allows phone number to act as alias for traditional banking
 */
export async function linkToBankAccounts(
  phoneNumber: string,
  bankAccounts: { accountNumber: string; bankName: string; accountName: string }[]
): Promise<VirtualBridge | null> {
  try {
    if (!validatePhoneNumber(phoneNumber)) {
      throw new Error('Invalid phone number format. Use E.164 format (e.g., +2348012345678)');
    }

    const virtualBridge: VirtualBridge = {
      id: crypto.randomUUID(),
      phone_number: phoneNumber,
      bank_account_numbers: bankAccounts.map(acc => acc.accountNumber),
      bank_names: bankAccounts.map(acc => acc.bankName),
      account_names: bankAccounts.map(acc => acc.accountName),
      bridge_status: 'ACTIVE',
      created_at: new Date().toISOString(),
    };

    // TODO: Insert into Supabase virtual_bridges table
    // const { data, error } = await supabase.from('virtual_bridges').insert(virtualBridge);

    return virtualBridge;
  } catch (error) {
    console.error('Error linking to bank accounts:', error);
    return null;
  }
}

/**
 * Register Sovereign Operator (Full-Access Business/Active User)
 */
export async function registerSovereignOperator(
  phoneNumber: string,
  fullName: string,
  bankAccounts?: { accountNumber: string; bankName: string; accountName: string }[]
): Promise<GlobalIdentity | null> {
  try {
    if (!validatePhoneNumber(phoneNumber)) {
      throw new Error('Invalid phone number format');
    }

    const identityHash = await generateIdentityHash(phoneNumber);
    const linkedBanks = bankAccounts?.map(acc => `${acc.bankName}-${acc.accountNumber}`) || [];

    const identity: GlobalIdentity = {
      id: crypto.randomUUID(),
      phone_number: phoneNumber,
      global_identity_hash: identityHash,
      account_type: AccountType.SOVEREIGN_OPERATOR,
      full_name: fullName,
      linked_bank_accounts: linkedBanks,
      vida_balance: 5.0, // 5 VIDA CAP (50% of 10)
      spendable_vida: 1.0, // 20% spendable
      locked_vida: 4.0, // 80% locked
      created_at: new Date().toISOString(),
      last_active: new Date().toISOString(),
      status: 'ACTIVE',
    };

    // Link to bank accounts if provided
    if (bankAccounts && bankAccounts.length > 0) {
      await linkToBankAccounts(phoneNumber, bankAccounts);
    }

    // TODO: Insert into Supabase global_identities table
    // const { data, error } = await supabase.from('global_identities').insert(identity);

    return identity;
  } catch (error) {
    console.error('Error registering Sovereign Operator:', error);
    return null;
  }
}

/**
 * Register Dependent (Simplified Managed Account for Family/Elderly)
 * Must be linked to a Guardian (Sovereign Operator)
 * REQUIRES: Date of Birth for age-based auto-promotion
 */
export async function registerDependent(
  phoneNumber: string,
  fullName: string,
  guardianPhone: string,
  dateOfBirth: string // ISO 8601 format (YYYY-MM-DD)
): Promise<GlobalIdentity | null> {
  try {
    if (!validatePhoneNumber(phoneNumber) || !validatePhoneNumber(guardianPhone)) {
      throw new Error('Invalid phone number format');
    }

    // Validate date of birth
    if (!dateOfBirth || !isValidDate(dateOfBirth)) {
      throw new Error('Invalid date of birth. Use YYYY-MM-DD format');
    }

    // Calculate age
    const age = calculateAge(dateOfBirth);

    // Verify guardian exists and is a Sovereign Operator
    // TODO: Check Supabase for guardian account
    // const { data: guardian } = await supabase.from('global_identities')
    //   .select('*')
    //   .eq('phone_number', guardianPhone)
    //   .eq('account_type', AccountType.SOVEREIGN_OPERATOR)
    //   .single();

    const identityHash = await generateIdentityHash(phoneNumber);

    const identity: GlobalIdentity = {
      id: crypto.randomUUID(),
      phone_number: phoneNumber,
      global_identity_hash: identityHash,
      account_type: AccountType.DEPENDENT,
      full_name: fullName,
      date_of_birth: dateOfBirth,
      age_years: age,
      guardian_phone: guardianPhone,
      linked_bank_accounts: [],
      vida_balance: 0.0, // Dependents start with 0, receive from guardian
      spendable_vida: 0.0,
      locked_vida: 0.0,
      created_at: new Date().toISOString(),
      last_active: new Date().toISOString(),
      status: 'PENDING', // Requires guardian approval
    };

    // TODO: Insert into Supabase family_members table
    // const { data, error } = await supabase.from('family_members').insert({
    //   phone_number: identity.phone_number,
    //   full_name: identity.full_name,
    //   date_of_birth: identity.date_of_birth,
    //   account_type: identity.account_type,
    //   guardian_phone: identity.guardian_phone,
    //   vida_balance: identity.vida_balance,
    //   spendable_vida: identity.spendable_vida,
    //   locked_vida: identity.locked_vida,
    //   status: 'ACTIVE',
    // });

    return identity;
  } catch (error) {
    console.error('Error registering Dependent:', error);
    return null;
  }
}

/**
 * Validate date string (YYYY-MM-DD format)
 */
export function isValidDate(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;

  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Calculate age from date of birth
 */
export function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}

/**
 * Resolve Phone Number to Global Identity
 * Instantly resolves phone number to identity hash and account details
 */
export async function resolvePhoneToIdentity(phoneNumber: string): Promise<GlobalIdentity | null> {
  try {
    if (!validatePhoneNumber(phoneNumber)) {
      throw new Error('Invalid phone number format');
    }

    // TODO: Query Supabase for identity
    // const { data, error } = await supabase.from('global_identities')
    //   .select('*')
    //   .eq('phone_number', phoneNumber)
    //   .single();

    // Mock data for now
    const identityHash = await generateIdentityHash(phoneNumber);
    return {
      id: crypto.randomUUID(),
      phone_number: phoneNumber,
      global_identity_hash: identityHash,
      account_type: AccountType.SOVEREIGN_OPERATOR,
      full_name: 'Unknown User',
      linked_bank_accounts: [],
      vida_balance: 5.0,
      spendable_vida: 1.0,
      locked_vida: 4.0,
      created_at: new Date().toISOString(),
      last_active: new Date().toISOString(),
      status: 'ACTIVE',
    };
  } catch (error) {
    console.error('Error resolving phone to identity:', error);
    return null;
  }
}

/**
 * Send Spendable VIDA to Phone Number
 * Users only need to type a phone number to transfer 20% Spendable VIDA
 */
export async function sendVidaToPhone(
  senderPhone: string,
  recipientPhone: string,
  amount: number
): Promise<{ success: boolean; message: string; transactionId?: string }> {
  try {
    // Validate phone numbers
    if (!validatePhoneNumber(senderPhone) || !validatePhoneNumber(recipientPhone)) {
      return { success: false, message: 'Invalid phone number format' };
    }

    // Resolve sender identity
    const sender = await resolvePhoneToIdentity(senderPhone);
    if (!sender) {
      return { success: false, message: 'Sender account not found' };
    }

    // Check if sender has sufficient spendable balance
    if (sender.spendable_vida < amount) {
      return {
        success: false,
        message: `Insufficient spendable balance. You have ${sender.spendable_vida} VIDA available.`,
      };
    }

    // Check if trying to send more than liquid vault (1 VIDA CAP)
    if (amount > 1.0) {
      return {
        success: false,
        message: 'Asset Locked: Requires 1B User Milestone for Release. Maximum transfer: 1.00 VIDA CAP',
      };
    }

    // Resolve recipient identity
    const recipient = await resolvePhoneToIdentity(recipientPhone);
    if (!recipient) {
      return { success: false, message: 'Recipient account not found' };
    }

    // Create transaction
    const transactionId = crypto.randomUUID();

    // TODO: Execute transaction in Supabase
    // 1. Deduct from sender's spendable_vida
    // 2. Add to recipient's spendable_vida
    // 3. Log transaction in transactions table

    return {
      success: true,
      message: `Successfully sent ${amount} VIDA to ${recipientPhone}`,
      transactionId,
    };
  } catch (error) {
    console.error('Error sending VIDA:', error);
    return { success: false, message: 'Transaction failed. Please try again.' };
  }
}

/**
 * Get Dependents Linked to Guardian
 * Returns all dependent accounts managed by a Sovereign Operator
 */
export async function getGuardianDependents(guardianPhone: string): Promise<GlobalIdentity[]> {
  try {
    // TODO: Query Supabase for dependents
    // const { data, error } = await supabase.from('global_identities')
    //   .select('*')
    //   .eq('guardian_phone', guardianPhone)
    //   .eq('account_type', AccountType.DEPENDENT);

    // Mock data for now
    return [];
  } catch (error) {
    console.error('Error fetching dependents:', error);
    return [];
  }
}


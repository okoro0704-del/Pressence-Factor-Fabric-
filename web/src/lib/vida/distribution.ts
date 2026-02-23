/**
 * VIDA Distribution Functions
 * 
 * Handles triple-split VIDA distribution for vitalization:
 * - 5 VIDA to Citizen (spendable)
 * - 5 VIDA to Nigeria National Treasury (locked)
 * - 1 VIDA to PFF Foundation (locked)
 * 
 * Phase 1: Database-only distribution (no blockchain transfers)
 * Phase 2: Will add actual ERC20 transfers via Thirdweb Paymaster
 */

import { createClient } from "@supabase/supabase-js";

// Supabase client (server-side)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Distribution amounts
export const VIDA_DISTRIBUTION = {
  CITIZEN: 5,
  TREASURY: 5,
  FOUNDATION: 1,
  TOTAL: 11,
} as const;

// Treasury and Foundation wallet addresses
export const SYSTEM_WALLETS = {
  NATIONAL_TREASURY: "0x4c81E768f4B201bCd7E924f671ABA1B162786b48",
  FOUNDATION_VAULT: "0xDD8046422Bbeba12FD47DE854639abF7FB6E0858",
  SENTINEL_VAULT: "0xBaF30D2fe8F8fb41F3053Ce68C4619A283B60211",
} as const;

export interface VIDADistributionResult {
  success: boolean;
  citizenVida: number;
  treasuryVida: number;
  foundationVida: number;
  transactionHash?: string;
  error?: string;
}

/**
 * Execute triple-split VIDA distribution for vitalization
 * 
 * Phase 1: Updates database balances only
 * Phase 2: Will execute actual blockchain transfers
 */
export async function distributeVitalizationVIDA(
  phoneNumber: string,
  sovereignId: string
): Promise<VIDADistributionResult> {
  try {
    // 1. Update citizen's spendable VIDA balance
    const { error: citizenError } = await supabase
      .from("user_profiles")
      .update({
        spendable_vida: VIDA_DISTRIBUTION.CITIZEN,
        updated_at: new Date().toISOString(),
      })
      .eq("phone_number", phoneNumber);

    if (citizenError) {
      throw new Error(`Failed to update citizen VIDA: ${citizenError.message}`);
    }

    // 2. Update treasury balance (in sovereign_internal_wallets or separate table)
    await updateTreasuryBalance(VIDA_DISTRIBUTION.TREASURY);

    // 3. Update foundation balance
    await updateFoundationBalance(VIDA_DISTRIBUTION.FOUNDATION);

    // 4. Log distribution event
    await logDistribution(phoneNumber, sovereignId);

    return {
      success: true,
      citizenVida: VIDA_DISTRIBUTION.CITIZEN,
      treasuryVida: VIDA_DISTRIBUTION.TREASURY,
      foundationVida: VIDA_DISTRIBUTION.FOUNDATION,
    };
  } catch (error: any) {
    console.error("[VIDA DISTRIBUTION ERROR]", error);
    return {
      success: false,
      citizenVida: 0,
      treasuryVida: 0,
      foundationVida: 0,
      error: error.message || "VIDA distribution failed",
    };
  }
}

/**
 * Update National Treasury VIDA balance
 */
async function updateTreasuryBalance(amount: number): Promise<void> {
  // Check if treasury wallet exists in sovereign_internal_wallets
  const { data: wallet, error: fetchError } = await supabase
    .from("sovereign_internal_wallets")
    .select("*")
    .eq("phone_number", "NATIONAL_TREASURY")
    .single();

  if (fetchError || !wallet) {
    // Create treasury wallet if it doesn't exist
    await supabase.from("sovereign_internal_wallets").insert({
      phone_number: "NATIONAL_TREASURY",
      vida_cap_balance: amount,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  } else {
    // Update existing balance
    await supabase
      .from("sovereign_internal_wallets")
      .update({
        vida_cap_balance: (wallet.vida_cap_balance ?? 0) + amount,
        updated_at: new Date().toISOString(),
      })
      .eq("phone_number", "NATIONAL_TREASURY");
  }
}

/**
 * Update PFF Foundation VIDA balance
 */
async function updateFoundationBalance(amount: number): Promise<void> {
  // Check if foundation wallet exists
  const { data: wallet, error: fetchError } = await supabase
    .from("sovereign_internal_wallets")
    .select("*")
    .eq("phone_number", "PFF_FOUNDATION")
    .single();

  if (fetchError || !wallet) {
    // Create foundation wallet if it doesn't exist
    await supabase.from("sovereign_internal_wallets").insert({
      phone_number: "PFF_FOUNDATION",
      vida_cap_balance: amount,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  } else {
    // Update existing balance
    await supabase
      .from("sovereign_internal_wallets")
      .update({
        vida_cap_balance: (wallet.vida_cap_balance ?? 0) + amount,
        updated_at: new Date().toISOString(),
      })
      .eq("phone_number", "PFF_FOUNDATION");
  }
}

/**
 * Log VIDA distribution event
 */
async function logDistribution(phoneNumber: string, sovereignId: string): Promise<void> {
  await supabase.from("vida_distribution_log").insert({
    phone_number: phoneNumber,
    sovereign_id: sovereignId,
    citizen_vida: VIDA_DISTRIBUTION.CITIZEN,
    treasury_vida: VIDA_DISTRIBUTION.TREASURY,
    foundation_vida: VIDA_DISTRIBUTION.FOUNDATION,
    total_vida: VIDA_DISTRIBUTION.TOTAL,
    timestamp: new Date().toISOString(),
  });
}


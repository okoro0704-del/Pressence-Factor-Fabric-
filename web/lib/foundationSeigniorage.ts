/**
 * Foundation Seigniorage Protocol — Dual-Minting on 3-of-4 Biometric Gate Clear.
 * Per new identity verified: 10 VIDA CAP to user wallet, 1 VIDA to PFF_FOUNDATION_VAULT (foundation_vault_ledger).
 * Grant trigger: 10 VIDA minting only begins AFTER the Sovereign Constitution is signed and recorded in legal_approvals.
 */

import { supabase } from './supabase';
import { getOrCreateSovereignWallet } from './sovereignInternalWallet';
import { hasSignedConstitution } from './legalApprovals';

/** VIDA CAP minted to user when 3-of-4 gate clears. */
export const USER_VIDA_ON_VERIFY = 10;

/** VIDA minted to PFF Foundation Vault per verification (audit in foundation_vault_ledger). */
export const FOUNDATION_VIDA_ON_VERIFY = 1;

/**
 * Execute dual-mint when vitalization succeeds (3-of-4 gate clears).
 * Mints 10 VIDA to user's sovereign_internal_wallets and 1 VIDA to foundation (foundation_vault_ledger).
 * Only mints once per citizen_id (phone) — idempotent.
 */
export async function mintFoundationSeigniorage(
  phoneNumber: string,
  citizenId?: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const citizenIdForAudit = citizenId ?? phoneNumber;

  if (!supabase) {
    return { ok: false, error: 'Supabase not available' };
  }

  try {
    // Grant trigger: Constitution must be signed and recorded before any mint.
    const signed = await hasSignedConstitution(phoneNumber);
    if (!signed) {
      return { ok: false, error: 'Constitution must be signed before grant. Complete the Biometric Signature on the Sovereign Constitution.' };
    }

    // Idempotent: already minted for this citizen?
    const { data: existing } = await (supabase as any)
      .from('foundation_vault_ledger')
      .select('id')
      .eq('citizen_id', citizenIdForAudit)
      .limit(1)
      .maybeSingle();

    if (existing) {
      return { ok: true }; // already minted
    }

    const wallet = await getOrCreateSovereignWallet(phoneNumber);
    if (!wallet) {
      return { ok: false, error: 'Could not get or create sovereign wallet' };
    }

    // 1) Mint 10 VIDA to user's wallet
    const { error: updateError } = await (supabase as any)
      .from('sovereign_internal_wallets')
      .update({
        vida_cap_balance: (wallet.vida_cap_balance ?? 0) + USER_VIDA_ON_VERIFY,
        updated_at: new Date().toISOString(),
      })
      .eq('phone_number', phoneNumber);

    if (updateError) {
      console.error('[FoundationSeigniorage] User mint failed:', updateError);
      return { ok: false, error: updateError.message ?? 'User mint failed' };
    }

    // 2) Record 1 VIDA to foundation_vault_ledger (PFF_FOUNDATION_VAULT)
    const { error: ledgerError } = await (supabase as any)
      .from('foundation_vault_ledger')
      .insert({
        citizen_id: citizenIdForAudit,
        vida_amount: FOUNDATION_VIDA_ON_VERIFY,
        corporate_royalty_inflow: 0,
        national_levy_inflow: 0,
        source_type: 'seigniorage',
        created_at: new Date().toISOString(),
      });

    if (ledgerError) {
      console.error('[FoundationSeigniorage] Foundation ledger insert failed:', ledgerError);
      return { ok: false, error: ledgerError.message ?? 'Foundation ledger failed' };
    }

    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[FoundationSeigniorage]', msg);
    return { ok: false, error: msg };
  }
}

/**
 * Total Foundation Reserve (sum of VIDA in foundation_vault_ledger).
 * Used for "Total Foundation Reserve: [X] VIDA" in SovereignWallet.
 */
export async function getTotalFoundationReserve(): Promise<number> {
  if (!supabase) return 0;
  try {
    const { data, error } = await (supabase as any)
      .from('foundation_vault_ledger')
      .select('vida_amount');
    if (error || !data || !Array.isArray(data)) return 0;
    return data.reduce((sum: number, row: { vida_amount?: number }) => sum + (Number(row?.vida_amount) ?? 0), 0);
  } catch {
    return 0;
  }
}

/** 2% conversion levy on VIDA→DLLR (routed to PFF_FOUNDATION_VAULT). */
export const CONVERSION_LEVY_PERCENT = 0.02;

/**
 * Route 2% conversion levy to PFF_FOUNDATION_VAULT when user converts VIDA to DLLR.
 * Call this from updateSovereignWalletConvertVidaToDllr with the levy amount (vidaAmount * 0.02).
 */
export async function routeConversionLevyToFoundation(
  phoneNumber: string,
  levyVidaAmount: number,
  reference?: string
): Promise<boolean> {
  if (!supabase || levyVidaAmount <= 0) return false;
  try {
    const { error } = await (supabase as any)
      .from('foundation_vault_ledger')
      .insert({
        citizen_id: phoneNumber,
        vida_amount: levyVidaAmount,
        corporate_royalty_inflow: 0,
        national_levy_inflow: 0,
        source_type: 'conversion_levy_2',
        reference: reference ?? null,
        created_at: new Date().toISOString(),
      });
    return !error;
  } catch {
    return false;
  }
}

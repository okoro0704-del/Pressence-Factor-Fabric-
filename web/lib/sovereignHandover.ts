/**
 * Sovereign Handover Protocol — Minor-to-Adult transitions.
 * Sovereignty Check: compare IdentityAnchor DOB with current date (eligible at 18+).
 * Independence Activation: Handshake + one-time Sovereignty Fee + decouple from Guardian.
 */

import { supabase } from './supabase';
import { calculateAge } from './phoneIdentity';
import { normalizePhoneVariants } from './universalIdentityComparison';
import { activateSentinelHandshake, getGuardianPhone } from './sentinelActivation';
import { getSovereignInternalWallet } from './sovereignInternalWallet';

const SOVEREIGNTY_AGE_THRESHOLD = 18;

/** One-time Sovereignty Fee for PFF Sentinel business (VIDA). Equivalent to current PFF Sentinel fee. */
export const SOVEREIGNTY_FEE_VIDA = 0.5;

export interface SovereigntyEligibilityResult {
  eligible: boolean;
  ageYears?: number;
  dateOfBirth?: string;
  reason?: string;
}

/**
 * Background sovereignty check: compare IdentityAnchor DOB with current date.
 * Eligible when age >= 18 (Minor has turned adult).
 * Can be run as a background job (e.g. cron) to detect newly eligible minors.
 */
export async function checkSovereigntyEligibility(
  identityAnchorPhone: string
): Promise<SovereigntyEligibilityResult> {
  if (!identityAnchorPhone || !supabase) {
    return { eligible: false, reason: 'Invalid identity or Supabase not available' };
  }
  try {
    const variants = normalizePhoneVariants(identityAnchorPhone);
    for (const variant of variants) {
      const { data, error } = await (supabase as any)
        .from('sentinel_identities')
        .select('metadata, date_of_birth')
        .eq('phone_number', variant)
        .eq('status', 'ACTIVE')
        .maybeSingle();
      if (error || !data) continue;
      const meta = (data.metadata ?? {}) as Record<string, unknown>;
      const dob = (data.date_of_birth ?? meta.date_of_birth) as string | undefined;
      if (!dob) {
        return { eligible: false, reason: 'Date of birth not found for identity' };
      }
      const ageYears = calculateAge(dob);
      const eligible = ageYears >= SOVEREIGNTY_AGE_THRESHOLD;
      return {
        eligible,
        ageYears,
        dateOfBirth: dob,
        reason: eligible
          ? 'Eligible for sovereign handover (age 18+)'
          : `Must be ${SOVEREIGNTY_AGE_THRESHOLD} or older (current age: ${ageYears})`,
      };
    }
    return { eligible: false, reason: 'Identity not found' };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { eligible: false, reason: msg };
  }
}

/**
 * Decouple identity from Guardian (clear guardian_phone in sentinel_identities.metadata).
 * Used after independence activation.
 */
export async function unlinkGuardianFromIdentity(identityPhone: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!identityPhone || !supabase) {
    return { ok: false, error: 'Identity phone or Supabase not available' };
  }
  try {
    const variants = normalizePhoneVariants(identityPhone);
    for (const variant of variants) {
      const { data: row, error: fetchError } = await (supabase as any)
        .from('sentinel_identities')
        .select('id, metadata')
        .eq('phone_number', variant)
        .eq('status', 'ACTIVE')
        .maybeSingle();
      if (fetchError || !row) continue;
      const meta = (row.metadata ?? {}) as Record<string, unknown>;
      const { guardian_phone: _, ...rest } = meta;
      const updated = { ...rest };
      const { error: updateError } = await (supabase as any)
        .from('sentinel_identities')
        .update({ metadata: updated })
        .eq('id', row.id);
      if (updateError) return { ok: false, error: updateError.message ?? 'Update failed' };
      return { ok: true };
    }
    return { ok: false, error: 'Identity not found' };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

/**
 * Independence Activation: verify Sentinel on unique device, deduct one-time Sovereignty Fee, decouple from Guardian.
 * 1) Verify Handshake (Sentinel on unique device).
 * 2) Deduct SOVEREIGNTY_FEE_VIDA from user's sovereign_internal_wallets and record in foundation_vault_ledger.
 * 3) Decouple account from Guardian's phone (unlink guardian_phone); account links to user's own Anchor.
 */
export async function activateIndependentSentinel(
  identityPhone: string
): Promise<{ ok: true; sentinelId: string } | { ok: false; error: string }> {
  if (!identityPhone || !supabase) {
    return { ok: false, error: 'Identity phone or Supabase not available' };
  }

  const guardianPhone = await getGuardianPhone(identityPhone);
  if (!guardianPhone) {
    return { ok: false, error: 'Account is not linked to a Guardian; no handover needed' };
  }

  const eligibility = await checkSovereigntyEligibility(identityPhone);
  if (!eligibility.eligible) {
    return { ok: false, error: eligibility.reason ?? 'Not eligible for sovereign handover (must be 18+)' };
  }

  const handshake = await activateSentinelHandshake(identityPhone);
  if (!handshake.ok) {
    return { ok: false, error: handshake.error ?? 'Sentinel Handshake failed. Download and activate Sentinel on this device.' };
  }

  const wallet = await getSovereignInternalWallet(identityPhone);
  if (!wallet) {
    return { ok: false, error: 'Sovereign wallet not found' };
  }
  const balance = Number(wallet.vida_cap_balance ?? 0);
  if (balance < SOVEREIGNTY_FEE_VIDA) {
    return {
      ok: false,
      error: `Insufficient balance for Sovereignty Fee. Required: ${SOVEREIGNTY_FEE_VIDA} VIDA. Current: ${balance.toFixed(2)} VIDA.`,
    };
  }

  const newBalance = balance - SOVEREIGNTY_FEE_VIDA;
  const { error: updateWalletError } = await (supabase as any)
    .from('sovereign_internal_wallets')
    .update({
      vida_cap_balance: newBalance,
      updated_at: new Date().toISOString(),
    })
    .eq('phone_number', identityPhone);
  if (updateWalletError) {
    return { ok: false, error: updateWalletError.message ?? 'Failed to deduct Sovereignty Fee' };
  }

  await (supabase as any).from('foundation_vault_ledger').insert({
    citizen_id: identityPhone,
    vida_amount: SOVEREIGNTY_FEE_VIDA,
    corporate_royalty_inflow: 0,
    national_levy_inflow: 0,
    source_type: 'sovereignty_fee',
    reference: `Handover fee for ${identityPhone}`,
    created_at: new Date().toISOString(),
  });

  const unlink = await unlinkGuardianFromIdentity(identityPhone);
  if (!unlink.ok) {
    return { ok: false, error: unlink.error ?? 'Failed to decouple from Guardian' };
  }

  return { ok: true, sentinelId: handshake.sentinelId };
}

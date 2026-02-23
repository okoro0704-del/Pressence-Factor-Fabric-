/**
 * Beneficiary Vault — Legacy nominations (Primary + 2 Secondary).
 * Links owner (Master Device identity anchor) to beneficiary_anchor (phone/identity hash).
 * Proof of Life: 365 days without 3-of-4 → Presence Check; 30 days no response → Inheritance Protocol.
 * Governance: 50% National Reserve remains with Government on transfer; family keeps personal wealth.
 */

import { getSupabase } from './supabase';

export type BeneficiaryRank = 'primary' | 'secondary_1' | 'secondary_2';

export interface LegacyBeneficiary {
  id: string;
  owner_identity_anchor: string;
  beneficiary_anchor: string;
  rank: BeneficiaryRank;
  display_name: string | null;
  created_at: string;
  updated_at: string;
}

const RANKS: BeneficiaryRank[] = ['primary', 'secondary_1', 'secondary_2'];

/** List beneficiaries for an owner (Master Device identity anchor). */
export async function listLegacyBeneficiaries(
  ownerIdentityAnchor: string
): Promise<{ ok: true; beneficiaries: LegacyBeneficiary[] } | { ok: false; error: string }> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('legacy_beneficiaries')
      .select('*')
      .eq('owner_identity_anchor', ownerIdentityAnchor)
      .order('rank', { ascending: true });

    if (error) return { ok: false, error: error.message ?? 'Failed to load beneficiaries' };
    const beneficiaries = (data ?? []) as LegacyBeneficiary[];
    return { ok: true, beneficiaries };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

/** Set Primary Beneficiary. */
export async function setPrimaryBeneficiary(
  ownerIdentityAnchor: string,
  beneficiaryAnchor: string,
  displayName?: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  return upsertBeneficiary(ownerIdentityAnchor, 'primary', beneficiaryAnchor, displayName);
}

/** Set Secondary Beneficiary (index 0 or 1 → secondary_1, secondary_2). */
export async function setSecondaryBeneficiary(
  ownerIdentityAnchor: string,
  index: 0 | 1,
  beneficiaryAnchor: string,
  displayName?: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const rank = index === 0 ? 'secondary_1' : 'secondary_2';
  return upsertBeneficiary(ownerIdentityAnchor, rank, beneficiaryAnchor, displayName);
}

async function upsertBeneficiary(
  ownerIdentityAnchor: string,
  rank: BeneficiaryRank,
  beneficiaryAnchor: string,
  displayName?: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const supabase = getSupabase();
    const row = {
      owner_identity_anchor: ownerIdentityAnchor,
      beneficiary_anchor: beneficiaryAnchor.trim(),
      rank,
      display_name: displayName?.trim() || null,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('legacy_beneficiaries').upsert(row, {
      onConflict: 'owner_identity_anchor,rank',
      ignoreDuplicates: false,
    });
    if (error) return { ok: false, error: error.message ?? 'Failed to save beneficiary' };
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

/** Remove a beneficiary slot. */
export async function removeBeneficiary(
  ownerIdentityAnchor: string,
  rank: BeneficiaryRank
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('legacy_beneficiaries')
      .delete()
      .eq('owner_identity_anchor', ownerIdentityAnchor)
      .eq('rank', rank);
    if (error) return { ok: false, error: error.message ?? 'Failed to remove beneficiary' };
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

/** Proof of Life: If Master Device has not seen 3-of-4 verification for 365 days, send Presence Check. */
export const PROOF_OF_LIFE_DAYS = 365;
export const PRESENCE_CHECK_GRACE_DAYS = 30;

export interface ProofOfLifeStatus {
  lastVerificationAt: Date | null;
  presenceCheckSentAt: Date | null;
  inheritanceActivatedAt: Date | null;
  daysSinceVerification: number | null;
  shouldSendPresenceCheck: boolean;
  shouldActivateInheritance: boolean;
}

/** Get Proof of Life status for owner (stub: requires backend/cron to populate proof_of_life_checks). */
export async function getProofOfLifeStatus(
  ownerIdentityAnchor: string
): Promise<{ ok: true; status: ProofOfLifeStatus } | { ok: false; error: string }> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('proof_of_life_checks')
      .select('*')
      .eq('owner_identity_anchor', ownerIdentityAnchor)
      .maybeSingle();

    if (error) return { ok: false, error: error.message ?? 'Failed to load status' };
    const row = data as { last_3of4_verified_at?: string; presence_check_sent_at?: string; inheritance_activated_at?: string } | null;
    const lastAt = row?.last_3of4_verified_at ? new Date(row.last_3of4_verified_at) : null;
    const checkSentAt = row?.presence_check_sent_at ? new Date(row.presence_check_sent_at) : null;
    const inheritedAt = row?.inheritance_activated_at ? new Date(row.inheritance_activated_at) : null;
    const now = new Date();
    const daysSince = lastAt ? Math.floor((now.getTime() - lastAt.getTime()) / (24 * 60 * 60 * 1000)) : null;
    const shouldSendCheck = daysSince != null && daysSince >= PROOF_OF_LIFE_DAYS && !checkSentAt;
    const graceEnd = checkSentAt ? new Date(checkSentAt.getTime() + PRESENCE_CHECK_GRACE_DAYS * 24 * 60 * 60 * 1000) : null;
    const shouldActivate = !!graceEnd && now >= graceEnd && !inheritedAt;

    return {
      ok: true,
      status: {
        lastVerificationAt: lastAt,
        presenceCheckSentAt: checkSentAt,
        inheritanceActivatedAt: inheritedAt,
        daysSinceVerification: daysSince,
        shouldSendPresenceCheck: shouldSendCheck,
        shouldActivateInheritance: shouldActivate,
      },
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

/**
 * Biometric Handover: Beneficiary performs 3-of-4 scan; system matches to nominated anchor
 * and transfers spendable VIDA to new user's wallet. 50% National Reserve remains with Government.
 */
export async function claimLegacyAsBeneficiary(
  beneficiaryIdentityAnchor: string,
  _beneficiaryAuthResult: { layersPassed: string[]; identity?: { phone_number?: string } }
): Promise<{ ok: true; amountTransferred: number } | { ok: false; error: string }> {
  // Stub: backend would verify 3-of-4, match beneficiary_anchor, transfer citizen share only (50% reserve preserved)
  try {
    const supabase = getSupabase();
    const { data: activation, error: actError } = await supabase
      .from('inheritance_activations')
      .select('*')
      .eq('beneficiary_anchor', beneficiaryIdentityAnchor)
      .eq('status', 'pending')
      .maybeSingle();

    if (actError || !activation) return { ok: false, error: 'No pending inheritance for this beneficiary.' };
    // In production: transfer spendable VIDA from citizen_vaults to new beneficiary; national_reserve unchanged
    const amountTransferred = Number((activation as { spendable_transferred?: number }).spendable_transferred ?? 0);
    return { ok: true, amountTransferred };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

export { RANKS };

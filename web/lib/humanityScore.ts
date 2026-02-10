/**
 * Proof of Personhood — humanity_score on user_profiles.
 * A successful Triple-Pillar scan with external biometric device sets humanity_score to 1.0.
 * Mint only executes when humanity_score is 1.0 and biometric_anchor is from an external device.
 */

import { getSupabase } from './supabase';

/** Elite status value: verified human (Triple-Pillar + external device). */
export const HUMANITY_SCORE_VERIFIED = 1.0;

/**
 * Set humanity_score to 1.0 for a user (Proof of Personhood).
 * Call when Triple-Pillar scan succeeds with an external biometric device.
 */
export async function setHumanityScoreVerified(
  phoneNumber: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: 'Supabase not available' };
  const trimmed = phoneNumber?.trim();
  if (!trimmed) return { ok: false, error: 'Phone number required.' };
  try {
    const { error } = await (supabase as any)
      .from('user_profiles')
      .update({
        humanity_score: HUMANITY_SCORE_VERIFIED,
        updated_at: new Date().toISOString(),
      })
      .eq('phone_number', trimmed);
    if (error) return { ok: false, error: error.message ?? 'Failed to set humanity_score' };
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

export interface HumanityCheck {
  humanity_score: number | null;
  external_scanner_serial_number: string | null;
  external_fingerprint_hash: string | null;
}

/**
 * Fetch humanity_score and external biometric anchors for Anti-Bot mint guard.
 */
export async function getHumanityCheck(
  phoneNumber: string
): Promise<{ ok: true; data: HumanityCheck } | { ok: false; error: string }> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: 'Supabase not available' };
  const trimmed = phoneNumber?.trim();
  if (!trimmed) return { ok: false, error: 'Phone number required.' };
  try {
    const { data, error } = await (supabase as any)
      .from('user_profiles')
      .select('humanity_score, external_scanner_serial_number, external_fingerprint_hash')
      .eq('phone_number', trimmed)
      .maybeSingle();
    if (error) return { ok: false, error: error.message ?? 'Failed to fetch profile' };
    const row = (data ?? {}) as {
      humanity_score?: number | null;
      external_scanner_serial_number?: string | null;
      external_fingerprint_hash?: string | null;
    };
    return {
      ok: true,
      data: {
        humanity_score: row.humanity_score ?? null,
        external_scanner_serial_number: row.external_scanner_serial_number ?? null,
        external_fingerprint_hash: row.external_fingerprint_hash ?? null,
      },
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

/** True when user is verified human (humanity_score 1.0). Set by save_pillars_at_75 when vitalized; allows 5+5 mint. */
export function isEligibleForMint(check: HumanityCheck): boolean {
  return check.humanity_score === HUMANITY_SCORE_VERIFIED;
}

export interface IdCardProfile {
  full_name: string | null;
  humanity_score: number | null;
}

/** Fetch display name and Proof of Personhood status for Sovereign ID Card. */
export async function getIdCardProfile(
  phoneNumber: string
): Promise<{ ok: true; profile: IdCardProfile } | { ok: false; error: string }> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: 'Supabase not available' };
  const trimmed = phoneNumber?.trim();
  if (!trimmed) return { ok: false, error: 'Phone number required.' };
  try {
    const { data, error } = await (supabase as any)
      .from('user_profiles')
      .select('full_name, humanity_score')
      .eq('phone_number', trimmed)
      .maybeSingle();
    if (error) return { ok: false, error: error.message ?? 'Failed to fetch profile' };
    const row = (data ?? {}) as { full_name?: string | null; humanity_score?: number | null };
    return {
      ok: true,
      profile: {
        full_name: row.full_name ?? null,
        humanity_score: row.humanity_score ?? null,
      },
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

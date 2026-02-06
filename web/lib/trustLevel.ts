/**
 * DNA Learning Curve — trust_level in user_profiles.
 * Every successful login increases trust_level. Soft Start (low sensitivity, no strict lighting/confidence)
 * for the first 10 logins; when trust_level > 10, app suggests Sovereign Shield (High Security) mode.
 */

import { getSupabase } from './supabase';

const SOFT_START_THRESHOLD = 10;

/** Get current trust_level for a user (by phone). Default 0. */
export async function getTrustLevel(phoneNumber: string): Promise<number> {
  const supabase = getSupabase();
  if (!supabase || !phoneNumber?.trim()) return 0;
  try {
    const { data, error } = await (supabase as any)
      .from('user_profiles')
      .select('trust_level')
      .eq('phone_number', phoneNumber.trim())
      .maybeSingle();
    if (error || !data) return 0;
    const v = data.trust_level;
    return typeof v === 'number' && v >= 0 ? v : 0;
  } catch {
    return 0;
  }
}

/** Increment trust_level by 1 on successful login. Call after successful Face Pulse / Backup Anchor. */
export async function incrementTrustLevel(phoneNumber: string): Promise<{ ok: true; trustLevel: number } | { ok: false; error: string }> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: 'Supabase not available' };
  const trimmed = phoneNumber?.trim();
  if (!trimmed) return { ok: false, error: 'Phone number required' };
  try {
    const current = await getTrustLevel(trimmed);
    const next = current + 1;
    const { error } = await (supabase as any)
      .from('user_profiles')
      .update({ trust_level: next, updated_at: new Date().toISOString() })
      .eq('phone_number', trimmed);
    if (error) return { ok: false, error: error.message ?? 'Failed to update trust_level' };
    return { ok: true, trustLevel: next };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

/** Soft Start: first 10 successful logins use LOW sensitivity and no strict lighting/confidence barriers. */
export function isSoftStart(trustLevel: number): boolean {
  return trustLevel < SOFT_START_THRESHOLD;
}

/** When trust_level > 10, suggest switching to Sovereign Shield (High Security) mode. */
export function shouldSuggestSovereignShield(trustLevel: number): boolean {
  return trustLevel > SOFT_START_THRESHOLD;
}

/** Async helper: true when user is in Soft Start (first 10 logins). Used by FourLayerGate to set softStart state. */
export async function useSoftStart(phoneNumber: string): Promise<boolean> {
  const t = await getTrustLevel(phoneNumber);
  return isSoftStart(t);
}

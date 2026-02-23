/**
 * Palm hash in user_profiles — enrollment and verification for Palm Pulse (second pillar).
 * Dual-Pillar: Scan 1 Face Pulse (identity), Scan 2 Palm Pulse (authorize $100 daily unlock).
 */

import { getSupabase } from './supabase';

/** Get stored palm_hash for a user (by phone). Null if not enrolled. */
export async function getPalmHash(phoneNumber: string): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase || !phoneNumber?.trim()) return null;
  try {
    const { data, error } = await (supabase as any)
      .from('user_profiles')
      .select('palm_hash')
      .eq('phone_number', phoneNumber.trim())
      .maybeSingle();
    if (error || !data) return null;
    const h = data.palm_hash;
    return typeof h === 'string' && h.trim() ? h.trim() : null;
  } catch {
    return null;
  }
}

/** Save palm_hash (enrollment or update). Call after successful Palm Pulse capture. */
export async function savePalmHash(
  phoneNumber: string,
  palmHashHex: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: 'Supabase not available' };
  const trimmed = phoneNumber?.trim();
  const hash = palmHashHex?.trim();
  if (!trimmed || !hash) return { ok: false, error: 'Phone number and palm hash required' };
  try {
    const { error } = await (supabase as any)
      .from('user_profiles')
      .update({ palm_hash: hash, updated_at: new Date().toISOString() })
      .eq('phone_number', trimmed);
    if (error) return { ok: false, error: error.message ?? 'Failed to save palm_hash' };
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

/**
 * Verify live palm hash against stored. If no stored hash, treat as first-time enrollment (return true and caller should save).
 * Exact match only (palm geometry hash is stable enough per user).
 */
export async function verifyOrEnrollPalm(
  phoneNumber: string,
  livePalmHashHex: string
): Promise<{ ok: true; enrolled: boolean } | { ok: false; error: string }> {
  const stored = await getPalmHash(phoneNumber);
  const live = livePalmHashHex?.trim();
  if (!live) return { ok: false, error: 'No palm hash to verify' };
  if (!stored) {
    const save = await savePalmHash(phoneNumber, live);
    return save.ok ? { ok: true, enrolled: true } : { ok: false, error: save.error };
  }
  if (stored !== live) return { ok: false, error: 'Palm does not match. Please try again or use Backup Anchor.' };
  return { ok: true, enrolled: false };
}

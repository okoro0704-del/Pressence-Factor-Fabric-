/**
 * Palm hash storage and verification — palm_hash in user_profiles.
 * Used for Palm Pulse (second pillar) and $100 daily unlock.
 */

import { getSupabase } from './supabase';

/** Get stored palm_hash for a user (by phone). */
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
    return typeof h === 'string' && h.length > 0 ? h : null;
  } catch {
    return null;
  }
}

/** Save palm_hash after first successful Palm Pulse (enrollment). */
export async function setPalmHash(
  phoneNumber: string,
  palmHash: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: 'Supabase not available' };
  const trimmed = phoneNumber?.trim();
  if (!trimmed || !palmHash?.trim()) return { ok: false, error: 'Phone number and palm hash required' };
  try {
    const { error } = await (supabase as any)
      .from('user_profiles')
      .update({ palm_hash: palmHash.trim(), updated_at: new Date().toISOString() })
      .eq('phone_number', trimmed);
    if (error) return { ok: false, error: error.message ?? 'Failed to save palm_hash' };
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

/** Verify: compare live palm hash with stored. Exact match (hash is deterministic). */
export async function verifyPalmHash(phoneNumber: string, livePalmHash: string): Promise<boolean> {
  const stored = await getPalmHash(phoneNumber);
  if (!stored) return false;
  return stored.trim() === livePalmHash.trim();
}

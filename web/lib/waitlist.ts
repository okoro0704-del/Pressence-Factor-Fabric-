/**
 * Waitlist — Join the Vanguard. Insert email into Supabase waitlist table.
 * Wrapped in try/catch so static build and missing Supabase never crash.
 */

import { getSupabase, hasSupabase } from './supabase';

export type WaitlistResult =
  | { ok: true }
  | { ok: false; error: string };

const REFERRAL_SOURCE = 'manifesto';

/** Basic email format check. */
function isValidEmail(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 255) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

/**
 * Insert one waitlist entry. Safe for static export: no Supabase at build time.
 * Returns ok: false with message if Supabase missing, insert fails, or duplicate.
 */
export async function insertWaitlistEntry(
  email: string,
  referralSource: string = REFERRAL_SOURCE
): Promise<WaitlistResult> {
  if (typeof window === 'undefined') {
    return { ok: false, error: 'Not available during build.' };
  }

  const trimmed = email.trim();
  if (!trimmed) return { ok: false, error: 'Email is required.' };
  if (!isValidEmail(trimmed)) return { ok: false, error: 'Please enter a valid email address.' };

  try {
    if (!hasSupabase()) {
      return { ok: false, error: 'Protocol is not connected. Try again later.' };
    }

    const client = getSupabase();
    const { data, error } = await client
      .from('waitlist')
      .insert({
        email: trimmed.toLowerCase(),
        referral_source: referralSource || REFERRAL_SOURCE,
      })
      .select('id')
      .maybeSingle();

    if (error) {
      const msg = error.message ?? 'Could not join waitlist.';
      if (msg.includes('duplicate') || msg.includes('unique') || msg.includes('already')) {
        return { ok: true };
      }
      return { ok: false, error: msg };
    }

    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

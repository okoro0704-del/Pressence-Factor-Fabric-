/**
 * Persist country_code to user_profiles for global VIDA distribution tracking.
 * Called after identity anchor verification when user selects country in picker.
 */

import { supabase, hasSupabase } from './supabase';

/** Get country_code for a phone (E.164). Returns null if not found or no code. */
export async function getCountryCodeForPhone(phoneE164: string | null): Promise<string | null> {
  if (!hasSupabase() || !phoneE164?.trim()) return null;
  const { data, error } = await supabase
    .from('user_profiles')
    .select('country_code')
    .eq('phone_number', phoneE164.trim())
    .maybeSingle();
  if (error || !data?.country_code) return null;
  return String(data.country_code).trim().toUpperCase();
}

export type CountryCode = string; // ISO 3166-1 alpha-2 (e.g. NG, US, GB)

export interface SaveCountryCodeResult {
  ok: boolean;
  error?: string;
}

/**
 * Save country_code for the given phone (E.164). Used by auth flow after anchor verify.
 * Requires RLS to allow update on own row (e.g. by phone_number or auth.uid()).
 */
export async function saveUserProfileCountryCode(
  phoneE164: string,
  countryCode: CountryCode
): Promise<SaveCountryCodeResult> {
  if (!hasSupabase() || !supabase) {
    return { ok: false, error: 'Supabase not available' };
  }
  const code = countryCode?.trim().toUpperCase();
  if (!code || code.length !== 2) {
    return { ok: false, error: 'Invalid country code' };
  }

  const { error } = await supabase
    .from('user_profiles')
    .update({
      country_code: code,
      updated_at: new Date().toISOString(),
    })
    .eq('phone_number', phoneE164);

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

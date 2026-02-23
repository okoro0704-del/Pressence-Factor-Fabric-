/**
 * Supabase Auth client for Presence Factor Fabric.
 * signInWithOtp configured for international phone formats (E.164 via libphonenumber-js).
 */

import { parsePhoneNumberWithError, type CountryCode } from 'libphonenumber-js';
import { getSupabase } from './supabase';

export type { CountryCode };

/** Normalize and validate phone to E.164 (e.g. +2348012345678, +447700900123). */
export function formatPhoneE164(phone: string, defaultCountry?: CountryCode): { ok: true; e164: string } | { ok: false; error: string } {
  try {
    const trimmed = phone.trim().replace(/\s/g, '');
    if (!trimmed) return { ok: false, error: 'Phone number is required' };
    const parsed = defaultCountry
      ? parsePhoneNumberWithError(trimmed, defaultCountry)
      : parsePhoneNumberWithError(trimmed);
    if (!parsed.isValid()) return { ok: false, error: 'Invalid phone number' };
    return { ok: true, e164: parsed.format('E.164') };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg || 'Invalid phone number format' };
  }
}

/** Get country calling code for display (e.g. +234, +44). */
export function getCountryCallingCode(country: CountryCode): string {
  try {
    const parsed = parsePhoneNumberWithError('8012345678', country);
    return `+${parsed.countryCallingCode}`;
  } catch {
    return '+1';
  }
}

/** Auth redirect: use current origin so logins work on both Netlify URL and custom domain. */
function getAuthRedirectUrl(): string | undefined {
  if (typeof window === 'undefined' || !window.location?.origin) return undefined;
  return window.location.origin;
}

/**
 * Sign in with OTP (SMS). Phone must be in E.164 format.
 * Use formatPhoneE164() before calling if input may be national format.
 * redirectTo uses current origin so auth works on both pffwork.netlify.app and pffprotocol.com.
 */
export async function signInWithOtp(phoneE164: string, options?: { channel?: 'sms' | 'whatsapp' }) {
  const supabase = getSupabase();
  const redirectTo = getAuthRedirectUrl();
  const { data, error } = await supabase.auth.signInWithOtp({
    phone: phoneE164,
    options: {
      ...(options ?? { channel: 'sms' }),
      ...(redirectTo ? { redirectTo } : {}),
    },
  });
  return { data, error };
}

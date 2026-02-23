/**
 * Global SMS Gateway for Presence Factor Fabric.
 * Bridge to send verification codes with Failover: on primary failure, log and offer Vocal Call verification.
 */

import { signInWithOtp, formatPhoneE164, type CountryCode } from './supabaseClient';

export type SmsResult = { ok: true; channel: 'sms' } | { ok: false; error: string; offerVocalCall: boolean };

/**
 * Send verification code via primary SMS gateway (Supabase Auth OTP).
 * Failover: if primary fails, log error and return offerVocalCall: true so UI can offer "Vocal Call" verification.
 */
export async function sendVerificationCode(
  phone: string,
  defaultCountry?: CountryCode
): Promise<SmsResult> {
  const formatted = formatPhoneE164(phone, defaultCountry);
  if (!formatted.ok) {
    return { ok: false, error: formatted.error, offerVocalCall: false };
  }

  try {
    const { data, error } = await signInWithOtp(formatted.e164, { channel: 'sms' });

    if (error) {
      console.error('[SMS Gateway] Primary SMS failed:', error.message ?? error);
      return {
        ok: false,
        error: error.message ?? 'SMS delivery failed',
        offerVocalCall: true,
      };
    }

    if (!data?.session && !data?.user && error) {
      console.warn('[SMS Gateway] OTP sent but no session (expected for OTP flow)');
    }

    return { ok: true, channel: 'sms' };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[SMS Gateway] Primary gateway threw:', msg);
    return {
      ok: false,
      error: msg,
      offerVocalCall: true,
    };
  }
}

/**
 * Vocal Call verification option (failover when SMS fails).
 * Caller can use this to trigger a phone-call-based verification flow when offerVocalCall is true.
 */
export type VocalCallVerificationOption = {
  type: 'vocal_call';
  phoneE164: string;
  message: string;
};

export function getVocalCallOption(phoneE164: string): VocalCallVerificationOption {
  return {
    type: 'vocal_call',
    phoneE164,
    message: 'Verification code could not be sent by SMS. Use Vocal Call verification instead.',
  };
}

/**
 * Biometric Strictness — user preference stored in user_profiles (follows user to any device).
 * Low = High Speed (reduced lighting, faster match). High = Maximum Security (strict mesh, lighting enforced).
 */

import { getSupabase } from './supabase';

export type BiometricStrictness = 'low' | 'high';

export const STRICTNESS_LOW: BiometricStrictness = 'low';
export const STRICTNESS_HIGH: BiometricStrictness = 'high';

/** Low: confidence threshold 0.4, brightness check disabled. High: 0.8, brightness enforced. */
export const CONFIDENCE_THRESHOLD_LOW = 0.4;
export const CONFIDENCE_THRESHOLD_HIGH = 0.8;

/** Default if profile has no value. */
export const DEFAULT_STRICTNESS: BiometricStrictness = 'low';

export interface BiometricStrictnessConfig {
  strictness: BiometricStrictness;
  /** Face mesh confidence threshold (0–1). Pass when match confidence >= this. */
  confidenceThreshold: number;
  /** When true, show "Increase Lighting" and block scan if brightness too low. */
  enforceBrightnessCheck: boolean;
}

export function strictnessToConfig(strictness: BiometricStrictness | null | undefined): BiometricStrictnessConfig {
  const s = strictness === 'high' ? 'high' : 'low';
  return {
    strictness: s,
    confidenceThreshold: s === 'high' ? CONFIDENCE_THRESHOLD_HIGH : CONFIDENCE_THRESHOLD_LOW,
    enforceBrightnessCheck: s === 'high',
  };
}

/** Get current user's biometric strictness from user_profiles (by phone). */
export async function getBiometricStrictness(phoneNumber: string): Promise<BiometricStrictness> {
  const supabase = getSupabase();
  if (!supabase || !phoneNumber?.trim()) return DEFAULT_STRICTNESS;
  try {
    const { data, error } = await (supabase as any)
      .from('user_profiles')
      .select('biometric_strictness')
      .eq('phone_number', phoneNumber.trim())
      .maybeSingle();
    if (error || !data) return DEFAULT_STRICTNESS;
    const v = (data.biometric_strictness ?? '').toLowerCase().trim();
    return v === 'high' ? 'high' : 'low';
  } catch {
    return DEFAULT_STRICTNESS;
  }
}

/** Save biometric strictness to user_profiles (by phone). */
export async function setBiometricStrictness(
  phoneNumber: string,
  strictness: BiometricStrictness
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: 'Supabase not available' };
  const trimmed = phoneNumber?.trim();
  if (!trimmed) return { ok: false, error: 'Phone number required' };
  const value = strictness === 'high' ? 'high' : 'low';
  try {
    const { error } = await (supabase as any)
      .from('user_profiles')
      .update({ biometric_strictness: value, updated_at: new Date().toISOString() })
      .eq('phone_number', trimmed);
    if (error) return { ok: false, error: error.message ?? 'Failed to save' };
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

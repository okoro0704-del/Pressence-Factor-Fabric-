/**
 * Single Handshake = 100% Vitalization (9-Day Ritual removed).
 * One Quad-Pillar Handshake triggers full Vitalization immediately.
 * - Citizen_Vault: first 0.1 VIDA spendable on Day Zero; no daily-scan or 10-day vesting requirement.
 * - getVitalizationStatus: unlocked when user has any spendable or is_minted (already vitalized).
 * - recordDailyScan: still records scan for analytics; first scan treated as full unlock (streak = 10, full spendable if needed).
 */

import { getSupabase } from './supabase';
import { setBiometricStrictness } from './biometricStrictness';

/** Single handshake = full unlock; no 9-day requirement. */
const STREAK_TARGET = 10;
const DAILY_UNLOCK_VIDA_AMOUNT = 0.1;

export interface VitalizationStatus {
  streak: number;
  lastScanDate: string | null;
  spendableVida: number;
  lockedVida: number;
  /** True when user has completed vitalization (single handshake = 100%). */
  unlocked: boolean;
}

/** Get current vitalization state. Unlocked = already vitalized (has spendable or is_minted); no 9-day wait. */
export async function getVitalizationStatus(phoneNumber: string): Promise<VitalizationStatus | null> {
  const supabase = getSupabase();
  if (!supabase || !phoneNumber?.trim()) return null;
  try {
    const { data, error } = await (supabase as any)
      .from('user_profiles')
      .select('vitalization_streak, vitalization_last_scan_date, spendable_vida, locked_vida, is_minted')
      .eq('phone_number', phoneNumber.trim())
      .maybeSingle();
    if (error || !data) return null;
    const spendableVida = Number(data.spendable_vida) || 0;
    const lockedVida = Number(data.locked_vida) || 0;
    const isMinted = data.is_minted === true;
    const streak = Math.min(STREAK_TARGET, Number(data.vitalization_streak) || 0);
    const unlocked = isMinted || spendableVida >= DAILY_UNLOCK_VIDA_AMOUNT;
    return {
      streak: unlocked ? STREAK_TARGET : streak,
      lastScanDate: data.vitalization_last_scan_date ?? null,
      spendableVida,
      lockedVida,
      unlocked,
    };
  } catch {
    return null;
  }
}

/**
 * Record a successful scan (Face + Palm/Fingerprint). Single handshake = full unlock.
 * No 9-day or 10-day vesting: first scan sets streak to STREAK_TARGET and full spendable (1 VIDA) immediately.
 */
export async function recordDailyScan(phoneNumber: string): Promise<{
  ok: true;
  streak: number;
  justUnlocked: boolean;
  unlockedToday?: boolean;
  newSpendableVida?: number;
} | { ok: false; error: string }> {
  const supabase = getSupabase();
  if (!supabase || !phoneNumber?.trim()) return { ok: false, error: 'Supabase or phone required' };
  const trimmed = phoneNumber?.trim();

  try {
    const today = new Date().toISOString().slice(0, 10);

    const { data: profile, error: fetchError } = await (supabase as any)
      .from('user_profiles')
      .select('vitalization_streak, vitalization_last_scan_date, spendable_vida, locked_vida, is_minted')
      .eq('phone_number', trimmed)
      .maybeSingle();

    if (fetchError || !profile) return { ok: false, error: fetchError?.message ?? 'Profile not found' };

    const currentStreak = Number(profile.vitalization_streak) || 0;
    const lastScan = profile.vitalization_last_scan_date ? String(profile.vitalization_last_scan_date).slice(0, 10) : null;
    const spendable = Number(profile.spendable_vida) || 0;
    const locked = Number(profile.locked_vida) || 0;

    const payload: Record<string, unknown> = {
      vitalization_last_scan_date: today,
      updated_at: new Date().toISOString(),
      vitalization_streak: STREAK_TARGET,
    };

    if (spendable < 1 && locked >= 0.9) {
      payload.spendable_vida = 1;
      payload.locked_vida = Math.max(0, locked - (1 - spendable));
    }

    const { error: updateError } = await (supabase as any)
      .from('user_profiles')
      .update(payload)
      .eq('phone_number', trimmed);

    if (updateError) return { ok: false, error: updateError.message ?? 'Failed to update' };

    try {
      await (supabase as any).from('vitalization_daily_scans').insert({ phone_number: trimmed, scan_date: today });
    } catch {
      /* table may not exist */
    }
    try {
      await setBiometricStrictness(trimmed, 'high');
    } catch {
      /* ignore */
    }

    const newSpendable = payload.spendable_vida != null ? Number(payload.spendable_vida) : spendable;
    const justUnlocked = currentStreak < STREAK_TARGET;
    return {
      ok: true,
      streak: STREAK_TARGET,
      justUnlocked,
      unlockedToday: payload.spendable_vida != null,
      newSpendableVida: newSpendable > 0 ? newSpendable : undefined,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

export { STREAK_TARGET, DAILY_UNLOCK_VIDA_AMOUNT };

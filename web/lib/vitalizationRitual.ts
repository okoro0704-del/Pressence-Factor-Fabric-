/**
 * 9-Day Ritual Unlock (10 daily releases)
 * - Citizen_Vault 4/1 lock: 1 VIDA is the spendable portion, released over 10 days.
 * - Every 24 hours of successful Palm Scan releases $100 worth of VIDA (0.1 VIDA) until the full $1,000 (1 VIDA) is spendable.
 * - Starting balance: 0.1 VIDA Spendable ($100) + 4.9 VIDA Locked. Days 1–10: each new-day scan adds 0.1 VIDA to spendable (one per day; no double-unlock).
 * - On Day 10: full 1 VIDA spendable; set biometric_strictness to HIGH.
 */

import { getSupabase } from './supabase';
import { setBiometricStrictness } from './biometricStrictness';

const STREAK_TARGET = 10;
/** Per-day unlock: 0.1 VIDA ($100) from locked to spendable each day until full $1,000 (1 VIDA) is spendable. */
const DAILY_UNLOCK_VIDA_AMOUNT = 0.1;

export interface VitalizationStatus {
  streak: number;
  lastScanDate: string | null;
  spendableVida: number;
  lockedVida: number;
  unlocked: boolean;
}

/** Get current vitalization streak and balances (for "Day X of 9" UI). */
export async function getVitalizationStatus(phoneNumber: string): Promise<VitalizationStatus | null> {
  const supabase = getSupabase();
  if (!supabase || !phoneNumber?.trim()) return null;
  try {
    const { data, error } = await (supabase as any)
      .from('user_profiles')
      .select('vitalization_streak, vitalization_last_scan_date, spendable_vida, locked_vida')
      .eq('phone_number', phoneNumber.trim())
      .maybeSingle();
    if (error || !data) return null;
    const streak = Math.min(STREAK_TARGET, Number(data.vitalization_streak) || 0);
    const spendableVida = Number(data.spendable_vida) || 0;
    const lockedVida = Number(data.locked_vida) || 0;
    const unlocked = streak >= STREAK_TARGET;
    return {
      streak,
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
 * Record a successful daily Face + Palm/Fingerprint scan.
 * - One increment per calendar day; consecutive day = streak + 1; missed day = streak unchanged (no reset).
 * - Inserts a Training Sample into vitalization_daily_scans.
 * - Daily $100 Unlock: On Days 1–10 (inclusive), each new-day scan moves 0.1 VIDA from locked_vida to spendable_vida until full $1,000 (1 VIDA) is spendable. Same-day scans do not double-unlock.
 * - On Day 10: set biometric_strictness to HIGH.
 */
export async function recordDailyScan(phoneNumber: string): Promise<{
  ok: true;
  streak: number;
  /** True when Day 9 was just reached (full unlock). */
  justUnlocked: boolean;
  /** True when 0.1 VIDA was moved to spendable this run (Days 2–9, new day only). */
  unlockedToday?: boolean;
  /** New spendable balance after unlock (when unlockedToday). */
  newSpendableVida?: number;
} | { ok: false; error: string }> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: 'Supabase not available' };
  const trimmed = phoneNumber?.trim();
  if (!trimmed) return { ok: false, error: 'Phone number required' };

  try {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    const { data: profile, error: fetchError } = await (supabase as any)
      .from('user_profiles')
      .select('vitalization_streak, vitalization_last_scan_date, spendable_vida, locked_vida')
      .eq('phone_number', trimmed)
      .maybeSingle();

    if (fetchError || !profile) return { ok: false, error: fetchError?.message ?? 'Profile not found' };

    const currentStreak = Math.min(STREAK_TARGET, Number(profile.vitalization_streak) || 0);
    const lastScan = profile.vitalization_last_scan_date ? String(profile.vitalization_last_scan_date).slice(0, 10) : null;

    let newStreak = currentStreak;
    if (lastScan === today) {
      // Already counted today — no streak change, no unlock (prevents double-unlock)
      const { error: insertErr } = await (supabase as any)
        .from('vitalization_daily_scans')
        .insert({ phone_number: trimmed, scan_date: today });
      if (insertErr && !/duplicate|unique/i.test(String(insertErr.message))) {}
      return { ok: true, streak: currentStreak, justUnlocked: false, unlockedToday: false };
    }
    const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
    if (lastScan === yesterday) {
      newStreak = Math.min(STREAK_TARGET, currentStreak + 1);
    } else if (!lastScan) {
      newStreak = 1; // First scan = Day 1 of ritual
    }

    // Training Sample: insert daily scan record (idempotent per phone+date)
    const { error: insertErr } = await (supabase as any)
      .from('vitalization_daily_scans')
      .insert({ phone_number: trimmed, scan_date: today });
    if (insertErr && !/duplicate|unique/i.test(String(insertErr.message))) {}

    const payload: Record<string, unknown> = {
      vitalization_streak: newStreak,
      vitalization_last_scan_date: today,
      updated_at: new Date().toISOString(),
    };

    // Daily $100 Unlock: Days 1–10 — move 0.1 VIDA from locked to spendable (only on this new-day path; no double-unlock)
    const shouldUnlockToday = newStreak >= 1 && newStreak <= STREAK_TARGET;
    if (shouldUnlockToday) {
      const spendable = Number(profile.spendable_vida) || 0;
      const locked = Number(profile.locked_vida) || 0;
      payload.spendable_vida = Math.max(0, spendable + DAILY_UNLOCK_VIDA_AMOUNT);
      payload.locked_vida = Math.max(0, locked - DAILY_UNLOCK_VIDA_AMOUNT);
    }
    const justUnlockedDay9 = newStreak === STREAK_TARGET && currentStreak < STREAK_TARGET;
    if (justUnlockedDay9) {
      payload.biometric_strictness = 'high';
    }

    const { error: updateError } = await (supabase as any)
      .from('user_profiles')
      .update(payload)
      .eq('phone_number', trimmed);

    if (updateError) return { ok: false, error: updateError.message ?? 'Failed to update streak' };

    if (justUnlockedDay9) await setBiometricStrictness(trimmed, 'high');

    const newSpendable = shouldUnlockToday
      ? Math.max(0, (Number(profile.spendable_vida) || 0) + DAILY_UNLOCK_VIDA_AMOUNT)
      : undefined;
    return {
      ok: true,
      streak: newStreak,
      justUnlocked: justUnlockedDay9,
      unlockedToday: shouldUnlockToday,
      newSpendableVida: newSpendable,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

export { STREAK_TARGET, DAILY_UNLOCK_VIDA_AMOUNT };

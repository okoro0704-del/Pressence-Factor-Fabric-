/**
 * Single Source of Truth for Vitalization State and Navigation.
 * Used by root/layout, ProtectedRoute, and AppShell to:
 * - Force stay on /vitalization when user exists but citizen_record (Supabase face_hash) is empty.
 * - Show Restore Identity when citizen_record exists but local_hash (vitalization anchor) is missing.
 * - Allow Dashboard when both exist.
 */

import { getIdentityAnchorPhone } from './sentinelActivation';
import { getVitalizationAnchor } from './vitalizationAnchor';
import { getSupabase } from './supabase';
import { getCitizenStatusForPhone } from './supabaseTelemetry';

export type VitalizationStatus =
  | 'no_user'           // No identity anchor (phone) — show gate / registration
  | 'no_citizen_record' // User (phone) exists but no Supabase row or no face_hash → force /vitalization
  | 'needs_restore'     // Supabase has face_hash but local anchor (citizenHash) missing → Restore Identity page
  | 'vitalized';        // Both citizen_record and local_hash exist → allow Dashboard

/** User-facing status message when device is not yet anchored (replaces "Details not stored" as error). */
export const DEVICE_NOT_ANCHORED_MESSAGE =
  'Device not yet Anchored. Please complete Vitalization to secure this device.';

/** State lockdown: when true, app must not return to scanner unless user manually logs out. */
export const VITALIZATION_COMPLETE_KEY = 'VITALIZATION_COMPLETE';

/** One-way flow: once set, app must NEVER show registration again—only Welcome Home face scan. */
export const PFF_VITALIZED_KEY = 'pff_VITALIZED';

/** Persistence: user never sees vitalization screen again after successful scan. */
export const IS_VITALIZED_KEY = 'is_vitalized';

/** Anchor confirmation: set before redirect so route guard never sends user back to /vitalization or /registration. */
export const VITALIZATION_COMPLETE_STORAGE_KEY = 'vitalization_complete';

export function setVitalizationComplete(): void {
  try {
    if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(VITALIZATION_COMPLETE_KEY, 'true');
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(PFF_VITALIZED_KEY, '1');
      localStorage.setItem(IS_VITALIZED_KEY, 'true');
      localStorage.setItem(VITALIZATION_COMPLETE_STORAGE_KEY, 'true');
    }
  } catch {
    // ignore
  }
}

/** True if device has ever completed vitalization (one-way flag). Never show registration again. */
export function isVitalizedFlag(): boolean {
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem(PFF_VITALIZED_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * Single source of truth: app must NEVER redirect this user back to gate/vitalization/scanner
 * except on explicit logout (or session clear). Once vitalization is complete, user stays where they are.
 */
export function shouldNeverRedirectBack(): boolean {
  try {
    if (typeof localStorage === 'undefined') return false;
    if (localStorage.getItem(VITALIZATION_COMPLETE_STORAGE_KEY) === 'true') return true;
    if (localStorage.getItem(IS_VITALIZED_KEY) === 'true') return true;
    if (localStorage.getItem(PFF_VITALIZED_KEY) === '1') return true;
    return false;
  } catch {
    return false;
  }
}

/** Clear vitalization completion flags (session + localStorage). Call on logout so user is sent back to language/gate. */
export function clearVitalizationComplete(): void {
  try {
    if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(VITALIZATION_COMPLETE_KEY);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(VITALIZATION_COMPLETE_STORAGE_KEY);
      localStorage.removeItem(IS_VITALIZED_KEY);
      localStorage.removeItem(PFF_VITALIZED_KEY);
    }
  } catch {
    // ignore
  }
}

export function isVitalizationComplete(): boolean {
  try {
    return typeof sessionStorage !== 'undefined' && sessionStorage.getItem(VITALIZATION_COMPLETE_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Resolve current vitalization status from identity anchor, Supabase user_profiles, and local anchor.
 * Backend is source of truth: if Supabase says VITALIZED for this phone, we return 'vitalized' and
 * set local flags so the UI aligns (even when this device has no stored anchor yet).
 */
export async function getVitalizationStatus(): Promise<VitalizationStatus> {
  if (typeof window === 'undefined') return 'no_user';

  const phone = getIdentityAnchorPhone();
  if (!phone?.trim()) return 'no_user';

  try {
    const citizenStatus = await getCitizenStatusForPhone(phone.trim());
    if (citizenStatus === 'VITALIZED') {
      setVitalizationComplete();
      return 'vitalized';
    }
  } catch {
    // fall through to local/Supabase checks
  }

  const supabase = getSupabase();
  if (!supabase) return 'no_citizen_record';

  try {
    const { data, error } = await (supabase as any)
      .from('user_profiles')
      .select('face_hash')
      .eq('phone_number', phone.trim())
      .maybeSingle();

    if (error || !data) return 'no_citizen_record';
    const faceHash = (data as { face_hash?: string | null }).face_hash;
    if (!faceHash || !String(faceHash).trim()) return 'no_citizen_record';

    const anchor = await getVitalizationAnchor();
    if (!anchor.citizenHash || !anchor.citizenHash.trim()) return 'needs_restore';

    return 'vitalized';
  } catch {
    return 'no_citizen_record';
  }
}

/**
 * Synchronous check: is the device considered vitalized for menu/routing?
 * True when local storage has a valid vitalization anchor (isVitalized + citizenHash).
 * Use for instant UI (e.g. enabling nav); use getVitalizationStatus() for full routing decisions.
 */
export function isDeviceVitalizedSync(): boolean {
  if (typeof window === 'undefined') return false;
  const phone = getIdentityAnchorPhone();
  if (!phone?.trim()) return false;
  try {
    const raw = localStorage.getItem('pff_vitalized_anchor');
    return !!raw?.trim();
  } catch {
    return false;
  }
}

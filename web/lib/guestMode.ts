/**
 * Sovereign Guest Mode — shared hardware, identity partitioning.
 * - Entry: "Guest Login / New Citizen" on the Triple-Pillar Gate.
 * - Sandbox: Clear session from memory; do NOT delete Master Architect's HW fingerprint from DB.
 * - Identity: Same device (HW fingerprint), different Auth UUID and Face Hash.
 * - Vault: Guest must not see device owner's balance or National Reserve.
 * - access_logs: Mark entries as "Guest Access on Master Device" for Architect visibility.
 */

import { clearBiometricState } from './sessionIsolation';
import { getSupabase } from './supabase';

const GUEST_MODE_KEY = 'pff_guest_mode';

/** Keys cleared when entering guest mode (session only). Do not add device_id or DB-backed keys. */
const GUEST_CLEAR_KEYS = [
  'pff_identity_anchor_phone',
  'pff_session_phone',
  'pff_session_uid',
  'pff_presence_verified',
  'pff_presence_timestamp',
  'pff_presence_expiry',
  'pff_face_verified',
  'pff_face_verified_ts',
  'pff_portal_locked_until',
  'pff_user_role',
  'pff_id',
  'pff_token',
  'presence_verified',
  'device_authorized',
  'isLocked',
  'isAuthorized',
  'pff_sentinel_token_verified',
];
const GUEST_CLEAR_PREFIXES = ['pff_pillar_location_', 'pff_pillar_location_ts_', 'pff_pillar_hw_hash_', 'pff_pillar_hw_ts_'];

/**
 * Enter Sovereign Guest Mode.
 * Clears current session from memory (localStorage/sessionStorage) but does NOT
 * delete the Master Architect's primary_sentinel_device_id or HW fingerprint from the database.
 * Call before redirect so the gate shows Identity Anchor again for the new user.
 */
export function enterGuestMode(): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(GUEST_MODE_KEY, 'true');
    // Clear session and biometric cache only — do not touch device_id or DB
    clearBiometricState();
    // Also clear identity-related keys so gate shows "Identity Anchor" again
    if (typeof localStorage !== 'undefined') {
      for (const key of GUEST_CLEAR_KEYS) {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      }
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && GUEST_CLEAR_PREFIXES.some((p) => k.startsWith(p))) keysToRemove.push(k);
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    }
  } catch (e) {
    console.error('[guestMode] enterGuestMode failed:', e);
  }
}

/**
 * Exit guest mode (e.g. "Exit Guest" on dashboard).
 * Clears guest flag and session so next visit requires full gate.
 */
export function exitGuestMode(): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.removeItem(GUEST_MODE_KEY);
    clearBiometricState();
  } catch (e) {
    console.error('[guestMode] exitGuestMode failed:', e);
  }
}

/**
 * Returns true if the current session is in Sovereign Guest Mode.
 * Guest: same hardware, different Auth UUID and Face Hash; must not see owner data.
 */
export function isGuestMode(): boolean {
  if (typeof sessionStorage === 'undefined') return false;
  try {
    return sessionStorage.getItem(GUEST_MODE_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Log "Guest Access on Master Device" to access_logs.
 * Allows the Architect to see how many people used his phone as a gateway to the Mesh.
 * Table expected: access_logs (access_type, device_id?, auth_uid?, created_at).
 */
export async function logGuestAccessOnMasterDevice(
  deviceId?: string | null,
  authUid?: string | null
): Promise<void> {
  try {
    const supabase = getSupabase();
    if (!supabase) return;
    const payload = {
      access_type: 'Guest Access on Master Device',
      device_id: deviceId ?? null,
      auth_uid: authUid ?? null,
      created_at: new Date().toISOString(),
    };
    await (supabase as any).from('access_logs').insert(payload);
  } catch (e) {
    console.warn('[guestMode] logGuestAccessOnMasterDevice failed (table may not exist):', e);
  }
}

/**
 * Call when the gate succeeds; if current session is guest, logs to access_logs.
 * Call from FourLayerGate after setPresenceVerified(true).
 */
export async function logGuestAccessIfNeeded(): Promise<void> {
  if (!isGuestMode()) return;
  let deviceId: string | null = null;
  let authUid: string | null = null;
  try {
    if (typeof localStorage !== 'undefined') deviceId = localStorage.getItem('device_id');
    const supabase = getSupabase();
    if (supabase?.auth?.getUser) {
      const { data } = await supabase.auth.getUser();
      authUid = data?.user?.id ?? null;
    }
  } catch {
    // ignore
  }
  await logGuestAccessOnMasterDevice(deviceId, authUid);
}

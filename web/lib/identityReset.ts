/**
 * Hard Identity Reset for the current device.
 * 1. Sends device_id to API to purge profile binding (primary_sentinel_device_id, face_hash, etc.).
 * 2. Clears localStorage, sessionStorage, and cached biometric/pillar state.
 * 3. Redirects to /vitalization?reset=1 for camera diagnostic and re-registration.
 */

import { clearBiometricState } from './sessionIsolation';

const DEVICE_KEYS = ['device_id', 'pff_device_id'];
const GATE_KEY = 'pff_gate_identity_anchor';

/** All known PFF/local keys to clear (sessionIsolation + gate + device). */
function getAllKeysToClear(): string[] {
  const fromSessionIsolation = [
    'pff_pillar_location',
    'pff_pillar_location_ts',
    'pff_pillar_hw_hash',
    'pff_pillar_hw_ts',
    'pff_presence_verified',
    'pff_presence_timestamp',
    'pff_presence_expiry',
    'pff_identity_hash',
    'pff_face_verified',
    'pff_face_verified_ts',
    'pff_session_phone',
    'pff_session_uid',
    'pff_portal_locked_until',
    'pff_identity_anchor_phone',
    'pff_user_role',
    'pff_id',
    'pff_token',
    'presence_verified',
    'device_authorized',
    'isLocked',
    'isAuthorized',
    'hardware_tpm_hash',
    'pff_sentinel_token_verified',
  ];
  const prefixes = ['pff_pillar_location_', 'pff_pillar_location_ts_', 'pff_pillar_hw_hash_', 'pff_pillar_hw_ts_'];
  const keys = [...fromSessionIsolation, ...DEVICE_KEYS, GATE_KEY];
  if (typeof localStorage !== 'undefined') {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && prefixes.some((p) => k.startsWith(p))) keys.push(k);
    }
  }
  return [...new Set(keys)];
}

function clearAllPFFStorage(): void {
  if (typeof localStorage === 'undefined' && typeof sessionStorage === 'undefined') return;
  const keys = getAllKeysToClear();
  try {
    for (const key of keys) {
      localStorage?.removeItem(key);
      sessionStorage?.removeItem(key);
    }
    clearBiometricState();
  } catch (e) {
    console.error('[identityReset] clearAllPFFStorage failed:', e);
  }
}

export interface HardIdentityResetResult {
  ok: boolean;
  error?: string;
}

/**
 * Execute hard identity reset: purge profile by device_id, clear local state, redirect to /vitalization?reset=1.
 * Call from a button (e.g. debug or settings). After redirect, camera starts with mirror + AI mesh; then first-time registration.
 */
export async function executeHardIdentityReset(): Promise<HardIdentityResetResult> {
  if (typeof window === 'undefined') {
    return { ok: false, error: 'Must run in browser' };
  }

  const deviceId = localStorage.getItem('device_id') || localStorage.getItem('pff_device_id') || '';

  try {
    if (deviceId) {
      const res = await fetch('/api/identity-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.warn('[identityReset] API returned', res.status, data);
        // Continue to clear local state even if API fails (e.g. no profile bound)
      }
    }

    clearAllPFFStorage();
    window.location.href = '/vitalization?reset=1';
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[identityReset]', msg);
    return { ok: false, error: msg };
  }
}

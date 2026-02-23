/**
 * Hard Identity Reset for the current device.
 * 1. Sends device_id to API to purge profile binding (primary_sentinel_device_id, face_hash, etc.).
 * 2. Signs out Supabase auth, then full session wipe (localStorage.clear + sessionStorage.clear).
 * 3. Redirects to /vitalization?reset=1 for camera and re-registration.
 */

import { supabase } from './biometricAuth';

/** Full session wipe so the device forgets the old identity. */
function sessionWipe(): void {
  if (typeof localStorage === 'undefined' && typeof sessionStorage === 'undefined') return;
  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch (e) {
    console.error('[identityReset] sessionWipe failed:', e);
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
        // Continue to wipe and redirect even if API fails (e.g. no profile bound)
      }
    }

    if (supabase?.auth?.signOut) {
      await supabase.auth.signOut().catch(() => {});
    }

    sessionWipe();
    window.location.href = '/vitalization?reset=1';
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[identityReset]', msg);
    return { ok: false, error: msg };
  }
}

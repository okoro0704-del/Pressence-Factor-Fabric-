/**
 * Passkey Anchoring & Instant Re-Entry.
 * - If user is VITALIZED but navigator.credentials.get returns nothing, trigger a one-time
 *   "Silent Anchor" to save the Passkey to device hardware so future logins can use it.
 * - Does not delete or clear Passkey on logout; logout clears session only.
 */

import { getAssertion, createCredential, isWebAuthnSupported } from '@/lib/webauthn';
import { getIdentityAnchorPhone } from '@/lib/sentinelActivation';
import { isDeviceVitalizedSync } from '@/lib/vitalizationState';

const SILENT_ANCHOR_DONE_KEY = 'pff_silent_anchor_done';

/**
 * Try to get a Passkey assertion (triggers device biometric). Returns the assertion or null.
 */
export async function tryPasskeyAssertion(): Promise<{ credentialId?: string; success: boolean } | null> {
  if (!isWebAuthnSupported()) return null;
  try {
    const result = await getAssertion();
    if (!result) return { success: false };
    const id = result.credential?.id ?? undefined;
    return { credentialId: id, success: true };
  } catch {
    return { success: false };
  }
}

/**
 * One-time Silent Anchor: if the user is VITALIZED but no Passkey exists on this device,
 * create a platform credential (Face ID / Touch ID / Windows Hello) so future get() works.
 * Call once per device when vitalized and get() returns nothing.
 */
export async function ensurePasskeyAnchor(): Promise<
  { ok: true; created: boolean } | { ok: false; error: string }
> {
  if (typeof window === 'undefined') return { ok: false, error: 'Client only' };
  if (!isWebAuthnSupported()) return { ok: false, error: 'WebAuthn not supported' };

  const phone = getIdentityAnchorPhone();
  if (!phone?.trim()) return { ok: false, error: 'No identity anchor' };

  if (!isDeviceVitalizedSync()) return { ok: false, error: 'Device not vitalized' };

  try {
    const existing = await getAssertion();
    if (existing) return { ok: true, created: false };

    if (localStorage.getItem(SILENT_ANCHOR_DONE_KEY) === '1') {
      return { ok: true, created: false };
    }

    const userName = `PFF — ${phone.slice(-4)}`;
    const cred = await createCredential(phone.trim(), userName);
    if (!cred) return { ok: false, error: 'Passkey creation cancelled or failed' };

    localStorage.setItem(SILENT_ANCHOR_DONE_KEY, '1');
    return { ok: true, created: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

/**
 * Haptic: subtle vibration when Passkey is successfully detected (Sovereign Entry).
 */
export function sovereignEntryHaptic(): void {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate([40, 30, 40]);
  }
}

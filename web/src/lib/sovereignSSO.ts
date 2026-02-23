/**
 * Universal Sovereign SSO (Single Sign-On)
 * Secure Enclave Anchoring: non-reversible biometric token on device.
 * Kill-Switch: purge session and return to Shield on mismatch / Lock Identity.
 * Architect Bypass: Isreal (Master Phone / Master Laptop) never locked out.
 */

import { getVitalizationAnchor } from './vitalizationAnchor';
import { getCompositeDeviceFingerprint } from './biometricAuth';
import { isArchitect } from './publicRevealAccess';
import { setVitalizationComplete, clearVitalizationComplete, VITALIZATION_COMPLETE_KEY } from './vitalizationState';

const DEVICE_ANCHOR_TOKEN_KEY = 'pff_device_identity_anchor';
const SESSION_LOCKED_KEY = 'pff_session_locked';
const ANCHOR_SALT = 'pff_sso_anchor_v1';

/** Event: connected app requests authentication. detail: { requestId: string; appOrigin?: string }. */
export const SSO_AUTH_REQUEST_EVENT = 'pff-sso-auth-request';
/** Event: SSO approved after Face/Palm match. detail: { requestId: string }. */
export const SSO_AUTH_APPROVED_EVENT = 'pff-sso-auth-approved';
/** Event: trigger Lock Identity (purge session, return to Shield). */
export const LOCK_IDENTITY_EVENT = 'pff-lock-identity';

/**
 * Store a unique, non-reversible biometric token in the device's secure storage.
 * Call once initial Vitalization is complete (after setVitalizationAnchor).
 * Token = SHA-256(citizenHash + deviceId + salt) — cannot be reversed to get face hash.
 */
export async function anchorIdentityToDevice(citizenHash: string, phone?: string): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const deviceId = await getCompositeDeviceFingerprint();
    const payload = `${citizenHash.trim()}|${deviceId}|${ANCHOR_SALT}`;
    const enc = new TextEncoder();
    const hash = await crypto.subtle.digest('SHA-256', enc.encode(payload));
    const token = btoa(String.fromCharCode(...new Uint8Array(hash)));
    sessionStorage.setItem(DEVICE_ANCHOR_TOKEN_KEY, token);
    // Persist in localStorage so SSO listener knows device is anchored across tabs
    try {
      localStorage.setItem(DEVICE_ANCHOR_TOKEN_KEY, token);
    } catch {
      // quota or private mode
    }
  } catch {
    // ignore
  }
}

/**
 * Read the device anchor token (if any). Used to know if this device has completed Vitalization for SSO.
 */
export function getDeviceAnchorToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return sessionStorage.getItem(DEVICE_ANCHOR_TOKEN_KEY) || localStorage.getItem(DEVICE_ANCHOR_TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * True if this device has an identity anchored (token stored) or is Architect (redundant anchor bypass).
 */
export function isDeviceAnchoredForSSO(): boolean {
  if (typeof window === 'undefined') return false;
  if (isArchitect()) return true;
  return !!getDeviceAnchorToken();
}

/**
 * Clear the device anchor token (e.g. on Lock Identity or sign out).
 */
export function clearDeviceAnchorToken(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(DEVICE_ANCHOR_TOKEN_KEY);
    localStorage.removeItem(DEVICE_ANCHOR_TOKEN_KEY);
  } catch {
    // ignore
  }
}

/**
 * Enterprise Kill-Switch: purge active session and return to Shield.
 * On mismatch or "Lock Identity" gesture: clear session storage, then redirect.
 * Architect Bypass: Isreal (Master Phone / Master Laptop) is never locked out — redirect to /dashboard instead of Shield.
 */
export function purgeSessionAndReturnToShield(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(SESSION_LOCKED_KEY, 'true');
    clearVitalizationComplete();
    clearDeviceAnchorToken();
    // Clear session-only auth state; leave vitalization anchor so they can re-verify at Shield
    const keysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && (key.startsWith('pff_') || key.startsWith('sb-') || key === VITALIZATION_COMPLETE_KEY)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => sessionStorage.removeItem(k));
    clearDeviceAnchorToken(); // again after clear

    if (isArchitect()) {
      window.location.href = '/dashboard';
      return;
    }
    window.location.href = '/';
  } catch {
    window.location.href = '/';
  }
}

/**
 * Check if session was locked (e.g. by kill-switch). Call from root guard; if true, redirect to Shield.
 */
export function isSessionLocked(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return sessionStorage.getItem(SESSION_LOCKED_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Clear the session locked flag (e.g. after user passes Shield again).
 */
export function clearSessionLocked(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(SESSION_LOCKED_KEY);
  } catch {
    // ignore
  }
}

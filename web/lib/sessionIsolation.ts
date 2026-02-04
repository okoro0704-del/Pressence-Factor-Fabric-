/**
 * Strict Identity Isolation — prevent unauthorized access on shared devices.
 * Session clearing: force logout and clear biometric state if a different auth.uid or identity is detected.
 */

const PFF_SESSION_PHONE = 'pff_session_phone';
const PFF_SESSION_UID = 'pff_session_uid';

/** Keys to remove on session clear (biometric and presence state). */
const BIOMETRIC_STORAGE_KEYS = [
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

/** Scoped keys: pff_pillar_location_*, pff_pillar_hw_hash_* (remove any that match prefix). */
const SCOPED_PREFIXES = ['pff_pillar_location_', 'pff_pillar_location_ts_', 'pff_pillar_hw_hash_', 'pff_pillar_hw_ts_'];

/**
 * Clear all biometric and presence state from localStorage and sessionStorage.
 * Call when a different user is detected to prevent session hijacking.
 */
export function clearBiometricState(): void {
  if (typeof localStorage === 'undefined' && typeof sessionStorage === 'undefined') return;
  try {
    for (const key of BIOMETRIC_STORAGE_KEYS) {
      localStorage?.removeItem(key);
      sessionStorage?.removeItem(key);
    }
    if (typeof localStorage !== 'undefined') {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && SCOPED_PREFIXES.some((p) => k.startsWith(p))) keysToRemove.push(k);
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    }
  } catch (e) {
    console.error('[sessionIsolation] clearBiometricState failed:', e);
  }
}

/**
 * Store current session identity after successful gate/presence verification.
 * Used to detect when a different user logs in on the same device.
 */
export function setSessionIdentity(phone: string, uid?: string | null): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(PFF_SESSION_PHONE, phone);
    if (uid != null && uid !== '') {
      localStorage.setItem(PFF_SESSION_UID, uid);
    } else {
      localStorage.removeItem(PFF_SESSION_UID);
    }
  } catch (e) {
    console.error('[sessionIsolation] setSessionIdentity failed:', e);
  }
}

/**
 * Returns true if a different identity was detected and state was cleared (caller should redirect to gate).
 */
export function checkSessionIsolation(currentPhone: string | null, currentUid: string | null): boolean {
  if (typeof localStorage === 'undefined') return false;
  try {
    const storedPhone = localStorage.getItem(PFF_SESSION_PHONE);
    const storedUid = localStorage.getItem(PFF_SESSION_UID);

    const phoneChanged = storedPhone != null && storedPhone !== '' && currentPhone !== storedPhone;
    const uidChanged = storedUid != null && storedUid !== '' && currentUid != null && currentUid !== '' && currentUid !== storedUid;

    if (phoneChanged || uidChanged) {
      console.warn('[sessionIsolation] Different user detected — clearing biometric state. phoneChanged=', phoneChanged, 'uidChanged=', uidChanged);
      clearBiometricState();
      return true;
    }
    return false;
  } catch (e) {
    console.error('[sessionIsolation] checkSessionIsolation failed:', e);
    return false;
  }
}

/**
 * Biometric session — Auth-Active for 15 minutes after verification.
 * Don't ask for scan on every button click; once verified, keep session until close or expiry.
 */

const SESSION_KEY = 'pff_biometric_session_verified_at';
const SESSION_TTL_MS = 15 * 60 * 1000; // 15 minutes

export function getBiometricSessionVerifiedAt(): number | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const at = parseInt(raw, 10);
    if (Number.isNaN(at)) return null;
    return at;
  } catch {
    return null;
  }
}

export function isBiometricSessionActive(): boolean {
  const at = getBiometricSessionVerifiedAt();
  if (at == null) return false;
  return Date.now() - at < SESSION_TTL_MS;
}

export function setBiometricSessionVerified(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(SESSION_KEY, String(Date.now()));
  } catch {
    // ignore
  }
}

export function clearBiometricSession(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}

export const BIOMETRIC_SESSION_TTL_MS = SESSION_TTL_MS;

/** High-value threshold (VIDA): above this, require Face Pulse instead of fingerprint-only quick-auth. */
export const HIGH_VALUE_VIDA_THRESHOLD = 2;

/**
 * Ensure user is in an active biometric session (15 min). If not, try WebAuthn (Touch ID / Face ID) as primary quick-auth.
 * Resolves to true if session was already active or WebAuthn succeeded; false if user cancelled or WebAuthn unavailable.
 */
export async function ensureBiometricSession(): Promise<boolean> {
  if (isBiometricSessionActive()) return true;
  if (typeof window === 'undefined') return false;
  try {
    const { getAssertion } = await import('@/lib/webauthn');
    if (!getAssertion) return false;
    const result = await getAssertion();
    if (result) {
      setBiometricSessionVerified();
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

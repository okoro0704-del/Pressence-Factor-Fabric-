/**
 * Server-side helpers for /api/v1/identity/union (stage-union / seal-union).
 */

export const FACE_HASH_HEX_LEN = 64;

export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Normalize client biometric string to 64-char face hash (already hex or hash raw input). */
export async function normalizeBiometricToFaceHash(biometricString: string): Promise<string> {
  const trimmed = String(biometricString).trim();
  if (/^[0-9a-f]{64}$/i.test(trimmed)) {
    return trimmed.toLowerCase();
  }
  return sha256Hex(trimmed);
}

export function randomChallengeHex(byteLength = 32): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function resolveRpId(hostHeader: string | null, forwardedHost: string | null): string {
  const raw = (forwardedHost || hostHeader || 'localhost').split(',')[0].trim();
  const hostname = raw.split(':')[0].toLowerCase();
  if (hostname === 'localhost' || hostname === '127.0.0.1') return 'localhost';
  return hostname;
}

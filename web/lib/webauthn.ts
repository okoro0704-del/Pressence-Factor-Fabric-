/**
 * PFF — WebAuthn (navigator.credentials) for Sovereign Web.
 * Hooks into device biometrics (Face ID / Touch ID / fingerprint) for Presence Proof.
 * No raw biometric data leaves the device. Works offline (assertion stored locally).
 * All logic runs only in a secure context (HTTPS or localhost).
 *
 * Fortress Security: userVerification MUST be 'required' (hard biometric check).
 * Never use 'preferred'—defends against 2026-level identity theft / deepfake.
 */

const RP_NAME = 'PFF — Vitalization | mrfundzman';
const RP_ID = typeof window !== 'undefined' ? new URL(window.location.origin).hostname : 'localhost';

/** Ensure WebAuthn runs only over HTTPS (or localhost). No execution in insecure contexts. */
export function isSecureContext(): boolean {
  if (typeof window === 'undefined') return false;
  if (!window.isSecureContext) return false;
  try {
    const u = new URL(window.location.href);
    return u.protocol === 'https:' || u.hostname === 'localhost' || u.hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

export function isWebAuthnSupported(): boolean {
  if (typeof window === 'undefined') return false;
  if (!isSecureContext()) return false;
  return typeof window.PublicKeyCredential !== 'undefined' && typeof navigator?.credentials?.get === 'function';
}

/** Generate a random challenge (base64url). Used when offline; server should supply when online. */
export function generateChallenge(): Uint8Array {
  const buf = new Uint8Array(32);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(buf);
  }
  return buf;
}

function b64UrlEncode(buf: ArrayBuffer): string {
  const u8 = new Uint8Array(buf);
  let b64 = '';
  for (let i = 0; i < u8.length; i += 3) {
    const a = u8[i] ?? 0;
    const b = u8[i + 1] ?? 0;
    const c = u8[i + 2] ?? 0;
    b64 += encode([a >> 2, ((a & 3) << 4) | (b >> 4), ((b & 15) << 2) | (c >> 6), c & 63]);
  }
  const pad = u8.length % 3;
  return (pad ? b64.slice(0, -(3 - pad) * 4 / 3) : b64).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function encode(n: number[]): string {
  const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  return n.map((x) => ALPHABET[x & 63]).join('');
}

/** Create a new platform authenticator credential (register). userVerification: required → biometrics. */
export async function createCredential(userId: string, userName: string): Promise<PublicKeyCredential | null> {
  if (!isSecureContext() || !isWebAuthnSupported()) return null;
  const challenge = new Uint8Array(generateChallenge());
  const opts: CredentialCreationOptions = {
    publicKey: {
      rp: { name: RP_NAME, id: RP_ID },
      user: {
        id: new TextEncoder().encode(userId),
        name: userName,
        displayName: userName,
      },
      challenge,
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },
        { type: 'public-key', alg: -257 },
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required', // Fortress: hard biometric; never 'preferred'
        residentKey: 'preferred',
        requireResidentKey: false,
      },
      timeout: 60000,
      attestation: 'none',
    },
  };
  const cred = await navigator.credentials.create(opts);
  return cred as PublicKeyCredential | null;
}

export interface AssertionWithCredential {
  credential: PublicKeyCredential;
  response: AuthenticatorAssertionResponse;
}

/** Get assertion (sign in / handshake). Triggers native biometric prompt. Works offline. */
export async function getAssertion(
  credentialIds?: Uint8Array[],
  challengeOverride?: Uint8Array
): Promise<AssertionWithCredential | null> {
  if (!isSecureContext() || !isWebAuthnSupported()) return null;
  const rawChallenge = challengeOverride?.byteLength ? challengeOverride : generateChallenge();
  const challenge = new Uint8Array(rawChallenge);
  const allowCredentials: PublicKeyCredentialDescriptor[] = credentialIds?.length
    ? credentialIds.map((id) => ({ type: 'public-key', id: new Uint8Array(id) }))
    : [];
  const opts: CredentialRequestOptions = {
    publicKey: {
      rpId: RP_ID,
      challenge,
      timeout: 60000,
      userVerification: 'required', // Fortress: hard biometric; never 'preferred'
      ...(allowCredentials.length ? { allowCredentials } : {}),
    },
  };
  const cred = await navigator.credentials.get(opts);
  if (!cred || !(cred instanceof PublicKeyCredential)) return null;
  return { credential: cred, response: cred.response as AuthenticatorAssertionResponse };
}

export function getRpId(): string {
  return RP_ID;
}

/**
 * PFF — WebAuthn (Passkey) for Sovereign Web.
 * - createCredential: register a Passkey using the device's native biometric (Face ID / Touch ID / fingerprint).
 * - getAssertion: sign-in with one tap (native biometric prompt; no email/password).
 * Device credential ID is hashed and stored as device_hash; with face_hash it forms the sovereign identity.
 * Hardware lock: device_id is mapped to citizen_hash in Supabase (anchor_device_id, primary_sentinel_device_id)
 * so the account is locked to the registered device. If user tries from a new device with no passkey,
 * the app triggers a Request Handshake (login_request) to the registered phone instead of a generic error.
 * All logic runs only in a secure context (HTTPS or localhost). userVerification: required (hard biometric).
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

/**
 * Native Authenticator Bridge: detect if the device has Face ID (iOS), Fingerprint/Face (Android), or Windows Hello.
 * Use this to trigger the system's native biometric prompt and to enforce Sovereign-Only (no password) when true.
 */
export async function isUserVerifyingPlatformAuthenticatorAvailable(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!isSecureContext() || !isWebAuthnSupported()) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
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

/** Create a new passkey (platform or cross-platform). Prefer platform; fall back to security key. userVerification: required. */
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
        authenticatorAttachment: 'preferred', // platform first (Touch ID / Windows Hello), then cross-platform if needed
        userVerification: 'required',
        residentKey: 'preferred',
        requireResidentKey: false,
      },
      timeout: 90000,
      attestation: 'none',
    },
  };
  try {
    const cred = await navigator.credentials.create(opts);
    return cred as PublicKeyCredential | null;
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    if (/NotAllowedError|not allowed|user cancelled|canceled/i.test(err.name + err.message)) {
      throw new Error('Passkey creation was cancelled or is not allowed. Please click "Bind this device" and complete the prompt.');
    }
    throw err;
  }
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
  try {
    const cred = await navigator.credentials.get(opts);
    if (!cred || !(cred instanceof PublicKeyCredential)) return null;
    return { credential: cred, response: cred.response as AuthenticatorAssertionResponse };
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    if (/NotAllowedError|not allowed|user cancelled|canceled/i.test(err.name + err.message)) {
      throw new Error('Sign-in was cancelled. Please try again and complete the passkey prompt.');
    }
    throw err;
  }
}

export function getRpId(): string {
  return RP_ID;
}

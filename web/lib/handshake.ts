/**
 * PFF — Web Handshake (Sovereign Web).
 * Uses WebAuthn assertion as Presence Proof.
 * Fortress: use server-issued challenge (GET /api/challenge) when online; backend verifies before sync.
 */

import { getAssertion, isWebAuthnSupported, isSecureContext } from './webauthn';

const CHALLENGE_API = '/api/challenge';

export interface WebAuthnPresenceProof {
  type: 'webauthn';
  handshakeId: string;
  clientDataJSON: string;
  authenticatorData: string;
  signature: string;
  credentialId: string;
  userHandle: string | null;
  timestamp: number;
  rpId: string;
}

export interface HandshakeResult {
  success: boolean;
  proof?: WebAuthnPresenceProof;
  error?: string;
}

function highResTimestamp(): number {
  if (typeof performance !== 'undefined' && typeof performance.timeOrigin === 'number') {
    return performance.timeOrigin + performance.now();
  }
  return Date.now();
}

/**
 * Fetch server-issued challenge for Fortress verification.
 * Include credentials so session cookie is set/ sent.
 */
export async function fetchChallenge(): Promise<string | null> {
  try {
    const res = await fetch(CHALLENGE_API, { credentials: 'include' });
    if (!res.ok) return null;
    const data = (await res.json()) as { challenge?: string };
    return typeof data.challenge === 'string' ? data.challenge : null;
  } catch {
    return null;
  }
}

/**
 * Generate Presence Proof via navigator.credentials.get.
 * Triggers the device's native biometric prompt (Face ID / Touch ID / fingerprint).
 * The signed assertion is the Presence Proof; no raw biometric data is exposed.
 * If challengeBase64 is provided (from fetchChallenge), backend will verify it.
 */
export async function generatePresenceProof(
  credentialIds?: Uint8Array[],
  challengeBase64?: string
): Promise<HandshakeResult> {
  let override: Uint8Array | undefined;
  if (challengeBase64) {
    override = base64UrlToBuffer(challengeBase64);
    if (override.length === 0) return { success: false, error: 'Invalid challenge.' };
  }
  return performHandshake(credentialIds, override);
}

/** Perform PFF handshake via WebAuthn. Triggers device biometrics. UUID per handshake (nonce) for replay prevention. */
export async function performHandshake(
  credentialIds?: Uint8Array[],
  challengeOverride?: Uint8Array
): Promise<HandshakeResult> {
  if (!isSecureContext()) {
    return { success: false, error: 'PFF requires a secure context (HTTPS or localhost).' };
  }
  if (!isWebAuthnSupported()) {
    return { success: false, error: 'WebAuthn not supported. Use HTTPS and a supported browser.' };
  }
  try {
    const out = await getAssertion(credentialIds, challengeOverride);
    if (!out) return { success: false, error: 'Authentication cancelled or failed.' };
    const { credential, response: assertion } = out;
    let handshakeId: string;
    try {
      handshakeId = typeof crypto !== 'undefined' && 'randomUUID' in crypto && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : fallbackUuid();
    } catch {
      handshakeId = fallbackUuid();
    }

    const proof: WebAuthnPresenceProof = {
      type: 'webauthn',
      handshakeId,
      clientDataJSON: bufferToBase64Url(assertion.clientDataJSON),
      authenticatorData: bufferToBase64Url(assertion.authenticatorData),
      signature: bufferToBase64Url(assertion.signature),
      credentialId: bufferToBase64Url(credential.rawId),
      userHandle: assertion.userHandle
        ? new TextDecoder().decode(assertion.userHandle)
        : null,
      timestamp: highResTimestamp(),
      rpId: typeof window !== 'undefined' ? new URL(window.location.origin).hostname : 'localhost',
    };
    return { success: true, proof };
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    return { success: false, error: err };
  }
}

function fallbackUuid(): string {
  const hex = '0123456789abcdef';
  let s = '';
  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) s += '-';
    else if (i === 14) s += '4';
    else s += hex[Math.floor(Math.random() * 16)];
  }
  return s;
}

function bufferToBase64Url(buf: ArrayBuffer): string {
  const u8 = new Uint8Array(buf);
  let b64 = '';
  const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  for (let i = 0; i < u8.length; i += 3) {
    const a = u8[i] ?? 0;
    const b = u8[i + 1] ?? 0;
    const c = u8[i + 2] ?? 0;
    b64 += ALPHABET[a >> 2] + ALPHABET[((a & 3) << 4) | (b >> 4)] +
      ALPHABET[((b & 15) << 2) | (c >> 6)] + ALPHABET[c & 63];
  }
  const pad = u8.length % 3;
  const out = pad ? b64.slice(0, b64.length - (3 - pad)) : b64;
  return out.replace(/\+/g, '-').replace(/\//g, '_');
}

function base64UrlToBuffer(s: string): Uint8Array {
  try {
    let b64 = s.replace(/-/g, '+').replace(/_/g, '/');
    const pad = b64.length % 4;
    if (pad) b64 += '='.repeat(4 - pad);
    const bin = atob(b64);
    const u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    return u8;
  } catch {
    return new Uint8Array(0);
  }
}

export { isWebAuthnSupported, isSecureContext };

/**
 * Immutable 3-phase identity onboarding pipeline (Express backend):
 * register-genesis → stage-union → WebAuthn enclave → seal-union
 *
 * Browser-only: TextEncoder, Uint8Array, chunked base64 — no Node Buffer.
 */

import { isWebAuthnSupported, isSecureContext } from '@/lib/webauthn';
import {
  registerGenesis,
  stageUnion,
  sealUnion,
  SentinelApiError,
  type RegisterGenesisResponse,
  type SealUnionResponse,
} from '@/lib/sentinel/client';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface IdentityUnionPayload {
  /** E.164 phone (identity anchor) */
  phoneNumber: string;
  /** Bank Verification Number (11 digits Nigeria) */
  bvn: string;
  /** Face hash and/or palm vascular hash (64-char hex preferred) */
  biometricMathematicalFeatures: string;
  /** Persistent device id from ensureDeviceId() */
  deviceRawIdentifier: string;
}

export interface IdentityUnionResult {
  success: true;
  sessionId: string;
  citizenId: string;
  unionSealedAt: string;
  legalProfile: RegisterGenesisResponse['legalProfile'];
  nextStep: string;
}

const HEX_RE = /^[0-9a-f]{64}$/i;

// ---------------------------------------------------------------------------
// Encoding helpers (no Buffer)
// ---------------------------------------------------------------------------

export function hexToUint8Array(hex: string): Uint8Array {
  const clean = hex.replace(/^0x/i, '').trim();
  if (clean.length % 2 !== 0) {
    throw new Error('Invalid hex string length');
  }
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Build a single 64-char biometric feature string from face / palm captures.
 */
export async function deriveBiometricMathematicalFeatures(params: {
  faceHash?: string;
  palmHash?: string;
}): Promise<string> {
  const face = params.faceHash?.trim() ?? '';
  const palm = params.palmHash?.trim() ?? '';

  if (HEX_RE.test(face) && HEX_RE.test(palm)) {
    return sha256Hex(`${face.toLowerCase()}|${palm.toLowerCase()}`);
  }
  if (HEX_RE.test(face)) return face.toLowerCase();
  if (HEX_RE.test(palm)) return palm.toLowerCase();
  if (face || palm) {
    return sha256Hex(`${face}|${palm}`);
  }
  throw new Error('At least one biometric hash (face or palm) is required');
}

export function isIdentityUnionConflict(err: unknown): boolean {
  return SentinelApiError.isConflict(err);
}

// ---------------------------------------------------------------------------
// Pipeline
// ---------------------------------------------------------------------------

/**
 * Execute the full immutable identity union pipeline against PFF Express.
 */
export async function executeIdentityUnionPipeline(
  payload: IdentityUnionPayload
): Promise<IdentityUnionResult> {
  if (typeof window === 'undefined') {
    throw new Error('Identity union must run in the browser');
  }
  if (!isSecureContext() || !isWebAuthnSupported()) {
    throw new Error('Secure context and WebAuthn are required for identity union');
  }

  const phoneNumber = payload.phoneNumber.trim();
  const bvn = payload.bvn.trim();
  const deviceRawIdentifier = payload.deviceRawIdentifier.trim();
  let biometricMathematicalFeatures = payload.biometricMathematicalFeatures.trim();

  if (!phoneNumber || !bvn || !deviceRawIdentifier || !biometricMathematicalFeatures) {
    throw new Error('phoneNumber, bvn, deviceRawIdentifier, and biometricMathematicalFeatures are required');
  }

  if (!HEX_RE.test(biometricMathematicalFeatures)) {
    biometricMathematicalFeatures = await sha256Hex(biometricMathematicalFeatures);
  }

  // Phase 1: Genesis initialization
  const genesis: RegisterGenesisResponse = await registerGenesis({
    bvn,
    phoneNumber,
  });

  const sessionId = genesis.sessionId;
  if (!sessionId) {
    throw new Error('register-genesis did not return sessionId');
  }

  // Phase 2: Anchor pre-staging
  const staged = await stageUnion({
    genesisSessionId: sessionId,
    biometricMathematicalFeatures,
    deviceRawIdentifier,
  });

  const registrationChallenge = staged.registrationChallenge?.trim() ?? '';
  if (!HEX_RE.test(registrationChallenge)) {
    throw new Error('stage-union must return a 64-character hex registrationChallenge');
  }

  // Phase 3a: Hardware enclave attestation
  const challengeUint8Array = hexToUint8Array(registrationChallenge);
  const rpId = window.location.hostname;

  const credential = (await navigator.credentials.create({
    publicKey: {
      challenge: challengeUint8Array,
      rp: { name: 'PFF Sentinel Core', id: rpId },
      user: {
        id: new TextEncoder().encode(phoneNumber),
        name: phoneNumber,
        displayName: phoneNumber,
      },
      pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
      },
      timeout: 300_000,
    },
  })) as PublicKeyCredential | null;

  if (!credential) {
    throw new Error('Hardware enrollment cancelled by user');
  }

  const attestation = credential.response as AuthenticatorAttestationResponse;
  const credentialId =
    credential.id && credential.id.length > 0
      ? credential.id
      : arrayBufferToBase64(credential.rawId);

  const attestationObject = arrayBufferToBase64(attestation.attestationObject);
  const clientDataJSON = arrayBufferToBase64(attestation.clientDataJSON);

  // Phase 3b: Seal union
  const sealed: SealUnionResponse = await sealUnion({
    phoneNumber,
    sessionId,
    credentialId,
    hardwarePublicKey: 'PLATFORM_ENCLAVE_BOUND',
    attestationObject,
    clientDataJSON,
  });

  if (!sealed.citizenId || !sealed.unionSealedAt) {
    throw new Error('seal-union did not return citizenId and unionSealedAt');
  }

  return {
    success: true,
    sessionId,
    citizenId: sealed.citizenId,
    unionSealedAt: sealed.unionSealedAt,
    legalProfile: genesis.legalProfile,
    nextStep: genesis.nextStep,
  };
}

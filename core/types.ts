/**
 * PFF Core — Canonical types.
 * Anti-Greed: no raw biometrics. Hardware Anchor: non-exportable keys only.
 */

export type BiometryType = 'TouchID' | 'FaceID' | 'Biometrics';

/** Presence Proof payload (signed on-device). Zero-knowledge; no biometric data. */
export interface PresenceProofPayload {
  nonce: string;
  timestamp: number;
  keyId: string;
  deviceId: string;
  attestationCertChain?: string;
  livenessOk?: boolean;
}

/** Signed Presence Proof as sent to backend. */
export interface SignedPresenceProof {
  payload: PresenceProofPayload;
  signature: string;
}

/** 50/50: Identity Metadata — citizen autonomy. No transaction data. */
export interface IdentityMetadata {
  pffId: string;
  legalIdentityRef?: string;
  keyId: string;
  publicKey: string;
  deviceId: string;
  attestedAt?: number;
}

/** 50/50: Transaction Integrity — audit, vault access, integrity hashes. No PII. */
export interface TransactionIntegrityRecord {
  id: string;
  pffIdRef: string;
  action: string;
  integrityHash: string;
  at: number;
}

/** Device capabilities (Secure Enclave, biometrics, liveness). */
export interface DeviceCapabilities {
  hasBiometrics: boolean;
  biometryType: BiometryType | null;
  hasSecureEnclave: boolean;
  attestationSupported: boolean;
  livenessSupported: boolean;
}

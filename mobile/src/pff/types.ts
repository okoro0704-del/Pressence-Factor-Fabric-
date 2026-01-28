/**
 * PFF — Presence Factor Fabric
 * Shared types for Layer 1 (Phone), Presence Proof, and Vitalization.
 */

/** Biometry type reported by hardware. */
export type BiometryType = 'TouchID' | 'FaceID' | 'Biometrics';

/** Result of hardware-backed key creation. Keys are non-exportable. */
export interface KeyGenerationResult {
  success: true;
  /** Public key (PEM or base64) to register with backend. Never send private key. */
  publicKey: string;
  /** Stable identifier for this key (e.g. Android alias, iOS tag). */
  keyId: string;
  /** Biometry used to protect the key. */
  biometryType: BiometryType;
}

export interface KeyGenerationError {
  success: false;
  code: string;
  message: string;
}

export type KeyGenerationOutcome = KeyGenerationResult | KeyGenerationError;

/** Presence Proof payload (signed by device). Zero-knowledge: no raw biometrics. */
export interface PresenceProofPayload {
  nonce: string;
  timestamp: number;
  keyId: string;
  deviceId: string;
  /** iOS App Attest / Android Keymaster attestation; optional in MVP. */
  attestationCertChain?: string;
  /** Layer 3 liveness passed; optional until liveness SDK integrated. */
  livenessOk?: boolean;
}

/** Outcome of signing Presence Proof with hardware-backed key. */
export interface SigningResult {
  success: true;
  signature: string;
  payload: PresenceProofPayload;
}

/** Signed Presence Proof sent to backend. Raw biometrics never leave device. */
export interface SignedPresenceProof {
  payload: PresenceProofPayload;
  signature: string;
}

export interface SigningError {
  success: false;
  code: string;
  message: string;
}

export type SigningOutcome = SigningResult | SigningError;

/** Handshake result: SignedPresenceProof for backend, or error. */
export interface HandshakeSuccess {
  success: true;
  signedProof: SignedPresenceProof;
}

export interface HandshakeFailure {
  success: false;
  code: string;
  message: string;
}

export type HandshakeResult = HandshakeSuccess | HandshakeFailure;

/** Device capability flags for Vitalization flow (resilience / fallbacks). */
export interface DeviceCapabilities {
  hasBiometrics: boolean;
  biometryType: BiometryType | null;
  hasSecureEnclave: boolean;
  attestationSupported: boolean;
}

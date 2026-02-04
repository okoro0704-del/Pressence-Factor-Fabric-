/**
 * PFF — Presence Factor Fabric
 * Layer 1 (Phone) + proof signing. Public API.
 */

export {
  createSigningKey,
  deleteSigningKey,
  getDeviceCapabilities,
  getBiometricPromptMessage,
  hasSigningKey,
  signPresenceProof,
  PFF_SIGNING_KEY_ALIAS,
} from './secureEnclaveService';
export type { BiometricPromptOptions } from './secureEnclaveService';
export { getDeviceId } from './deviceId';
export { generateNonce } from './nonce';
export { performHandshake } from './handshake';
export type {
  BiometryType,
  DeviceCapabilities,
  KeyGenerationOutcome,
  KeyGenerationResult,
  KeyGenerationError,
  PresenceProofPayload,
  SigningOutcome,
  SigningResult,
  SigningError,
  SignedPresenceProof,
  HandshakeResult,
  HandshakeSuccess,
  HandshakeFailure,
} from './types';

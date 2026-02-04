/**
 * PFF — Presence Factor Fabric
 * The Handshake: biometric verification → sign Presence Proof (nonce + timestamp).
 * Only the signed proof is sent to backend; raw biometric data never leaves device.
 * Uses native fingerprint (LocalAuthentication / BiometricPrompt); falls back to
 * face when the device has no fingerprint sensor.
 */

import {
  hasSigningKey,
  signPresenceProof,
  getDeviceCapabilities,
  getBiometricPromptMessage,
  PFF_SIGNING_KEY_ALIAS,
} from './secureEnclaveService';
import { getDeviceId } from './deviceId';
import { generateNonce } from './nonce';
import type { PresenceProofPayload, HandshakeResult, HandshakeSuccess, HandshakeFailure } from './types';

/**
 * Perform the PFF Handshake:
 * 1. Ensure Secure Enclave key exists.
 * 2. Build Presence Proof payload (nonce + timestamp + deviceId + keyId).
 * 3. Trigger native biometric (fingerprint first; fallback to face if no fingerprint).
 * 4. Only listen for success: true; then cryptographically sign the session using the Device Fingerprint.
 * 5. Return SignedPresenceProof for backend.
 *
 * Raw biometric data never leaves the device. Only the success boolean and signed proof are used.
 */
export async function performHandshake(): Promise<HandshakeResult> {
  const exists = await hasSigningKey();
  if (!exists) {
    return {
      success: false,
      code: 'NO_SIGNING_KEY',
      message: 'No PFF signing key. Complete Vitalization first.',
    } satisfies HandshakeFailure;
  }

  const nonce = generateNonce();
  const timestamp = Date.now();
  const deviceId = await getDeviceId();

  const payload: PresenceProofPayload = {
    nonce,
    timestamp,
    keyId: PFF_SIGNING_KEY_ALIAS,
    deviceId,
    livenessOk: true,
  };

  const caps = await getDeviceCapabilities();
  const promptMessage = getBiometricPromptMessage(caps);

  const outcome = await signPresenceProof(payload, {
    promptMessage,
    cancelButtonText: 'Cancel',
  });

  if (!outcome.success) {
    return {
      success: false,
      code: outcome.code,
      message: outcome.message,
    } satisfies HandshakeFailure;
  }

  const signedProof = {
    payload: outcome.payload,
    signature: outcome.signature,
  };

  return {
    success: true,
    signedProof,
  } satisfies HandshakeSuccess;
}

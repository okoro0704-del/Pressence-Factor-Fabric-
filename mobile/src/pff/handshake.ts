/**
 * PFF — Presence Factor Fabric
 * The Handshake: biometric verification → sign Presence Proof (nonce + timestamp).
 * Only the signed proof is sent to backend; raw biometric data never leaves device.
 */

import { hasSigningKey, signPresenceProof, PFF_SIGNING_KEY_ALIAS } from './secureEnclaveService';
import { getDeviceId } from './deviceId';
import { generateNonce } from './nonce';
import type { PresenceProofPayload, HandshakeResult, HandshakeSuccess, HandshakeFailure } from './types';

/**
 * Perform the PFF Handshake:
 * 1. Ensure Secure Enclave key exists.
 * 2. Build Presence Proof payload (nonce + timestamp + deviceId + keyId).
 * 3. Trigger native biometric auth (TouchID / FaceID / Android Biometrics).
 * 4. Sign payload with hardware key; return SignedPresenceProof for backend.
 *
 * Raw biometric data never leaves the device. Only the signed proof is sent.
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

  const outcome = await signPresenceProof(payload);
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

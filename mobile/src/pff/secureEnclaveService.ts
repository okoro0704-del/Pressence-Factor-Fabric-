/**
 * PFF — Presence Factor Fabric
 * Layer 1 [Phone]: Secure Enclave / Keymaster Key Generation.
 *
 * Generates a unique, non-exportable keypair inside device secure hardware.
 * Keys are bound to the device; hardware UUID is included in Presence Proof
 * payload (see handshake) for backend verification.
 *
 * Layer 2 [Finger/Face]: Native biometric auth gates key use (createSignature).
 * No raw biometric templates leave the device—only signed Presence Proofs.
 *
 * Reference: System Prompt — Phone/Finger/Face, Data Doctrine (Zero-Knowledge).
 */

import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';
import type {
  KeyGenerationOutcome,
  KeyGenerationResult,
  KeyGenerationError,
  DeviceCapabilities,
  BiometryType,
  PresenceProofPayload,
  SigningOutcome,
  SigningResult,
  SigningError,
} from './types';

/** Options for the native biometric prompt (message only; no raw data requested). */
export interface BiometricPromptOptions {
  promptMessage?: string;
  cancelButtonText?: string;
}

const rnBiometrics = new ReactNativeBiometrics();

/** Key alias used in Keychain/KeyStore. Must be unique per PFF identity. */
export const PFF_SIGNING_KEY_ALIAS = 'pff_presence_signing_key';

/** Map library biometry types to our union. */
function toBiometryType(t: string | null): BiometryType {
  if (t === BiometryTypes.TouchID) return 'TouchID';
  if (t === BiometryTypes.FaceID) return 'FaceID';
  if (t === BiometryTypes.Biometrics) return 'Biometrics';
  return 'Biometrics';
}

/**
 * Check device capabilities (biometrics, secure hardware). Used by Vitalization
 * to decide available layers and fallbacks.
 */
export async function getDeviceCapabilities(): Promise<DeviceCapabilities> {
  const { available, biometryType } = await rnBiometrics.isSensorAvailable();
  return {
    hasBiometrics: available,
    biometryType: available && biometryType != null ? toBiometryType(biometryType) : null,
    hasSecureEnclave: available, // Keychain/KeyStore implies hardware-backed when biometry exists
    attestationSupported: false, // Set true when react-native-app-attest / Keymaster attestation integrated
  };
}

/**
 * Create a hardware-bound, non-exportable key pair for signing Presence Proofs.
 * Key is stored in Secure Enclave / Keymaster and protected by biometrics.
 * Call during Vitalization after user consents.
 *
 * Returns public key and keyId only; private key never leaves the device.
 */
export async function createSigningKey(): Promise<KeyGenerationOutcome> {
  try {
    const { publicKey } = await rnBiometrics.createKeys();
    const { biometryType } = await rnBiometrics.isSensorAvailable();
    if (!publicKey) {
      return {
        success: false,
        code: 'KEY_CREATE_FAILED',
        message: 'Key creation did not return a public key',
      } satisfies KeyGenerationError;
    }
    const result: KeyGenerationResult = {
      success: true,
      publicKey,
      keyId: PFF_SIGNING_KEY_ALIAS,
      biometryType: toBiometryType(biometryType ?? null),
    };
    return result;
  } catch (e) {
    const err = e as Error;
    return {
      success: false,
      code: 'KEY_CREATE_ERROR',
      message: err?.message ?? 'Unknown error creating signing key',
    } satisfies KeyGenerationError;
  }
}

/**
 * Sign a Presence Proof payload with the hardware-backed key. Requires
 * biometric authentication (TouchID / FaceID / Android Biometrics).
 * Only the success boolean and signature are used; no raw biometric data.
 * Used for Digital Handshake and Heartbeat.
 */
export async function signPresenceProof(
  payload: PresenceProofPayload,
  options?: BiometricPromptOptions
): Promise<SigningOutcome> {
  const payloadString = JSON.stringify(payload);
  const promptMessage = options?.promptMessage ?? 'Confirm your presence';
  const cancelButtonText = options?.cancelButtonText ?? 'Cancel';
  try {
    const { success, signature } = await rnBiometrics.createSignature({
      promptMessage,
      payload: payloadString,
      cancelButtonText,
    });
    if (!success || !signature) {
      return {
        success: false,
        code: 'SIGN_CANCELLED',
        message: 'Biometric authentication was cancelled or failed',
      } satisfies SigningError;
    }
    return {
      success: true,
      signature,
      payload,
    } satisfies SigningResult;
  } catch (e) {
    const err = e as Error;
    return {
      success: false,
      code: 'SIGN_ERROR',
      message: err?.message ?? 'Unknown error signing presence proof',
    } satisfies SigningError;
  }
}

/**
 * Prompt message for native biometric (LocalAuthentication / BiometricPrompt).
 * Fingerprint-first; if device has no fingerprint sensor, use face messaging
 * so the user knows they can use Face ID / face unlock and aren't locked out.
 */
export function getBiometricPromptMessage(caps: DeviceCapabilities): string {
  if (!caps.hasBiometrics || !caps.biometryType) {
    return 'Verify your identity';
  }
  switch (caps.biometryType) {
    case 'TouchID':
      return 'Verify with fingerprint';
    case 'FaceID':
      return 'Verify with face';
    case 'Biometrics':
      return 'Verify with fingerprint or face';
    default:
      return 'Verify your identity';
  }
}

/**
 * Delete the PFF signing key. Use when user revokes device or during
 * re-vitalization. Idempotent; safe to call if key does not exist.
 */
export async function deleteSigningKey(): Promise<{ deleted: boolean }> {
  try {
    await rnBiometrics.deleteKeys();
    return { deleted: true };
  } catch {
    return { deleted: false };
  }
}

/**
 * Check whether a PFF signing key already exists (e.g. user already vitalized
 * on this device).
 */
export async function hasSigningKey(): Promise<boolean> {
  try {
    const { keysExist } = await rnBiometrics.biometricKeysExist();
    return keysExist ?? false;
  } catch {
    return false;
  }
}

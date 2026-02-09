/**
 * Biometric pipeline state machine: Face Scan → Device Binding → Sovereign Hash.
 * No palm scanning. Clear separation between stages; no shared mutable state across stages.
 *
 * Why Face + Device: Face provides biometric (who you are), WebAuthn/Passkey provides
 * possession (what you have). Together they yield deterministic sovereign hash without
 * storing raw biometrics. Palm was removed for PWA stability and simpler mobile UX.
 */

export enum IdentityState {
  IDLE = 'IDLE',
  FACE_SCANNING = 'FACE_SCANNING',
  FACE_VERIFIED = 'FACE_VERIFIED',
  DEVICE_BINDING = 'DEVICE_BINDING',
  HASH_GENERATION = 'HASH_GENERATION',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
}

export type IdentityStateType = keyof typeof IdentityState;

export function isTerminalState(state: IdentityState): boolean {
  return state === IdentityState.COMPLETED || state === IdentityState.ERROR;
}

export function isActiveState(state: IdentityState): boolean {
  return (
    state === IdentityState.FACE_SCANNING ||
    state === IdentityState.FACE_VERIFIED ||
    state === IdentityState.DEVICE_BINDING ||
    state === IdentityState.HASH_GENERATION
  );
}

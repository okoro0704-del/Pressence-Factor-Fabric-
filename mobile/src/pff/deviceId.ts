/**
 * PFF — Presence Factor Fabric
 * Hardware-bound device identifier for Presence Proof.
 * Binds proofs to the device; keys are already stored in Secure Enclave/Keymaster.
 */

import DeviceInfo from 'react-native-device-info';

/**
 * Stable hardware-derived device ID (iOS: identifierForVendor, Android: androidId).
 * Used in Presence Proof payload to bind proof to this device.
 */
export async function getDeviceId(): Promise<string> {
  try {
    const id = await DeviceInfo.getUniqueId();
    return id ?? 'device-id-unknown';
  } catch {
    return 'device-id-unknown';
  }
}

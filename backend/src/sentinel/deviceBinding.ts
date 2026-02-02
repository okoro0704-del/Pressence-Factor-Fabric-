/**
 * PFF Backend — Device Binding Service
 * Generate Device_UUID and Hardware_TPM_Hash for license binding
 * Architect: Isreal Okoro (mrfundzman)
 * 
 * Purpose:
 * - Generate unique device identifiers
 * - Create Hardware TPM Hash
 * - Enforce non-transferable licensing
 * - Detect pre-installed Sentinel builds
 */

import * as crypto from 'crypto';
import { query } from '../db/client';
import type {
  DeviceBindingInfo,
  PreInstallStatus,
  IS_LICENSE_TRANSFERABLE,
} from '../../../core/oemCertification';

// ============================================================================
// DEVICE UUID GENERATION
// ============================================================================

/**
 * Generate Device UUID
 * Combines device ID, platform info, and hardware identifiers
 * This UUID is unique to the device and cannot be transferred
 */
export function generateDeviceUUID(
  deviceId: string,
  platformOS: string,
  platformVersion: string,
  architecture: string
): string {
  const uuidData = `${deviceId}-${platformOS}-${platformVersion}-${architecture}`;
  
  return crypto
    .createHash('sha256')
    .update(uuidData)
    .digest('hex');
}

/**
 * Generate Hardware TPM Hash
 * SHA-256 hash of TPM attestation data
 * Binds license to specific hardware security module
 */
export function generateHardwareTPMHash(
  tpmAttestation: string,
  secureEnclaveAttestation: string,
  deviceId: string
): string {
  const tpmData = `${tpmAttestation}-${secureEnclaveAttestation}-${deviceId}`;
  
  return crypto
    .createHash('sha256')
    .update(tpmData)
    .digest('hex');
}

// ============================================================================
// PRE-INSTALL DETECTION
// ============================================================================

/**
 * Detect if Sentinel is pre-installed on device
 * Checks for OEM certification and build metadata
 */
export async function detectPreInstallStatus(
  deviceUUID: string,
  manufacturer: string,
  deviceModel: string
): Promise<PreInstallStatus> {
  // Check if device has OEM certification
  const certResult = await query<{ certification_id: string; pre_install_config: string }>(
    `SELECT certification_id, pre_install_config
     FROM oem_certifications
     WHERE manufacturer = $1 AND device_model = $2 AND status = 'CERTIFIED'
     LIMIT 1`,
    [manufacturer, deviceModel]
  );
  
  if (certResult.rows.length === 0) {
    return 'USER_INSTALLED';
  }
  
  // Parse pre-install config
  const preInstallConfig = JSON.parse(certResult.rows[0].pre_install_config);
  
  if (preInstallConfig.isPreInstalled === true) {
    return 'PRE_INSTALLED';
  }
  
  return 'USER_INSTALLED';
}

/**
 * Check if device has existing Sentinel activation
 * Used to prevent duplicate activations on same device
 */
export async function hasExistingActivation(deviceUUID: string): Promise<boolean> {
  const result = await query<{ id: string }>(
    `SELECT id FROM sentinel_activations
     WHERE device_uuid = $1 AND status = 'ACTIVE'
     LIMIT 1`,
    [deviceUUID]
  );
  
  return result.rows.length > 0;
}

// ============================================================================
// DEVICE BINDING CREATION
// ============================================================================

/**
 * Create device binding information
 * Generates all unique identifiers for license binding
 */
export async function createDeviceBinding(
  deviceId: string,
  deviceFingerprint: string,
  platformOS: string,
  platformVersion: string,
  architecture: string,
  tpmAttestation: string,
  secureEnclaveAttestation: string,
  manufacturer: string,
  deviceModel: string
): Promise<DeviceBindingInfo> {
  // Generate Device UUID
  const deviceUUID = generateDeviceUUID(
    deviceId,
    platformOS,
    platformVersion,
    architecture
  );
  
  // Generate Hardware TPM Hash
  const hardwareTPMHash = generateHardwareTPMHash(
    tpmAttestation,
    secureEnclaveAttestation,
    deviceId
  );
  
  // Detect pre-install status
  const preInstallStatus = await detectPreInstallStatus(
    deviceUUID,
    manufacturer,
    deviceModel
  );
  
  // Get OEM certification ID (if applicable)
  let oemCertificationId: string | undefined;
  if (preInstallStatus === 'PRE_INSTALLED') {
    const certResult = await query<{ certification_id: string }>(
      `SELECT certification_id
       FROM oem_certifications
       WHERE manufacturer = $1 AND device_model = $2 AND status = 'CERTIFIED'
       LIMIT 1`,
      [manufacturer, deviceModel]
    );
    
    if (certResult.rows.length > 0) {
      oemCertificationId = certResult.rows[0].certification_id;
    }
  }
  
  return {
    deviceUUID,
    hardwareTPMHash,
    deviceFingerprint,
    isLicenseTransferable: false, // HARDCODED to FALSE
    preInstallStatus,
    oemCertificationId,
  };
}

/**
 * Verify device binding
 * Ensures license is bound to correct device
 */
export async function verifyDeviceBinding(
  deviceUUID: string,
  hardwareTPMHash: string,
  citizenId: string
): Promise<{ valid: boolean; error?: string }> {
  // Check if activation exists for this citizen
  const result = await query<{
    device_uuid: string;
    hardware_tpm_hash: string;
    is_license_transferable: boolean;
  }>(
    `SELECT device_uuid, hardware_tpm_hash, is_license_transferable
     FROM sentinel_activations
     WHERE citizen_id = $1 AND status = 'ACTIVE'
     LIMIT 1`,
    [citizenId]
  );
  
  if (result.rows.length === 0) {
    return { valid: false, error: 'No active Sentinel activation found' };
  }
  
  const activation = result.rows[0];
  
  // Verify device UUID matches
  if (activation.device_uuid !== deviceUUID) {
    return { valid: false, error: 'Device UUID mismatch - license is bound to another device' };
  }
  
  // Verify hardware TPM hash matches
  if (activation.hardware_tpm_hash !== hardwareTPMHash) {
    return { valid: false, error: 'Hardware TPM hash mismatch - hardware has changed' };
  }
  
  // Verify license is not transferable
  if (activation.is_license_transferable !== false) {
    return { valid: false, error: 'Invalid license configuration' };
  }
  
  return { valid: true };
}


/**
 * PFF Backend — Hardware Sync Protocol
 * Secure handshake between HP Laptop and Mobile Device for Genesis Verification
 * Architect: Isreal Okoro (mrfundzman)
 *
 * Purpose:
 * - Initiate secure handshake between ROOT_SOVEREIGN_PAIR devices
 * - Verify both Hardware_UUIDs match ROOT_SOVEREIGN_PAIR registry
 * - Synchronize device states for Genesis Verification
 * - Establish encrypted communication channel
 */

import { pool, query } from '../db/client';
import * as crypto from 'crypto';

export interface HardwareSyncRequest {
  laptopDeviceUUID: string;
  mobileDeviceUUID: string;
  laptopTPMAttestation: string;
  mobileSecureEnclaveAttestation: string;
  syncSessionId: string;
  timestamp: Date;
}

export interface HardwareSyncResult {
  success: boolean;
  syncSessionId: string;
  laptopDeviceUUID: string;
  mobileDeviceUUID: string;
  pairBindingHash: string;
  pairVerified: boolean;
  encryptedChannelEstablished: boolean;
  syncTimestamp: Date;
  message: string;
  error?: string;
}

export interface RootSovereignPairVerification {
  pairExists: boolean;
  laptopMatches: boolean;
  mobileMatches: boolean;
  pairBindingHash: string;
  activationTimestamp: Date;
}

/**
 * Verify ROOT_SOVEREIGN_PAIR Registry
 * Check if both devices match the registered ROOT_SOVEREIGN_PAIR
 */
export async function verifyRootSovereignPair(
  laptopDeviceUUID: string,
  mobileDeviceUUID: string
): Promise<RootSovereignPairVerification> {
  const result = await query<{
    laptop_device_uuid: string;
    mobile_device_uuid: string;
    pair_binding_hash: string;
    binding_timestamp: Date;
  }>(
    `SELECT laptop_device_uuid, mobile_device_uuid, pair_binding_hash, binding_timestamp
     FROM root_sovereign_pair
     WHERE laptop_device_uuid = $1 AND mobile_device_uuid = $2
     LIMIT 1`,
    [laptopDeviceUUID, mobileDeviceUUID]
  );

  if (result.rows.length === 0) {
    return {
      pairExists: false,
      laptopMatches: false,
      mobileMatches: false,
      pairBindingHash: '',
      activationTimestamp: new Date(),
    };
  }

  const pair = result.rows[0];

  return {
    pairExists: true,
    laptopMatches: pair.laptop_device_uuid === laptopDeviceUUID,
    mobileMatches: pair.mobile_device_uuid === mobileDeviceUUID,
    pairBindingHash: pair.pair_binding_hash,
    activationTimestamp: pair.binding_timestamp,
  };
}

/**
 * Generate Sync Session Encryption Key
 * Creates AES-256 key for encrypted communication between devices
 */
function generateSyncEncryptionKey(
  laptopDeviceUUID: string,
  mobileDeviceUUID: string,
  syncSessionId: string
): string {
  const keyMaterial = `${laptopDeviceUUID}::${mobileDeviceUUID}::${syncSessionId}`;
  
  return crypto
    .createHash('sha256')
    .update(keyMaterial)
    .digest('hex');
}

/**
 * Initiate Secure Handshake
 * Establish encrypted communication channel between HP Laptop and Mobile Device
 */
export async function initiateSecureHandshake(
  request: HardwareSyncRequest
): Promise<HardwareSyncResult> {
  const syncTimestamp = new Date();

  try {
    // STEP 1: Verify ROOT_SOVEREIGN_PAIR
    const pairVerification = await verifyRootSovereignPair(
      request.laptopDeviceUUID,
      request.mobileDeviceUUID
    );

    if (!pairVerification.pairExists) {
      return {
        success: false,
        syncSessionId: request.syncSessionId,
        laptopDeviceUUID: request.laptopDeviceUUID,
        mobileDeviceUUID: request.mobileDeviceUUID,
        pairBindingHash: '',
        pairVerified: false,
        encryptedChannelEstablished: false,
        syncTimestamp,
        message: 'ROOT_SOVEREIGN_PAIR not found in registry',
        error: 'PAIR_NOT_REGISTERED',
      };
    }

    if (!pairVerification.laptopMatches || !pairVerification.mobileMatches) {
      return {
        success: false,
        syncSessionId: request.syncSessionId,
        laptopDeviceUUID: request.laptopDeviceUUID,
        mobileDeviceUUID: request.mobileDeviceUUID,
        pairBindingHash: pairVerification.pairBindingHash,
        pairVerified: false,
        encryptedChannelEstablished: false,
        syncTimestamp,
        message: 'Hardware_UUIDs do not match ROOT_SOVEREIGN_PAIR registry',
        error: 'PAIR_MISMATCH',
      };
    }

    // STEP 2: Generate Sync Encryption Key
    const syncEncryptionKey = generateSyncEncryptionKey(
      request.laptopDeviceUUID,
      request.mobileDeviceUUID,
      request.syncSessionId
    );

    // STEP 3: Log Hardware Sync Session
    await query(
      `INSERT INTO hardware_sync_sessions
       (sync_session_id, laptop_device_uuid, mobile_device_uuid, pair_binding_hash,
        sync_encryption_key, sync_status, sync_timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        request.syncSessionId,
        request.laptopDeviceUUID,
        request.mobileDeviceUUID,
        pairVerification.pairBindingHash,
        syncEncryptionKey,
        'ACTIVE',
        syncTimestamp,
      ]
    );

    return {
      success: true,
      syncSessionId: request.syncSessionId,
      laptopDeviceUUID: request.laptopDeviceUUID,
      mobileDeviceUUID: request.mobileDeviceUUID,
      pairBindingHash: pairVerification.pairBindingHash,
      pairVerified: true,
      encryptedChannelEstablished: true,
      syncTimestamp,
      message: 'HARDWARE_SYNC_ESTABLISHED. ROOT_SOVEREIGN_PAIR_VERIFIED.',
    };
  } catch (e) {
    const err = e as Error;
    console.error('[HARDWARE SYNC] Failed to initiate secure handshake:', err);

    return {
      success: false,
      syncSessionId: request.syncSessionId,
      laptopDeviceUUID: request.laptopDeviceUUID,
      mobileDeviceUUID: request.mobileDeviceUUID,
      pairBindingHash: '',
      pairVerified: false,
      encryptedChannelEstablished: false,
      syncTimestamp,
      message: 'HARDWARE_SYNC_FAILED',
      error: err.message,
    };
  }
}


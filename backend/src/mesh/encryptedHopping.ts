/**
 * PFF Backend — VLT Darknet Mesh Sync: Encrypted Hopping
 * Store encrypted offline vitalization data on neighboring devices
 * Architect: Isreal Okoro (mrfundzman)
 * 
 * Purpose:
 * - Capture offline vitalization data and encrypt it
 * - Store encrypted data on neighboring Sentinel devices
 * - Forward data when any device in mesh hits internet-active node
 * - Implement cleanup and acknowledgment protocols
 */

import * as crypto from 'crypto';
import { query } from '../db/client';

// ============================================================================
// TYPES
// ============================================================================

export interface OfflineVitalizationData {
  vitalizationId: string;
  citizenId: string;
  pffId: string;
  deviceId: string;
  transactionType: string;
  amount: number;
  fromVault: string | null;
  toVault: string | null;
  metadata: Record<string, unknown>;
  timestamp: Date;
  offlineSignature: string;
}

export interface EncryptedHop {
  hopId: string;
  vitalizationId: string;
  originDeviceId: string;
  storageDeviceId: string;
  encryptedPayload: string;
  encryptionKey: string; // Encrypted with storage device's public key
  hopCount: number;
  maxHops: number;
  createdAt: Date;
  forwardedAt: Date | null;
  acknowledgedAt: Date | null;
  status: 'STORED' | 'FORWARDED' | 'DELIVERED' | 'EXPIRED';
}

export interface HopResult {
  success: boolean;
  hopId: string;
  storageDeviceId: string;
  hopCount: number;
  error?: string;
}

export interface ForwardResult {
  success: boolean;
  vitalizationId: string;
  deliveredToServer: boolean;
  hopPath: string[];
  error?: string;
}

// ============================================================================
// ENCRYPTION
// ============================================================================

/**
 * Encrypt vitalization data for storage on neighbor device
 * Uses AES-256-GCM for encryption
 */
function encryptVitalizationData(
  data: OfflineVitalizationData,
  storageDevicePublicKey: string
): { encryptedPayload: string; encryptionKey: string } {
  // Generate random AES key
  const aesKey = crypto.randomBytes(32);
  const iv = crypto.randomBytes(16);

  // Encrypt data with AES
  const cipher = crypto.createCipheriv('aes-256-gcm', aesKey, iv);
  const dataString = JSON.stringify(data);
  let encrypted = cipher.update(dataString, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  // Combine IV + encrypted data + auth tag
  const encryptedPayload = iv.toString('hex') + ':' + encrypted + ':' + authTag.toString('hex');

  // Encrypt AES key with storage device's public key
  // In production, this would use actual RSA encryption
  const encryptionKey = crypto
    .createHash('sha256')
    .update(aesKey.toString('hex') + storageDevicePublicKey)
    .digest('hex');

  return { encryptedPayload, encryptionKey };
}

/**
 * Decrypt vitalization data from encrypted hop
 * Uses AES-256-GCM for decryption
 */
function decryptVitalizationData(
  encryptedPayload: string,
  encryptionKey: string,
  storageDevicePrivateKey: string
): OfflineVitalizationData | null {
  try {
    // Decrypt AES key with private key
    // In production, this would use actual RSA decryption
    const parts = encryptedPayload.split(':');
    if (parts.length !== 3) return null;

    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const authTag = Buffer.from(parts[2], 'hex');

    // For now, we'll use a simplified decryption
    // In production, this would properly decrypt the AES key first
    const aesKey = Buffer.from(encryptionKey.substring(0, 64), 'hex');

    const decipher = crypto.createDecipheriv('aes-256-gcm', aesKey, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted);
  } catch (error) {
    console.error('Decryption failed:', error);
    return null;
  }
}

// ============================================================================
// HOP STORAGE
// ============================================================================

/**
 * Store encrypted vitalization data on neighbor device
 * Creates a "hop" in the mesh network
 */
export async function storeEncryptedHop(
  vitalizationData: OfflineVitalizationData,
  originDeviceId: string,
  storageDeviceId: string,
  storageDevicePublicKey: string,
  hopCount: number = 0,
  maxHops: number = 5
): Promise<HopResult> {
  const hopId = crypto.randomUUID();

  try {
    // 1. Encrypt vitalization data
    const { encryptedPayload, encryptionKey } = encryptVitalizationData(
      vitalizationData,
      storageDevicePublicKey
    );

    // 2. Store encrypted hop
    await query(
      `INSERT INTO mesh_encrypted_hops
       (hop_id, vitalization_id, origin_device_id, storage_device_id, 
        encrypted_payload, encryption_key, hop_count, max_hops, created_at, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        hopId,
        vitalizationData.vitalizationId,
        originDeviceId,
        storageDeviceId,
        encryptedPayload,
        encryptionKey,
        hopCount,
        maxHops,
        new Date(),
        'STORED',
      ]
    );

    return {
      success: true,
      hopId,
      storageDeviceId,
      hopCount,
    };
  } catch (error) {
    const err = error as Error;
    return {
      success: false,
      hopId,
      storageDeviceId,
      hopCount,
      error: `Failed to store encrypted hop: ${err.message}`,
    };
  }
}

// ============================================================================
// HOP FORWARDING
// ============================================================================

/**
 * Forward encrypted hop to next device in mesh
 * Called when current device connects to another peer
 */
export async function forwardEncryptedHop(
  hopId: string,
  nextDeviceId: string,
  nextDevicePublicKey: string,
  storageDevicePrivateKey: string
): Promise<HopResult> {
  try {
    // 1. Retrieve encrypted hop
    const hopResult = await query<{
      hop_id: string;
      vitalization_id: string;
      origin_device_id: string;
      storage_device_id: string;
      encrypted_payload: string;
      encryption_key: string;
      hop_count: number;
      max_hops: number;
      status: string;
    }>(
      `SELECT * FROM mesh_encrypted_hops WHERE hop_id = $1`,
      [hopId]
    );

    if (hopResult.rows.length === 0) {
      return {
        success: false,
        hopId,
        storageDeviceId: nextDeviceId,
        hopCount: 0,
        error: 'Hop not found',
      };
    }

    const hop = hopResult.rows[0];

    // 2. Check if max hops reached
    if (hop.hop_count >= hop.max_hops) {
      await query(
        `UPDATE mesh_encrypted_hops SET status = 'EXPIRED' WHERE hop_id = $1`,
        [hopId]
      );
      return {
        success: false,
        hopId,
        storageDeviceId: nextDeviceId,
        hopCount: hop.hop_count,
        error: 'Max hops reached',
      };
    }

    // 3. Decrypt vitalization data
    const vitalizationData = decryptVitalizationData(
      hop.encrypted_payload,
      hop.encryption_key,
      storageDevicePrivateKey
    );

    if (!vitalizationData) {
      return {
        success: false,
        hopId,
        storageDeviceId: nextDeviceId,
        hopCount: hop.hop_count,
        error: 'Decryption failed',
      };
    }

    // 4. Re-encrypt for next device
    const { encryptedPayload, encryptionKey } = encryptVitalizationData(
      vitalizationData,
      nextDevicePublicKey
    );

    // 5. Create new hop
    const newHopId = crypto.randomUUID();
    await query(
      `INSERT INTO mesh_encrypted_hops
       (hop_id, vitalization_id, origin_device_id, storage_device_id,
        encrypted_payload, encryption_key, hop_count, max_hops, created_at, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        newHopId,
        vitalizationData.vitalizationId,
        hop.origin_device_id,
        nextDeviceId,
        encryptedPayload,
        encryptionKey,
        hop.hop_count + 1,
        hop.max_hops,
        new Date(),
        'STORED',
      ]
    );

    // 6. Mark original hop as forwarded
    await query(
      `UPDATE mesh_encrypted_hops
       SET status = 'FORWARDED', forwarded_at = NOW()
       WHERE hop_id = $1`,
      [hopId]
    );

    return {
      success: true,
      hopId: newHopId,
      storageDeviceId: nextDeviceId,
      hopCount: hop.hop_count + 1,
    };
  } catch (error) {
    const err = error as Error;
    return {
      success: false,
      hopId,
      storageDeviceId: nextDeviceId,
      hopCount: 0,
      error: `Failed to forward hop: ${err.message}`,
    };
  }
}

/**
 * Deliver encrypted hop to central server when internet connection available
 * Returns true if successfully delivered
 */
export async function deliverToServer(
  hopId: string,
  storageDevicePrivateKey: string,
  serverUrl: string
): Promise<ForwardResult> {
  try {
    // 1. Retrieve encrypted hop
    const hopResult = await query<{
      hop_id: string;
      vitalization_id: string;
      origin_device_id: string;
      encrypted_payload: string;
      encryption_key: string;
      hop_count: number;
    }>(
      `SELECT * FROM mesh_encrypted_hops WHERE hop_id = $1`,
      [hopId]
    );

    if (hopResult.rows.length === 0) {
      return {
        success: false,
        vitalizationId: '',
        deliveredToServer: false,
        hopPath: [],
        error: 'Hop not found',
      };
    }

    const hop = hopResult.rows[0];

    // 2. Decrypt vitalization data
    const vitalizationData = decryptVitalizationData(
      hop.encrypted_payload,
      hop.encryption_key,
      storageDevicePrivateKey
    );

    if (!vitalizationData) {
      return {
        success: false,
        vitalizationId: hop.vitalization_id,
        deliveredToServer: false,
        hopPath: [],
        error: 'Decryption failed',
      };
    }

    // 3. Get hop path
    const hopPath = await getHopPath(hop.vitalization_id);

    // 4. Submit to VLT server
    // In production, this would make HTTP request to server
    const transactionHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(vitalizationData))
      .digest('hex');

    await query(
      `INSERT INTO vlt_transactions
       (transaction_type, transaction_hash, citizen_id, amount, from_vault, to_vault, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        vitalizationData.transactionType,
        transactionHash,
        vitalizationData.citizenId,
        vitalizationData.amount,
        vitalizationData.fromVault,
        vitalizationData.toVault,
        JSON.stringify({
          ...vitalizationData.metadata,
          offlineVitalization: true,
          hopCount: hop.hop_count,
          hopPath,
          deliveredAt: new Date().toISOString(),
        }),
      ]
    );

    // 5. Mark hop as delivered
    await query(
      `UPDATE mesh_encrypted_hops
       SET status = 'DELIVERED', acknowledged_at = NOW()
       WHERE hop_id = $1`,
      [hopId]
    );

    // 6. Send acknowledgment back through hop path
    await sendAcknowledgment(hop.vitalization_id, hopPath);

    return {
      success: true,
      vitalizationId: hop.vitalization_id,
      deliveredToServer: true,
      hopPath,
    };
  } catch (error) {
    const err = error as Error;
    return {
      success: false,
      vitalizationId: '',
      deliveredToServer: false,
      hopPath: [],
      error: `Failed to deliver to server: ${err.message}`,
    };
  }
}

/**
 * Get hop path for vitalization
 */
async function getHopPath(vitalizationId: string): Promise<string[]> {
  const result = await query<{ storage_device_id: string; hop_count: number }>(
    `SELECT storage_device_id, hop_count FROM mesh_encrypted_hops
     WHERE vitalization_id = $1
     ORDER BY hop_count ASC`,
    [vitalizationId]
  );

  return result.rows.map(row => row.storage_device_id);
}

/**
 * Send acknowledgment back through hop path
 */
async function sendAcknowledgment(
  vitalizationId: string,
  hopPath: string[]
): Promise<void> {
  // In production, this would send acknowledgment messages back through the mesh
  // For now, we just log it
  await query(
    `INSERT INTO mesh_hop_acknowledgments
     (vitalization_id, hop_path, acknowledged_at)
     VALUES ($1, $2, NOW())`,
    [vitalizationId, JSON.stringify(hopPath)]
  );
}

/**
 * Check for pending hops and attempt delivery when online
 */
export async function processPendingHops(
  deviceId: string,
  devicePrivateKey: string,
  serverUrl: string
): Promise<number> {
  // Get all stored hops on this device
  const result = await query<{ hop_id: string }>(
    `SELECT hop_id FROM mesh_encrypted_hops
     WHERE storage_device_id = $1 AND status = 'STORED'
     ORDER BY created_at ASC`,
    [deviceId]
  );

  let deliveredCount = 0;

  for (const row of result.rows) {
    const deliveryResult = await deliverToServer(row.hop_id, devicePrivateKey, serverUrl);
    if (deliveryResult.success) {
      deliveredCount++;
    }
  }

  return deliveredCount;
}


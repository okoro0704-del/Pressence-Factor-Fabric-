/**
 * PFF Backend — VLT Darknet Mesh Sync: Offline Verification
 * 4-Layer Handshake verification using TEE without internet
 * Architect: Isreal Okoro (mrfundzman)
 * 
 * Purpose:
 * - Enable offline verification of 4-layer biometric handshake using hardware TEE
 * - Store verification templates locally in secure enclave
 * - Generate offline signatures that can be synced when device comes online
 * - Maintain zero-knowledge principle (no raw biometric data stored)
 */

import * as crypto from 'crypto';
import { query } from '../db/client';

// ============================================================================
// TYPES
// ============================================================================

export interface OfflineHandshakeData {
  citizenId: string;
  pffId: string;
  deviceId: string;
  faceSignature: string;      // Phase 1: Visual Liveness
  fingerSignature: string;    // Phase 2: Tactile Identity
  heartSignature: string;     // Phase 3: Vital Pulse (Heart)
  voiceSignature: string;     // Phase 3: Vital Pulse (Voice)
  timestamp: number;
  nonce: string;
}

export interface OfflineVerificationTemplate {
  citizenId: string;
  pffId: string;
  deviceId: string;
  faceTemplateHash: string;
  fingerTemplateHash: string;
  heartTemplateHash: string;
  voiceTemplateHash: string;
  compositeHash: string;
  teeAttestationHash: string;
  createdAt: Date;
  lastVerifiedAt: Date | null;
}

export interface OfflineVerificationResult {
  success: boolean;
  sessionId: string;
  verifiedOffline: boolean;
  compositeHash: string;
  timestamp: Date;
  syncRequired: boolean;
  error?: string;
}

export interface TEEAttestation {
  deviceId: string;
  tpmHash: string;
  secureEnclaveHash: string;
  platformInfo: {
    os: string;
    version: string;
    architecture: string;
  };
}

// ============================================================================
// OFFLINE TEMPLATE GENERATION
// ============================================================================

/**
 * Generate offline verification template from 4-layer handshake
 * Stores hashed templates in local TEE for offline verification
 * Templates are cryptographic hashes, not raw biometric data
 */
export async function generateOfflineTemplate(
  citizenId: string,
  pffId: string,
  deviceId: string,
  faceSignature: string,
  fingerSignature: string,
  heartSignature: string,
  voiceSignature: string,
  teeAttestation: TEEAttestation
): Promise<OfflineVerificationTemplate> {
  // Generate individual template hashes (SHA-512 for security)
  const faceTemplateHash = crypto
    .createHash('sha512')
    .update(faceSignature)
    .digest('hex');

  const fingerTemplateHash = crypto
    .createHash('sha512')
    .update(fingerSignature)
    .digest('hex');

  const heartTemplateHash = crypto
    .createHash('sha512')
    .update(heartSignature)
    .digest('hex');

  const voiceTemplateHash = crypto
    .createHash('sha512')
    .update(voiceSignature)
    .digest('hex');

  // Generate composite hash (combines all 4 phases)
  const compositeData = `${faceTemplateHash}:${fingerTemplateHash}:${heartTemplateHash}:${voiceTemplateHash}`;
  const compositeHash = crypto
    .createHash('sha512')
    .update(compositeData)
    .digest('hex');

  // Generate TEE attestation hash
  const teeData = `${teeAttestation.tpmHash}:${teeAttestation.secureEnclaveHash}:${deviceId}`;
  const teeAttestationHash = crypto
    .createHash('sha512')
    .update(teeData)
    .digest('hex');

  const createdAt = new Date();

  // Store template in database
  await query(
    `INSERT INTO offline_verification_templates
     (citizen_id, pff_id, device_id, face_template_hash, finger_template_hash, 
      heart_template_hash, voice_template_hash, composite_hash, tee_attestation_hash, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     ON CONFLICT (citizen_id, device_id) 
     DO UPDATE SET
       face_template_hash = EXCLUDED.face_template_hash,
       finger_template_hash = EXCLUDED.finger_template_hash,
       heart_template_hash = EXCLUDED.heart_template_hash,
       voice_template_hash = EXCLUDED.voice_template_hash,
       composite_hash = EXCLUDED.composite_hash,
       tee_attestation_hash = EXCLUDED.tee_attestation_hash,
       created_at = EXCLUDED.created_at`,
    [
      citizenId,
      pffId,
      deviceId,
      faceTemplateHash,
      fingerTemplateHash,
      heartTemplateHash,
      voiceTemplateHash,
      compositeHash,
      teeAttestationHash,
      createdAt,
    ]
  );

  return {
    citizenId,
    pffId,
    deviceId,
    faceTemplateHash,
    fingerTemplateHash,
    heartTemplateHash,
    voiceTemplateHash,
    compositeHash,
    teeAttestationHash,
    createdAt,
    lastVerifiedAt: null,
  };
}

// ============================================================================
// OFFLINE HANDSHAKE VERIFICATION
// ============================================================================

/**
 * Verify 4-layer handshake offline using stored templates in TEE
 * No internet connection required
 * Returns verification result with sync flag
 */
export async function verifyOfflineHandshake(
  handshakeData: OfflineHandshakeData
): Promise<OfflineVerificationResult> {
  const sessionId = crypto.randomUUID();
  const timestamp = new Date();

  try {
    // 1. Retrieve stored template from local database
    const templateResult = await query<OfflineVerificationTemplate>(
      `SELECT * FROM offline_verification_templates
       WHERE citizen_id = $1 AND device_id = $2`,
      [handshakeData.citizenId, handshakeData.deviceId]
    );

    if (templateResult.rows.length === 0) {
      return {
        success: false,
        sessionId,
        verifiedOffline: false,
        compositeHash: '',
        timestamp,
        syncRequired: true,
        error: 'No offline template found. Online verification required.',
      };
    }

    const template = templateResult.rows[0];

    // 2. Generate hashes from provided signatures
    const faceHash = crypto
      .createHash('sha512')
      .update(handshakeData.faceSignature)
      .digest('hex');

    const fingerHash = crypto
      .createHash('sha512')
      .update(handshakeData.fingerSignature)
      .digest('hex');

    const heartHash = crypto
      .createHash('sha512')
      .update(handshakeData.heartSignature)
      .digest('hex');

    const voiceHash = crypto
      .createHash('sha512')
      .update(handshakeData.voiceSignature)
      .digest('hex');

    // 3. Generate composite hash
    const compositeData = `${faceHash}:${fingerHash}:${heartHash}:${voiceHash}`;
    const compositeHash = crypto
      .createHash('sha512')
      .update(compositeData)
      .digest('hex');

    // 4. Verify composite hash matches stored template
    if (compositeHash !== template.composite_hash) {
      // Log failed verification attempt
      await query(
        `INSERT INTO offline_verification_log
         (session_id, citizen_id, device_id, verification_status, composite_hash, timestamp, sync_pending)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [sessionId, handshakeData.citizenId, handshakeData.deviceId, 'FAILED', compositeHash, timestamp, true]
      );

      return {
        success: false,
        sessionId,
        verifiedOffline: true,
        compositeHash,
        timestamp,
        syncRequired: true,
        error: 'Handshake verification failed. Biometric mismatch.',
      };
    }

    // 5. SUCCESS: Log successful verification
    await query(
      `INSERT INTO offline_verification_log
       (session_id, citizen_id, device_id, verification_status, composite_hash, timestamp, sync_pending)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [sessionId, handshakeData.citizenId, handshakeData.deviceId, 'SUCCESS', compositeHash, timestamp, true]
    );

    // 6. Update last verified timestamp
    await query(
      `UPDATE offline_verification_templates
       SET last_verified_at = $1
       WHERE citizen_id = $2 AND device_id = $3`,
      [timestamp, handshakeData.citizenId, handshakeData.deviceId]
    );

    return {
      success: true,
      sessionId,
      verifiedOffline: true,
      compositeHash,
      timestamp,
      syncRequired: true, // Always sync offline verifications when online
    };
  } catch (error) {
    const err = error as Error;
    return {
      success: false,
      sessionId,
      verifiedOffline: false,
      compositeHash: '',
      timestamp,
      syncRequired: true,
      error: `Offline verification error: ${err.message}`,
    };
  }
}

// ============================================================================
// OFFLINE VERIFICATION SYNC
// ============================================================================

/**
 * Sync offline verification logs to central VLT when device comes online
 * Returns number of records synced
 */
export async function syncOfflineVerifications(deviceId: string): Promise<number> {
  // 1. Get all pending offline verifications
  const pendingResult = await query<{
    id: string;
    session_id: string;
    citizen_id: string;
    device_id: string;
    verification_status: string;
    composite_hash: string;
    timestamp: Date;
  }>(
    `SELECT * FROM offline_verification_log
     WHERE device_id = $1 AND sync_pending = true
     ORDER BY timestamp ASC`,
    [deviceId]
  );

  if (pendingResult.rows.length === 0) {
    return 0;
  }

  let syncedCount = 0;

  // 2. Sync each verification to VLT
  for (const record of pendingResult.rows) {
    try {
      // Create VLT transaction for offline verification
      const transactionHash = crypto
        .createHash('sha256')
        .update(`${record.session_id}:${record.composite_hash}:${record.timestamp.toISOString()}`)
        .digest('hex');

      await query(
        `INSERT INTO vlt_transactions
         (transaction_type, transaction_hash, citizen_id, amount, from_vault, to_vault, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          'OFFLINE_VERIFICATION',
          transactionHash,
          record.citizen_id,
          0,
          null,
          null,
          JSON.stringify({
            sessionId: record.session_id,
            deviceId: record.device_id,
            verificationStatus: record.verification_status,
            compositeHash: record.composite_hash,
            timestamp: record.timestamp.toISOString(),
            verifiedOffline: true,
          }),
        ]
      );

      // Mark as synced
      await query(
        `UPDATE offline_verification_log
         SET sync_pending = false, synced_at = NOW()
         WHERE id = $1`,
        [record.id]
      );

      syncedCount++;
    } catch (error) {
      console.error(`Failed to sync offline verification ${record.id}:`, error);
      // Continue with next record
    }
  }

  return syncedCount;
}


/**
 * PFF Backend — Architect's Final Genesis Verification (The Master Key)
 * Complete ceremony that binds the Architect to the PFF Protocol
 * Architect: Isreal Okoro (mrfundzman)
 *
 * Purpose:
 * - Execute 4-Layer Genesis Signature (Face, Finger, Heart, Voice)
 * - Generate GENESIS_AUTHORITY_HASH
 * - Store encrypted seal in hardware TPM
 * - Bind to Sentinel Business Block and Architect's Master Vault
 * - Set STASIS_READY = TRUE for Feb 7th unveiling
 * - Broadcast genesis completion
 */

import { pool, query } from '../db/client';
import * as crypto from 'crypto';
import {
  GENESIS_VERIFICATION_REQUIRED_SCORE,
  GENESIS_VERIFICATION_MIN_LIVENESS,
  GENESIS_VERIFICATION_COHESION_TIMEOUT_MS,
  TPM_STORAGE_CONFIG,
  GOVERNANCE_BINDING_CONFIG,
  GENESIS_COMPLETION_MESSAGE,
  GENESIS_COMPLETION_EVENT_TYPE,
} from '../../core/genesisVerification';
import { initiateSecureHandshake, HardwareSyncRequest } from './hardwareSync';

export interface GenesisHandshakePayload {
  sessionId: string;
  faceSignature: string;
  fingerSignature: string;
  heartSignature: string;
  voiceSignature: string;
  faceScore: number;
  fingerScore: number;
  heartScore: number;
  voiceScore: number;
  livenessScore: number;
  totalDuration: number;
  captureTimestamp: Date;
}

export interface GenesisVerificationResult {
  success: boolean;
  genesisAuthorityHash: string;
  tpmSealHash: string;
  governanceBindingHash: string;
  stasisReady: boolean;
  verificationScore: number;
  livenessScore: number;
  verificationTimestamp: Date;
  message: string;
  error?: string;
}

/**
 * Validate Genesis Handshake Scores
 * All 4 layers must score 100% (1.0)
 */
function validateGenesisScores(payload: GenesisHandshakePayload): boolean {
  return (
    payload.faceScore >= GENESIS_VERIFICATION_REQUIRED_SCORE &&
    payload.fingerScore >= GENESIS_VERIFICATION_REQUIRED_SCORE &&
    payload.heartScore >= GENESIS_VERIFICATION_REQUIRED_SCORE &&
    payload.voiceScore >= GENESIS_VERIFICATION_REQUIRED_SCORE &&
    payload.livenessScore >= GENESIS_VERIFICATION_MIN_LIVENESS &&
    payload.totalDuration <= GENESIS_VERIFICATION_COHESION_TIMEOUT_MS
  );
}

/**
 * Generate GENESIS_AUTHORITY_HASH
 * SHA-512 composite of all 4 biometric signatures
 */
function generateGenesisAuthorityHash(payload: GenesisHandshakePayload): string {
  const compositeData = `FACE::${payload.faceSignature}||FINGER::${payload.fingerSignature}||HEART::${payload.heartSignature}||VOICE::${payload.voiceSignature}`;
  
  return crypto
    .createHash('sha512')
    .update(compositeData)
    .digest('hex');
}

/**
 * Generate TPM Seal Hash
 * Simulates storing hash in hardware Secure Element
 * In production, this would use actual TPM/Secure Enclave APIs
 */
function generateTPMSealHash(genesisAuthorityHash: string, deviceUUID: string): string {
  const sealData = `TPM_SEAL::${genesisAuthorityHash}::${deviceUUID}::${TPM_STORAGE_CONFIG.storageLocation}`;
  
  return crypto
    .createHash('sha256')
    .update(sealData)
    .digest('hex');
}

/**
 * Generate Governance Binding Hash
 * Binds Genesis Signature to revenue vaults
 */
function generateGovernanceBindingHash(
  genesisAuthorityHash: string,
  architectPffId: string
): string {
  const bindingData = `GOVERNANCE::${genesisAuthorityHash}::${architectPffId}::SENTINEL_BUSINESS_BLOCK::ARCHITECT_MASTER_VAULT`;
  
  return crypto
    .createHash('sha256')
    .update(bindingData)
    .digest('hex');
}

/**
 * Execute Architect's Final Genesis Verification
 * The Master Key ceremony
 */
export async function executeGenesisVerification(
  laptopDeviceUUID: string,
  mobileDeviceUUID: string,
  laptopTPMAttestation: string,
  mobileSecureEnclaveAttestation: string,
  handshakePayload: GenesisHandshakePayload,
  architectPffId: string,
  architectCitizenId: string
): Promise<GenesisVerificationResult> {
  const verificationTimestamp = new Date();

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // ========================================================================
    // STEP 1: Hardware Sync — Verify ROOT_SOVEREIGN_PAIR
    // ========================================================================

    const syncRequest: HardwareSyncRequest = {
      laptopDeviceUUID,
      mobileDeviceUUID,
      laptopTPMAttestation,
      mobileSecureEnclaveAttestation,
      syncSessionId: handshakePayload.sessionId,
      timestamp: verificationTimestamp,
    };

    const syncResult = await initiateSecureHandshake(syncRequest);

    if (!syncResult.success || !syncResult.pairVerified) {
      await client.query('ROLLBACK');
      return {
        success: false,
        genesisAuthorityHash: '',
        tpmSealHash: '',
        governanceBindingHash: '',
        stasisReady: false,
        verificationScore: 0,
        livenessScore: handshakePayload.livenessScore,
        verificationTimestamp,
        message: 'HARDWARE_SYNC_FAILED',
        error: syncResult.error || 'ROOT_SOVEREIGN_PAIR verification failed',
      };
    }

    // ========================================================================
    // STEP 2: The 4-Layer Genesis Signature — Validate 100% Match
    // ========================================================================

    const scoresValid = validateGenesisScores(handshakePayload);

    if (!scoresValid) {
      await client.query('ROLLBACK');
      return {
        success: false,
        genesisAuthorityHash: '',
        tpmSealHash: '',
        governanceBindingHash: '',
        stasisReady: false,
        verificationScore: Math.min(
          handshakePayload.faceScore,
          handshakePayload.fingerScore,
          handshakePayload.heartScore,
          handshakePayload.voiceScore
        ),
        livenessScore: handshakePayload.livenessScore,
        verificationTimestamp,
        message: 'GENESIS_VERIFICATION_FAILED',
        error: '100% match required for all 4 layers',
      };
    }

    // Generate GENESIS_AUTHORITY_HASH
    const genesisAuthorityHash = generateGenesisAuthorityHash(handshakePayload);

    // ========================================================================
    // STEP 3: Encrypted Seal — Store in Hardware TPM
    // ========================================================================

    const tpmSealHash = generateTPMSealHash(genesisAuthorityHash, laptopDeviceUUID);

    // Store TPM seal metadata (actual TPM storage would be done via native APIs)
    await client.query(
      `INSERT INTO genesis_tpm_seals
       (genesis_authority_hash, device_uuid, tpm_seal_hash, storage_location,
        encryption_algorithm, export_allowed, backup_allowed, access_control,
        sealed_at, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        genesisAuthorityHash,
        laptopDeviceUUID,
        tpmSealHash,
        TPM_STORAGE_CONFIG.storageLocation,
        TPM_STORAGE_CONFIG.encryptionAlgorithm,
        TPM_STORAGE_CONFIG.exportAllowed,
        TPM_STORAGE_CONFIG.backupAllowed,
        TPM_STORAGE_CONFIG.accessControl,
        verificationTimestamp,
        JSON.stringify({
          mobileDeviceUUID,
          syncSessionId: handshakePayload.sessionId,
          keyDerivationFunction: TPM_STORAGE_CONFIG.keyDerivationFunction,
          keyDerivationIterations: TPM_STORAGE_CONFIG.keyDerivationIterations,
        }),
      ]
    );

    // ========================================================================
    // STEP 4: Governance Binding — Bind to Revenue Vaults
    // ========================================================================

    const governanceBindingHash = generateGovernanceBindingHash(
      genesisAuthorityHash,
      architectPffId
    );

    await client.query(
      `INSERT INTO genesis_governance_bindings
       (genesis_authority_hash, architect_pff_id, architect_citizen_id,
        governance_binding_hash, sentinel_business_block_binding,
        architect_master_vault_binding, revenue_oversight_access,
        emergency_override_access, sovereign_movement_validator,
        binding_timestamp, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        genesisAuthorityHash,
        architectPffId,
        architectCitizenId,
        governanceBindingHash,
        GOVERNANCE_BINDING_CONFIG.sentinelBusinessBlockBinding,
        GOVERNANCE_BINDING_CONFIG.architectMasterVaultBinding,
        GOVERNANCE_BINDING_CONFIG.revenueOversightAccess,
        GOVERNANCE_BINDING_CONFIG.emergencyOverrideAccess,
        GOVERNANCE_BINDING_CONFIG.sovereignMovementValidator,
        verificationTimestamp,
        JSON.stringify({
          syncSessionId: handshakePayload.sessionId,
          pairBindingHash: syncResult.pairBindingHash,
        }),
      ]
    );

    // ========================================================================
    // STEP 5: Stasis Release — Set STASIS_READY = TRUE
    // ========================================================================

    await client.query(
      `INSERT INTO stasis_release_status
       (genesis_authority_hash, architect_pff_id, stasis_ready,
        unveiling_date, genesis_verification_timestamp, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (architect_pff_id)
       DO UPDATE SET
         stasis_ready = EXCLUDED.stasis_ready,
         genesis_verification_timestamp = EXCLUDED.genesis_verification_timestamp,
         updated_at = NOW()`,
      [
        genesisAuthorityHash,
        architectPffId,
        true, // STASIS_READY = TRUE
        '2026-02-07T06:00:00.000Z',
        verificationTimestamp,
        JSON.stringify({
          verificationScore: 1.0,
          livenessScore: handshakePayload.livenessScore,
          syncSessionId: handshakePayload.sessionId,
        }),
      ]
    );

    // ========================================================================
    // STEP 6: Final Broadcast — Log Genesis Completion
    // ========================================================================

    const broadcastHash = crypto.randomBytes(32).toString('hex');

    // Log to VLT Transactions
    await client.query(
      `INSERT INTO vlt_transactions
       (transaction_type, transaction_hash, citizen_id, amount, from_vault, to_vault, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        GENESIS_COMPLETION_EVENT_TYPE,
        broadcastHash,
        architectCitizenId,
        0,
        'GENESIS_VERIFICATION',
        'ARCHITECT_AUTHORITY',
        JSON.stringify({
          message: GENESIS_COMPLETION_MESSAGE,
          genesisAuthorityHash,
          tpmSealHash,
          governanceBindingHash,
          stasisReady: true,
          verificationTimestamp: verificationTimestamp.toISOString(),
        }),
      ]
    );

    // Log to System Events
    await client.query(
      `INSERT INTO system_events
       (event_type, event_data, created_at)
       VALUES ($1, $2, $3)`,
      [
        GENESIS_COMPLETION_EVENT_TYPE,
        JSON.stringify({
          message: GENESIS_COMPLETION_MESSAGE,
          architectPffId,
          architectCitizenId,
          genesisAuthorityHash,
          tpmSealHash,
          governanceBindingHash,
          stasisReady: true,
          verificationScore: 1.0,
          livenessScore: handshakePayload.livenessScore,
          laptopDeviceUUID,
          mobileDeviceUUID,
          pairBindingHash: syncResult.pairBindingHash,
          verificationTimestamp: verificationTimestamp.toISOString(),
        }),
        verificationTimestamp,
      ]
    );

    await client.query('COMMIT');

    console.log(`\n${'='.repeat(80)}`);
    console.log(GENESIS_COMPLETION_MESSAGE);
    console.log(`${'='.repeat(80)}\n`);

    return {
      success: true,
      genesisAuthorityHash,
      tpmSealHash,
      governanceBindingHash,
      stasisReady: true,
      verificationScore: 1.0,
      livenessScore: handshakePayload.livenessScore,
      verificationTimestamp,
      message: GENESIS_COMPLETION_MESSAGE,
    };
  } catch (e) {
    await client.query('ROLLBACK');
    const err = e as Error;
    console.error('[GENESIS VERIFICATION] Failed:', err);

    return {
      success: false,
      genesisAuthorityHash: '',
      tpmSealHash: '',
      governanceBindingHash: '',
      stasisReady: false,
      verificationScore: 0,
      livenessScore: handshakePayload.livenessScore,
      verificationTimestamp,
      message: 'GENESIS_VERIFICATION_FAILED',
      error: err.message,
    };
  } finally {
    client.release();
  }
}

/**
 * Verify Genesis Authority Hash
 * Used for subsequent authentications
 */
export async function verifyGenesisAuthority(
  architectPffId: string,
  providedGenesisHash: string
): Promise<boolean> {
  const result = await query<{ genesis_authority_hash: string }>(
    `SELECT genesis_authority_hash
     FROM genesis_governance_bindings
     WHERE architect_pff_id = $1
     LIMIT 1`,
    [architectPffId]
  );

  if (result.rows.length === 0) {
    return false;
  }

  return result.rows[0].genesis_authority_hash === providedGenesisHash;
}

/**
 * Get Stasis Release Status
 * Check if STASIS_READY is TRUE
 */
export async function getStasisReleaseStatus(
  architectPffId: string
): Promise<{ stasisReady: boolean; unveilingDate: Date }> {
  const result = await query<{ stasis_ready: boolean; unveiling_date: Date }>(
    `SELECT stasis_ready, unveiling_date
     FROM stasis_release_status
     WHERE architect_pff_id = $1
     LIMIT 1`,
    [architectPffId]
  );

  if (result.rows.length === 0) {
    return {
      stasisReady: false,
      unveilingDate: new Date('2026-02-07T06:00:00.000Z'),
    };
  }

  return {
    stasisReady: result.rows[0].stasis_ready,
    unveilingDate: result.rows[0].unveiling_date,
  };
}


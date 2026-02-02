/**
 * PFF Backend — Emergency Stasis Protocol
 * High-Security Stasis for SOVRYN Revenue Flow if Root Pair is compromised
 * Architect: Isreal Okoro (mrfundzman)
 *
 * Purpose:
 * - Monitor Root Sovereign Pair integrity
 * - Detect unauthorized access attempts
 * - Trigger Emergency Stasis if pair is separated or accessed without Genesis Handshake
 * - Freeze all revenue flows until Architect re-verifies
 */

import { pool, query } from '../db/client';
import * as crypto from 'crypto';

export interface StasisTriggerReason {
  type: 'PAIR_SEPARATION' | 'UNAUTHORIZED_ACCESS' | 'GENESIS_HASH_MISMATCH' | 'MANUAL_TRIGGER';
  details: string;
  detectedAt: Date;
}

export interface StasisStatus {
  isActive: boolean;
  triggeredAt: Date | null;
  triggerReason: StasisTriggerReason | null;
  affectedSystems: string[];
  resolvedAt: Date | null;
  resolutionMethod: string | null;
}

export interface StasisActivationResult {
  success: boolean;
  stasisId: string;
  triggeredAt: Date;
  triggerReason: StasisTriggerReason;
  affectedSystems: string[];
  message: string;
  error?: string;
}

/**
 * Verify Root Sovereign Pair integrity
 * Checks if both devices are present and bound correctly
 */
export async function verifyRootPairIntegrity(
  laptopDeviceUUID: string,
  mobileDeviceUUID: string,
  pairBindingHash: string
): Promise<{ valid: boolean; reason?: string }> {
  try {
    const result = await query<{ pair_binding_hash: string }>(
      `SELECT pair_binding_hash 
       FROM root_sovereign_pair 
       WHERE laptop_device_uuid = $1 AND mobile_device_uuid = $2 AND pair_binding_hash = $3
       LIMIT 1`,
      [laptopDeviceUUID, mobileDeviceUUID, pairBindingHash]
    );

    if (result.rows.length === 0) {
      return { valid: false, reason: 'Root Sovereign Pair not found or binding hash mismatch' };
    }

    return { valid: true };
  } catch (e) {
    const err = e as Error;
    return { valid: false, reason: `Verification error: ${err.message}` };
  }
}

/**
 * Verify Genesis Authority Hash
 * Checks if the provided biometric signatures match the stored Genesis Hash
 */
export async function verifyGenesisAuthority(
  faceSignature: string,
  fingerSignature: string,
  heartSignature: string,
  voiceSignature: string
): Promise<{ valid: boolean; reason?: string }> {
  try {
    // Generate composite hash from provided signatures
    const compositeData = `FACE::${faceSignature}||FINGER::${fingerSignature}||HEART::${heartSignature}||VOICE::${voiceSignature}`;
    const providedHash = crypto
      .createHash('sha512')
      .update(compositeData)
      .digest('hex');

    const result = await query<{ composite_hash: string }>(
      `SELECT composite_hash 
       FROM genesis_authority_hash 
       WHERE composite_hash = $1
       LIMIT 1`,
      [providedHash]
    );

    if (result.rows.length === 0) {
      return { valid: false, reason: 'Genesis Authority Hash mismatch - biometric signatures do not match' };
    }

    return { valid: true };
  } catch (e) {
    const err = e as Error;
    return { valid: false, reason: `Verification error: ${err.message}` };
  }
}

/**
 * Trigger Emergency Stasis
 * Freezes all SOVRYN revenue flows until Architect re-verifies
 */
export async function triggerEmergencyStasis(
  nodeId: string,
  triggerReason: StasisTriggerReason
): Promise<StasisActivationResult> {
  const stasisId = crypto.randomBytes(16).toString('hex');
  const triggeredAt = new Date();

  const affectedSystems = [
    'SENTINEL_BUSINESS_BLOCK',
    'ARCHITECT_MASTER_VAULT',
    'GLOBAL_CITIZEN_BLOCK',
    'NATIONAL_ESCROW',
    'SOVRYN_REVENUE_FLOW',
    'MONTHLY_DIVIDEND_DISTRIBUTION',
    'ARCHITECT_SHIELD_EXECUTION',
  ];

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Update Alpha Node Status to STASIS
    await client.query(
      `UPDATE alpha_node_status 
       SET status = 'ALPHA_NODE_STASIS', 
           revenue_oversight_enabled = FALSE,
           sovereign_movement_validator_enabled = FALSE,
           updated_at = $1,
           metadata = jsonb_set(
             COALESCE(metadata, '{}'::jsonb),
             '{stasisTriggered}',
             to_jsonb($2::text)
           )
       WHERE node_id = $3`,
      [triggeredAt, triggeredAt.toISOString(), nodeId]
    );

    // 2. Log Emergency Stasis activation
    await client.query(
      `INSERT INTO emergency_stasis_log 
       (node_id, stasis_reason, stasis_triggered_at, metadata)
       VALUES ($1, $2, $3, $4)`,
      [
        nodeId,
        `${triggerReason.type}: ${triggerReason.details}`,
        triggeredAt,
        JSON.stringify({
          stasisId,
          triggerReason,
          affectedSystems,
          autoResolution: false,
        }),
      ]
    );

    // 3. Create stasis_active flag in system
    await client.query(`
      CREATE TABLE IF NOT EXISTS system_stasis_status (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        stasis_id TEXT NOT NULL UNIQUE,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        triggered_at TIMESTAMPTZ NOT NULL,
        trigger_reason JSONB NOT NULL,
        affected_systems JSONB NOT NULL,
        resolved_at TIMESTAMPTZ,
        resolution_method TEXT,
        metadata JSONB
      )
    `);

    await client.query(
      `INSERT INTO system_stasis_status 
       (stasis_id, is_active, triggered_at, trigger_reason, affected_systems)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        stasisId,
        true,
        triggeredAt,
        JSON.stringify(triggerReason),
        JSON.stringify(affectedSystems),
      ]
    );

    // 4. Log to VLT for transparency
    await client.query(
      `INSERT INTO vlt_transactions
       (transaction_type, transaction_hash, citizen_id, amount, from_vault, to_vault, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        'EMERGENCY_STASIS_TRIGGERED',
        stasisId,
        null,
        0,
        null,
        null,
        JSON.stringify({
          nodeId,
          triggerReason,
          affectedSystems,
          message: '⚠️ EMERGENCY STASIS ACTIVATED. ALL REVENUE FLOWS FROZEN. ARCHITECT RE-VERIFICATION REQUIRED.',
          timestamp: triggeredAt.toISOString(),
        }),
      ]
    );

    // 5. Log system event
    await client.query(
      `INSERT INTO system_events (event_type, event_data, created_at)
       VALUES ($1, $2, $3)`,
      [
        'EMERGENCY_STASIS_ACTIVATED',
        JSON.stringify({
          status: 'STASIS_ACTIVE',
          stasisId,
          nodeId,
          triggerReason,
          affectedSystems,
          message: '⚠️ EMERGENCY STASIS ACTIVATED. ALL REVENUE FLOWS FROZEN.',
        }),
        triggeredAt,
      ]
    );

    await client.query('COMMIT');

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('⚠️  EMERGENCY STASIS ACTIVATED');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`Stasis ID: ${stasisId}`);
    console.log(`Trigger Reason: ${triggerReason.type}`);
    console.log(`Details: ${triggerReason.details}`);
    console.log(`Affected Systems: ${affectedSystems.join(', ')}`);
    console.log('ALL REVENUE FLOWS FROZEN. ARCHITECT RE-VERIFICATION REQUIRED.');
    console.log('═══════════════════════════════════════════════════════════════');

    return {
      success: true,
      stasisId,
      triggeredAt,
      triggerReason,
      affectedSystems,
      message: '⚠️ EMERGENCY STASIS ACTIVATED. ALL REVENUE FLOWS FROZEN. ARCHITECT RE-VERIFICATION REQUIRED.',
    };
  } catch (e) {
    await client.query('ROLLBACK');
    const err = e as Error;
    console.error('[EMERGENCY STASIS] Failed to activate:', err);

    return {
      success: false,
      stasisId,
      triggeredAt,
      triggerReason,
      affectedSystems: [],
      message: 'EMERGENCY_STASIS_ACTIVATION_FAILED',
      error: err.message,
    };
  } finally {
    client.release();
  }
}

/**
 * Resolve Emergency Stasis
 * Requires Architect re-verification with Genesis Handshake
 */
export async function resolveEmergencyStasis(
  stasisId: string,
  nodeId: string,
  faceSignature: string,
  fingerSignature: string,
  heartSignature: string,
  voiceSignature: string,
  laptopDeviceUUID: string,
  mobileDeviceUUID: string,
  pairBindingHash: string
): Promise<{ success: boolean; message: string; error?: string }> {
  const resolvedAt = new Date();

  try {
    // 1. Verify Genesis Authority Hash
    const genesisVerification = await verifyGenesisAuthority(
      faceSignature,
      fingerSignature,
      heartSignature,
      voiceSignature
    );

    if (!genesisVerification.valid) {
      return {
        success: false,
        message: 'GENESIS_AUTHORITY_VERIFICATION_FAILED',
        error: genesisVerification.reason,
      };
    }

    // 2. Verify Root Sovereign Pair integrity
    const pairVerification = await verifyRootPairIntegrity(
      laptopDeviceUUID,
      mobileDeviceUUID,
      pairBindingHash
    );

    if (!pairVerification.valid) {
      return {
        success: false,
        message: 'ROOT_PAIR_VERIFICATION_FAILED',
        error: pairVerification.reason,
      };
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 3. Update Alpha Node Status to ACTIVE
      await client.query(
        `UPDATE alpha_node_status
         SET status = 'ALPHA_NODE_ACTIVE',
             revenue_oversight_enabled = TRUE,
             sovereign_movement_validator_enabled = TRUE,
             last_verification_timestamp = $1,
             updated_at = $1,
             metadata = jsonb_set(
               COALESCE(metadata, '{}'::jsonb),
               '{stasisResolved}',
               to_jsonb($2::text)
             )
         WHERE node_id = $3`,
        [resolvedAt, resolvedAt.toISOString(), nodeId]
      );

      // 4. Update Emergency Stasis Log
      await client.query(
        `UPDATE emergency_stasis_log
         SET stasis_resolved_at = $1,
             resolution_method = 'ARCHITECT_RE_VERIFICATION',
             metadata = jsonb_set(
               COALESCE(metadata, '{}'::jsonb),
               '{resolvedAt}',
               to_jsonb($2::text)
             )
         WHERE node_id = $3 AND stasis_resolved_at IS NULL`,
        [resolvedAt, resolvedAt.toISOString(), nodeId]
      );

      // 5. Update System Stasis Status
      await client.query(
        `UPDATE system_stasis_status
         SET is_active = FALSE,
             resolved_at = $1,
             resolution_method = 'ARCHITECT_RE_VERIFICATION'
         WHERE stasis_id = $2`,
        [resolvedAt, stasisId]
      );

      // 6. Log to VLT for transparency
      await client.query(
        `INSERT INTO vlt_transactions
         (transaction_type, transaction_hash, citizen_id, amount, from_vault, to_vault, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          'EMERGENCY_STASIS_RESOLVED',
          stasisId,
          null,
          0,
          null,
          null,
          JSON.stringify({
            nodeId,
            stasisId,
            resolutionMethod: 'ARCHITECT_RE_VERIFICATION',
            message: '✅ EMERGENCY STASIS RESOLVED. REVENUE FLOWS RESTORED. THE ARCHITECT HAS RE-VERIFIED.',
            timestamp: resolvedAt.toISOString(),
          }),
        ]
      );

      // 7. Log system event
      await client.query(
        `INSERT INTO system_events (event_type, event_data, created_at)
         VALUES ($1, $2, $3)`,
        [
          'EMERGENCY_STASIS_RESOLVED',
          JSON.stringify({
            status: 'STASIS_RESOLVED',
            stasisId,
            nodeId,
            resolutionMethod: 'ARCHITECT_RE_VERIFICATION',
            message: '✅ EMERGENCY STASIS RESOLVED. REVENUE FLOWS RESTORED.',
          }),
          resolvedAt,
        ]
      );

      await client.query('COMMIT');

      console.log('═══════════════════════════════════════════════════════════════');
      console.log('✅  EMERGENCY STASIS RESOLVED');
      console.log('═══════════════════════════════════════════════════════════════');
      console.log(`Stasis ID: ${stasisId}`);
      console.log(`Resolution Method: ARCHITECT_RE_VERIFICATION`);
      console.log(`Resolved At: ${resolvedAt.toISOString()}`);
      console.log('REVENUE FLOWS RESTORED. THE ARCHITECT HAS RE-VERIFIED.');
      console.log('═══════════════════════════════════════════════════════════════');

      return {
        success: true,
        message: '✅ EMERGENCY STASIS RESOLVED. REVENUE FLOWS RESTORED. THE ARCHITECT HAS RE-VERIFIED.',
      };
    } catch (e) {
      await client.query('ROLLBACK');
      const err = e as Error;
      return {
        success: false,
        message: 'STASIS_RESOLUTION_FAILED',
        error: err.message,
      };
    } finally {
      client.release();
    }
  } catch (e) {
    const err = e as Error;
    return {
      success: false,
      message: 'STASIS_RESOLUTION_FAILED',
      error: err.message,
    };
  }
}

/**
 * Check if Emergency Stasis is currently active
 */
export async function isStasisActive(): Promise<boolean> {
  try {
    const result = await query<{ is_active: boolean }>(
      `SELECT is_active
       FROM system_stasis_status
       WHERE is_active = TRUE
       LIMIT 1`
    );

    return result.rows.length > 0 && result.rows[0].is_active;
  } catch (e) {
    console.error('[EMERGENCY STASIS] Failed to check stasis status:', e);
    return false;
  }
}

/**
 * Get current Stasis Status
 */
export async function getStasisStatus(): Promise<StasisStatus> {
  try {
    const result = await query<{
      is_active: boolean;
      triggered_at: Date;
      trigger_reason: any;
      affected_systems: any;
      resolved_at: Date | null;
      resolution_method: string | null;
    }>(
      `SELECT is_active, triggered_at, trigger_reason, affected_systems, resolved_at, resolution_method
       FROM system_stasis_status
       ORDER BY triggered_at DESC
       LIMIT 1`
    );

    if (result.rows.length === 0) {
      return {
        isActive: false,
        triggeredAt: null,
        triggerReason: null,
        affectedSystems: [],
        resolvedAt: null,
        resolutionMethod: null,
      };
    }

    const row = result.rows[0];

    return {
      isActive: row.is_active,
      triggeredAt: row.triggered_at,
      triggerReason: row.trigger_reason,
      affectedSystems: row.affected_systems,
      resolvedAt: row.resolved_at,
      resolutionMethod: row.resolution_method,
    };
  } catch (e) {
    console.error('[EMERGENCY STASIS] Failed to get stasis status:', e);
    return {
      isActive: false,
      triggeredAt: null,
      triggerReason: null,
      affectedSystems: [],
      resolvedAt: null,
      resolutionMethod: null,
    };
  }
}


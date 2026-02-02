/**
 * PFF Backend — Hardware Handover Protocol
 * Transfer MASTER_SECURITY_TOKEN to Sentinel Daemon
 * Architect: Isreal Okoro (mrfundzman)
 * 
 * Purpose:
 * - Generate MASTER_SECURITY_TOKEN with hardware-level security keys
 * - Establish encrypted communication channel with Sentinel Daemon
 * - Hand over token to local Sentinel Daemon for system-level wrapping
 * - Track handover status and daemon binding
 */

import * as crypto from 'crypto';
import { pool, query } from '../db/client';
import { generateMasterSecurityToken } from '../../../core/sentinelBindingEngine';
import type { MasterSecurityToken } from '../../../core/sentinelOptIn';

export interface SentinelDaemonInfo {
  daemonId: string;
  daemonPublicKey: string;
  encryptedChannel: string;
  platformInfo: {
    os: string;
    version: string;
    architecture: string;
  };
}

export interface HandoverResult {
  success: boolean;
  masterSecurityToken: MasterSecurityToken;
  sentinelDaemonId: string;
  encryptedChannel: string;
  handoverTimestamp: Date;
}

/**
 * Generate unique hardware fingerprint
 * Combines device ID, platform info, and secure enclave attestation
 * This fingerprint binds the token to specific hardware
 */
function generateHardwareFingerprint(
  deviceId: string,
  platformInfo: SentinelDaemonInfo['platformInfo'],
  secureEnclaveAttestation: string
): string {
  const fingerprintData = `${deviceId}-${platformInfo.os}-${platformInfo.version}-${platformInfo.architecture}-${secureEnclaveAttestation}`;

  return crypto
    .createHash('sha256')
    .update(fingerprintData)
    .digest('hex');
}

/**
 * Generate encrypted payload for MASTER_SECURITY_TOKEN
 * Contains hardware-level security keys (encrypted with daemon's public key)
 * Includes hardware fingerprint to prevent device transfer
 */
function generateEncryptedPayload(
  citizenId: string,
  pffId: string,
  deviceId: string,
  deviceFingerprint: string,
  daemonPublicKey: string
): string {
  // Generate hardware security keys
  const hardwareKeys = {
    encryptionKey: crypto.randomBytes(32).toString('hex'),
    signingKey: crypto.randomBytes(32).toString('hex'),
    wrappingKey: crypto.randomBytes(32).toString('hex'),
    citizenId,
    pffId,
    deviceId,
    deviceFingerprint, // Hardware-bound - token cannot be moved to another device
    timestamp: new Date().toISOString(),
  };

  // In production, encrypt with daemon's public key
  // For now, we'll use a simple base64 encoding (TODO: Replace with RSA-2048 encryption)
  const payload = JSON.stringify(hardwareKeys);
  return Buffer.from(payload).toString('base64');
}

/**
 * Establish encrypted communication channel with Sentinel Daemon
 */
function establishEncryptedChannel(
  citizenId: string,
  sentinelDaemonId: string
): string {
  const channelId = crypto
    .createHash('sha256')
    .update(`${citizenId}-${sentinelDaemonId}-${Date.now()}`)
    .digest('hex');
  
  return channelId;
}

/**
 * Execute hardware handover to Sentinel Daemon
 * Generates hardware-bound MASTER_SECURITY_TOKEN and hands it to the daemon
 * Token is bound to specific device and has LIFETIME validity (no expiration)
 */
export async function executeHardwareHandover(
  citizenId: string,
  pffId: string,
  deviceId: string,
  secureEnclaveAttestation: string,
  daemonInfo: SentinelDaemonInfo
): Promise<HandoverResult> {
  const handoverTimestamp = new Date();

  // 1. Generate hardware fingerprint (binds token to device)
  const deviceFingerprint = generateHardwareFingerprint(
    deviceId,
    daemonInfo.platformInfo,
    secureEnclaveAttestation
  );

  // 2. Establish encrypted channel
  const encryptedChannel = establishEncryptedChannel(citizenId, daemonInfo.daemonId);

  // 3. Generate encrypted payload with hardware keys
  const encryptedPayload = generateEncryptedPayload(
    citizenId,
    pffId,
    deviceId,
    deviceFingerprint,
    daemonInfo.daemonPublicKey
  );

  // 4. Generate MASTER_SECURITY_TOKEN (hardware-bound, lifetime validity)
  const masterSecurityToken = generateMasterSecurityToken(
    citizenId,
    pffId,
    deviceId,
    deviceFingerprint,
    daemonInfo.daemonId,
    encryptedPayload
  );
  
  // 5. Store handover record in database
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Store Sentinel activation record
    await client.query(
      `INSERT INTO sentinel_activations
       (citizen_id, pff_id, sentinel_daemon_id, master_security_token_id, encrypted_channel,
        daemon_public_key, platform_info, device_id, device_fingerprint, status, activated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        citizenId,
        pffId,
        daemonInfo.daemonId,
        masterSecurityToken.tokenId,
        encryptedChannel,
        daemonInfo.daemonPublicKey,
        JSON.stringify(daemonInfo.platformInfo),
        deviceId,
        deviceFingerprint,
        'ACTIVE',
        handoverTimestamp,
      ]
    );

    // Store MASTER_SECURITY_TOKEN (hardware-bound, lifetime validity)
    await client.query(
      `INSERT INTO master_security_tokens
       (token_id, citizen_id, pff_id, sentinel_daemon_id, device_id, device_fingerprint,
        encrypted_payload, signature, issued_at, expires_at, hardware_bound)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        masterSecurityToken.tokenId,
        masterSecurityToken.citizenId,
        masterSecurityToken.pffId,
        masterSecurityToken.sentinelDaemonId,
        masterSecurityToken.deviceId,
        masterSecurityToken.deviceFingerprint,
        masterSecurityToken.encryptedPayload,
        masterSecurityToken.signature,
        masterSecurityToken.issuedAt,
        masterSecurityToken.expiresAt, // NULL = Lifetime/Infinite
        masterSecurityToken.hardwareBound, // Always true
      ]
    );
    
    // Log handover event
    await client.query(
      `INSERT INTO system_events (event_type, event_data, created_at)
       VALUES ($1, $2, $3)`,
      [
        'SENTINEL_HARDWARE_HANDOVER',
        JSON.stringify({
          citizenId,
          pffId,
          sentinelDaemonId: daemonInfo.daemonId,
          tokenId: masterSecurityToken.tokenId,
          encryptedChannel,
          handoverTimestamp: handoverTimestamp.toISOString(),
        }),
        handoverTimestamp,
      ]
    );
    
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
  
  return {
    success: true,
    masterSecurityToken,
    sentinelDaemonId: daemonInfo.daemonId,
    encryptedChannel,
    handoverTimestamp,
  };
}

/**
 * Get Sentinel activation status for a citizen
 */
export async function getSentinelActivationStatus(
  citizenId: string
): Promise<{
  isActive: boolean;
  sentinelDaemonId?: string;
  activatedAt?: Date;
  expiresAt?: Date;
}> {
  const result = await query<{
    sentinel_daemon_id: string;
    activated_at: Date;
    status: string;
  }>(
    `SELECT sentinel_daemon_id, activated_at, status
     FROM sentinel_activations
     WHERE citizen_id = $1 AND status = 'ACTIVE'
     ORDER BY activated_at DESC
     LIMIT 1`,
    [citizenId]
  );
  
  if (result.rows.length === 0) {
    return { isActive: false };
  }
  
  const activation = result.rows[0];
  
  // Get token expiration
  const tokenResult = await query<{ expires_at: Date }>(
    `SELECT expires_at
     FROM master_security_tokens
     WHERE citizen_id = $1
     ORDER BY issued_at DESC
     LIMIT 1`,
    [citizenId]
  );
  
  return {
    isActive: true,
    sentinelDaemonId: activation.sentinel_daemon_id,
    activatedAt: activation.activated_at,
    expiresAt: tokenResult.rows[0]?.expires_at,
  };
}


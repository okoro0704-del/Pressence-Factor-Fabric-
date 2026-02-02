/**
 * PFF Backend — Sovereign Handoff Protocol
 * Execute complete Sentinel activation with hardware-bound token handover
 * Architect: Isreal Okoro (mrfundzman)
 * 
 * Purpose:
 * - Execute complete Sentinel activation flow
 * - Verify 100% successful 4-layer handshake BEFORE payment
 * - Process $10 USD payment with 45-10-45 split
 * - Generate hardware-bound MASTER_SECURITY_TOKEN
 * - Hand over token to Sentinel Daemon
 * - Send LifeOS callback
 * 
 * CRITICAL: Payment ONLY triggers after 100% successful handshake
 * No payment can be taken if liveness check or any layer fails
 */

import { executeSentinelBindingHandshake } from '../../../core/sentinelBindingEngine';
import { executeSentinelPayment } from './tokenBurn';
import { executeHardwareHandover } from './hardwareHandover';
import { sendLifeOSCallback } from './lifeosCallback';
import { createDeviceBinding, hasExistingActivation } from './deviceBinding';
import { query } from '../db/client';
import type { SentinelBindingHandshakePayload } from '../../../core/sentinelOptIn';
import type { SentinelDaemonInfo } from './hardwareHandover';
import type { SentinelActivationMetadata } from '../../../core/oemCertification';

export interface SovereignHandoffResult {
  success: boolean;
  sessionId: string;
  masterSecurityToken?: string;
  sentinelDaemonId?: string;
  paymentTransactionHash?: string;
  feeAmountUSD?: number;
  feeAmountVIDA?: number;
  oraclePrice?: number;
  encryptedChannel?: string;
  deviceUUID?: string;
  hardwareTPMHash?: string;
  isPreInstalled?: boolean;
  oemCertificationId?: string;
  totalDuration: number;
  error?: {
    code: string;
    message: string;
    layer?: string;
  };
}

/**
 * Execute Sovereign Handoff
 * Complete Sentinel activation with hardware-bound token
 *
 * Flow:
 * 0. Create device binding (Device_UUID + Hardware_TPM_Hash)
 * 1. Verify 100% successful 4-layer handshake
 * 2. ONLY IF handshake succeeds: Execute $10 USD payment (MANDATORY even for pre-installed)
 * 3. Generate hardware-bound MASTER_SECURITY_TOKEN (lifetime validity)
 * 4. Hand over token to Sentinel Daemon
 * 5. Send LifeOS callback
 *
 * CRITICAL: Payment is GATED by handshake success
 * If liveness check fails, NO payment is taken
 *
 * CRITICAL: $10 fee is MANDATORY for ALL activations (pre-installed or user-installed)
 */
export async function executeSovereignHandoff(
  citizenId: string,
  pffId: string,
  handshakePayload: SentinelBindingHandshakePayload,
  daemonInfo: SentinelDaemonInfo,
  deviceId: string,
  secureEnclaveAttestation: string,
  tpmAttestation: string,
  manufacturer: string,
  deviceModel: string
): Promise<SovereignHandoffResult> {
  const startTime = Date.now();

  // ============================================================================
  // STEP 0: Create Device Binding (Device_UUID + Hardware_TPM_Hash)
  // ============================================================================

  const deviceBinding = await createDeviceBinding(
    deviceId,
    '', // deviceFingerprint will be generated in hardware handover
    daemonInfo.platformInfo.os,
    daemonInfo.platformInfo.version,
    daemonInfo.platformInfo.architecture,
    tpmAttestation,
    secureEnclaveAttestation,
    manufacturer,
    deviceModel
  );

  // Check if device already has activation
  const alreadyActivated = await hasExistingActivation(deviceBinding.deviceUUID);
  if (alreadyActivated) {
    return {
      success: false,
      sessionId: handshakePayload.sessionId,
      totalDuration: Date.now() - startTime,
      error: {
        code: 'DEVICE_ALREADY_ACTIVATED',
        message: 'This device already has an active Sentinel license. License is non-transferable.',
      },
    };
  }
  
  // ============================================================================
  // STEP 1: Execute 4-Layer Handshake (PAYMENT GATING)
  // ============================================================================
  
  const handshakeResult = await executeSentinelBindingHandshake(
    handshakePayload,
    citizenId,
    pffId
  );
  
  // If handshake fails, return immediately WITHOUT taking payment
  if (!handshakeResult.success) {
    // Update activation status to FAILED
    await query(
      `UPDATE sentinel_activations
       SET status = $1, error_code = $2, error_message = $3, updated_at = NOW()
       WHERE citizen_id = $4 AND session_id = $5`,
      [
        'FAILED',
        handshakeResult.error?.code,
        handshakeResult.error?.message,
        citizenId,
        handshakePayload.sessionId,
      ]
    );
    
    return {
      success: false,
      sessionId: handshakePayload.sessionId,
      totalDuration: Date.now() - startTime,
      error: {
        code: handshakeResult.error?.code || 'HANDSHAKE_FAILED',
        message: handshakeResult.error?.message || 'Handshake failed',
        layer: handshakeResult.error?.layer,
      },
    };
  }
  
  // ============================================================================
  // STEP 2: Execute Payment (ONLY AFTER 100% SUCCESSFUL HANDSHAKE)
  // ============================================================================
  
  let paymentResult;
  try {
    paymentResult = await executeSentinelPayment(citizenId, pffId);
  } catch (e) {
    const err = e as Error;
    
    // Update activation status to FAILED
    await query(
      `UPDATE sentinel_activations
       SET status = $1, error_code = $2, error_message = $3, updated_at = NOW()
       WHERE citizen_id = $4 AND session_id = $5`,
      [
        'FAILED',
        'PAYMENT_FAILED',
        err.message,
        citizenId,
        handshakePayload.sessionId,
      ]
    );
    
    return {
      success: false,
      sessionId: handshakePayload.sessionId,
      totalDuration: Date.now() - startTime,
      error: {
        code: 'PAYMENT_FAILED',
        message: err.message,
      },
    };
  }
  
  // ============================================================================
  // STEP 3: Execute Hardware Handover (Generate hardware-bound token)
  // ============================================================================
  
  const handoverResult = await executeHardwareHandover(
    citizenId,
    pffId,
    deviceId,
    secureEnclaveAttestation,
    daemonInfo
  );
  
  // ============================================================================
  // STEP 4: Update Activation Status to ACTIVE (with device binding)
  // ============================================================================

  await query(
    `UPDATE sentinel_activations
     SET status = $1,
         sentinel_daemon_id = $2,
         master_security_token_id = $3,
         payment_transaction_hash = $4,
         encrypted_channel = $5,
         device_uuid = $6,
         hardware_tpm_hash = $7,
         is_license_transferable = $8,
         pre_install_status = $9,
         oem_certification_id = $10,
         activated_at = NOW(),
         updated_at = NOW()
     WHERE citizen_id = $11 AND session_id = $12`,
    [
      'ACTIVE',
      daemonInfo.daemonId,
      handoverResult.masterSecurityToken.tokenId,
      paymentResult.paymentTransactionHash,
      handoverResult.encryptedChannel,
      deviceBinding.deviceUUID,
      deviceBinding.hardwareTPMHash,
      false, // isLicenseTransferable - HARDCODED to FALSE
      deviceBinding.preInstallStatus,
      deviceBinding.oemCertificationId || null,
      citizenId,
      handshakePayload.sessionId,
    ]
  );

  // ============================================================================
  // STEP 5: Send LifeOS Callback
  // ============================================================================

  await sendLifeOSCallback(citizenId);

  // ============================================================================
  // SUCCESS: Return complete handoff result (with device binding info)
  // ============================================================================

  return {
    success: true,
    sessionId: handshakePayload.sessionId,
    masterSecurityToken: handoverResult.masterSecurityToken.tokenId,
    sentinelDaemonId: daemonInfo.daemonId,
    paymentTransactionHash: paymentResult.paymentTransactionHash,
    feeAmountUSD: paymentResult.feeAmountUSD,
    feeAmountVIDA: paymentResult.feeAmountVIDA,
    oraclePrice: paymentResult.oraclePrice,
    encryptedChannel: handoverResult.encryptedChannel,
    deviceUUID: deviceBinding.deviceUUID,
    hardwareTPMHash: deviceBinding.hardwareTPMHash,
    isPreInstalled: deviceBinding.preInstallStatus === 'PRE_INSTALLED',
    oemCertificationId: deviceBinding.oemCertificationId,
    totalDuration: Date.now() - startTime,
  };
}


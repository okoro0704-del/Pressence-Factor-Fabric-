/**
 * PFF Core — Sentinel Binding Handshake Engine
 * Specialized 4-Layer Handshake for Sentinel Activation
 * Architect: Isreal Okoro (mrfundzman)
 * 
 * Purpose:
 * - Execute 4-layer handshake for Sentinel binding
 * - Verify each layer sequentially with timeout enforcement
 * - Generate MASTER_SECURITY_TOKEN on success
 * - Coordinate with Sentinel Daemon for system-level wrapping
 */

import * as crypto from 'crypto';
import type {
  SentinelBindingHandshakePayload,
  SentinelBindingResult,
  SentinelBindingError,
  SentinelBindingLayer1,
  SentinelBindingLayer2,
  SentinelBindingLayer3,
  SentinelBindingLayer4,
  MasterSecurityToken,
  SENTINEL_BINDING_TIMEOUT_MS,
  MASTER_SECURITY_TOKEN_VALIDITY_MS,
} from './sentinelOptIn';

// ============================================================================
// LAYER VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate Layer 1: Identity Verification
 * Verify PFF identity and presence proof
 */
export async function validateLayer1(
  layer1: SentinelBindingLayer1,
  expectedCitizenId: string,
  expectedPffId: string
): Promise<{ valid: boolean; error?: string }> {
  // Verify citizen ID and PFF ID match
  if (layer1.citizenId !== expectedCitizenId) {
    return { valid: false, error: 'Citizen ID mismatch' };
  }
  
  if (layer1.pffId !== expectedPffId) {
    return { valid: false, error: 'PFF ID mismatch' };
  }
  
  // Verify presence proof exists (actual verification done by backend)
  if (!layer1.presenceProof || layer1.presenceProof.length === 0) {
    return { valid: false, error: 'Missing presence proof' };
  }
  
  // Verify timestamp is recent (within 30 seconds)
  const now = Date.now();
  if (Math.abs(now - layer1.timestamp) > 30000) {
    return { valid: false, error: 'Layer 1 timestamp too old' };
  }
  
  return { valid: true };
}

/**
 * Validate Layer 2: Payment Verification
 * Verify $10 USD payment (converted to VIDA) on SOVRYN Chain
 */
export async function validateLayer2(
  layer2: SentinelBindingLayer2
): Promise<{ valid: boolean; error?: string }> {
  // Verify fee amount is exactly $10 USD
  const EXPECTED_FEE_USD = 10.0;
  if (Math.abs(layer2.feeAmountUSD - EXPECTED_FEE_USD) > 0.01) {
    return { valid: false, error: 'Invalid fee amount (must be $10 USD)' };
  }

  // Verify VIDA amount is positive (actual amount verified by backend using oracle)
  if (layer2.feeAmountVIDA <= 0) {
    return { valid: false, error: 'Invalid VIDA amount' };
  }

  // Verify oracle price is positive
  if (layer2.oraclePrice <= 0) {
    return { valid: false, error: 'Invalid oracle price' };
  }

  // Verify SOVRYN chain ID (30 for RSK mainnet)
  if (layer2.sovrynChainId !== 30) {
    return { valid: false, error: 'Invalid chain ID (must be RSK mainnet)' };
  }

  // Verify transaction hash exists (actual blockchain verification done by backend)
  if (!layer2.paymentTransactionHash || layer2.paymentTransactionHash.length === 0) {
    return { valid: false, error: 'Missing payment transaction hash' };
  }

  // Verify timestamp
  const now = Date.now();
  if (Math.abs(now - layer2.timestamp) > 60000) {
    return { valid: false, error: 'Layer 2 timestamp too old' };
  }

  return { valid: true };
}

/**
 * Validate Layer 3: Hardware Attestation
 * Verify device has secure enclave and platform attestation
 */
export async function validateLayer3(
  layer3: SentinelBindingLayer3
): Promise<{ valid: boolean; error?: string }> {
  // Verify secure enclave is confirmed
  if (!layer3.secureEnclaveConfirmed) {
    return { valid: false, error: 'Secure enclave not confirmed' };
  }
  
  // Verify device ID exists
  if (!layer3.deviceId || layer3.deviceId.length === 0) {
    return { valid: false, error: 'Missing device ID' };
  }
  
  // Verify platform attestation exists (actual verification done by backend)
  if (!layer3.platformAttestation || layer3.platformAttestation.length === 0) {
    return { valid: false, error: 'Missing platform attestation' };
  }
  
  // Verify timestamp
  const now = Date.now();
  if (Math.abs(now - layer3.timestamp) > 60000) {
    return { valid: false, error: 'Layer 3 timestamp too old' };
  }
  
  return { valid: true };
}

/**
 * Validate Layer 4: Daemon Handshake
 * Verify Sentinel Daemon connection and encrypted channel
 */
export async function validateLayer4(
  layer4: SentinelBindingLayer4
): Promise<{ valid: boolean; error?: string }> {
  // Verify Sentinel Daemon ID exists
  if (!layer4.sentinelDaemonId || layer4.sentinelDaemonId.length === 0) {
    return { valid: false, error: 'Missing Sentinel Daemon ID' };
  }
  
  // Verify daemon public key exists
  if (!layer4.daemonPublicKey || layer4.daemonPublicKey.length === 0) {
    return { valid: false, error: 'Missing daemon public key' };
  }
  
  // Verify encrypted channel exists
  if (!layer4.encryptedChannel || layer4.encryptedChannel.length === 0) {
    return { valid: false, error: 'Missing encrypted channel' };
  }
  
  // Verify timestamp
  const now = Date.now();
  if (Math.abs(now - layer4.timestamp) > 60000) {
    return { valid: false, error: 'Layer 4 timestamp too old' };
  }
  
  return { valid: true };
}

// ============================================================================
// MASTER SECURITY TOKEN GENERATION
// ============================================================================

/**
 * Generate MASTER_SECURITY_TOKEN for Sentinel Daemon
 * This token contains hardware-level security keys and is handed to the daemon
 * Hardware-bound: Token cannot be moved to another device
 * Lifetime validity: No expiration (expiresAt = NULL)
 */
export function generateMasterSecurityToken(
  citizenId: string,
  pffId: string,
  deviceId: string,
  deviceFingerprint: string,
  sentinelDaemonId: string,
  encryptedPayload: string
): MasterSecurityToken {
  const tokenId = crypto.randomBytes(32).toString('hex');
  const issuedAt = new Date();
  const expiresAt = null; // NULL = Lifetime/Infinite (No expiration)
  const hardwareBound = true; // Always true - token cannot be moved to another device

  // Create signature for token
  const dataToSign = JSON.stringify({
    tokenId,
    citizenId,
    pffId,
    deviceId,
    deviceFingerprint,
    sentinelDaemonId,
    issuedAt: issuedAt.toISOString(),
    expiresAt: null, // Lifetime
    hardwareBound,
  });

  const signature = crypto
    .createHash('sha256')
    .update(dataToSign)
    .digest('hex');

  return {
    tokenId,
    citizenId,
    pffId,
    sentinelDaemonId,
    deviceId,
    deviceFingerprint,
    issuedAt,
    expiresAt, // NULL = Lifetime
    encryptedPayload,
    signature,
    hardwareBound,
  };
}

// ============================================================================
// SENTINEL BINDING HANDSHAKE EXECUTION
// ============================================================================

/**
 * Execute Sentinel Binding Handshake
 * Validates all 4 layers sequentially and generates MASTER_SECURITY_TOKEN on success
 */
export async function executeSentinelBindingHandshake(
  payload: SentinelBindingHandshakePayload,
  expectedCitizenId: string,
  expectedPffId: string
): Promise<SentinelBindingResult> {
  const startTime = Date.now();

  try {
    // Validate Layer 1: Identity Verification
    const layer1Result = await validateLayer1(
      payload.layer1,
      expectedCitizenId,
      expectedPffId
    );

    if (!layer1Result.valid) {
      return {
        success: false,
        sessionId: payload.sessionId,
        error: {
          code: 'IDENTITY_VERIFICATION_FAILED',
          message: layer1Result.error || 'Identity verification failed',
          layer: 'LAYER_1',
          timestamp: Date.now(),
        },
        totalDuration: Date.now() - startTime,
      };
    }

    // Validate Layer 2: Token Burn Verification
    const layer2Result = await validateLayer2(payload.layer2);

    if (!layer2Result.valid) {
      return {
        success: false,
        sessionId: payload.sessionId,
        error: {
          code: 'TOKEN_BURN_FAILED',
          message: layer2Result.error || 'Token burn verification failed',
          layer: 'LAYER_2',
          timestamp: Date.now(),
        },
        totalDuration: Date.now() - startTime,
      };
    }

    // Validate Layer 3: Hardware Attestation
    const layer3Result = await validateLayer3(payload.layer3);

    if (!layer3Result.valid) {
      return {
        success: false,
        sessionId: payload.sessionId,
        error: {
          code: 'HARDWARE_ATTESTATION_FAILED',
          message: layer3Result.error || 'Hardware attestation failed',
          layer: 'LAYER_3',
          timestamp: Date.now(),
        },
        totalDuration: Date.now() - startTime,
      };
    }

    // Validate Layer 4: Daemon Handshake
    const layer4Result = await validateLayer4(payload.layer4);

    if (!layer4Result.valid) {
      return {
        success: false,
        sessionId: payload.sessionId,
        error: {
          code: 'DAEMON_HANDSHAKE_FAILED',
          message: layer4Result.error || 'Daemon handshake failed',
          layer: 'LAYER_4',
          timestamp: Date.now(),
        },
        totalDuration: Date.now() - startTime,
      };
    }

    // Check total duration (2 second timeout)
    const totalDuration = Date.now() - startTime;
    if (totalDuration > 2000) {
      return {
        success: false,
        sessionId: payload.sessionId,
        error: {
          code: 'BINDING_TIMEOUT',
          message: `Binding handshake exceeded 2s timeout (${totalDuration}ms)`,
          layer: 'COHESION',
          timestamp: Date.now(),
        },
        totalDuration,
      };
    }

    // SUCCESS: Generate MASTER_SECURITY_TOKEN
    const masterSecurityToken = generateMasterSecurityToken(
      expectedCitizenId,
      expectedPffId,
      payload.layer4.sentinelDaemonId,
      payload.layer4.encryptedChannel // Use encrypted channel as payload
    );

    return {
      success: true,
      sessionId: payload.sessionId,
      masterSecurityToken: masterSecurityToken.tokenId,
      sentinelDaemonId: payload.layer4.sentinelDaemonId,
      totalDuration,
    };
  } catch (e) {
    const err = e as Error;
    return {
      success: false,
      sessionId: payload.sessionId,
      error: {
        code: 'DAEMON_HANDSHAKE_FAILED',
        message: err.message,
        layer: 'EXECUTION',
        timestamp: Date.now(),
      },
      totalDuration: Date.now() - startTime,
    };
  }
}


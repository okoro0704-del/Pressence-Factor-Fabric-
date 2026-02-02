/**
 * PFF Core — Sentinel Opt-In Feature Logic
 * Sovereign Decision Engine: SENTINEL_DEPLOYMENT_REQUISITION
 * Architect: Isreal Okoro (mrfundzman)
 * 
 * Purpose:
 * - Create logic gate that remains CLOSED until manual request from verified PFF identity
 * - Trigger specialized 4-layer handshake for Sentinel Binding
 * - Execute 0.1 ngVIDA token burn on SOVRYN Chain
 * - Hand over MASTER_SECURITY_TOKEN to Sentinel Daemon
 * - Provide encrypted callback to LifeOS for Security Status badge
 */

// ============================================================================
// SENTINEL DEPLOYMENT CONSTANTS
// ============================================================================

// ============================================================================
// TIERED SENTINEL LICENSING
// ============================================================================

/**
 * Sentinel License Tiers (UPDATED PRICING - 2026-02-01)
 *
 * Tier 1 (Citizen): $20.00 for 1 device
 * Tier 2 (Personal Multi): $50.00 for up to 3 devices
 * Tier 3 (Enterprise Lite): $1,000.00 for up to 15 devices
 */
export enum SentinelLicenseTier {
  TIER_1_CITIZEN = 'TIER_1_CITIZEN',
  TIER_2_PERSONAL_MULTI = 'TIER_2_PERSONAL_MULTI',
  TIER_3_ENTERPRISE_LITE = 'TIER_3_ENTERPRISE_LITE',
}

export interface SentinelTierConfig {
  tier: SentinelLicenseTier;
  name: string;
  priceUSD: number;
  maxDevices: number;
  description: string;
}

export const SENTINEL_TIER_CONFIGS: Record<SentinelLicenseTier, SentinelTierConfig> = {
  [SentinelLicenseTier.TIER_1_CITIZEN]: {
    tier: SentinelLicenseTier.TIER_1_CITIZEN,
    name: 'Citizen',
    priceUSD: 20.0,
    maxDevices: 1,
    description: 'Single device protection for individual citizens',
  },
  [SentinelLicenseTier.TIER_2_PERSONAL_MULTI]: {
    tier: SentinelLicenseTier.TIER_2_PERSONAL_MULTI,
    name: 'Personal Multi',
    priceUSD: 50.0,
    maxDevices: 3,
    description: 'Multi-device protection for personal use (up to 3 devices)',
  },
  [SentinelLicenseTier.TIER_3_ENTERPRISE_LITE]: {
    tier: SentinelLicenseTier.TIER_3_ENTERPRISE_LITE,
    name: 'Enterprise Lite',
    priceUSD: 1000.0,
    maxDevices: 15,
    description: 'Enterprise-grade protection for organizations (up to 15 devices)',
  },
};

/**
 * Fee Split Configuration (99-1 Sovereign Split)
 *
 * Revenue Intake: 100% of tier fee routes to SENTINEL_BUSINESS_BLOCK
 *
 * The 1% Sovereign Movement (RE-APPLIED):
 * - 1% mandatory protocol pull from every activation ($0.10, $0.30, or $10.00)
 * - Split into two equal halves:
 *   - 0.5% → National Escrow (Liquidity backing)
 *   - 0.5% → Global Citizen Block (Monthly Dividend) [UPDATED from User Vault]
 *
 * Architect Retention:
 * - 99% secured in Sentinel Business Block for the Architect
 */
export const SENTINEL_FEE_SPLIT_ARCHITECT = 0.99; // 99% to Sentinel Business Block (Architect)
export const SENTINEL_FEE_SPLIT_SOVEREIGN_MOVEMENT = 0.01; // 1% Sovereign Movement
export const SENTINEL_FEE_SPLIT_NATIONAL_ESCROW = 0.005; // 0.5% to National Escrow (half of 1%)
export const SENTINEL_FEE_SPLIT_GLOBAL_CITIZEN_BLOCK = 0.005; // 0.5% to Global Citizen Block (half of 1%) [UPDATED]

/** Legacy constant for backward compatibility (UPDATED to $20.00) */
export const SENTINEL_ACTIVATION_FEE_USD = SENTINEL_TIER_CONFIGS[SentinelLicenseTier.TIER_1_CITIZEN].priceUSD; // $20.00

/** Sentinel binding handshake timeout (2 seconds for 4-layer handshake) */
export const SENTINEL_BINDING_TIMEOUT_MS = 2000;

/**
 * MASTER_SECURITY_TOKEN validity period
 * NULL = Lifetime/Infinite (No expiration)
 * This is a LIFETIME service - no subscription logic
 */
export const MASTER_SECURITY_TOKEN_VALIDITY_MS = null; // Lifetime/Infinite

// ============================================================================
// SENTINEL DEPLOYMENT REQUISITION GATE
// ============================================================================

export type SentinelGateStatus = 'CLOSED' | 'REQUESTED' | 'BINDING' | 'ACTIVE' | 'FAILED';

export interface SentinelDeploymentRequisition {
  citizenId: string;
  pffId: string;
  gateStatus: SentinelGateStatus;
  requestedAt?: Date;
  activatedAt?: Date;
  masterSecurityToken?: string;
  sentinelDaemonId?: string;
  burnTransactionHash?: string;
}

// ============================================================================
// SENTINEL BINDING HANDSHAKE (4-Layer)
// ============================================================================

/**
 * Specialized 4-Layer Handshake for Sentinel Binding
 * Different from standard sequential handshake - this is for system-level security binding
 */

export interface SentinelBindingLayer1 {
  type: 'IDENTITY_VERIFICATION';
  pffId: string;
  citizenId: string;
  presenceProof: string; // Signed presence proof
  timestamp: number;
}

export interface SentinelBindingLayer2 {
  type: 'PAYMENT_VERIFICATION';
  feeAmountUSD: number; // $10.00 USD (Fixed)
  feeAmountVIDA: number; // Converted from USD using SOVRYN Oracle
  paymentTransactionHash: string;
  sovrynChainId: number; // 30 for RSK mainnet
  oraclePrice: number; // VIDA/USD price at time of payment
  timestamp: number;
}

export interface SentinelBindingLayer3 {
  type: 'HARDWARE_ATTESTATION';
  deviceId: string;
  platformAttestation: string; // Platform-specific hardware attestation
  secureEnclaveConfirmed: boolean;
  timestamp: number;
}

export interface SentinelBindingLayer4 {
  type: 'DAEMON_HANDSHAKE';
  sentinelDaemonId: string;
  daemonPublicKey: string;
  encryptedChannel: string; // Encrypted communication channel ID
  timestamp: number;
}

export interface SentinelBindingHandshakePayload {
  sessionId: string;
  layer1: SentinelBindingLayer1;
  layer2: SentinelBindingLayer2;
  layer3: SentinelBindingLayer3;
  layer4: SentinelBindingLayer4;
  totalDuration: number;
  timestamp: number;
}

export interface SentinelBindingResult {
  success: boolean;
  sessionId: string;
  masterSecurityToken?: string;
  sentinelDaemonId?: string;
  error?: SentinelBindingError;
  totalDuration: number;
}

export interface SentinelBindingError {
  code: SentinelBindingErrorCode;
  message: string;
  layer: string;
  timestamp: number;
}

export type SentinelBindingErrorCode =
  | 'IDENTITY_VERIFICATION_FAILED'
  | 'TOKEN_BURN_FAILED'
  | 'HARDWARE_ATTESTATION_FAILED'
  | 'DAEMON_HANDSHAKE_FAILED'
  | 'BINDING_TIMEOUT'
  | 'GATE_NOT_REQUESTED'
  | 'INSUFFICIENT_VIDA_BALANCE';

// ============================================================================
// MASTER SECURITY TOKEN
// ============================================================================

export interface MasterSecurityToken {
  tokenId: string;
  citizenId: string;
  pffId: string;
  sentinelDaemonId: string;
  deviceId: string; // Hardware-bound to specific device
  deviceFingerprint: string; // Unique hardware fingerprint (prevents device transfer)
  issuedAt: Date;
  expiresAt: Date | null; // NULL = Lifetime/Infinite (No expiration)
  encryptedPayload: string; // Contains hardware-level security keys
  signature: string;
  hardwareBound: boolean; // Always true - token cannot be moved to another device
}

// ============================================================================
// LIFEOS STATUS CALLBACK
// ============================================================================

export interface LifeOSSecurityStatusCallback {
  citizenId: string;
  securityStatus: 'SENTINEL_INACTIVE' | 'SENTINEL_ACTIVE' | 'SENTINEL_BINDING' | 'SENTINEL_ERROR';
  statusBadge: {
    level: 'STANDARD' | 'SENTINEL' | 'FORTRESS';
    color: string;
    icon: string;
  };
  lastUpdated: Date;
  encryptedMetadata: string; // Encrypted, no biometric data exposed
}

// ============================================================================
// SENTINEL OPT-IN REQUEST
// ============================================================================

export interface SentinelOptInRequest {
  citizenId: string;
  pffId: string;
  presenceToken: string; // Must be verified PFF identity
  deviceInfo: {
    platform: string;
    deviceId: string;
    hasSecureEnclave: boolean;
  };
}

export interface SentinelOptInResponse {
  success: boolean;
  gateStatus: SentinelGateStatus;
  sessionId?: string;
  error?: string;
}


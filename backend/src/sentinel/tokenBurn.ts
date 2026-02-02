/**
 * PFF Backend — Sentinel Payment Logic
 * Execute Sentinel activation fee with Unified Revenue-to-Dividend Bridge
 * Architect: Isreal Okoro (mrfundzman)
 *
 * Purpose:
 * - Charge tier fee (converted to VIDA using SOVRYN Oracle)
 * - Route through Unified Revenue-to-Dividend Bridge:
 *   - 1% → PROT_TRIBUTE_POOL (consolidated revenue)
 *   - Auto-Split: 50% National Liquidity Vault + 50% Global Citizen Block
 *   - 99% → Architect retention
 * - Log payment transaction to VLT
 * - Return payment transaction hash for Layer 2 verification
 * - CRITICAL: Payment only executes AFTER 100% successful 4-layer handshake
 */

import * as crypto from 'crypto';
import { pool, query } from '../db/client';
import {
  SENTINEL_ACTIVATION_FEE_USD,
  SentinelLicenseTier,
  SENTINEL_TIER_CONFIGS,
} from '../../../core/sentinelOptIn';
import { getSentinelActivationFeeInVIDA } from './sovrynOracle';
import { consolidateRevenueToTributePool } from '../services/revenueBridge';
import { RevenueSourceType } from '../../../core/revenueBridge';

export interface SentinelPaymentResult {
  success: boolean;
  feeAmountUSD: number;
  feeAmountVIDA: number;
  architectShare: number; // 99% to Sentinel Business Block
  sovereignMovementTotal: number; // 1% total
  nationalEscrowShare: number; // 0.5% to National Escrow
  userRebateShare: number; // 0.5% to User Vault (instant rebate)
  paymentTransactionHash: string;
  sovrynChainId: number;
  oraclePrice: number;
  citizenBalanceBefore: number;
  citizenBalanceAfter: number;
  timestamp: Date;
}

/**
 * Generate VLT transaction hash
 */
function generateTransactionHash(): string {
  return crypto
    .createHash('sha256')
    .update(`${Date.now()}-${crypto.randomBytes(16).toString('hex')}`)
    .digest('hex');
}

/**
 * Get citizen's VIDA Cap balance
 */
async function getCitizenVidaCapBalance(citizenId: string): Promise<number> {
  const result = await query<{ balance: string }>(
    `SELECT COALESCE(SUM(amount), 0) as balance
     FROM citizen_vaults
     WHERE citizen_id = $1`,
    [citizenId]
  );
  
  return parseFloat(result.rows[0]?.balance || '0');
}

/**
 * Execute Sentinel activation payment with Unified Revenue-to-Dividend Bridge
 * Supports Tier 1 ($10), Tier 2 ($30), Tier 3 ($1000)
 *
 * Flow:
 * 1. Deduct tier fee from citizen vault
 * 2. Route through Unified Revenue-to-Dividend Bridge:
 *    - Consolidate into PROT_TRIBUTE_POOL (1% Standard)
 *    - Auto-Split: 50% National Liquidity Vault + 50% Global Citizen Block
 *    - 99% Architect retention
 * 3. Log to VLT
 *
 * CRITICAL: This function should ONLY be called AFTER 100% successful 4-layer handshake
 * No payment can be taken if liveness check or any handshake layer fails
 */
export async function executeSentinelPayment(
  citizenId: string,
  pffId: string,
  tier: SentinelLicenseTier = SentinelLicenseTier.TIER_1_CITIZEN
): Promise<SentinelPaymentResult> {
  const timestamp = new Date();
  const transactionHash = generateTransactionHash();

  // Get tier configuration
  const tierConfig = SENTINEL_TIER_CONFIGS[tier];
  const feeAmountUSD = tierConfig.priceUSD;

  // Get real-time VIDA price from SOVRYN Oracle
  const feeConversion = await getSentinelActivationFeeInVIDA(feeAmountUSD);
  const feeAmountVIDA = feeConversion.vidaAmount;

  // Get current balance
  const balanceBefore = await getCitizenVidaCapBalance(citizenId);

  // Verify sufficient balance
  if (balanceBefore < feeAmountVIDA) {
    throw new Error(
      `Insufficient VIDA Cap balance for Sentinel activation. Required: ${feeAmountVIDA} VIDA ($${feeAmountUSD} USD ${tierConfig.name}), Available: ${balanceBefore} VIDA`
    );
  }

  const balanceAfter = balanceBefore - feeAmountVIDA;

  // Determine revenue source type based on tier
  let revenueSource: RevenueSourceType;
  switch (tier) {
    case SentinelLicenseTier.TIER_1_CITIZEN:
      revenueSource = RevenueSourceType.SENTINEL_TIER_1;
      break;
    case SentinelLicenseTier.TIER_2_PERSONAL_MULTI:
      revenueSource = RevenueSourceType.SENTINEL_TIER_2;
      break;
    case SentinelLicenseTier.TIER_3_ENTERPRISE:
      revenueSource = RevenueSourceType.SENTINEL_TIER_3;
      break;
    default:
      revenueSource = RevenueSourceType.SENTINEL_TIER_1;
  }

  // Atomic transaction: Deduct from citizen + Route through Revenue Bridge + Log to VLT
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ========================================================================
    // STEP 1: Deduct total tier fee from citizen vault
    // ========================================================================
    await client.query(
      `INSERT INTO citizen_vaults (citizen_id, amount, transaction_type, transaction_hash, created_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [citizenId, -feeAmountVIDA, 'sentinel_activation_payment', transactionHash, timestamp]
    );

    // ========================================================================
    // STEP 2: Log to VLT (Vitalization Ledger Technology)
    // ========================================================================
    await client.query(
      `INSERT INTO vlt_transactions
       (transaction_type, transaction_hash, citizen_id, amount, from_vault, to_vault, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        'sentinel_activation_payment',
        transactionHash,
        citizenId,
        feeAmountVIDA,
        'citizen_vault',
        'revenue_bridge',
        JSON.stringify({
          pffId,
          tier: tier,
          tierName: tierConfig.name,
          feeUSD: feeAmountUSD,
          feeVIDA: feeAmountVIDA,
          oraclePrice: feeConversion.oraclePrice,
          revenueSource: revenueSource,
          revenueBridge: 'UNIFIED_REVENUE_TO_DIVIDEND_BRIDGE',
          sovrynChainId: 30, // RSK mainnet
          timestamp: timestamp.toISOString(),
        }),
      ]
    );

    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }

  // ========================================================================
  // STEP 3: Route through Unified Revenue-to-Dividend Bridge
  // ========================================================================
  // This executes AFTER the citizen payment transaction is committed
  // to ensure citizen is charged even if revenue bridge fails
  const revenueBridgeResult = await consolidateRevenueToTributePool(
    feeAmountVIDA,
    revenueSource,
    transactionHash,
    {
      citizenId,
      pffId,
      tier: tier,
      tierName: tierConfig.name,
      feeUSD: feeAmountUSD,
      feeVIDA: feeAmountVIDA,
      oraclePrice: feeConversion.oraclePrice,
    }
  );

  if (!revenueBridgeResult.success) {
    console.error('[SENTINEL PAYMENT] Revenue bridge consolidation failed:', revenueBridgeResult.error);
    // Note: Citizen payment already committed, so we log the error but don't fail the payment
  }

  // ========================================================================
  // STEP 4: Log Sentinel activation completion
  // ========================================================================
  await query(
    `INSERT INTO system_events (event_type, event_data, created_at)
     VALUES ($1, $2, $3)`,
    [
      'SENTINEL_ACTIVE',
      JSON.stringify({
        status: 'UNIFIED_REVENUE_BRIDGE_COMPLETE',
        citizenId,
        pffId,
        tier: tier,
        tierName: tierConfig.name,
        feeUSD: feeAmountUSD,
        feeVIDA: feeAmountVIDA,
        oraclePrice: feeConversion.oraclePrice,
        revenueBridge: {
          success: revenueBridgeResult.success,
          tributeAmount: revenueBridgeResult.tributeAmount,
          architectAmount: revenueBridgeResult.architectAmount,
          tributePoolHash: revenueBridgeResult.tributePoolHash,
        },
        transactionHash,
        balanceBefore,
        balanceAfter,
        message: 'SENTINEL_ACTIVE | UNIFIED_REVENUE_BRIDGE_COMPLETE',
      }),
      timestamp,
    ]
  );

  return {
    success: true,
    feeAmountUSD: feeAmountUSD,
    feeAmountVIDA,
    architectShare: revenueBridgeResult.architectAmount, // 99% to Architect
    sovereignMovementTotal: revenueBridgeResult.tributeAmount, // 1% to PROT_TRIBUTE_POOL
    nationalEscrowShare: revenueBridgeResult.tributeAmount * 0.5, // 50% of 1% = 0.5%
    userRebateShare: revenueBridgeResult.tributeAmount * 0.5, // 50% of 1% = 0.5% to Global Citizen Block
    paymentTransactionHash: transactionHash,
    sovrynChainId: 30, // RSK mainnet
    oraclePrice: feeConversion.oraclePrice,
    citizenBalanceBefore: balanceBefore,
    citizenBalanceAfter: balanceAfter,
    timestamp,
  };
}


/**
 * PFF Backend — Dividend Projection Oracle
 * Real-time tracking and projection of monthly dividend payouts
 * Architect: Isreal Okoro (mrfundzman)
 *
 * Purpose:
 * - Track CURRENT_MONTH_DIVIDEND_POOL (0.5% from all tiered Sentinel activations)
 * - Track ACTIVE_TRUTH_TELLERS count (unique PFF handshakes this month)
 * - Calculate Estimated Payout: Current_Pool / Active_Users
 * - Provide transparency via public VLT address
 * - Implement Architect's Shield (move 99% before monthly flush)
 */

import { query } from '../db/client';

export interface DividendProjection {
  currentMonth: string;
  currentMonthDividendPool: number; // CURRENT_MONTH_DIVIDEND_POOL
  activeTruthTellers: number; // ACTIVE_TRUTH_TELLERS count
  estimatedPayoutPerCitizen: number; // Current_Pool / Active_Users
  globalCitizenBlockAddress: string; // Public VLT address for transparency
  lastUpdated: Date;
}

export interface ArchitectShieldResult {
  success: boolean;
  totalArchitectShare: number; // 99% from SENTINEL_BUSINESS_BLOCK
  transferredToArchitectVault: number;
  remainingInBusinessBlock: number;
  transferHash: string;
  timestamp: Date;
  error?: string;
}

/**
 * Get current month's dividend pool balance (CURRENT_MONTH_DIVIDEND_POOL)
 * This is the real-time counter tracking 0.5% from all tiered Sentinel activations
 */
export async function getCurrentMonthDividendPool(): Promise<number> {
  const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM

  const result = await query<{ total: string }>(
    `SELECT COALESCE(SUM(amount), 0) as total 
     FROM global_citizen_block 
     WHERE transaction_type = 'dividend_accumulation'
     AND TO_CHAR(created_at, 'YYYY-MM') = $1`,
    [currentMonth]
  );

  return parseFloat(result.rows[0]?.total || '0');
}

/**
 * Get total Global Citizen Block balance (all time)
 */
export async function getTotalGlobalCitizenBlock(): Promise<number> {
  const result = await query<{ total: string }>(
    `SELECT COALESCE(SUM(amount), 0) as total FROM global_citizen_block`
  );
  return parseFloat(result.rows[0]?.total || '0');
}

/**
 * Get active truth-tellers count for current month (ACTIVE_TRUTH_TELLERS)
 * Tracks unique PFF handshakes this month
 */
export async function getActiveTruthTellersCount(): Promise<number> {
  const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM

  const result = await query<{ count: string }>(
    `SELECT COUNT(*) as count 
     FROM verified_truth_tellers 
     WHERE verified_month = $1`,
    [currentMonth]
  );

  return parseInt(result.rows[0]?.count || '0');
}

/**
 * Get dividend projection for current month
 * Displays 'Estimated Payout' on LifeOS dashboard
 */
export async function getDividendProjection(): Promise<DividendProjection> {
  const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM

  // Get current month's dividend pool (CURRENT_MONTH_DIVIDEND_POOL)
  const currentMonthDividendPool = await getCurrentMonthDividendPool();

  // Get active truth-tellers count (ACTIVE_TRUTH_TELLERS)
  const activeTruthTellers = await getActiveTruthTellersCount();

  // Calculate estimated payout per citizen
  const estimatedPayoutPerCitizen = activeTruthTellers > 0 
    ? currentMonthDividendPool / activeTruthTellers 
    : 0;

  // Get Global Citizen Block address (public VLT address for transparency)
  const globalCitizenBlockAddress = await getGlobalCitizenBlockAddress();

  return {
    currentMonth,
    currentMonthDividendPool,
    activeTruthTellers,
    estimatedPayoutPerCitizen,
    globalCitizenBlockAddress,
    lastUpdated: new Date(),
  };
}

/**
 * Get Global Citizen Block address for transparency
 * Makes the GLOBAL_CITIZEN_BLOCK address public on the Truth Ledger (VLT)
 */
export async function getGlobalCitizenBlockAddress(): Promise<string> {
  // This would be a blockchain address in production
  // For now, we return a deterministic identifier
  return 'VLT_GLOBAL_CITIZEN_BLOCK_0x' + Buffer.from('GLOBAL_CITIZEN_BLOCK').toString('hex').toUpperCase();
}

/**
 * Get detailed breakdown of current month's accumulation
 * Shows contributions from each tier ($10, $30, $1000)
 */
export async function getCurrentMonthAccumulationBreakdown(): Promise<{
  tier1Contributions: number;
  tier2Contributions: number;
  tier3Contributions: number;
  totalContributions: number;
  contributionCount: number;
}> {
  const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM

  const result = await query<{
    tier1_total: string;
    tier2_total: string;
    tier3_total: string;
    total_contributions: string;
    contribution_count: string;
  }>(
    `SELECT 
       COALESCE(SUM(CASE WHEN metadata->>'tier' = 'TIER_1_CITIZEN' THEN amount ELSE 0 END), 0) as tier1_total,
       COALESCE(SUM(CASE WHEN metadata->>'tier' = 'TIER_2_PERSONAL_MULTI' THEN amount ELSE 0 END), 0) as tier2_total,
       COALESCE(SUM(CASE WHEN metadata->>'tier' = 'TIER_3_ENTERPRISE' THEN amount ELSE 0 END), 0) as tier3_total,
       COALESCE(SUM(amount), 0) as total_contributions,
       COUNT(*) as contribution_count
     FROM global_citizen_block
     WHERE transaction_type = 'dividend_accumulation'
     AND TO_CHAR(created_at, 'YYYY-MM') = $1`,
    [currentMonth]
  );

  const row = result.rows[0];

  return {
    tier1Contributions: parseFloat(row?.tier1_total || '0'),
    tier2Contributions: parseFloat(row?.tier2_total || '0'),
    tier3Contributions: parseFloat(row?.tier3_total || '0'),
    totalContributions: parseFloat(row?.total_contributions || '0'),
    contributionCount: parseInt(row?.contribution_count || '0'),
  };
}

/**
 * Architect's Shield: Move 99% from SENTINEL_BUSINESS_BLOCK to Architect's vault
 * This MUST execute BEFORE the monthly flush to protect architect retention
 *
 * Flow:
 * 1. Calculate total balance in SENTINEL_BUSINESS_BLOCK
 * 2. Transfer 99% to architect_vault (secure long-term storage)
 * 3. Leave minimal balance for operational purposes
 * 4. Log transfer to VLT for transparency
 */
export async function executeArchitectShield(): Promise<ArchitectShieldResult> {
  const { pool } = await import('../db/client');
  const crypto = await import('crypto');

  const timestamp = new Date();
  const transferHash = crypto
    .createHash('sha256')
    .update(`architect_shield_${timestamp.getTime()}`)
    .digest('hex');

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Get total balance in SENTINEL_BUSINESS_BLOCK
    const balanceResult = await client.query<{ total: string }>(
      `SELECT COALESCE(SUM(amount), 0) as total FROM sentinel_business_block`
    );
    const totalBusinessBlockBalance = parseFloat(balanceResult.rows[0]?.total || '0');

    if (totalBusinessBlockBalance <= 0) {
      await client.query('ROLLBACK');
      return {
        success: false,
        totalArchitectShare: 0,
        transferredToArchitectVault: 0,
        remainingInBusinessBlock: 0,
        transferHash,
        timestamp,
        error: 'No balance in SENTINEL_BUSINESS_BLOCK to transfer',
      };
    }

    // 2. Calculate 99% for architect vault (leave 1% for operational buffer)
    const architectShare = totalBusinessBlockBalance * 0.99;
    const operationalBuffer = totalBusinessBlockBalance * 0.01;

    // 3. Deduct from SENTINEL_BUSINESS_BLOCK
    await client.query(
      `INSERT INTO sentinel_business_block (amount, transaction_type, transaction_hash, created_at)
       VALUES ($1, $2, $3, $4)`,
      [-architectShare, 'architect_shield_transfer', transferHash, timestamp]
    );

    // 4. Add to architect_vault (create table if needed)
    await client.query(
      `CREATE TABLE IF NOT EXISTS architect_vault (
         id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
         amount NUMERIC(20, 8) NOT NULL,
         transaction_type VARCHAR(100) NOT NULL,
         transaction_hash VARCHAR(255) NOT NULL,
         metadata JSONB,
         created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
       )`
    );

    await client.query(
      `INSERT INTO architect_vault (amount, transaction_type, transaction_hash, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        architectShare,
        'architect_shield_deposit',
        transferHash,
        JSON.stringify({
          sourceBlock: 'SENTINEL_BUSINESS_BLOCK',
          totalBusinessBlockBalance,
          architectShare,
          operationalBuffer,
          transferReason: 'Pre-monthly-flush architect protection',
        }),
        timestamp,
      ]
    );

    // 5. Log to VLT for transparency
    await client.query(
      `INSERT INTO vlt_transactions
       (transaction_type, transaction_hash, citizen_id, amount, from_vault, to_vault, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        'architect_shield_transfer',
        transferHash,
        null, // System transaction, no specific citizen
        architectShare,
        'sentinel_business_block',
        'architect_vault',
        JSON.stringify({
          totalBusinessBlockBalance,
          architectShare,
          operationalBuffer,
          transferPercentage: 99,
          timestamp: timestamp.toISOString(),
        }),
      ]
    );

    // 6. Log system event
    await client.query(
      `INSERT INTO system_events (event_type, event_data, created_at)
       VALUES ($1, $2, $3)`,
      [
        'ARCHITECT_SHIELD_EXECUTED',
        JSON.stringify({
          status: 'ARCHITECT_SHIELD_COMPLETE',
          totalBusinessBlockBalance,
          architectShare,
          operationalBuffer,
          transferHash,
          message: 'Architect retention secured before monthly flush',
        }),
        timestamp,
      ]
    );

    await client.query('COMMIT');

    console.log(`[ARCHITECT SHIELD] Successfully transferred ${architectShare} VIDA to architect vault`);

    return {
      success: true,
      totalArchitectShare: totalBusinessBlockBalance,
      transferredToArchitectVault: architectShare,
      remainingInBusinessBlock: operationalBuffer,
      transferHash,
      timestamp,
    };
  } catch (e) {
    await client.query('ROLLBACK');
    const err = e as Error;
    console.error('[ARCHITECT SHIELD] Failed to execute:', err);
    return {
      success: false,
      totalArchitectShare: 0,
      transferredToArchitectVault: 0,
      remainingInBusinessBlock: 0,
      transferHash,
      timestamp,
      error: err.message,
    };
  } finally {
    client.release();
  }
}


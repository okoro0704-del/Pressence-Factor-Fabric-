/**
 * PFF Backend — Unified Revenue-to-Dividend Bridge Service
 * Consolidates all revenue into PROT_TRIBUTE_POOL with hardcoded 50/50 auto-split
 * Architect: Isreal Okoro (mrfundzman)
 *
 * Purpose:
 * - Consolidate all revenue sources into PROT_TRIBUTE_POOL (1% Standard)
 * - Execute hardcoded 50/50 auto-split:
 *   - 50% → National Liquidity Vault
 *   - 50% → Global Citizen Block
 * - Link Monthly Truth Dividend to unified pool
 * - Provide audit trail for all revenue flows
 */

import { query, pool } from '../db/client';
import * as crypto from 'crypto';
import {
  PROT_TRIBUTE_PERCENTAGE,
  ARCHITECT_RETENTION_PERCENTAGE,
  NATIONAL_LIQUIDITY_SPLIT,
  GLOBAL_CITIZEN_SPLIT,
  NATIONAL_LIQUIDITY_PERCENTAGE,
  GLOBAL_CITIZEN_PERCENTAGE,
  RevenueSourceType,
  validateAutoSplit,
  validateRevenueSplit,
  verifyImmutableConstraints,
} from '../../../core/revenueBridge';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface RevenueConsolidationResult {
  success: boolean;
  totalRevenueAmount: number;
  tributeAmount: number;
  architectAmount: number;
  revenueSource: RevenueSourceType;
  sourceTransactionHash: string;
  tributePoolHash: string;
  architectVaultHash: string;
  consolidatedAt: Date;
  error?: string;
}

export interface AutoSplitResult {
  success: boolean;
  totalTributeAmount: number;
  nationalLiquidityAmount: number;
  globalCitizenAmount: number;
  tributePoolTransactionHash: string;
  nationalLiquidityHash: string;
  globalCitizenHash: string;
  revenueSource: RevenueSourceType;
  executedAt: Date;
  error?: string;
}

export interface TributePoolStatus {
  totalBalance: number;
  pendingSplitAmount: number;
  totalConsolidated: number;
  totalSplit: number;
  revenueBreakdown: {
    [key in RevenueSourceType]?: number;
  };
}

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Consolidate revenue into PROT_TRIBUTE_POOL
 * Applies the 1% Standard: 1% to tribute pool, 99% to architect
 *
 * Flow:
 * 1. Validate immutable constraints
 * 2. Calculate 1% tribute and 99% architect retention
 * 3. Add tribute to PROT_TRIBUTE_POOL
 * 4. Add architect share to architect vault
 * 5. Log consolidation for audit trail
 * 6. Trigger auto-split immediately
 */
export async function consolidateRevenueToTributePool(
  totalRevenueAmount: number,
  revenueSource: RevenueSourceType,
  sourceTransactionHash: string,
  metadata?: Record<string, unknown>
): Promise<RevenueConsolidationResult> {
  // Validate immutable constraints
  if (!verifyImmutableConstraints()) {
    throw new Error('PROTOCOL VIOLATION: Immutable constraints have been modified');
  }

  if (!validateRevenueSplit()) {
    throw new Error('PROTOCOL VIOLATION: Revenue split percentages do not sum to 100%');
  }

  const consolidatedAt = new Date();
  const tributePoolHash = crypto
    .createHash('sha256')
    .update(`tribute_pool_${sourceTransactionHash}_${consolidatedAt.getTime()}`)
    .digest('hex');
  const architectVaultHash = crypto
    .createHash('sha256')
    .update(`architect_vault_${sourceTransactionHash}_${consolidatedAt.getTime()}`)
    .digest('hex');

  // Calculate splits
  const tributeAmount = totalRevenueAmount * PROT_TRIBUTE_PERCENTAGE; // 1%
  const architectAmount = totalRevenueAmount * ARCHITECT_RETENTION_PERCENTAGE; // 99%

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Add tribute to PROT_TRIBUTE_POOL
    await client.query(
      `INSERT INTO prot_tribute_pool (amount, revenue_source, source_transaction_hash, transaction_type, transaction_hash, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        tributeAmount,
        revenueSource,
        sourceTransactionHash,
        'tribute_intake',
        tributePoolHash,
        metadata ? JSON.stringify(metadata) : null,
        consolidatedAt,
      ]
    );

    // 2. Add architect share to architect vault (sentinel_business_block for now)
    await client.query(
      `INSERT INTO sentinel_business_block (amount, transaction_type, transaction_hash, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        architectAmount,
        'architect_retention',
        architectVaultHash,
        JSON.stringify({ revenueSource, sourceTransactionHash }),
        consolidatedAt,
      ]
    );

    // 3. Log consolidation
    await client.query(
      `INSERT INTO revenue_consolidation_log 
       (revenue_source, total_revenue_amount, tribute_amount, architect_amount, tribute_percentage, architect_percentage, 
        source_transaction_hash, tribute_pool_hash, architect_vault_hash, metadata, consolidated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        revenueSource,
        totalRevenueAmount,
        tributeAmount,
        architectAmount,
        PROT_TRIBUTE_PERCENTAGE,
        ARCHITECT_RETENTION_PERCENTAGE,
        sourceTransactionHash,
        tributePoolHash,
        architectVaultHash,
        metadata ? JSON.stringify(metadata) : null,
        consolidatedAt,
      ]
    );

    await client.query('COMMIT');

    // 4. Trigger auto-split immediately (in separate transaction)
    const autoSplitResult = await executeAutoSplit(tributePoolHash, tributeAmount, revenueSource);

    if (!autoSplitResult.success) {
      console.error('[REVENUE BRIDGE] Auto-split failed after consolidation:', autoSplitResult.error);
    }

    return {
      success: true,
      totalRevenueAmount,
      tributeAmount,
      architectAmount,
      revenueSource,
      sourceTransactionHash,
      tributePoolHash,
      architectVaultHash,
      consolidatedAt,
    };
  } catch (e) {
    await client.query('ROLLBACK');
    const err = e as Error;
    console.error('[REVENUE BRIDGE] Consolidation failed:', err);
    return {
      success: false,
      totalRevenueAmount,
      tributeAmount: 0,
      architectAmount: 0,
      revenueSource,
      sourceTransactionHash,
      tributePoolHash,
      architectVaultHash,
      consolidatedAt,
      error: err.message,
    };
  } finally {
    client.release();
  }
}

/**
 * Execute Auto-Split: 50/50 split of tribute pool
 * 50% → National Liquidity Vault
 * 50% → Global Citizen Block
 *
 * This function is called automatically after each revenue consolidation
 */
export async function executeAutoSplit(
  tributePoolTransactionHash: string,
  totalTributeAmount: number,
  revenueSource: RevenueSourceType
): Promise<AutoSplitResult> {
  // Validate immutable constraints
  if (!validateAutoSplit()) {
    throw new Error('PROTOCOL VIOLATION: Auto-split percentages do not sum to 100%');
  }

  const executedAt = new Date();
  const nationalLiquidityHash = crypto
    .createHash('sha256')
    .update(`national_liquidity_${tributePoolTransactionHash}_${executedAt.getTime()}`)
    .digest('hex');
  const globalCitizenHash = crypto
    .createHash('sha256')
    .update(`global_citizen_${tributePoolTransactionHash}_${executedAt.getTime()}`)
    .digest('hex');

  // Calculate 50/50 split
  const nationalLiquidityAmount = totalTributeAmount * NATIONAL_LIQUIDITY_SPLIT; // 50%
  const globalCitizenAmount = totalTributeAmount * GLOBAL_CITIZEN_SPLIT; // 50%

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Add to National Liquidity Vault
    await client.query(
      `INSERT INTO national_liquidity_vault (amount, source_tribute_hash, transaction_type, transaction_hash, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        nationalLiquidityAmount,
        tributePoolTransactionHash,
        'auto_split_intake',
        nationalLiquidityHash,
        JSON.stringify({ revenueSource, splitPercentage: NATIONAL_LIQUIDITY_SPLIT }),
        executedAt,
      ]
    );

    // 2. Add to Global Citizen Block
    await client.query(
      `INSERT INTO global_citizen_block (amount, transaction_type, transaction_hash, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        globalCitizenAmount,
        'dividend_accumulation',
        globalCitizenHash,
        JSON.stringify({
          revenueSource,
          splitPercentage: GLOBAL_CITIZEN_SPLIT,
          sourceTributeHash: tributePoolTransactionHash,
        }),
        executedAt,
      ]
    );

    // 3. Deduct from PROT_TRIBUTE_POOL
    await client.query(
      `INSERT INTO prot_tribute_pool (amount, revenue_source, source_transaction_hash, transaction_type, transaction_hash, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        -totalTributeAmount,
        revenueSource,
        tributePoolTransactionHash,
        'auto_split_deduction',
        `${nationalLiquidityHash}_${globalCitizenHash}`,
        JSON.stringify({ nationalLiquidityHash, globalCitizenHash }),
        executedAt,
      ]
    );

    // 4. Log auto-split execution
    await client.query(
      `INSERT INTO tribute_auto_split_log
       (tribute_pool_transaction_hash, total_tribute_amount, national_liquidity_amount, global_citizen_amount,
        national_liquidity_hash, global_citizen_hash, split_percentage_national, split_percentage_global,
        revenue_source, metadata, executed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        tributePoolTransactionHash,
        totalTributeAmount,
        nationalLiquidityAmount,
        globalCitizenAmount,
        nationalLiquidityHash,
        globalCitizenHash,
        NATIONAL_LIQUIDITY_SPLIT,
        GLOBAL_CITIZEN_SPLIT,
        revenueSource,
        JSON.stringify({ autoSplitExecuted: true }),
        executedAt,
      ]
    );

    await client.query('COMMIT');

    console.log(`[REVENUE BRIDGE] Auto-split executed: ${nationalLiquidityAmount} to National Liquidity, ${globalCitizenAmount} to Global Citizen Block`);

    return {
      success: true,
      totalTributeAmount,
      nationalLiquidityAmount,
      globalCitizenAmount,
      tributePoolTransactionHash,
      nationalLiquidityHash,
      globalCitizenHash,
      revenueSource,
      executedAt,
    };
  } catch (e) {
    await client.query('ROLLBACK');
    const err = e as Error;
    console.error('[REVENUE BRIDGE] Auto-split failed:', err);
    return {
      success: false,
      totalTributeAmount,
      nationalLiquidityAmount: 0,
      globalCitizenAmount: 0,
      tributePoolTransactionHash,
      nationalLiquidityHash,
      globalCitizenHash,
      revenueSource,
      executedAt,
      error: err.message,
    };
  } finally {
    client.release();
  }
}

/**
 * Get PROT_TRIBUTE_POOL status
 * Returns current balance, pending splits, and revenue breakdown
 */
export async function getTributePoolStatus(): Promise<TributePoolStatus> {
  try {
    // Get total balance
    const balanceResult = await query<{ total: string }>(
      `SELECT COALESCE(SUM(amount), 0) as total FROM prot_tribute_pool`
    );
    const totalBalance = parseFloat(balanceResult.rows[0]?.total || '0');

    // Get total consolidated
    const consolidatedResult = await query<{ total: string }>(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM prot_tribute_pool
       WHERE transaction_type = 'tribute_intake'`
    );
    const totalConsolidated = parseFloat(consolidatedResult.rows[0]?.total || '0');

    // Get total split
    const splitResult = await query<{ total: string }>(
      `SELECT COALESCE(ABS(SUM(amount)), 0) as total
       FROM prot_tribute_pool
       WHERE transaction_type = 'auto_split_deduction'`
    );
    const totalSplit = parseFloat(splitResult.rows[0]?.total || '0');

    // Get revenue breakdown by source
    const breakdownResult = await query<{ revenue_source: RevenueSourceType; total: string }>(
      `SELECT revenue_source, COALESCE(SUM(amount), 0) as total
       FROM prot_tribute_pool
       WHERE transaction_type = 'tribute_intake'
       GROUP BY revenue_source`
    );

    const revenueBreakdown: { [key in RevenueSourceType]?: number } = {};
    breakdownResult.rows.forEach(row => {
      revenueBreakdown[row.revenue_source] = parseFloat(row.total);
    });

    return {
      totalBalance,
      pendingSplitAmount: totalBalance, // Any positive balance is pending split
      totalConsolidated,
      totalSplit,
      revenueBreakdown,
    };
  } catch (e) {
    const err = e as Error;
    console.error('[REVENUE BRIDGE] Failed to get tribute pool status:', err);
    return {
      totalBalance: 0,
      pendingSplitAmount: 0,
      totalConsolidated: 0,
      totalSplit: 0,
      revenueBreakdown: {},
    };
  }
}

/**
 * Get National Liquidity Vault balance
 */
export async function getNationalLiquidityVaultBalance(): Promise<number> {
  const result = await query<{ total: string }>(
    `SELECT COALESCE(SUM(amount), 0) as total FROM national_liquidity_vault`
  );
  return parseFloat(result.rows[0]?.total || '0');
}

/**
 * Get auto-split execution history
 */
export async function getAutoSplitHistory(limit: number = 10): Promise<AutoSplitResult[]> {
  const result = await query<{
    tribute_pool_transaction_hash: string;
    total_tribute_amount: string;
    national_liquidity_amount: string;
    global_citizen_amount: string;
    national_liquidity_hash: string;
    global_citizen_hash: string;
    revenue_source: RevenueSourceType;
    executed_at: Date;
  }>(
    `SELECT
       tribute_pool_transaction_hash,
       total_tribute_amount,
       national_liquidity_amount,
       global_citizen_amount,
       national_liquidity_hash,
       global_citizen_hash,
       revenue_source,
       executed_at
     FROM tribute_auto_split_log
     ORDER BY executed_at DESC
     LIMIT $1`,
    [limit]
  );

  return result.rows.map(row => ({
    success: true,
    totalTributeAmount: parseFloat(row.total_tribute_amount),
    nationalLiquidityAmount: parseFloat(row.national_liquidity_amount),
    globalCitizenAmount: parseFloat(row.global_citizen_amount),
    tributePoolTransactionHash: row.tribute_pool_transaction_hash,
    nationalLiquidityHash: row.national_liquidity_hash,
    globalCitizenHash: row.global_citizen_hash,
    revenueSource: row.revenue_source,
    executedAt: row.executed_at,
  }));
}


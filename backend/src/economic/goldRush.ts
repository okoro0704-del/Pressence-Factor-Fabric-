/**
 * PFF Backend — Sovereign Gold Rush & Burn Logic Implementation
 * Genesis Protocol v1.0
 * Architect: Isreal Okoro (mrfundzman)
 */

import { pool, query } from '../db/client';
import {
  getCurrentEra,
  getMintAmountForEra,
  getEraStatus,
  calculateBurn,
  isBurnToOneComplete,
  type EraStatus,
  type BurnResult,
} from '../../../core/goldRush';

/**
 * Get total VIDA Cap supply across all vaults
 */
export async function getTotalVidaCapSupply(): Promise<number> {
  // Sum citizen vaults
  const citizenResult = await query<{ total: string }>(
    `SELECT COALESCE(SUM(vida_cap_balance), 0) as total FROM citizen_vaults`
  );
  
  // Sum national reserve
  const reserveResult = await query<{ total: string }>(
    `SELECT COALESCE(SUM(vida_cap_balance), 0) as total FROM national_reserve`
  );
  
  const citizenTotal = parseFloat(citizenResult.rows[0]?.total || '0');
  const reserveTotal = parseFloat(reserveResult.rows[0]?.total || '0');
  
  return citizenTotal + reserveTotal;
}

/**
 * Get total number of verified citizens
 */
export async function getTotalCitizens(): Promise<number> {
  const result = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM citizen_vaults`
  );
  
  return parseInt(result.rows[0]?.count || '0', 10);
}

/**
 * Get current economic era status
 */
export async function getCurrentEraStatus(): Promise<EraStatus> {
  const totalSupply = await getTotalVidaCapSupply();
  const totalCitizens = await getTotalCitizens();
  
  return getEraStatus(totalSupply, totalCitizens);
}

/**
 * Get minting amount for next vitalization based on current supply
 */
export async function getNextMintAmount(): Promise<{
  mintAmount: number;
  era: string;
  citizenShare: number;
  nationalShare: number;
}> {
  const totalSupply = await getTotalVidaCapSupply();
  const era = getCurrentEra(totalSupply);
  const mintAmount = getMintAmountForEra(era);
  
  return {
    mintAmount,
    era,
    citizenShare: mintAmount * 0.5,
    nationalShare: mintAmount * 0.5,
  };
}

/**
 * Apply transaction burn (1% burn rate)
 */
export async function applyTransactionBurn(
  transactionAmount: number,
  citizenId: string,
  transactionType: string
): Promise<BurnResult> {
  const burnResult = calculateBurn(transactionAmount);
  
  // Log burn transaction
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Record burn in burn_ledger table
    await client.query(
      `INSERT INTO burn_ledger 
       (citizen_id, transaction_type, original_amount, burn_amount, net_amount, burn_rate)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        citizenId,
        transactionType,
        burnResult.originalAmount,
        burnResult.burnAmount,
        burnResult.netAmount,
        burnResult.burnRate,
      ]
    );
    
    // Update total burned supply (tracked in system_metrics table)
    await client.query(
      `INSERT INTO system_metrics (metric_name, metric_value, updated_at)
       VALUES ('total_burned', $1, NOW())
       ON CONFLICT (metric_name) DO UPDATE SET
         metric_value = system_metrics.metric_value + $1,
         updated_at = NOW()`,
      [burnResult.burnAmount]
    );
    
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
  
  return burnResult;
}

/**
 * Get total burned supply
 */
export async function getTotalBurned(): Promise<number> {
  const result = await query<{ metric_value: string }>(
    `SELECT metric_value FROM system_metrics WHERE metric_name = 'total_burned'`
  );
  
  return parseFloat(result.rows[0]?.metric_value || '0');
}

/**
 * Check if Burn-to-One target is reached
 */
export async function checkBurnToOneStatus(): Promise<{
  isComplete: boolean;
  currentSupply: number;
  targetSupply: number;
  totalCitizens: number;
  progress: number;
}> {
  const totalSupply = await getTotalVidaCapSupply();
  const totalCitizens = await getTotalCitizens();
  const targetSupply = totalCitizens * 1.0; // 1 VIDA Cap per citizen
  const isComplete = isBurnToOneComplete(totalSupply, totalCitizens);
  
  const progress = isComplete ? 100 : Math.min(100, ((5_000_000_000 - totalSupply) / (5_000_000_000 - targetSupply)) * 100);
  
  return {
    isComplete,
    currentSupply: totalSupply,
    targetSupply,
    totalCitizens,
    progress,
  };
}


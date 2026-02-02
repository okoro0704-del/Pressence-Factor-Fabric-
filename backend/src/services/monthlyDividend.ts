/**
 * PFF Backend — Monthly Truth Dividend Service
 * Manages monthly dividend distribution to verified truth-tellers
 * Architect: Isreal Okoro (mrfundzman)
 *
 * Purpose:
 * - Register citizens who perform successful 4-layer PFF handshakes
 * - Execute monthly flush on last day of month at 23:59 GMT
 * - Distribute Global Citizen Block balance equally to all verified truth-tellers
 * - Send dividend notifications to recipients
 */

import { pool, query } from '../db/client';
import * as crypto from 'crypto';

export interface MonthlyFlushResult {
  success: boolean;
  distributionMonth: string;
  totalBlockValue: number;
  totalTruthTellers: number;
  sharePerCitizen: number;
  distributionHash: string;
  distributedAt: Date;
  error?: string;
}

export interface TruthTellerRegistration {
  citizenId: string;
  pffId: string;
  verifiedMonth: string;
  handshakeSessionId: string;
}

/**
 * Register a citizen as a verified truth-teller for the current month
 * Called after successful 4-layer PFF handshake
 */
export async function registerTruthTeller(
  citizenId: string,
  pffId: string,
  handshakeSessionId: string
): Promise<boolean> {
  const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM

  try {
    await query(
      `INSERT INTO verified_truth_tellers (citizen_id, pff_id, verified_month, handshake_session_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (citizen_id, verified_month) DO NOTHING`,
      [citizenId, pffId, currentMonth, handshakeSessionId]
    );
    return true;
  } catch (e) {
    console.error('Failed to register truth-teller:', e);
    return false;
  }
}

/**
 * Get total balance of Global Citizen Block
 */
async function getTotalGlobalCitizenBlock(): Promise<number> {
  const result = await query<{ total: string }>(
    `SELECT COALESCE(SUM(amount), 0) as total FROM global_citizen_block`
  );
  return parseFloat(result.rows[0]?.total || '0');
}

/**
 * Get all verified truth-tellers for a specific month
 */
async function getVerifiedTruthTellers(month: string): Promise<TruthTellerRegistration[]> {
  const result = await query<TruthTellerRegistration>(
    `SELECT citizen_id as "citizenId", pff_id as "pffId", verified_month as "verifiedMonth", handshake_session_id as "handshakeSessionId"
     FROM verified_truth_tellers
     WHERE verified_month = $1`,
    [month]
  );
  return result.rows;
}

/**
 * Execute monthly dividend distribution
 * Called by cron job on last day of month at 23:59 GMT
 */
export async function executeMonthlyFlush(): Promise<MonthlyFlushResult> {
  const timestamp = new Date();
  const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
  const distributionHash = crypto.createHash('sha256').update(`${currentMonth}-${timestamp.toISOString()}`).digest('hex');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Get total Global Citizen Block balance
    const totalBlockValue = await getTotalGlobalCitizenBlock();

    if (totalBlockValue <= 0) {
      await client.query('ROLLBACK');
      return {
        success: false,
        distributionMonth: currentMonth,
        totalBlockValue: 0,
        totalTruthTellers: 0,
        sharePerCitizen: 0,
        distributionHash,
        distributedAt: timestamp,
        error: 'No funds in Global Citizen Block',
      };
    }

    // 2. Get all verified truth-tellers for current month
    const truthTellers = await getVerifiedTruthTellers(currentMonth);

    if (truthTellers.length === 0) {
      await client.query('ROLLBACK');
      return {
        success: false,
        distributionMonth: currentMonth,
        totalBlockValue,
        totalTruthTellers: 0,
        sharePerCitizen: 0,
        distributionHash,
        distributedAt: timestamp,
        error: 'No verified truth-tellers for this month',
      };
    }

    // 3. Calculate equal share per citizen
    const sharePerCitizen = totalBlockValue / truthTellers.length;

    // 4. Execute bulk transfer to all verified truth-tellers
    for (const truthTeller of truthTellers) {
      // Add dividend to citizen vault
      await client.query(
        `INSERT INTO citizen_vaults (citizen_id, amount, transaction_type, transaction_hash, created_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [truthTeller.citizenId, sharePerCitizen, 'monthly_truth_dividend', distributionHash, timestamp]
      );
    }

    // 5. Deduct total from Global Citizen Block
    await client.query(
      `INSERT INTO global_citizen_block (amount, transaction_type, transaction_hash, created_at)
       VALUES ($1, $2, $3, $4)`,
      [-totalBlockValue, 'dividend_distribution', distributionHash, timestamp]
    );

    // 6. Log to monthly dividend history
    await client.query(
      `INSERT INTO monthly_dividend_history (distribution_month, total_block_value, total_truth_tellers, share_per_citizen, distribution_hash, distributed_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [currentMonth, totalBlockValue, truthTellers.length, sharePerCitizen, distributionHash, timestamp]
    );

    await client.query('COMMIT');

    return {
      success: true,
      distributionMonth: currentMonth,
      totalBlockValue,
      totalTruthTellers: truthTellers.length,
      sharePerCitizen,
      distributionHash,
      distributedAt: timestamp,
    };
  } catch (e) {
    await client.query('ROLLBACK');
    const err = e as Error;
    return {
      success: false,
      distributionMonth: currentMonth,
      totalBlockValue: 0,
      totalTruthTellers: 0,
      sharePerCitizen: 0,
      distributionHash,
      distributedAt: timestamp,
      error: err.message,
    };
  } finally {
    client.release();
  }
}


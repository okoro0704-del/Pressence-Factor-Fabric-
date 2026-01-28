/**
 * PFF Backend — $VIDA Currency Issuance.
 * 1:1 issuance against VIDA CAP Reserve (debt-free backing).
 */

import * as crypto from 'crypto';
import { pool } from '../db/client';
import { getNationalReserve } from './vidaCap';
import { VIDA_ISSUANCE_RATIO, type VidaIssuanceResult } from '../../../core/economic';

/**
 * Generate VLT transaction hash.
 */
function generateTransactionHash(): string {
  return crypto
    .createHash('sha256')
    .update(`${Date.now()}-${crypto.randomBytes(16).toString('hex')}`)
    .digest('hex');
}

/**
 * Issue $VIDA against VIDA CAP Reserve (1:1 ratio).
 * Verifies reserve has sufficient VIDA CAP before issuance.
 */
export async function issueVida(
  amount: number,
  type: 'citizen' | 'state',
  citizenId?: string
): Promise<VidaIssuanceResult> {
  // 1. Verify reserve has enough VIDA CAP
  const reserve = await getNationalReserve();
  if (reserve.totalVidaCap < amount) {
    throw new Error(
      `Insufficient VIDA CAP in National Reserve. Available: ${reserve.totalVidaCap}, Requested: ${amount}`
    );
  }

  const transactionHash = generateTransactionHash();
  const before = reserve.totalVidaCap;
  const after = before - amount;

  // 2. Atomic transaction: Reserve VIDA CAP + Issue $VIDA + Log
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Update reserve
    await client.query(
      `UPDATE national_reserve
       SET vida_cap_balance = $1, last_updated = NOW()
       WHERE id = '00000000-0000-0000-0000-000000000001'::uuid`,
      [after]
    );

    // Issue $VIDA
    await client.query(
      `INSERT INTO vida_currency 
       (issuance_type, citizen_id, amount, vida_cap_backing, reserve_balance_before, reserve_balance_after, transaction_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [type, citizenId || null, amount, amount, before, after, transactionHash]
    );

    // Log to VLT
    await client.query(
      `INSERT INTO vlt_transactions 
       (transaction_type, transaction_hash, citizen_id, amount, from_vault, to_vault, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        'issue',
        transactionHash,
        citizenId || null,
        amount,
        'national_reserve',
        type === 'citizen' ? 'citizen' : 'state',
        JSON.stringify({ type, ratio: VIDA_ISSUANCE_RATIO }),
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
    vidaIssued: amount,
    vidaCapReserved: amount,
    reserveBalanceBefore: before,
    reserveBalanceAfter: after,
    transactionHash,
  };
}

/**
 * Get $VIDA issuance history for a citizen.
 */
export async function getCitizenVidaHistory(
  citizenId: string
): Promise<
  Array<{
    amount: number;
    vidaCapBacking: number;
    issuedAt: string;
    transactionHash: string;
    status: string;
  }>
> {
  const { rows } = await query<{
    amount: string;
    vida_cap_backing: string;
    issued_at: string;
    transaction_hash: string;
    status: string;
  }>(
    `SELECT amount, vida_cap_backing, issued_at, transaction_hash, status
     FROM vida_currency
     WHERE citizen_id = $1
     ORDER BY issued_at DESC`,
    [citizenId]
  );

  return rows.map((r) => ({
    amount: parseFloat(r.amount),
    vidaCapBacking: parseFloat(r.vida_cap_backing),
    issuedAt: r.issued_at,
    transactionHash: r.transaction_hash,
    status: r.status,
  }));
}

/**
 * Get total $VIDA in circulation.
 */
export async function getTotalVidaInCirculation(): Promise<number> {
  const { rows } = await query<{ total: string }>(
    `SELECT COALESCE(SUM(amount), 0) as total
     FROM vida_currency
     WHERE status = 'issued'`
  );

  return parseFloat(rows[0]?.total || '0');
}

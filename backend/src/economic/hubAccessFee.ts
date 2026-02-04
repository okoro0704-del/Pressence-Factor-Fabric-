/**
 * PFF Backend — Sovereign Hub Access Fee.
 * When a new user is registered via Guest Mode, 0.1 VIDA ($100) is deducted from their
 * $1,000 Liquid grant and transferred to the device owner's primary wallet (citizen vault).
 * Transaction only runs after the grant is issued (new user balance >= 1.0 VIDA).
 * Label in transaction history: "Sovereign Hub Access Fee".
 */

import * as crypto from 'crypto';
import { pool, query } from '../db/client';
import {
  HUB_SERVICE_FEE_VIDA,
  MIN_BALANCE_FOR_HUB_FEE_VIDA,
} from '../../../core/economic';
import { getCitizenVidaCapBalance } from './vidaCap';

const SOVEREIGN_HUB_ACCESS_FEE_LABEL = 'Sovereign Hub Access Fee';

function generateTransactionHash(): string {
  return crypto
    .createHash('sha256')
    .update(`hub-fee-${Date.now()}-${crypto.randomBytes(16).toString('hex')}`)
    .digest('hex');
}

export interface ProcessHubAccessFeeResult {
  processed: boolean;
  transactionHash?: string;
  error?: string;
}

/**
 * Resolve the device owner (first citizen registered on this device_id, excluding the new guest).
 */
async function getDeviceOwnerCitizenId(
  hostDeviceId: string,
  excludeCitizenId: string
): Promise<{ id: string; pff_id: string } | null> {
  const { rows } = await query<{ id: string; pff_id: string }>(
    `SELECT id, pff_id FROM citizens
     WHERE device_id = $1 AND id != $2 AND vitalization_status = 'vitalized'
     ORDER BY created_at ASC
     LIMIT 1`,
    [hostDeviceId, excludeCitizenId]
  );
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Process Sovereign Hub Access Fee: deduct 0.1 VIDA from new user's Liquid (citizen vault),
 * transfer to the device owner's primary wallet (citizen vault). Only runs if new user
 * balance >= 1.0 VIDA (grant already issued). Records VLT with label "Sovereign Hub Access Fee".
 */
export async function processHubAccessFee(
  newCitizenId: string,
  newPffId: string,
  hostDeviceId: string
): Promise<ProcessHubAccessFeeResult> {
  try {
    const balance = await getCitizenVidaCapBalance(newCitizenId);
    if (!balance || balance.vidaCapBalance < MIN_BALANCE_FOR_HUB_FEE_VIDA) {
      return { processed: false, error: 'Insufficient balance for hub fee (min 1.0 VIDA)' };
    }

    const owner = await getDeviceOwnerCitizenId(hostDeviceId, newCitizenId);
    if (!owner) {
      return { processed: false, error: 'No device owner found for host device' };
    }

    const transactionHash = generateTransactionHash();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Deduct from new user's citizen vault
      const deductResult = await client.query(
        `UPDATE citizen_vaults
         SET vida_cap_balance = vida_cap_balance - $1, updated_at = NOW()
         WHERE citizen_id = $2 AND vida_cap_balance >= $1
         RETURNING citizen_id`,
        [HUB_SERVICE_FEE_VIDA, newCitizenId]
      );
      if (deductResult.rowCount !== 1) {
        await client.query('ROLLBACK');
        return { processed: false, error: 'Deduction failed (insufficient balance or vault not found)' };
      }

      // 2. Credit device owner's primary wallet (citizen vault)
      await client.query(
        `INSERT INTO citizen_vaults (citizen_id, pff_id, vida_cap_balance)
         VALUES ($1, $2, $3)
         ON CONFLICT (citizen_id) DO UPDATE SET
           vida_cap_balance = citizen_vaults.vida_cap_balance + $3,
           updated_at = NOW()`,
        [owner.id, owner.pff_id, HUB_SERVICE_FEE_VIDA]
      );

      // 3. VLT: transfer with label "Sovereign Hub Access Fee"
      await client.query(
        `INSERT INTO vlt_transactions
         (transaction_type, transaction_hash, citizen_id, amount, from_vault, to_vault, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          'transfer',
          transactionHash,
          newCitizenId,
          HUB_SERVICE_FEE_VIDA,
          'citizen',
          'citizen',
          JSON.stringify({
            label: SOVEREIGN_HUB_ACCESS_FEE_LABEL,
            from_citizen_id: newCitizenId,
            from_pff_id: newPffId,
            to_citizen_id: owner.id,
            to_pff_id: owner.pff_id,
            host_device_id: hostDeviceId,
          }),
        ]
      );

      await client.query('COMMIT');
      return { processed: true, transactionHash };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (e) {
    const err = e as Error;
    return { processed: false, error: err.message };
  }
}

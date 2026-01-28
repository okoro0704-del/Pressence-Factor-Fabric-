/**
 * PFF Backend — VIDA CAP Minting & Management.
 * Implements 50/50 split: Citizen Vault + National Reserve.
 */

import * as crypto from 'crypto';
import { pool } from '../db/client';
import {
  VIDA_CAP_MINT_AMOUNT,
  MINTING_SPLIT_CITIZEN,
  MINTING_SPLIT_NATIONAL,
  type VidaCapAllocation,
} from '../../../core/economic';

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
 * Mint VIDA CAP upon Vitalization with 50/50 split.
 * Atomic transaction: allocation + citizen vault + national reserve.
 */
export async function mintVidaCap(
  citizenId: string,
  pffId: string
): Promise<VidaCapAllocation> {
  // Calculate split
  const totalMinted = VIDA_CAP_MINT_AMOUNT;
  const citizenShare = totalMinted * MINTING_SPLIT_CITIZEN;
  const nationalShare = totalMinted * MINTING_SPLIT_NATIONAL;
  const transactionHash = generateTransactionHash();

  // Atomic transaction
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // 1. Insert allocation record
    await client.query(
      `INSERT INTO vida_cap_allocations 
       (citizen_id, pff_id, total_minted, citizen_share, national_reserve_share, transaction_hash)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [citizenId, pffId, totalMinted, citizenShare, nationalShare, transactionHash]
    );

    // 2. Update/create citizen vault
    await client.query(
      `INSERT INTO citizen_vaults (citizen_id, pff_id, vida_cap_balance)
       VALUES ($1, $2, $3)
       ON CONFLICT (citizen_id) DO UPDATE SET
         vida_cap_balance = citizen_vaults.vida_cap_balance + $3,
         updated_at = NOW()`,
      [citizenId, pffId, citizenShare]
    );

    // 3. Update national reserve (singleton, id = 1)
    await client.query(
      `INSERT INTO national_reserve (id, vida_cap_balance)
       VALUES ('00000000-0000-0000-0000-000000000001'::uuid, $1)
       ON CONFLICT (id) DO UPDATE SET
         vida_cap_balance = national_reserve.vida_cap_balance + $1,
         last_updated = NOW()`,
      [nationalShare]
    );

    // 4. Log to VLT
    await client.query(
      `INSERT INTO vlt_transactions 
       (transaction_type, transaction_hash, citizen_id, amount, from_vault, to_vault, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        'mint',
        transactionHash,
        citizenId,
        totalMinted,
        'external',
        'split',
        JSON.stringify({ citizenShare, nationalShare }),
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
    totalMinted,
    citizenShare,
    nationalReserveShare: nationalShare,
    transactionHash,
  };
}

/**
 * Get citizen VIDA CAP balance.
 */
export async function getCitizenVidaCapBalance(
  citizenId: string
): Promise<{ vidaCapBalance: number; pffId: string } | null> {
  const { rows } = await query<{
    vida_cap_balance: string;
    pff_id: string;
  }>(
    `SELECT vida_cap_balance, pff_id
     FROM citizen_vaults
     WHERE citizen_id = $1`,
    [citizenId]
  );

  if (rows.length === 0) return null;

  return {
    vidaCapBalance: parseFloat(rows[0].vida_cap_balance),
    pffId: rows[0].pff_id,
  };
}

/**
 * Get National Reserve VIDA CAP total.
 */
export async function getNationalReserve(): Promise<{
  totalVidaCap: number;
  lastUpdated: string;
}> {
  const { rows } = await query<{
    vida_cap_balance: string;
    last_updated: string;
  }>(
    `SELECT vida_cap_balance, last_updated
     FROM national_reserve
     WHERE id = '00000000-0000-0000-0000-000000000001'::uuid
     LIMIT 1`
  );

  if (rows.length === 0) {
    // Initialize if not exists
    await query(
      `INSERT INTO national_reserve (id, vida_cap_balance)
       VALUES ('00000000-0000-0000-0000-000000000001'::uuid, 0)
       ON CONFLICT (id) DO NOTHING`
    );
    return { totalVidaCap: 0, lastUpdated: new Date().toISOString() };
  }

  return {
    totalVidaCap: parseFloat(rows[0].vida_cap_balance),
    lastUpdated: rows[0].last_updated,
  };
}

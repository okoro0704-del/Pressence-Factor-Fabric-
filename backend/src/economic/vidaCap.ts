/**
 * PFF Backend — VIDA CAP Minting & Management.
 * Sovereign Handshake: 10 VIDA grant with three-way mint (5 gov, 4.98 user, 0.02 sentinel).
 * All three legs recorded in sovereign_mint_ledger with a single batch_id so the 50% government split is never bypassed.
 */

import * as crypto from 'crypto';
import { pool, query } from '../db/client';
import {
  GROSS_SOVEREIGN_GRANT_VIDA,
  GOVERNMENT_TREASURY_VIDA,
  USER_WALLET_VIDA,
  SENTINEL_BUSINESS_VIDA,
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
 * Mint VIDA CAP upon Vitalization — Sovereign Handshake (three-way mint).
 * 5.00 VIDA → government_treasury_vault, 4.98 VIDA → user_wallet, 0.02 VIDA → sentinel_business_ledger.
 * All three recorded in sovereign_mint_ledger with one batch_id (atomic).
 */
export async function mintVidaCap(
  citizenId: string,
  pffId: string
): Promise<VidaCapAllocation> {
  const totalMinted = GROSS_SOVEREIGN_GRANT_VIDA;
  const governmentShare = GOVERNMENT_TREASURY_VIDA;
  const userShare = USER_WALLET_VIDA;
  const sentinelShare = SENTINEL_BUSINESS_VIDA;
  const transactionHash = generateTransactionHash();
  const batchId = crypto.randomUUID();

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Insert allocation record (with batch_id and sentinel_share)
    await client.query(
      `INSERT INTO vida_cap_allocations 
       (citizen_id, pff_id, total_minted, citizen_share, national_reserve_share, sentinel_share, batch_id, transaction_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [citizenId, pffId, totalMinted, userShare, governmentShare, sentinelShare, batchId, transactionHash]
    );

    // 2. User wallet (citizen vault) — 4.98 VIDA
    await client.query(
      `INSERT INTO citizen_vaults (citizen_id, pff_id, vida_cap_balance)
       VALUES ($1, $2, $3)
       ON CONFLICT (citizen_id) DO UPDATE SET
         vida_cap_balance = citizen_vaults.vida_cap_balance + $3,
         updated_at = NOW()`,
      [citizenId, pffId, userShare]
    );

    // 3. Government treasury (national reserve) — 5.00 VIDA
    await client.query(
      `INSERT INTO national_reserve (id, vida_cap_balance)
       VALUES ('00000000-0000-0000-0000-000000000001'::uuid, $1)
       ON CONFLICT (id) DO UPDATE SET
         vida_cap_balance = national_reserve.vida_cap_balance + $1,
         last_updated = NOW()`,
      [governmentShare]
    );

    // 4. Sovereign mint ledger — all three transactions with same batch_id (ensures 50% never bypassed)
    await client.query(
      `INSERT INTO sovereign_mint_ledger (batch_id, citizen_id, pff_id, destination, amount_vida, transaction_hash)
       VALUES ($1, $2, $3, 'government_treasury_vault', $4, $5),
              ($1, $2, $3, 'user_wallet', $6, $5),
              ($1, $2, $3, 'sentinel_business_ledger', $7, $5)`,
      [batchId, citizenId, pffId, governmentShare, transactionHash, userShare, sentinelShare]
    );

    // 5. VLT log
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
        JSON.stringify({ governmentShare, userShare, sentinelShare, batchId }),
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
    citizenShare: userShare,
    nationalReserveShare: governmentShare,
    sentinelShare,
    transactionHash,
    batchId,
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

/**
 * Total National Reserve Accumulated — sum of all 5 VIDA (government_treasury_vault) splits from sovereign_mint_ledger.
 * Government view stat: total from every citizen in the block.
 */
export async function getTotalNationalReserveAccumulated(): Promise<number> {
  try {
    const { rows } = await query<{ total: string }>(
      `SELECT COALESCE(SUM(amount_vida), 0)::text as total
       FROM sovereign_mint_ledger
       WHERE destination = 'government_treasury_vault'`
    );
    return rows.length > 0 ? parseFloat(rows[0].total) : 0;
  } catch {
    // Table may not exist before migration
    const reserve = await getNationalReserve();
    return reserve.totalVidaCap;
  }
}

export interface CitizenImpactRow {
  id: string;
  pff_id: string;
  amount_vida: number;
  created_at: string;
}

/**
 * Citizen Impact Feed — recent government_treasury_vault entries (3-of-4 verified → +5 VIDA).
 */
export async function getCitizenImpactFeed(limit = 50): Promise<CitizenImpactRow[]> {
  try {
    const { rows } = await query<{ id: string; pff_id: string; amount_vida: string; created_at: string }>(
      `SELECT id, pff_id, amount_vida, created_at
       FROM sovereign_mint_ledger
       WHERE destination = 'government_treasury_vault'
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit]
    );
    return rows.map((r) => ({
      id: r.id,
      pff_id: r.pff_id,
      amount_vida: parseFloat(r.amount_vida),
      created_at: r.created_at,
    }));
  } catch {
    return [];
  }
}

export interface TreasuryGrowthDayRow {
  date: string;
  total_vida: number;
  cumulative_vida: number;
}

/**
 * Treasury growth over last N days (daily cumulative from sovereign_mint_ledger government_treasury_vault).
 */
export async function getTreasuryGrowthLastNDays(days = 30): Promise<TreasuryGrowthDayRow[]> {
  try {
    const { rows } = await query<{ day: string; total_vida: string; cumulative_vida: string }>(
      `WITH daily AS (
         SELECT date_trunc('day', created_at)::date AS day,
                COALESCE(SUM(amount_vida), 0) AS total_vida
         FROM sovereign_mint_ledger
         WHERE destination = 'government_treasury_vault'
           AND created_at >= NOW() - ($1::text || ' days')::interval
         GROUP BY date_trunc('day', created_at)::date
       ),
       ordered AS (
         SELECT day, total_vida::double precision,
                SUM(total_vida::double precision) OVER (ORDER BY day) AS cumulative_vida
         FROM daily
       )
       SELECT day::text, total_vida::text, cumulative_vida::text FROM ordered ORDER BY day`,
      [days]
    );
    return rows.map((r) => ({
      date: r.day,
      total_vida: parseFloat(r.total_vida),
      cumulative_vida: parseFloat(r.cumulative_vida),
    }));
  } catch {
    return [];
  }
}

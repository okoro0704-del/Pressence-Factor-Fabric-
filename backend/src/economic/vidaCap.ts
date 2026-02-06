/**
 * PFF Backend — VIDA CAP Minting & Management.
 * mintOnVitalization: 10 VIDA per new user → 5 National_Vault (70/30 lock), 5 Citizen_Vault (4/1 lock).
 * After VITALIZATION_CAP: 2 VIDA per user and Burning Mechanism enabled.
 */

import * as crypto from 'crypto';
import { pool, query } from '../db/client';
import {
  VITALIZATION_CAP,
  GROSS_SOVEREIGN_GRANT_VIDA,
  POST_HALVING_MINT_VIDA,
  NATIONAL_VAULT_VIDA,
  CITIZEN_VAULT_VIDA,
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

/** Total VIDA CAP minted across all citizens (lifecycle). Used for halving and burn. */
export async function getTotalVidaCapMinted(): Promise<number> {
  try {
    const { rows } = await query<{ total: string }>(
      `SELECT COALESCE(SUM(total_minted), 0)::text AS total FROM vida_cap_allocations`
    );
    return rows.length > 0 ? parseFloat(rows[0].total) : 0;
  } catch {
    return 0;
  }
}

/** True when total minted >= VITALIZATION_CAP; minting halves to 2 VIDA and Burning Mechanism is enabled. */
export async function isHalvingActive(): Promise<boolean> {
  const total = await getTotalVidaCapMinted();
  return total >= VITALIZATION_CAP;
}

export interface MintOnVitalizationResult extends VidaCapAllocation {
  halvingActive: boolean;
  burningEnabled: boolean;
}

/**
 * Mint on Vitalization: 10 VIDA per new user (or 2 after cap).
 * 50:50 split: 5 → National_Vault (70/30 lock), 5 → Citizen_Vault (4/1 lock).
 * National: hasSignedSovereignClauses = false → 70% remains untouchable.
 * Citizen: 1 VIDA released via 9-Day Ritual ($100/day until $1,000 spendable).
 */
export async function mintOnVitalization(
  citizenId: string,
  pffId: string
): Promise<MintOnVitalizationResult> {
  const totalMintedLifecycle = await getTotalVidaCapMinted();
  const halvingActive = totalMintedLifecycle >= VITALIZATION_CAP;
  const burningEnabled = halvingActive;

  const totalMinted = halvingActive ? POST_HALVING_MINT_VIDA : GROSS_SOVEREIGN_GRANT_VIDA;
  const nationalShare = halvingActive ? 1 : NATIONAL_VAULT_VIDA;
  const citizenShare = halvingActive ? 1 : CITIZEN_VAULT_VIDA;

  const nationalLocked70 = nationalShare * 0.7;
  const nationalSpendable30 = nationalShare * 0.3;
  const citizenLocked4 = citizenShare * (4 / 5);
  const citizenRitual1 = citizenShare * (1 / 5);

  const transactionHash = generateTransactionHash();
  const batchId = crypto.randomUUID();
  const NATIONAL_RESERVE_ID = '00000000-0000-0000-0000-000000000001';

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `INSERT INTO vida_cap_allocations 
       (citizen_id, pff_id, total_minted, citizen_share, national_reserve_share, sentinel_share, batch_id, transaction_hash)
       VALUES ($1, $2, $3, $4, $5, 0, $6, $7)`,
      [citizenId, pffId, totalMinted, citizenShare, nationalShare, batchId, transactionHash]
    );

    await client.query(
      `INSERT INTO citizen_vaults (citizen_id, pff_id, vida_cap_balance, vida_locked_4, vida_ritual_pool_1)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (citizen_id) DO UPDATE SET
         vida_cap_balance = citizen_vaults.vida_cap_balance + $3,
         vida_locked_4 = citizen_vaults.vida_locked_4 + $4,
         vida_ritual_pool_1 = citizen_vaults.vida_ritual_pool_1 + $5,
         updated_at = NOW()`,
      [citizenId, pffId, citizenShare, citizenLocked4, citizenRitual1]
    );

    await client.query(
      `INSERT INTO national_reserve (id, vida_cap_balance, vida_locked_70, vida_spendable_30)
       VALUES ($1::uuid, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET
         vida_cap_balance = national_reserve.vida_cap_balance + $2,
         vida_locked_70 = national_reserve.vida_locked_70 + $3,
         vida_spendable_30 = national_reserve.vida_spendable_30 + $4,
         last_updated = NOW()`,
      [NATIONAL_RESERVE_ID, nationalShare, nationalLocked70, nationalSpendable30]
    );

    await client.query(
      `INSERT INTO sovereign_mint_ledger (batch_id, citizen_id, pff_id, destination, amount_vida, transaction_hash)
       VALUES ($1, $2, $3, 'government_treasury_vault', $4, $5),
              ($1, $2, $3, 'user_wallet', $6, $5)`,
      [batchId, citizenId, pffId, nationalShare, transactionHash, citizenShare]
    );

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
        JSON.stringify({
          nationalShare,
          citizenShare,
          nationalLocked70,
          nationalSpendable30,
          citizenLocked4,
          citizenRitual1,
          halvingActive,
          burningEnabled,
          batchId,
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

  return {
    totalMinted,
    citizenShare,
    nationalReserveShare: nationalShare,
    sentinelShare: 0,
    transactionHash,
    batchId,
    halvingActive,
    burningEnabled,
  };
}

/**
 * Mint VIDA CAP upon Vitalization — Legacy Sovereign Handshake (three-way mint).
 * 5.00 VIDA → government_treasury_vault, 4.98 VIDA → user_wallet, 0.02 VIDA → sentinel_business_ledger.
 * Prefer mintOnVitalization for new flows (50:50 with 70/30 and 4/1 locks).
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

    await client.query(
      `INSERT INTO vida_cap_allocations 
       (citizen_id, pff_id, total_minted, citizen_share, national_reserve_share, sentinel_share, batch_id, transaction_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [citizenId, pffId, totalMinted, userShare, governmentShare, sentinelShare, batchId, transactionHash]
    );

    await client.query(
      `INSERT INTO citizen_vaults (citizen_id, pff_id, vida_cap_balance)
       VALUES ($1, $2, $3)
       ON CONFLICT (citizen_id) DO UPDATE SET
         vida_cap_balance = citizen_vaults.vida_cap_balance + $3,
         updated_at = NOW()`,
      [citizenId, pffId, userShare]
    );

    await client.query(
      `INSERT INTO national_reserve (id, vida_cap_balance)
       VALUES ('00000000-0000-0000-0000-000000000001'::uuid, $1)
       ON CONFLICT (id) DO UPDATE SET
         vida_cap_balance = national_reserve.vida_cap_balance + $1,
         last_updated = NOW()`,
      [governmentShare]
    );

    await client.query(
      `INSERT INTO sovereign_mint_ledger (batch_id, citizen_id, pff_id, destination, amount_vida, transaction_hash)
       VALUES ($1, $2, $3, 'government_treasury_vault', $4, $5),
              ($1, $2, $3, 'user_wallet', $6, $5),
              ($1, $2, $3, 'sentinel_business_ledger', $7, $5)`,
      [batchId, citizenId, pffId, governmentShare, transactionHash, userShare, sentinelShare]
    );

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
 * Burning Mechanism: burn VIDA CAP from a citizen vault. Only allowed when total minted >= VITALIZATION_CAP.
 * Returns success and new balance, or error if burning not enabled or insufficient balance.
 */
export async function burnVidaCap(
  citizenId: string,
  amount: number
): Promise<{ ok: true; newBalance: number } | { ok: false; error: string }> {
  if (amount <= 0) return { ok: false, error: 'Amount must be positive' };
  const burningEnabled = await isHalvingActive();
  if (!burningEnabled) return { ok: false, error: 'Burning is not enabled until VITALIZATION_CAP is reached' };

  const client = await pool.connect();
  try {
    const { rows } = await client.query<{ vida_cap_balance: string }>(
      `SELECT vida_cap_balance FROM citizen_vaults WHERE citizen_id = $1`,
      [citizenId]
    );
    if (rows.length === 0) return { ok: false, error: 'Citizen vault not found' };
    const current = parseFloat(rows[0].vida_cap_balance);
    if (current < amount) return { ok: false, error: 'Insufficient VIDA CAP to burn' };

    const newBalance = current - amount;
    const transactionHash = generateTransactionHash();

    await client.query('BEGIN');
    await client.query(
      `UPDATE citizen_vaults SET vida_cap_balance = $1, updated_at = NOW() WHERE citizen_id = $2`,
      [newBalance, citizenId]
    );
    await client.query(
      `INSERT INTO vlt_transactions (transaction_type, transaction_hash, citizen_id, amount, from_vault, to_vault, metadata)
       VALUES ('burn', $1, $2, $3, 'citizen', 'burn', $4)`,
      [transactionHash, citizenId, amount, JSON.stringify({ burningEnabled: true })]
    );
    await client.query('COMMIT');
    return { ok: true, newBalance };
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}

/**
 * Get National Reserve status including diplomatic lock (hasSignedSovereignClauses).
 * When false, the 70% (vida_locked_70) is untouchable.
 */
export async function getNationalReserveWithLocks(): Promise<{
  totalVidaCap: number;
  vidaLocked70: number;
  vidaSpendable30: number;
  hasSignedSovereignClauses: boolean;
  lastUpdated: string;
}> {
  const { rows } = await query<{
    vida_cap_balance: string;
    vida_locked_70: string | null;
    vida_spendable_30: string | null;
    has_signed_sovereign_clauses: boolean | null;
    last_updated: string;
  }>(
    `SELECT vida_cap_balance, vida_locked_70, vida_spendable_30, has_signed_sovereign_clauses, last_updated
     FROM national_reserve WHERE id = '00000000-0000-0000-0000-000000000001'::uuid LIMIT 1`
  );
  if (rows.length === 0) {
    return {
      totalVidaCap: 0,
      vidaLocked70: 0,
      vidaSpendable30: 0,
      hasSignedSovereignClauses: false,
      lastUpdated: new Date().toISOString(),
    };
  }
  const r = rows[0];
  return {
    totalVidaCap: parseFloat(r.vida_cap_balance),
    vidaLocked70: r.vida_locked_70 != null ? parseFloat(r.vida_locked_70) : 0,
    vidaSpendable30: r.vida_spendable_30 != null ? parseFloat(r.vida_spendable_30) : 0,
    hasSignedSovereignClauses: r.has_signed_sovereign_clauses ?? false,
    lastUpdated: r.last_updated,
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

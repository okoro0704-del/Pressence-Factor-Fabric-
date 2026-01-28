/**
 * PFF Backend — Recovery Split System.
 * Implements 45-10-45 split: People (45%) + State (45%) + Agents (10%).
 */

import * as crypto from 'crypto';
import { pool, query } from '../db/client';
import {
  RECOVERY_SPLIT_PEOPLE,
  RECOVERY_SPLIT_STATE,
  RECOVERY_SPLIT_AGENT,
  type RecoverySplitResult,
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
 * Distribute recovery share proportionally to all citizens based on their VIDA CAP balance.
 */
async function distributeProportionalToCitizens(
  client: any,
  peopleShare: number
): Promise<void> {
  // Get total citizen VIDA CAP
  const totalResult = await client.query(
    `SELECT COALESCE(SUM(vida_cap_balance), 0) as total FROM citizen_vaults`
  );
  const totalCitizenVidaCap = parseFloat(totalResult.rows[0]?.total || '0');

  if (totalCitizenVidaCap === 0) {
    // If no citizen VIDA CAP, distribute equally
    await distributeEqualToCitizens(client, peopleShare);
    return;
  }

  // Distribute proportionally
  const citizenResult = await client.query(
    `SELECT citizen_id, vida_cap_balance FROM citizen_vaults`
  );

  for (const citizen of citizenResult.rows) {
    const balance = parseFloat(citizen.vida_cap_balance);
    const share = (balance / totalCitizenVidaCap) * peopleShare;

    await client.query(
      `UPDATE citizen_vaults
       SET vida_cap_balance = vida_cap_balance + $1, updated_at = NOW()
       WHERE citizen_id = $2`,
      [share, citizen.citizen_id]
    );
  }
}

/**
 * Distribute recovery share equally to all citizens.
 */
async function distributeEqualToCitizens(
  client: any,
  peopleShare: number
): Promise<void> {
  // Get citizen count
  const countResult = await client.query(
    `SELECT COUNT(*) as count FROM citizen_vaults`
  );
  const citizenCount = parseInt(countResult.rows[0]?.count || '0', 10);

  if (citizenCount === 0) {
    // No citizens to distribute to
    return;
  }

  const sharePerCitizen = peopleShare / citizenCount;

  // Distribute equally
  await client.query(
    `UPDATE citizen_vaults
     SET vida_cap_balance = vida_cap_balance + $1, updated_at = NOW()`,
    [sharePerCitizen]
  );
}

/**
 * Process external fund recovery with 45-10-45 split.
 * Atomic transaction: all distributions happen together.
 */
export async function processRecovery(
  recoveryAmount: number,
  agentId: string,
  distributionMethod: 'proportional' | 'equal' = 'proportional',
  metadata?: Record<string, unknown>
): Promise<RecoverySplitResult> {
  // Calculate split
  const agentShare = recoveryAmount * RECOVERY_SPLIT_AGENT;
  const peopleShare = recoveryAmount * RECOVERY_SPLIT_PEOPLE;
  const stateShare = recoveryAmount * RECOVERY_SPLIT_STATE;
  const transactionHash = generateTransactionHash();

  // Atomic transaction
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // 1. Log recovery transaction
    await client.query(
      `INSERT INTO recovery_transactions 
       (recovery_amount, people_share, state_share, agent_share, agent_id, distribution_method, transaction_hash, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        recoveryAmount,
        peopleShare,
        stateShare,
        agentShare,
        agentId,
        distributionMethod,
        transactionHash,
        metadata ? JSON.stringify(metadata) : null,
      ]
    );

    // 2. Distribute to people
    if (distributionMethod === 'proportional') {
      await distributeProportionalToCitizens(client, peopleShare);
    } else {
      await distributeEqualToCitizens(client, peopleShare);
    }

    // 3. Add to national reserve
    await client.query(
      `UPDATE national_reserve
       SET vida_cap_balance = vida_cap_balance + $1, last_updated = NOW()
       WHERE id = '00000000-0000-0000-0000-000000000001'::uuid`,
      [stateShare]
    );

    // 4. Log agent share (tracked in recovery_transactions, can be extended with agent_vaults table if needed)

    // 5. Log to VLT
    await client.query(
      `INSERT INTO vlt_transactions 
       (transaction_type, transaction_hash, amount, from_vault, to_vault, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        'recovery',
        transactionHash,
        recoveryAmount,
        'external',
        'split',
        JSON.stringify({
          peopleShare,
          stateShare,
          agentShare,
          agentId,
          distributionMethod,
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
    peopleShare,
    stateShare,
    agentShare,
    transactionHash,
  };
}

/**
 * Get recovery transaction history.
 */
export async function getRecoveryHistory(limit: number = 100): Promise<
  Array<{
    recoveryAmount: number;
    peopleShare: number;
    stateShare: number;
    agentShare: number;
    agentId: string;
    recoveredAt: string;
    transactionHash: string;
  }>
> {
  const { rows } = await query<{
    recovery_amount: string;
    people_share: string;
    state_share: string;
    agent_share: string;
    agent_id: string;
    recovered_at: string;
    transaction_hash: string;
  }>(
    `SELECT recovery_amount, people_share, state_share, agent_share, agent_id, recovered_at, transaction_hash
     FROM recovery_transactions
     ORDER BY recovered_at DESC
     LIMIT $1`,
    [limit]
  );

  return rows.map((r) => ({
    recoveryAmount: parseFloat(r.recovery_amount),
    peopleShare: parseFloat(r.people_share),
    stateShare: parseFloat(r.state_share),
    agentShare: parseFloat(r.agent_share),
    agentId: r.agent_id,
    recoveredAt: r.recovered_at,
    transactionHash: r.transaction_hash,
  }));
}

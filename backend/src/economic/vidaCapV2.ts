/**
 * PFF Backend — VIDA CAP Minting V2 with Sovereign Gold Rush Logic
 * Genesis Protocol v1.0
 * Architect: Isreal Okoro (mrfundzman)
 * 
 * Implements era-based minting:
 * - 10 VIDA Cap per citizen (Pre-Burn Era, before 5B supply)
 * - 2 VIDA Cap per citizen (Post-Burn Era, after 5B supply)
 */

import * as crypto from 'crypto';
import { pool } from '../db/client';
import {
  MINTING_SPLIT_CITIZEN,
  MINTING_SPLIT_NATIONAL,
  type VidaCapAllocation,
} from '../../../core/economic';
import { getNextMintAmount, getCurrentEraStatus } from './goldRush';

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
 * Uses Sovereign Gold Rush logic to determine mint amount based on current era.
 * 
 * Atomic transaction: allocation + citizen vault + national reserve + era tracking.
 */
export async function mintVidaCapWithEra(
  citizenId: string,
  pffId: string
): Promise<VidaCapAllocation & { era: string; eraStatus: any }> {
  // Get mint amount based on current era
  const mintInfo = await getNextMintAmount();
  const eraStatus = await getCurrentEraStatus();
  
  const totalMinted = mintInfo.mintAmount;
  const citizenShare = totalMinted * MINTING_SPLIT_CITIZEN;
  const nationalShare = totalMinted * MINTING_SPLIT_NATIONAL;
  const transactionHash = generateTransactionHash();

  // Atomic transaction
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // 1. Insert allocation record with era information
    await client.query(
      `INSERT INTO vida_cap_allocations 
       (citizen_id, pff_id, total_minted, citizen_share, national_reserve_share, transaction_hash, era, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        citizenId,
        pffId,
        totalMinted,
        citizenShare,
        nationalShare,
        transactionHash,
        mintInfo.era,
        JSON.stringify({
          eraAtMint: mintInfo.era,
          totalSupplyAtMint: eraStatus.totalSupply,
          remainingPreBurnSlots: eraStatus.remainingSlotsInPreBurn,
        }),
      ]
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

    // 4. Log to VLT with era metadata
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
          citizenShare,
          nationalShare,
          era: mintInfo.era,
          totalSupply: eraStatus.totalSupply,
          percentageToGreatBurn: eraStatus.percentageToGreatBurn,
        }),
      ]
    );
    
    // 5. Update era transition tracking if Great Burn just triggered
    if (eraStatus.currentEra === 'POST_BURN' && eraStatus.totalSupply >= 5_000_000_000) {
      await client.query(
        `INSERT INTO system_events (event_type, event_data, created_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT DO NOTHING`,
        [
          'GREAT_BURN_TRIGGERED',
          JSON.stringify({
            triggeredAt: new Date().toISOString(),
            totalSupply: eraStatus.totalSupply,
            totalCitizens: eraStatus.totalCitizens,
            triggeringCitizen: citizenId,
          }),
        ]
      );
    }

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
    era: mintInfo.era,
    eraStatus,
  };
}


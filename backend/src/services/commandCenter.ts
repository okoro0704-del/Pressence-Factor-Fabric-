/**
 * PFF Backend — Architect's Command Center Service
 * Business logic for telemetry, security status, and sovereign actions
 * Architect: Isreal Okoro (mrfundzman)
 */

import { query } from '../db/client';
import { ROOT_SOVEREIGN_PAIR, ARCHITECT_IDENTITY } from '../../../core/rootPairBinding';
import * as crypto from 'crypto';

// ============================================================================
// TYPES
// ============================================================================

export interface CommandCenterTelemetry {
  activeSentinels: {
    citizen: number;
    personalMulti: number;
    enterpriseLite: number;
    total: number;
  };
  totalTributes: {
    deepTruthVIDA: number;
    deepTruthUSD: number;
    businessCount: number;
    last24hVIDA: number;
  };
  nationalLiquidity: {
    totalReservesVIDA: number;
    totalReservesUSD: number;
    activeNations: number;
    avgReservePerNation: number;
  };
  lastUpdated: string;
}

export interface SecurityStatus {
  laptopBinded: boolean;
  mobileBinded: boolean;
  genesisHashVerified: boolean;
  laptopDeviceUUID: string;
  mobileDeviceUUID: string;
  lastVerificationTimestamp?: string;
}

export interface ActionResult {
  success: boolean;
  message?: string;
  error?: string;
  timestamp?: string;
}

export interface NationalLiquidity {
  nationCode: string;
  nationName: string;
  reservesVIDA: number;
  reservesUSD: number;
  citizenCount: number;
  avgReservePerCitizen: number;
  rank: number;
}

// ============================================================================
// TELEMETRY
// ============================================================================

/**
 * Get Command Center Telemetry
 * Real-time metrics for Sentinels, tributes, and national liquidity
 */
export async function getCommandCenterTelemetry(): Promise<CommandCenterTelemetry> {
  try {
    // Get active Sentinels count by tier
    const sentinelResult = await query<{
      tier: string;
      count: number;
    }>(
      `SELECT tier, COUNT(*) as count
       FROM sentinel_licenses
       WHERE status = 'ACTIVE'
       GROUP BY tier`
    );

    const sentinelCounts = {
      citizen: 0,
      personalMulti: 0,
      enterpriseLite: 0,
      total: 0,
    };

    sentinelResult.rows.forEach(row => {
      const count = parseInt(row.count.toString());
      if (row.tier === 'TIER_1_CITIZEN') sentinelCounts.citizen = count;
      if (row.tier === 'TIER_2_PERSONAL_MULTI') sentinelCounts.personalMulti = count;
      if (row.tier === 'TIER_3_ENTERPRISE_LITE') sentinelCounts.enterpriseLite = count;
      sentinelCounts.total += count;
    });

    // Get total tributes collected
    const tributeResult = await query<{
      total_vida: number;
      total_usd: number;
      business_count: number;
      last_24h_vida: number;
    }>(
      `SELECT 
         COALESCE(SUM(tribute_amount_vida), 0) as total_vida,
         COALESCE(SUM(tribute_amount_vida * 1.0), 0) as total_usd,
         COUNT(DISTINCT business_id) as business_count,
         COALESCE(SUM(CASE WHEN access_timestamp > NOW() - INTERVAL '24 hours' THEN tribute_amount_vida ELSE 0 END), 0) as last_24h_vida
       FROM deep_truth_access_log`
    );

    const tributes = tributeResult.rows[0] || {
      total_vida: 0,
      total_usd: 0,
      business_count: 0,
      last_24h_vida: 0,
    };

    // Get national liquidity levels
    const liquidityResult = await query<{
      total_reserves_vida: number;
      total_reserves_usd: number;
      active_nations: number;
      avg_reserve_per_nation: number;
    }>(
      `SELECT 
         COALESCE(SUM(balance_vida), 0) as total_reserves_vida,
         COALESCE(SUM(balance_vida * 1.0), 0) as total_reserves_usd,
         COUNT(*) as active_nations,
         COALESCE(AVG(balance_vida), 0) as avg_reserve_per_nation
       FROM national_liquidity_vaults
       WHERE balance_vida > 0`
    );

    const liquidity = liquidityResult.rows[0] || {
      total_reserves_vida: 0,
      total_reserves_usd: 0,
      active_nations: 0,
      avg_reserve_per_nation: 0,
    };

    return {
      activeSentinels: sentinelCounts,
      totalTributes: {
        deepTruthVIDA: parseFloat(tributes.total_vida.toString()),
        deepTruthUSD: parseFloat(tributes.total_usd.toString()),
        businessCount: parseInt(tributes.business_count.toString()),
        last24hVIDA: parseFloat(tributes.last_24h_vida.toString()),
      },
      nationalLiquidity: {
        totalReservesVIDA: parseFloat(liquidity.total_reserves_vida.toString()),
        totalReservesUSD: parseFloat(liquidity.total_reserves_usd.toString()),
        activeNations: parseInt(liquidity.active_nations.toString()),
        avgReservePerNation: parseFloat(liquidity.avg_reserve_per_nation.toString()),
      },
      lastUpdated: new Date().toISOString(),
    };
  } catch (e) {
    const err = e as Error;
    console.error('[COMMAND CENTER] Failed to fetch telemetry:', err);
    throw err;
  }
}

// ============================================================================
// SECURITY STATUS
// ============================================================================

/**
 * Get Security Status
 * Check ROOT_SOVEREIGN_PAIR binding status
 */
export async function getSecurityStatus(): Promise<SecurityStatus> {
  try {
    // Check if ROOT_SOVEREIGN_PAIR devices are registered
    const deviceResult = await query<{
      device_uuid: string;
      is_root_pair: boolean;
      created_at: Date;
    }>(
      `SELECT device_uuid, is_root_pair, created_at
       FROM root_sovereign_devices
       WHERE device_uuid IN ($1, $2)`,
      [ROOT_SOVEREIGN_PAIR.LAPTOP_DEVICE_UUID, ROOT_SOVEREIGN_PAIR.MOBILE_DEVICE_UUID]
    );

    const laptopBinded = deviceResult.rows.some(
      row => row.device_uuid === ROOT_SOVEREIGN_PAIR.LAPTOP_DEVICE_UUID && row.is_root_pair
    );
    const mobileBinded = deviceResult.rows.some(
      row => row.device_uuid === ROOT_SOVEREIGN_PAIR.MOBILE_DEVICE_UUID && row.is_root_pair
    );

    // Check if Genesis Authority Hash is verified
    const genesisResult = await query<{
      genesis_authority_hash: string;
      verified_at: Date;
    }>(
      `SELECT genesis_authority_hash, verified_at
       FROM genesis_verification
       WHERE citizen_id = $1
       ORDER BY verified_at DESC
       LIMIT 1`,
      [ARCHITECT_IDENTITY.CITIZEN_ID || 'PFF-ARCHITECT-001']
    );

    const genesisHashVerified = genesisResult.rows.length > 0 && genesisResult.rows[0].genesis_authority_hash.length > 0;
    const lastVerificationTimestamp = genesisResult.rows.length > 0
      ? genesisResult.rows[0].verified_at.toISOString()
      : undefined;

    return {
      laptopBinded,
      mobileBinded,
      genesisHashVerified,
      laptopDeviceUUID: ROOT_SOVEREIGN_PAIR.LAPTOP_DEVICE_UUID,
      mobileDeviceUUID: ROOT_SOVEREIGN_PAIR.MOBILE_DEVICE_UUID,
      lastVerificationTimestamp,
    };
  } catch (e) {
    const err = e as Error;
    console.error('[COMMAND CENTER] Failed to fetch security status:', err);

    // Return default status if database query fails
    return {
      laptopBinded: false,
      mobileBinded: false,
      genesisHashVerified: false,
      laptopDeviceUUID: ROOT_SOVEREIGN_PAIR.LAPTOP_DEVICE_UUID,
      mobileDeviceUUID: ROOT_SOVEREIGN_PAIR.MOBILE_DEVICE_UUID,
    };
  }
}

// ============================================================================
// TOP NATIONS BY LIQUIDITY
// ============================================================================

/**
 * Get Top Nations by Liquidity Reserves
 */
export async function getTopNationsByLiquidity(limit: number = 10): Promise<NationalLiquidity[]> {
  try {
    const result = await query<{
      nation_code: string;
      nation_name: string;
      balance_vida: number;
      balance_usd: number;
      citizen_count: number;
      avg_reserve_per_citizen: number;
    }>(
      `SELECT
         nlv.nation_code,
         nlv.nation_name,
         nlv.balance_vida,
         nlv.balance_vida * 1.0 as balance_usd,
         COALESCE(COUNT(DISTINCT c.citizen_id), 0) as citizen_count,
         CASE
           WHEN COUNT(DISTINCT c.citizen_id) > 0 THEN nlv.balance_vida / COUNT(DISTINCT c.citizen_id)
           ELSE 0
         END as avg_reserve_per_citizen
       FROM national_liquidity_vaults nlv
       LEFT JOIN citizens c ON c.nation_code = nlv.nation_code
       WHERE nlv.balance_vida > 0
       GROUP BY nlv.nation_code, nlv.nation_name, nlv.balance_vida
       ORDER BY nlv.balance_vida DESC
       LIMIT $1`,
      [limit]
    );

    return result.rows.map((row, index) => ({
      nationCode: row.nation_code,
      nationName: row.nation_name,
      reservesVIDA: parseFloat(row.balance_vida.toString()),
      reservesUSD: parseFloat(row.balance_usd.toString()),
      citizenCount: parseInt(row.citizen_count.toString()),
      avgReservePerCitizen: parseFloat(row.avg_reserve_per_citizen.toString()),
      rank: index + 1,
    }));
  } catch (e) {
    const err = e as Error;
    console.error('[COMMAND CENTER] Failed to fetch top nations:', err);
    return [];
  }
}

// ============================================================================
// SOVEREIGN ACTIONS
// ============================================================================

/**
 * Broadcast Message to Mesh
 * Send sovereign message to all connected Sentinels
 */
export async function broadcastToMesh(message: string): Promise<ActionResult> {
  const timestamp = new Date();
  const broadcastHash = crypto.randomBytes(32).toString('hex');

  try {
    // Log broadcast to VLT
    await query(
      `INSERT INTO vlt_transactions
       (transaction_type, transaction_hash, metadata, created_at)
       VALUES ($1, $2, $3, $4)`,
      [
        'MESH_BROADCAST',
        broadcastHash,
        JSON.stringify({
          message,
          source: 'ARCHITECT_COMMAND_CENTER',
          architectId: ARCHITECT_IDENTITY.PFF_ID,
          timestamp: timestamp.toISOString(),
        }),
        timestamp,
      ]
    );

    // Log system event
    await query(
      `INSERT INTO system_events (event_type, event_data, created_at)
       VALUES ($1, $2, $3)`,
      [
        'MESH_BROADCAST',
        JSON.stringify({
          message,
          broadcastHash,
          architectId: ARCHITECT_IDENTITY.PFF_ID,
        }),
        timestamp,
      ]
    );

    console.log(`[COMMAND CENTER] Mesh broadcast sent: ${message}`);

    return {
      success: true,
      message: 'Broadcast sent to all Sentinels',
      timestamp: timestamp.toISOString(),
    };
  } catch (e) {
    const err = e as Error;
    console.error('[COMMAND CENTER] Failed to broadcast to mesh:', err);

    return {
      success: false,
      error: 'Failed to broadcast to mesh',
      timestamp: timestamp.toISOString(),
    };
  }
}

/**
 * Trigger Emergency Stasis
 * Activate global protocol freeze
 */
export async function triggerEmergencyStasis(reason: string): Promise<ActionResult> {
  const timestamp = new Date();
  const stasisHash = crypto.randomBytes(32).toString('hex');

  try {
    // Log stasis trigger to VLT
    await query(
      `INSERT INTO vlt_transactions
       (transaction_type, transaction_hash, metadata, created_at)
       VALUES ($1, $2, $3, $4)`,
      [
        'EMERGENCY_STASIS_ACTIVATED',
        stasisHash,
        JSON.stringify({
          reason,
          source: 'ARCHITECT_COMMAND_CENTER',
          architectId: ARCHITECT_IDENTITY.PFF_ID,
          timestamp: timestamp.toISOString(),
        }),
        timestamp,
      ]
    );

    // Log system event
    await query(
      `INSERT INTO system_events (event_type, event_data, created_at)
       VALUES ($1, $2, $3)`,
      [
        'EMERGENCY_STASIS_ACTIVATED',
        JSON.stringify({
          reason,
          stasisHash,
          architectId: ARCHITECT_IDENTITY.PFF_ID,
        }),
        timestamp,
      ]
    );

    // Update stasis status in database
    await query(
      `UPDATE system_config
       SET config_value = 'true', updated_at = NOW()
       WHERE config_key = 'EMERGENCY_STASIS_ACTIVE'`
    );

    console.log(`[COMMAND CENTER] EMERGENCY STASIS ACTIVATED: ${reason}`);

    return {
      success: true,
      message: 'Emergency stasis activated globally',
      timestamp: timestamp.toISOString(),
    };
  } catch (e) {
    const err = e as Error;
    console.error('[COMMAND CENTER] Failed to trigger emergency stasis:', err);

    return {
      success: false,
      error: 'Failed to trigger emergency stasis',
      timestamp: timestamp.toISOString(),
    };
  }
}


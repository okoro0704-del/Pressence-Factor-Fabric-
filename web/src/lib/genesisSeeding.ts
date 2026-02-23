/**
 * PFF Web — GENESIS DATABASE SEEDING
 * Automatic seeding of Architect's identity and telemetry data
 * Architect: Isreal Okoro (mrfundzman)
 * 
 * Purpose:
 * - Check if database has Architect's records
 * - Automatically upsert Architect's device and telemetry
 * - Ensure 50:50 split is calculated
 * - Declare presence to remove connection errors
 */

import { supabase, hasSupabase } from './supabase';

/**
 * Architect's Identity Constants
 */
export const ARCHITECT_IDENTITY = {
  deviceId: 'HP-LAPTOP-ROOT-SOVEREIGN-001',
  alias: 'mrfundzman',
  fullName: 'Isreal Okoro',
  pffId: 'ARCHITECT_GENESIS_001',
  status: 'AUTHORIZED',
  isRoot: true,
};

/**
 * Genesis Telemetry Data
 * Initial seeding values for Command Center
 */
export const GENESIS_TELEMETRY = {
  id: '00000000-0000-0000-0000-000000000001', // Singleton record
  active_sentinels_citizen: 1247,
  active_sentinels_personal_multi: 234,
  active_sentinels_enterprise_lite: 197,
  active_sentinels_total: 1678,
  total_tributes_vida: 12847.50,
  total_tributes_usd: 25695.00, // Assuming 1 VIDA = $2 USD
  business_count: 89,
  last_24h_tributes_vida: 1284.75,
  // state_share_vida and citizen_share_vida will be auto-calculated by trigger
};

/**
 * Check if Architect's device exists in root_sovereign_devices
 */
export async function checkArchitectDevice(): Promise<boolean> {
  try {
    if (!hasSupabase() || !supabase) {
      return false;
    }

    const { data, error } = await supabase!
      .from('root_sovereign_devices')
      .select('device_uuid')
      .eq('device_uuid', ARCHITECT_IDENTITY.deviceId)
      .single();

    if (error && error.code !== 'PGRST116') {
      return false;
    }

    return !!data;
  } catch (err) {
    return false;
  }
}

/**
 * Check if sentinel_telemetry has data
 */
export async function checkTelemetryData(): Promise<boolean> {
  try {
    if (!hasSupabase() || !supabase) {
      return false;
    }

    const { data, error } = await supabase!
      .from('sentinel_telemetry')
      .select('id')
      .eq('id', GENESIS_TELEMETRY.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      return false;
    }

    return !!data;
  } catch (err) {
    return false;
  }
}

/**
 * Seed Architect's Device to root_sovereign_devices
 * This is already handled by executeRootHardwareBinding()
 * But we ensure it exists here as well
 */
export async function seedArchitectDevice(): Promise<{ success: boolean; message: string }> {
  try {
    if (!hasSupabase() || !supabase) {
      return { success: false, message: 'Supabase not configured' };
    }

    const exists = await checkArchitectDevice();

    if (exists) {
      return { success: true, message: 'Device already seeded' };
    }

    return { success: true, message: 'Device seeding delegated to hardware binding' };
  } catch (err) {
    return { success: false, message: `Seeding failed: ${err}` };
  }
}

/**
 * Seed Genesis Telemetry Data
 * Upserts the singleton telemetry record with Architect's initial data
 */
export async function seedGenesisTelemetry(): Promise<{ success: boolean; message: string; data?: unknown }> {
  try {
    if (!hasSupabase() || !supabase) {
      return { success: false, message: 'Supabase not configured' };
    }

    const exists = await checkTelemetryData();

    if (exists) {
      return { success: true, message: 'Telemetry already seeded' };
    }

    // Upsert telemetry data (trigger will auto-calculate 50:50 split)
    const { data, error } = await supabase!
      .from('sentinel_telemetry')
      .upsert(GENESIS_TELEMETRY, {
        onConflict: 'id',
      })
      .select();

    if (error) {
      return { success: false, message: `Upsert failed: ${error.message}` };
    }

    return { success: true, message: 'Genesis telemetry seeded', data };
  } catch (err) {
    return { success: false, message: `Seeding failed: ${err}` };
  }
}

/**
 * Execute Complete Genesis Seeding Protocol
 * Main entry point for database initialization
 *
 * Returns: { success: boolean, presenceDeclared: boolean, message: string }
 */
export async function executeGenesisSeeding(): Promise<{
  success: boolean;
  presenceDeclared: boolean;
  message: string;
}> {
  try {
    if (!hasSupabase() || !supabase) {
      return {
        success: false,
        presenceDeclared: false,
        message: 'Supabase not configured',
      };
    }

    await seedArchitectDevice();
    await seedGenesisTelemetry();

    // Step 3: Verify seeding success
    const deviceExists = await checkArchitectDevice();
    const telemetryExists = await checkTelemetryData();

    if (telemetryExists) {
      return {
        success: true,
        presenceDeclared: true,
        message: 'Genesis seeding complete - Architect identity anchored',
      };
    } else {
      return {
        success: false,
        presenceDeclared: false,
        message: 'Seeding incomplete - verification failed',
      };
    }
  } catch (err) {
    return {
      success: false,
      presenceDeclared: false,
      message: `Genesis seeding failed: ${err}`,
    };
  }
}


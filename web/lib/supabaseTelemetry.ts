/**
 * PFF Web — Supabase Telemetry Service
 * Fetches live data from sentinel_telemetry table
 * Replaces mock data with real-time Supabase queries
 */

import { supabase, hasSupabase } from './supabase';

// ============================================================================
// SOVEREIGN BLOCK EXCHANGE RATES & 10-CAP MASTER MATH
// ============================================================================

/**
 * 10-CAP MASTER MATH CONSTANTS
 * Total Minted: 10 VIDA CAP
 * Sovereign Share (50%): 5 VIDA CAP
 * Citizen Share (50%): 5 VIDA CAP
 */
export const TOTAL_MINTED = 10;
export const SOVEREIGN_SHARE = 5; // The 50% split

/**
 * VIDA CAP to USD Exchange Rate
 * 1 VIDA CAP = $1,000 USD
 */
export const VIDA_PRICE_USD = 1000;

/**
 * USD to Naira Exchange Rate
 * 1 USD = ₦1,400 Nigerian Naira
 */
export const NAIRA_RATE = 1400;

/**
 * Derived: VIDA CAP to Naira Exchange Rate
 * 1 VIDA CAP = $1,000 * ₦1,400 = ₦1,400,000
 */
export const VIDA_TO_NAIRA_RATE = VIDA_PRICE_USD * NAIRA_RATE;

/**
 * LIQUIDITY SPLIT (70/15/15)
 * National Vault (Locked Reserves): 70% of Sovereign Share
 * National Liquidity (Active Supply): 15% of Sovereign Share
 * Naira-VIDA (Local Currency): 15% of Sovereign Share
 */
export const NATIONAL_VAULT_PERCENT = 0.70;
export const NATIONAL_LIQUIDITY_PERCENT = 0.15;
export const NAIRA_VIDA_PERCENT = 0.15;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface SentinelTelemetry {
  id: string;
  active_sentinels_citizen: number;
  active_sentinels_personal_multi: number;
  active_sentinels_enterprise_lite: number;
  active_sentinels_total: number;
  total_tributes_vida: number;
  total_tributes_usd: number;
  business_count: number;
  last_24h_tributes_vida: number;
  state_share_vida: number;
  citizen_share_vida: number;
  last_updated: string;
}

export interface CitizenVault {
  owner: string;
  alias: string;
  status: string;
  total_vida_cap_minted: number;
  personal_share_50: number;
  state_contribution_50: number;
  spendable_balance_vida: number;
  linked_bank_accounts: string[];
}

export interface NationalReserve {
  country: string;
  // THE ARCHITECT'S SOVEREIGN PORTFOLIO (5 VIDA from 10 total)
  sovereign_share_vida: number;
  total_value_naira: number;
  total_value_usd: number;
  // 70/15/15 Liquidity Split
  national_vault_vida: number; // 70% - Locked Reserves
  national_liquidity_vida: number; // 15% - Active Supply
  naira_vida_amount: number; // 15% - Local Currency
  naira_vida_value_naira: number; // Naira equivalent of 15%
  backing_ratio: string;
  burn_rate_infrastructure: string;
  monthly_growth: string;
}

/**
 * Fetch live telemetry data from Supabase
 * Returns singleton record from sentinel_telemetry table
 */
export async function fetchLiveTelemetry(): Promise<SentinelTelemetry | null> {
  try {
    console.log('[TELEMETRY] 🔄 Fetching live sentinel telemetry...');

    if (!hasSupabase()) {
      console.error('[TELEMETRY] ❌ Supabase client not available');
      return null;
    }

    // Force fresh fetch - bypass any cache
    const timestamp = Date.now();
    const { data, error } = await supabase
      .from('sentinel_telemetry')
      .select('*')
      .eq('id', '00000000-0000-0000-0000-000000000001')
      .single();

    if (error) {
      console.error('[TELEMETRY] ❌ Query failed');
      console.error('[TELEMETRY] Error Code:', error.code);
      console.error('[TELEMETRY] Error Message:', error.message);
      console.error('[TELEMETRY] Error Details:', error.details);
      console.error('[TELEMETRY] Error Hint:', error.hint);

      // Specific error type detection
      if (error.message.includes('Invalid API key') || error.message.includes('JWT')) {
        console.error('[TELEMETRY] 🔑 INVALID API KEY ERROR');
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        console.error('[TELEMETRY] 🌐 NETWORK ERROR');
      } else if (error.message.includes('CORS')) {
        console.error('[TELEMETRY] 🚫 CORS ERROR');
      } else if (error.code === 'PGRST116') {
        console.error('[TELEMETRY] 📊 TABLE NOT FOUND OR NO ROWS');
      }

      return null;
    }

    console.log('[TELEMETRY] ✅ Live data fetched successfully');
    console.log('[TELEMETRY] Active Sentinels:', data.active_sentinels_total);
    console.log('[TELEMETRY] Total VIDA:', data.total_tributes_vida);
    console.log('[TELEMETRY] Citizen Share (50%):', data.citizen_share_vida);
    console.log('[TELEMETRY] State Share (50%):', data.state_share_vida);
    console.log('[TELEMETRY] Fetch timestamp:', timestamp);

    return data as SentinelTelemetry;
  } catch (err) {
    console.error('[TELEMETRY] ❌ Unexpected error during fetch');
    console.error('[TELEMETRY] Error Type:', err instanceof Error ? err.constructor.name : typeof err);
    console.error('[TELEMETRY] Error Message:', err instanceof Error ? err.message : String(err));
    console.error('[TELEMETRY] Full Error:', err);
    return null;
  }
}

/**
 * Fetch citizen vault data for ARCHITECT
 * Uses telemetry data to calculate 50:50 split
 */
export async function fetchCitizenVault(): Promise<CitizenVault | null> {
  try {
    const telemetry = await fetchLiveTelemetry();
    if (!telemetry) return null;

    const citizenVault: CitizenVault = {
      owner: 'Isreal Okoro',
      alias: 'mrfundzman',
      status: 'VITALIZED',
      total_vida_cap_minted: telemetry.total_tributes_vida,
      personal_share_50: telemetry.citizen_share_vida,
      state_contribution_50: telemetry.state_share_vida,
      spendable_balance_vida: telemetry.citizen_share_vida * 0.75,
      linked_bank_accounts: ['GTBank-****4920'],
    };

    return citizenVault;
  } catch (err) {
    return null;
  }
}

/**
 * Fetch national reserve data
 * Implements 10-CAP MASTER MATH with 70/15/15 Liquidity Split
 *
 * TOTAL_MINTED = 10 VIDA CAP
 * SOVEREIGN_SHARE = 5 VIDA CAP (50%)
 *
 * Liquidity Split:
 * - National Vault (70%): 3.5 VIDA - Locked Reserves
 * - National Liquidity (15%): 0.75 VIDA - Active Supply
 * - Naira-VIDA (15%): 0.75 VIDA - Local Currency
 *
 * Total Value: 5 VIDA * $1,000 * ₦1,400 = ₦7,000,000
 */
export async function fetchNationalReserve(): Promise<NationalReserve | null> {
  try {
    const telemetry = await fetchLiveTelemetry();
    if (!telemetry) return null;

    // 10-CAP MASTER MATH
    // Use SOVEREIGN_SHARE (5 VIDA) as the base for calculations
    const sovereignShareVida = SOVEREIGN_SHARE;

    // 70/15/15 Liquidity Split
    const nationalVaultVida = sovereignShareVida * NATIONAL_VAULT_PERCENT; // 3.5 VIDA
    const nationalLiquidityVida = sovereignShareVida * NATIONAL_LIQUIDITY_PERCENT; // 0.75 VIDA
    const nairaVidaAmount = sovereignShareVida * NAIRA_VIDA_PERCENT; // 0.75 VIDA

    // Calculate Naira values
    const nairaVidaValueNaira = nairaVidaAmount * VIDA_PRICE_USD * NAIRA_RATE; // 0.75 * 1000 * 1400
    const totalValueNaira = sovereignShareVida * VIDA_PRICE_USD * NAIRA_RATE; // 5 * 1000 * 1400 = ₦7,000,000
    const totalValueUsd = sovereignShareVida * VIDA_PRICE_USD; // 5 * 1000 = $5,000

    const nationalReserve: NationalReserve = {
      country: 'Nigeria',
      sovereign_share_vida: sovereignShareVida,
      total_value_naira: totalValueNaira,
      total_value_usd: totalValueUsd,
      national_vault_vida: nationalVaultVida,
      national_liquidity_vida: nationalLiquidityVida,
      naira_vida_amount: nairaVidaAmount,
      naira_vida_value_naira: nairaVidaValueNaira,
      backing_ratio: '1:1',
      burn_rate_infrastructure: '0.05%',
      monthly_growth: '+12.4%',
    };

    return nationalReserve;
  } catch (err) {
    return null;
  }
}

/**
 * Check if current device is hardware bounded
 * Checks device_id against sentinel_devices table
 */
export async function checkHardwareBounded(): Promise<boolean> {
  try {
    if (!hasSupabase()) {
      return false;
    }

    const deviceId = localStorage.getItem('device_id');
    if (!deviceId) {
      return false;
    }

    const { data, error } = await supabase
      .from('sentinel_devices')
      .select('*')
      .eq('device_id', deviceId)
      .single();

    if (error) {
      return false;
    }

    return !!data;
  } catch (err) {
    return false;
  }
}


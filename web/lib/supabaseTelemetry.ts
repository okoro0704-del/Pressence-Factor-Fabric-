/**
 * PFF Web — Supabase Telemetry Service
 * Fetches live data from sentinel_telemetry table
 * Replaces mock data with real-time Supabase queries
 */

import { supabase, hasSupabase } from './supabase';

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
  vault_balance_vida_cap: number;
  backed_currency_circulation_vida: number;
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
    if (!hasSupabase()) {
      return null;
    }

    const { data, error } = await supabase
      .from('sentinel_telemetry')
      .select('*')
      .eq('id', '00000000-0000-0000-0000-000000000001')
      .single();

    if (error) {
      return null;
    }

    return data as SentinelTelemetry;
  } catch (err) {
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
 * Uses telemetry data to calculate reserve metrics
 */
export async function fetchNationalReserve(): Promise<NationalReserve | null> {
  try {
    const telemetry = await fetchLiveTelemetry();
    if (!telemetry) return null;

    const nationalReserve: NationalReserve = {
      country: 'Nigeria',
      vault_balance_vida_cap: telemetry.state_share_vida * 2,
      backed_currency_circulation_vida: telemetry.total_tributes_vida,
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


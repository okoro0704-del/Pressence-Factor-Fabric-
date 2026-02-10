/**
 * Global ledger_stats — Public National Ledger.
 * National Treasury tab and Global Pulse Bar pull from this table.
 * Fallback: national_block_reserves + user_profiles count + sentinel_telemetry for minted.
 */

import { supabase, hasSupabase } from './supabase';
import { fetchReserveCounter } from './governmentTreasury';
import { getVitalizedCitizensCount } from './supabaseTelemetry';
import { fetchLiveTelemetry } from './supabaseTelemetry';
import { VIDA_USD_VALUE } from './economic';

export interface LedgerStats {
  totalReserveVida: number;
  totalVitalizedCount: number;
  totalMintedVida: number;
  nationalReserveUsd: number;
}

/** Fetch ledger_stats from Supabase only. Returns null if Supabase unavailable or no row. Use for Treasury (all details from Supabase). */
export async function fetchLedgerStatsFromSupabase(): Promise<LedgerStats | null> {
  if (!hasSupabase()) return null;
  try {
    const { data, error } = await supabase
      .from('ledger_stats')
      .select('total_reserve_vida, total_vitalized_count, total_minted_vida')
      .eq('id', '00000000-0000-0000-0000-000000000001')
      .maybeSingle();
    if (error || !data) return null;
    const totalReserveVida = Number(data.total_reserve_vida);
    const totalVitalizedCount = Number(data.total_vitalized_count) || 0;
    const totalMintedVida = Number(data.total_minted_vida);
    return {
      totalReserveVida,
      totalVitalizedCount,
      totalMintedVida,
      nationalReserveUsd: totalReserveVida * VIDA_USD_VALUE,
    };
  } catch {
    return null;
  }
}

/** Fetch global ledger_stats (single row). Falls back to existing sources if table missing or empty. */
export async function fetchLedgerStats(): Promise<LedgerStats> {
  try {
    if (hasSupabase()) {
      const { data, error } = await supabase
        .from('ledger_stats')
        .select('total_reserve_vida, total_vitalized_count, total_minted_vida')
        .eq('id', '00000000-0000-0000-0000-000000000001')
        .maybeSingle();

      if (!error && data && Number(data.total_reserve_vida) > 0) {
        const totalReserveVida = Number(data.total_reserve_vida);
        const totalVitalizedCount = Number(data.total_vitalized_count) || 0;
        const totalMintedVida = Number(data.total_minted_vida) || totalReserveVida;
        return {
          totalReserveVida,
          totalVitalizedCount,
          totalMintedVida,
          nationalReserveUsd: totalReserveVida * VIDA_USD_VALUE,
        };
      }
    }
  } catch {
    // fall through to fallback
  }

  const [reserveVida, citizens, telemetry] = await Promise.all([
    fetchReserveCounter(),
    getVitalizedCitizensCount(),
    fetchLiveTelemetry(),
  ]);
  const totalMinted =
    telemetry && typeof (telemetry as { total_tributes_vida?: number }).total_tributes_vida === 'number'
      ? (telemetry as { total_tributes_vida: number }).total_tributes_vida
      : 5_000_000;
  return {
    totalReserveVida: reserveVida,
    totalVitalizedCount: citizens,
    totalMintedVida: totalMinted,
    nationalReserveUsd: reserveVida * VIDA_USD_VALUE,
  };
}

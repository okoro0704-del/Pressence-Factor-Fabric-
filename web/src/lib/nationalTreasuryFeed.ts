/**
 * National Treasury Feed — Backend feeds frontend.
 * Fetches total vitalized citizens, nation's minted VIDA CAP, locked, national liquidity, liquid pool
 * from RPC get_national_treasury_feed(). Subscribes to ledger_stats + national_block_reserves
 * so when the backend updates, the frontend receives new data.
 */

import { supabase, hasSupabase } from './supabase';

export interface NationalTreasuryFeed {
  ok: boolean;
  total_vitalized_citizens: number;
  total_vitalized_count: number;
  total_reserve_vida: number;
  total_minted_vida: number;
  total_minted_vida_cap_nation: number;
  vida_cap_locked: number;
  national_vault_vida_cap: number;
  national_vault_locked: boolean;
  national_liquidity: number;
  vida_cap_liquidity: number;
  liquid_pool: number;
  national_vida_circulating: number;
  vida_price_usd: number;
  naira_rate: number;
  last_updated: string | null;
  error?: string;
}

const DEFAULT_FEED: NationalTreasuryFeed = {
  ok: false,
  total_vitalized_citizens: 0,
  total_vitalized_count: 0,
  total_reserve_vida: 0,
  total_minted_vida: 0,
  total_minted_vida_cap_nation: 0,
  vida_cap_locked: 0,
  national_vault_vida_cap: 0,
  national_vault_locked: true,
  national_liquidity: 0,
  vida_cap_liquidity: 0,
  liquid_pool: 0,
  national_vida_circulating: 0,
  vida_price_usd: 1000,
  naira_rate: 1400,
  last_updated: null,
};

/**
 * Fetch national treasury feed from backend (one RPC: ledger_stats + national_block_reserves + vitalized count).
 */
export async function fetchNationalTreasuryFeed(): Promise<NationalTreasuryFeed> {
  if (!hasSupabase()) return DEFAULT_FEED;
  try {
    const { data, error } = await (supabase as any).rpc('get_national_treasury_feed');
    if (error) {
      return { ...DEFAULT_FEED, error: error.message };
    }
    if (!data || data.ok === false) {
      return { ...DEFAULT_FEED, error: (data?.error as string) ?? 'RPC returned no data' };
    }
    return {
      ok: true,
      total_vitalized_citizens: Number(data.total_vitalized_citizens) ?? 0,
      total_vitalized_count: Number(data.total_vitalized_count) ?? 0,
      total_reserve_vida: Number(data.total_reserve_vida) ?? 0,
      total_minted_vida: Number(data.total_minted_vida) ?? 0,
      total_minted_vida_cap_nation: Number(data.total_minted_vida_cap_nation) ?? 0,
      vida_cap_locked: Number(data.vida_cap_locked) ?? 0,
      national_vault_vida_cap: Number(data.national_vault_vida_cap) ?? 0,
      national_vault_locked: data.national_vault_locked !== false,
      national_liquidity: Number(data.national_liquidity) ?? 0,
      vida_cap_liquidity: Number(data.vida_cap_liquidity) ?? 0,
      liquid_pool: Number(data.liquid_pool) ?? 0,
      national_vida_circulating: Number(data.national_vida_circulating) ?? 0,
      vida_price_usd: Number(data.vida_price_usd) ?? 1000,
      naira_rate: Number(data.naira_rate) ?? 1400,
      last_updated: data.last_updated ?? null,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ...DEFAULT_FEED, error: msg };
  }
}

/**
 * Subscribe to backend changes (ledger_stats + national_block_reserves).
 * When either table is updated, the callback is invoked so the frontend can refetch the feed.
 */
export function subscribeToNationalTreasuryFeed(onFeedChange: () => void): () => void {
  if (!supabase?.channel) return () => {};
  try {
    const channel = (supabase as any)
      .channel('national_treasury_feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ledger_stats' }, () => {
        onFeedChange();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'national_block_reserves' }, () => {
        onFeedChange();
      })
      .subscribe();
    return () => {
      try {
        (channel as { unsubscribe?: () => void }).unsubscribe?.();
      } catch {
        // ignore
      }
      try {
        (supabase as any).removeChannel?.(channel);
      } catch {
        // ignore
      }
    };
  } catch {
    return () => {};
  }
}

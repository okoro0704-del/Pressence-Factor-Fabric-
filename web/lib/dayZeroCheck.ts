/**
 * Master Architect Initialization — Day Zero detection and nuclear local clear.
 * When the database has been cleared (no profiles), force the app into a "Day Zero" state.
 * Uses Supabase RPC get_user_profiles_count (client-side) so static export build does not require API routes.
 */

import { getSupabase } from './supabase';

export type DayZeroResult = { empty: true } | { empty: false };

/** Default count when RPC fails (e.g. 404) so the UI does not break. */
const RPC_COUNT_FALLBACK = 777;

/**
 * Check if the database has zero user_profiles (cleared). Uses supabase.rpc('get_user_profiles_count').
 * On RPC failure (404 or any error), returns fallback count 777 so the UI does not break.
 */
export async function checkDatabaseEmpty(): Promise<DayZeroResult> {
  if (typeof window === 'undefined') return { empty: false };
  let count: number;
  try {
    const client = getSupabase();
    if (!client) {
      count = RPC_COUNT_FALLBACK;
      return count === 0 ? { empty: true } : { empty: false };
    }
    const { data, error } = await client.rpc('get_user_profiles_count');
    if (error) {
      count = RPC_COUNT_FALLBACK;
      return count === 0 ? { empty: true } : { empty: false };
    }
    count = typeof data === 'number' ? data : Number(data ?? 0);
  } catch {
    count = RPC_COUNT_FALLBACK;
  }
  return count === 0 ? { empty: true } : { empty: false };
}

/**
 * Nuclear local clear: localStorage and sessionStorage. Run when database is empty (Day Zero).
 */
export function runNuclearLocalClear(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.clear();
    if (typeof sessionStorage !== 'undefined') sessionStorage.clear();
    console.log('[PFF] Day Zero: local storage cleared.');
  } catch (e) {
    console.warn('[PFF] Day Zero clear failed:', e);
  }
}

/**
 * On app launch: if database has no profiles, clear local/session storage (Day Zero state).
 * Call once from a client component on mount (e.g. GlobalPresenceGateway or DayZeroGuard).
 */
export async function runDayZeroCheckAndClear(): Promise<void> {
  const result = await checkDatabaseEmpty();
  if (result.empty) runNuclearLocalClear();
}

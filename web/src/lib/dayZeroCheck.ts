/**
 * Master Architect Initialization — Day Zero detection and nuclear local clear.
 * Nuclear clear runs only when Reset Mode is set (PFF_DAY_ZERO_RESET_MODE=1), so session memory
 * is not wiped on every page load. Uses Supabase RPC get_user_profiles_count (client-side).
 */

import { getSupabase } from './supabase';

export type DayZeroResult = { empty: true } | { empty: false };

/** Set to '1' in localStorage to allow nuclear clear when DB is empty (Reset Mode). Without this, we do not clear on load. */
export const DAY_ZERO_RESET_MODE_KEY = 'PFF_DAY_ZERO_RESET_MODE';

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
 * Nuclear local clear: localStorage and sessionStorage. Only call when explicitly in Reset Mode.
 */
export function runNuclearLocalClear(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.clear();
    if (typeof sessionStorage !== 'undefined') sessionStorage.clear();
  } catch {
    // ignore
  }
}

/**
 * On app launch: if database has no profiles and Reset Mode is set, clear local/session storage.
 * Does not run nuclear clear on every page load — only when PFF_DAY_ZERO_RESET_MODE is '1'.
 */
export async function runDayZeroCheckAndClear(): Promise<void> {
  const result = await checkDatabaseEmpty();
  if (!result.empty) return;
  if (typeof window === 'undefined') return;
  const resetMode = localStorage.getItem(DAY_ZERO_RESET_MODE_KEY) === '1';
  if (resetMode) runNuclearLocalClear();
}

/**
 * Master Architect Initialization — Day Zero detection and nuclear local clear.
 * When the database has been cleared (no profiles), force the app into a "Day Zero" state.
 * Uses Supabase RPC get_user_profiles_count (client-side) so static export build does not require API routes.
 */

import { getSupabase } from './supabase';

export type DayZeroResult = { empty: true } | { empty: false };

/**
 * Check if the database has zero user_profiles (cleared). Calls RPC get_user_profiles_count via Supabase client.
 */
export async function checkDatabaseEmpty(): Promise<DayZeroResult> {
  if (typeof window === 'undefined') return { empty: false };
  try {
    const supabase = getSupabase();
    if (!supabase) return { empty: false };
    const { data, error } = await (supabase as any).rpc('get_user_profiles_count');
    if (error) return { empty: false };
    const count = typeof data === 'number' ? data : Number(data ?? 0);
    return count === 0 ? { empty: true } : { empty: false };
  } catch {
    return { empty: false };
  }
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

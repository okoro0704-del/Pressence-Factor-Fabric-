/**
 * Architect's Secret Reset — nuclear reset (sign out, clear storage, hard reload).
 * Enabled in development, or when NEXT_PUBLIC_ARCHITECT_RESET_ENABLED is set (hidden feature for field use).
 */

import { getSupabase, hasSupabase } from './supabase';

export function isArchitectResetEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  const dev = process.env.NODE_ENV === 'development';
  const explicit = process.env.NEXT_PUBLIC_ARCHITECT_RESET_ENABLED === 'true' || process.env.NEXT_PUBLIC_ARCHITECT_RESET_ENABLED === '1';
  return dev || !!explicit;
}

/**
 * Nuclear reset: sign out, clear all local/session storage, alert, then hard reload to /.
 * Only run when isArchitectResetEnabled() is true (caller should check).
 */
export async function nuclearReset(): Promise<void> {
  if (hasSupabase()) {
    const supabase = getSupabase();
    if (supabase?.auth) await supabase.auth.signOut();
  }
  try {
    localStorage.clear();
    if (typeof sessionStorage !== 'undefined') sessionStorage.clear();
  } catch (e) {
    console.warn('[architectReset] clear storage:', e);
  }
  if (typeof window !== 'undefined') {
    window.alert('Architect Authority Confirmed: Resetting Protocol...');
    window.location.href = '/';
  }
}

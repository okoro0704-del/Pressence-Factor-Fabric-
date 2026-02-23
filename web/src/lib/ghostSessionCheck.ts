/**
 * Hard Reset Safety Valve — Ghost Session check.
 * If Supabase Auth has a session but there is no matching row in user_profiles,
 * treat as "ghost" (e.g. profile was purged): sign out and clear local state.
 */

import { getSupabase, hasSupabase } from './supabase';

export type GhostCheckResult = 'ok' | 'cleared';

/**
 * Check for ghost session: auth has user but user_profiles has no row for that id.
 * If ghost: calls supabase.auth.signOut(), localStorage.clear(), sessionStorage.clear(); returns 'cleared'.
 * Otherwise returns 'ok'. Safe to call on every app load (client-side only).
 */
export async function checkGhostSession(): Promise<GhostCheckResult> {
  if (typeof window === 'undefined') return 'ok';
  const supabase = getSupabase();
  if (!supabase || !hasSupabase()) return 'ok';

  try {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user?.id) return 'ok';

    const { data: profile, error } = await (supabase as any)
      .from('user_profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.warn('[ghostSessionCheck] Profile lookup failed (non-fatal):', error.message);
      return 'ok';
    }
    if (profile != null) return 'ok';

    console.warn('[ghostSessionCheck] Ghost session: auth user has no user_profiles row. Clearing.');
    await supabase.auth.signOut();
    try {
      localStorage.clear();
      if (typeof sessionStorage !== 'undefined') sessionStorage.clear();
    } catch (e) {
      console.warn('[ghostSessionCheck] clear storage:', e);
    }
    return 'cleared';
  } catch (e) {
    console.warn('[ghostSessionCheck] Check failed:', e);
    return 'ok';
  }
}

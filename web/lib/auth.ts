/**
 * Auth helpers: Genesis (first citizen = MASTER_ARCHITECT) and session checks.
 * If user_profiles is empty, the first person to pass the gate is granted MASTER_ARCHITECT.
 */

import { getSupabase } from './supabase';

/**
 * Genesis protocol: if the profiles table is completely empty, insert the current
 * user as MASTER_ARCHITECT so the first person to log in becomes Master Architect.
 * Call after setIdentityAnchorForSession (gate clear) so the user has a session.
 */
export async function ensureGenesisIfEmpty(actorPhone: string, actorName: string): Promise<{ ok: boolean; role?: string; reason?: string }> {
  const supabase = getSupabase();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) return { ok: false, reason: 'no_session' };

    const { data, error } = await (supabase as any).rpc('genesis_ensure_first_citizen', {
      auth_user_id: user.id,
      actor_phone: actorPhone.trim(),
      actor_name: actorName?.trim() || 'Genesis',
    });

    if (error) {
      console.error('[AUTH] genesis_ensure_first_citizen error:', error);
      return { ok: false, reason: error.message };
    }

    const result = data as { ok?: boolean; role?: string; reason?: string; error?: string } | null;
    if (result?.ok) return { ok: true, role: result.role };
    return { ok: false, reason: result?.reason ?? result?.error ?? 'unknown' };
  } catch (e) {
    console.error('[AUTH] ensureGenesisIfEmpty exception:', e);
    return { ok: false, reason: e instanceof Error ? e.message : String(e) };
  }
}

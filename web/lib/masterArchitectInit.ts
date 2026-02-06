/**
 * Master Architect Initialization — first registration in an empty database.
 * The very first person to register gets role MASTER_ARCHITECT and vitalization_status Master_Vitalization.
 * 5 VIDA grant: 1 spendable + 4 locked, credited to profiles on successful Face Pulse.
 */

import { getSupabase } from './supabase';

export type FirstRegistrationResult = { isFirst: true } | { isFirst: false };

/**
 * Check if the database is empty (no profiles). Uses Supabase RPC get_user_profiles_count (client-side) for static export.
 */
export async function isFirstRegistration(): Promise<FirstRegistrationResult> {
  if (typeof window === 'undefined') return { isFirst: false };
  try {
    const supabase = getSupabase();
    if (!supabase) return { isFirst: false };
    const { data, error } = await (supabase as any).rpc('get_user_profiles_count');
    if (error) return { isFirst: false };
    const count = typeof data === 'number' ? data : Number(data ?? 0);
    return count === 0 ? { isFirst: true } : { isFirst: false };
  } catch {
    return { isFirst: false };
  }
}

/**
 * Credit 5 VIDA to the Architect on first Face Pulse: 0.1 spendable ($100), 4.9 locked (9-Day Unlock Ritual).
 * Updates user_profiles (spendable_vida=0.1, locked_vida=4.9, is_minted=true) and sovereign_internal_wallets (vida_cap_balance=5).
 * Call from ensureMintedAndBalance or from the success handler when isFirstRegistration was true.
 */
export async function creditArchitectVidaGrant(phoneNumber: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: 'Supabase not available' };
  const trimmed = phoneNumber?.trim();
  if (!trimmed) return { ok: false, error: 'Phone number required' };

  try {
    const payload: Record<string, unknown> = {
      is_minted: true,
      spendable_vida: 0.1,
      locked_vida: 4.9,
      updated_at: new Date().toISOString(),
    };
    let { error: profileError } = await (supabase as any)
      .from('user_profiles')
      .update(payload)
      .eq('phone_number', trimmed);
    if (profileError && /column.*locked_vida|does not exist/i.test(profileError.message ?? '')) {
      delete payload.locked_vida;
      const retry = await (supabase as any)
        .from('user_profiles')
        .update(payload)
        .eq('phone_number', trimmed);
      profileError = retry.error;
    }
    if (profileError) return { ok: false, error: profileError.message ?? 'Failed to set spendable_vida' };

    const { getOrCreateSovereignWallet } = await import('./sovereignInternalWallet');
    await getOrCreateSovereignWallet(trimmed);
    const { data: wallet } = await (supabase as any)
      .from('sovereign_internal_wallets')
      .select('vida_cap_balance')
      .eq('phone_number', trimmed)
      .maybeSingle();
    const current = Number(wallet?.vida_cap_balance ?? 0);
    const { error: walletError } = await (supabase as any)
      .from('sovereign_internal_wallets')
      .update({
        vida_cap_balance: current + 5,
        updated_at: new Date().toISOString(),
      })
      .eq('phone_number', trimmed);
    if (walletError) return { ok: false, error: walletError.message ?? 'Failed to credit 5 VIDA' };
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

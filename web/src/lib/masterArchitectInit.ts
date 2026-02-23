/**
 * Master Architect Initialization — first registration in an empty database.
 * The very first person to register gets role MASTER_ARCHITECT and vitalization_status Master_Vitalization.
 * 5 VIDA grant: 1 spendable + 4 locked, credited to profiles on successful Face Pulse.
 */

import { getSupabase } from './supabase';
import { getIsMinted } from './mintStatus';
import { setMintStatus, MINT_STATUS_MINTED } from './mintStatus';

export type FirstRegistrationResult = { isFirst: true } | { isFirst: false };

/** Default count when RPC fails (e.g. 404) so the UI does not break. */
const RPC_COUNT_FALLBACK = 777;

/** First $100 in VIDA (0.1). When balance hits this, Sentinel Activation auto-debit runs once. */
const SENTINEL_ACTIVATION_VIDA = 0.1;

/**
 * Sentinel Auto-Debit: as soon as account balance is >= 0.1 VIDA, debit $100 for 'Sentinel Activation'
 * and flip sentinel_status to ACTIVE, last_activation_date = now. Runs only once (sentinel_activation_debited guard).
 */
export async function executeSentinelActivationDebit(phoneNumber: string): Promise<
  { ok: true; debited: true } | { ok: true; debited: false; reason: 'already_debited' | 'insufficient_balance' } | { ok: false; error: string }
> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: 'Supabase not available' };
  const trimmed = phoneNumber?.trim();
  if (!trimmed) return { ok: false, error: 'Phone number required' };

  try {
    const { data: profile, error: fetchError } = await (supabase as any)
      .from('user_profiles')
      .select('spendable_vida, locked_vida, sentinel_activation_debited')
      .eq('phone_number', trimmed)
      .maybeSingle();
    if (fetchError) return { ok: false, error: fetchError.message ?? 'Failed to read profile' };
    if (!profile) return { ok: true, debited: false, reason: 'insufficient_balance' };
    if (profile.sentinel_activation_debited === true) return { ok: true, debited: false, reason: 'already_debited' };
    const spendable = Number(profile.spendable_vida) ?? 0;
    if (spendable < SENTINEL_ACTIVATION_VIDA) return { ok: true, debited: false, reason: 'insufficient_balance' };

    const newSpendable = Math.max(0, spendable - SENTINEL_ACTIVATION_VIDA);
    const currentLocked = Number(profile.locked_vida) ?? 0;
    const newLocked = currentLocked + SENTINEL_ACTIVATION_VIDA;
    const updatePayload: Record<string, unknown> = {
      spendable_vida: newSpendable,
      locked_vida: newLocked,
      sentinel_activation_debited: true,
      updated_at: new Date().toISOString(),
    };
    let { error: updateError } = await (supabase as any)
      .from('user_profiles')
      .update(updatePayload)
      .eq('phone_number', trimmed);
    if (updateError && /column.*locked_vida|does not exist/i.test(updateError.message ?? '')) {
      delete updatePayload.locked_vida;
      const retry = await (supabase as any).from('user_profiles').update(updatePayload).eq('phone_number', trimmed);
      updateError = retry.error;
    }
    if (updateError) return { ok: false, error: updateError.message ?? 'Failed to debit Sentinel Activation' };

    const { data: sentinelRow } = await (supabase as any)
      .from('sentinel_identities')
      .select('id')
      .eq('phone_number', trimmed)
      .maybeSingle();
    if (sentinelRow?.id) {
      await (supabase as any)
        .from('sentinel_identities')
        .update({
          status: 'ACTIVE',
          last_activation_date: new Date().toISOString(),
          last_verified: new Date().toISOString(),
        })
        .eq('id', sentinelRow.id);
    }
    return { ok: true, debited: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

/**
 * Check if the database is empty (no profiles). Uses supabase.rpc('get_user_profiles_count').
 * On RPC failure (404 or any error), returns fallback count 777 so the UI does not break.
 */
export async function isFirstRegistration(): Promise<FirstRegistrationResult> {
  if (typeof window === 'undefined') return { isFirst: false };
  let count: number;
  try {
    const client = getSupabase();
    if (!client) {
      count = RPC_COUNT_FALLBACK;
      return count === 0 ? { isFirst: true } : { isFirst: false };
    }
    const { data, error } = await client.rpc('get_user_profiles_count');
    if (error) {
      count = RPC_COUNT_FALLBACK;
      return count === 0 ? { isFirst: true } : { isFirst: false };
    }
    count = typeof data === 'number' ? data : Number(data ?? 0);
  } catch {
    count = RPC_COUNT_FALLBACK;
  }
  return count === 0 ? { isFirst: true } : { isFirst: false };
}

/**
 * Credit 5 VIDA to the Architect on first Face Pulse: 1.0 spendable, 4.0 locked (instant vitalization).
 * Then executeSentinelActivationDebit runs → 0.9 spendable, 4.1 locked.
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
      spendable_vida: 1.0,
      locked_vida: 4.0,
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
    // As soon as balance hits 0.1 VIDA: one-time debit $100 for Sentinel Activation, flip sentinel_status to ACTIVE.
    await executeSentinelActivationDebit(trimmed);
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

/**
 * Authorize the first $100 (0.1 VIDA) initial release to the user's ledger.
 * One-time only: does nothing if user is already minted (subsequent daily logins must not trigger).
 * Call after successful redirect from Scanner VERIFIED → dashboard.
 */
export async function authorizeInitialRelease(phoneNumber: string): Promise<
  { ok: true; credited: true } | { ok: true; credited: false; reason: 'already_minted' } | { ok: false; error: string }
> {
  const trimmed = phoneNumber?.trim();
  if (!trimmed) return { ok: false, error: 'Phone number required' };

  const minted = await getIsMinted(trimmed);
  if (!minted.ok) return { ok: false, error: minted.error ?? 'Failed to check mint status' };
  if (minted.is_minted) return { ok: true, credited: false, reason: 'already_minted' };

  const credit = await creditArchitectVidaGrant(trimmed);
  if (!credit.ok) return { ok: false, error: credit.error };
  await setMintStatus(trimmed, MINT_STATUS_MINTED);
  return { ok: true, credited: true };
}

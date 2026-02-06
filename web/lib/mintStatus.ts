/**
 * Mint status — PENDING_HARDWARE (mobile initial reg) vs MINTED (hub or full flow).
 */

import { getSupabase } from './supabase';

export const MINT_STATUS_PENDING_HARDWARE = 'PENDING_HARDWARE';
export const MINT_STATUS_MINTED = 'MINTED';

export type MintStatus = typeof MINT_STATUS_PENDING_HARDWARE | typeof MINT_STATUS_MINTED | null;

export async function setMintStatus(
  phoneNumber: string,
  status: MintStatus
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: 'Supabase not available' };
  const trimmed = phoneNumber?.trim();
  if (!trimmed) return { ok: false, error: 'Phone number required.' };
  try {
    const { error } = await (supabase as any)
      .from('user_profiles')
      .update({
        mint_status: status,
        updated_at: new Date().toISOString(),
      })
      .eq('phone_number', trimmed);
    if (error) return { ok: false, error: error.message ?? 'Failed to set mint_status' };
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

export async function getMintStatus(
  phoneNumber: string
): Promise<{ ok: true; mint_status: MintStatus } | { ok: false; error: string }> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: 'Supabase not available' };
  const trimmed = phoneNumber?.trim();
  if (!trimmed) return { ok: false, error: 'Phone number required.' };
  try {
    const { data, error } = await (supabase as any)
      .from('user_profiles')
      .select('mint_status')
      .eq('phone_number', trimmed)
      .maybeSingle();
    if (error) return { ok: false, error: error.message ?? 'Failed to get mint_status' };
    const status = (data?.mint_status ?? null) as MintStatus;
    return { ok: true, mint_status: status };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

/** Bypass gate: true when user has completed Face Pulse and received 5 VIDA auto-credit (is_minted on profile). */
export async function getIsMinted(
  phoneNumber: string
): Promise<{ ok: true; is_minted: boolean } | { ok: false; error: string }> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: 'Supabase not available' };
  const trimmed = phoneNumber?.trim();
  if (!trimmed) return { ok: false, error: 'Phone number required.' };
  try {
    const { data, error } = await (supabase as any)
      .from('user_profiles')
      .select('is_minted')
      .eq('phone_number', trimmed)
      .maybeSingle();
    if (error) return { ok: false, error: error.message ?? 'Failed to get is_minted' };
    const is_minted = data?.is_minted === true;
    return { ok: true, is_minted };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

/**
 * Read mint_status and is_minted by phone via RPC (bypasses RLS when app.current_user_phone is not set).
 * Use in GlobalPresenceGateway for vault bypass so users who passed the gate can stay on dashboard.
 */
export async function getMintStatusForPresence(
  phoneNumber: string
): Promise<{ ok: true; mint_status: MintStatus; is_minted: boolean } | { ok: false; error: string }> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: 'Supabase not available' };
  const trimmed = phoneNumber?.trim();
  if (!trimmed) return { ok: false, error: 'Phone number required.' };
  try {
    const { data, error } = await (supabase as any).rpc('get_mint_status_for_presence', {
      p_phone: trimmed,
    });
    if (error) return { ok: false, error: error.message ?? 'RPC failed' };
    if (data?.ok === false) return { ok: false, error: data?.error ?? 'RPC returned error' };
    const mint_status = (data?.mint_status ?? null) as MintStatus;
    const is_minted = data?.is_minted === true;
    return { ok: true, mint_status, is_minted };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

/** 5 VIDA auto-credit on successful Face Pulse: set user_profiles.is_minted = true and credit sovereign_internal_wallets.vida_cap_balance += 5. Uses RPC when available to bypass RLS. */
export async function ensureMintedAndBalance(phoneNumber: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: 'Supabase not available' };
  const trimmed = phoneNumber?.trim();
  if (!trimmed) return { ok: false, error: 'Phone number required.' };
  try {
    const { data: rpcData, error: rpcError } = await (supabase as any).rpc('ensure_minted_and_balance_rpc', {
      p_phone: trimmed,
    });
    if (!rpcError && rpcData?.ok === true) return { ok: true };
    if (rpcError) {
      console.warn('[mintStatus] ensure_minted_and_balance_rpc failed, trying direct update:', rpcError.message);
    }

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
      const retry = await (supabase as any).from('user_profiles').update(payload).eq('phone_number', trimmed);
      profileError = retry.error;
    }
    if (profileError) return { ok: false, error: profileError.message ?? 'Failed to set is_minted' };

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

/** Protocol Release: spending is unlocked when is_fully_verified === true OR face_hash is present (no external fingerprint required). */
export async function getBiometricSpendingActive(
  phoneNumber: string
): Promise<{ ok: true; active: boolean } | { ok: false; error: string }> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: 'Supabase not available' };
  const trimmed = phoneNumber?.trim();
  if (!trimmed) return { ok: false, error: 'Phone number required.' };
  try {
    const { data, error } = await (supabase as any)
      .from('user_profiles')
      .select('is_fully_verified, face_hash')
      .eq('phone_number', trimmed)
      .maybeSingle();
    if (error) return { ok: false, error: error.message ?? 'Failed to get biometric status' };
    const isFullyVerified = data?.is_fully_verified === true;
    const faceHash = data?.face_hash != null ? String(data.face_hash).trim() : '';
    const active = isFullyVerified || faceHash !== '';
    return { ok: true, active };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

/** Vault Sync: spending_unlocked is true when second biometric (external fingerprint) is saved in DB. */
export async function getSpendingUnlocked(
  phoneNumber: string
): Promise<{ ok: true; spending_unlocked: boolean } | { ok: false; error: string }> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: 'Supabase not available' };
  const trimmed = phoneNumber?.trim();
  if (!trimmed) return { ok: false, error: 'Phone number required.' };
  try {
    const { data, error } = await (supabase as any)
      .from('user_profiles')
      .select('spending_unlocked')
      .eq('phone_number', trimmed)
      .maybeSingle();
    if (error) return { ok: false, error: error.message ?? 'Failed to get spending_unlocked' };
    const spending_unlocked = data?.spending_unlocked === true;
    return { ok: true, spending_unlocked };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

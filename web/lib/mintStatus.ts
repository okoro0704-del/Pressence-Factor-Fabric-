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

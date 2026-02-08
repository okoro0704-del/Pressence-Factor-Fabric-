/**
 * user_balances — Private Personal Treasury.
 * Personal Treasury tab pulls from this table (per-user). Fallback: chain + user_profiles.
 */

import { supabase, hasSupabase } from './supabase';

export interface UserBalanceRow {
  phone_number: string;
  vida_balance: number;
  dllr_balance: number;
  usdt_balance: number;
  vngn_balance: number;
  wallet_address: string | null;
  updated_at: string;
}

/** Fetch current user's row from user_balances. Returns null if no row or table missing. */
export async function fetchUserBalances(phoneNumber: string | null): Promise<UserBalanceRow | null> {
  if (!phoneNumber?.trim() || !hasSupabase()) return null;
  try {
    const { data, error } = await supabase
      .from('user_balances')
      .select('phone_number, vida_balance, dllr_balance, usdt_balance, vngn_balance, wallet_address, updated_at')
      .eq('phone_number', phoneNumber.trim())
      .maybeSingle();

    if (error || !data) return null;
    return {
      phone_number: data.phone_number,
      vida_balance: Number(data.vida_balance),
      dllr_balance: Number(data.dllr_balance),
      usdt_balance: Number(data.usdt_balance),
      vngn_balance: Number(data.vngn_balance),
      wallet_address: data.wallet_address ?? null,
      updated_at: data.updated_at,
    };
  } catch {
    return null;
  }
}

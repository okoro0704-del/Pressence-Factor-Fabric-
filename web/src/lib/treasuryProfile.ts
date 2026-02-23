/**
 * Treasury — fetch spendable_vida from user_profiles for Personal Treasury display.
 * If empty or null, default to 1.0 VIDA ($1,000 anchor).
 * If column is missing (400) or any error, returns default so UI and swap still work.
 */

import { hasSupabase, supabase } from './supabase';

const DEFAULT_SPENDABLE_VIDA = 1.0; // $1,000 anchor per 1 VIDA

export async function getSpendableVidaFromProfile(phoneNumber: string): Promise<number> {
  if (!phoneNumber?.trim()) return DEFAULT_SPENDABLE_VIDA;
  if (!hasSupabase() || !supabase) return DEFAULT_SPENDABLE_VIDA;

  try {
    const { data, error } = await (supabase as any)
      .from('user_profiles')
      .select('spendable_vida')
      .eq('phone_number', phoneNumber.trim())
      .maybeSingle();

    if (error) return DEFAULT_SPENDABLE_VIDA;
    if (data == null) return DEFAULT_SPENDABLE_VIDA;
    const val = data.spendable_vida;
    if (val == null || val === '' || Number.isNaN(Number(val))) return DEFAULT_SPENDABLE_VIDA;
    const num = Number(val);
    return num >= 0 ? num : DEFAULT_SPENDABLE_VIDA;
  } catch {
    return DEFAULT_SPENDABLE_VIDA;
  }
}

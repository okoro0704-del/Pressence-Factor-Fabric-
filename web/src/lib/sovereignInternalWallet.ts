/**
 * Sovereign Internal Wallet — balances from sovereign_internal_wallets (Supabase).
 * No MetaMask/Phantom. All data from internal table.
 */

import { supabase } from './supabase';
import { VIDA_USD_VALUE } from './economic';

export interface SovereignInternalWalletRow {
  id: string;
  phone_number: string;
  dllr_balance: number;
  usdt_balance: number;
  vida_cap_balance: number;
  usdt_deposit_address_erc20: string | null;
  usdt_deposit_address_trc20: string | null;
  created_at: string;
  updated_at: string;
}

/** Generate deterministic static USDT address from phone (same user = same address). */
function deriveStaticAddress(phone: string, prefix: '0x' | 'T'): string {
  const encoder = new TextEncoder();
  const data = encoder.encode('pff-usdt-' + phone);
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) - hash + data[i]) | 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(40, '0').slice(0, 40);
  if (prefix === '0x') return '0x' + hex;
  return 'T' + hex.slice(0, 34);
}

export async function getSovereignInternalWallet(
  phoneNumber: string
): Promise<SovereignInternalWalletRow | null> {
  if (!supabase) return null;
  const { data, error } = await (supabase as any)
    .from('sovereign_internal_wallets')
    .select('*')
    .eq('phone_number', phoneNumber)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as Record<string, unknown>;
  return {
    id: row.id as string,
    phone_number: row.phone_number as string,
    dllr_balance: Number(row.dllr_balance ?? 0),
    usdt_balance: Number(row.usdt_balance ?? 0),
    vida_cap_balance: Number(row.vida_cap_balance ?? 0),
    usdt_deposit_address_erc20: (row.usdt_deposit_address_erc20 as string) ?? null,
    usdt_deposit_address_trc20: (row.usdt_deposit_address_trc20 as string) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

/** Ensure wallet exists and return it; create with static USDT addresses if missing. */
export async function getOrCreateSovereignWallet(
  phoneNumber: string
): Promise<SovereignInternalWalletRow | null> {
  let row = await getSovereignInternalWallet(phoneNumber);
  if (row) return row;
  if (!supabase) return null;
  const erc20 = deriveStaticAddress(phoneNumber, '0x');
  const trc20 = deriveStaticAddress(phoneNumber, 'T');
  const { data, error } = await (supabase as any)
    .from('sovereign_internal_wallets')
    .insert({
      phone_number: phoneNumber,
      dllr_balance: 0,
      usdt_balance: 0,
      vida_cap_balance: 0,
      usdt_deposit_address_erc20: erc20,
      usdt_deposit_address_trc20: trc20,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error || !data) return null;
  const d = data as Record<string, unknown>;
  return {
    id: d.id as string,
    phone_number: d.phone_number as string,
    dllr_balance: Number(d.dllr_balance ?? 0),
    usdt_balance: Number(d.usdt_balance ?? 0),
    vida_cap_balance: Number(d.vida_cap_balance ?? 0),
    usdt_deposit_address_erc20: (d.usdt_deposit_address_erc20 as string) ?? erc20,
    usdt_deposit_address_trc20: (d.usdt_deposit_address_trc20 as string) ?? trc20,
    created_at: d.created_at as string,
    updated_at: d.updated_at as string,
  };
}

export function getStaticUSDTAddresses(phoneNumber: string): { erc20: string; trc20: string } {
  return {
    erc20: deriveStaticAddress(phoneNumber, '0x'),
    trc20: deriveStaticAddress(phoneNumber, 'T'),
  };
}

/** Conversion rate: 1 VIDA = $1,000 = 1,000 DLLR (from economic anchor). */
export const VIDA_TO_DLLR_RATE = VIDA_USD_VALUE;

/** 2% conversion levy routed to PFF_FOUNDATION_VAULT (user receives DLLR on 98% of VIDA). */
const CONVERSION_LEVY_PERCENT = 0.02;

/** Update balances after Convert VIDA to DLLR. 2% levy goes to Foundation Vault; user gets DLLR on 98%. */
export async function updateSovereignWalletConvertVidaToDllr(
  phoneNumber: string,
  vidaAmount: number
): Promise<boolean> {
  if (!supabase || vidaAmount <= 0) return false;
  const row = await getSovereignInternalWallet(phoneNumber);
  if (!row) return false;
  const levyVida = vidaAmount * CONVERSION_LEVY_PERCENT;
  const netVidaForUser = vidaAmount - levyVida;
  const dllrCredited = netVidaForUser * VIDA_TO_DLLR_RATE;

  const { routeConversionLevyToFoundation } = await import('@/lib/foundationSeigniorage');
  if (levyVida > 0) {
    await routeConversionLevyToFoundation(phoneNumber, levyVida, `convert_${Date.now()}`);
  }

  const { error } = await (supabase as any)
    .from('sovereign_internal_wallets')
    .update({
      vida_cap_balance: row.vida_cap_balance - vidaAmount,
      dllr_balance: row.dllr_balance + dllrCredited,
      updated_at: new Date().toISOString(),
    })
    .eq('phone_number', phoneNumber);
  return !error;
}

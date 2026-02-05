/**
 * PFF × Sovryn — Relayer gas for first VIDA-to-DLLR swap when user has insufficient RBTC.
 */

import { getSupabase } from '../supabase';
import { deriveRSKWalletFromSeed } from './derivedWallet';

/**
 * Request the Protocol Relayer to cover gas for a swap (e.g. first VIDA→DLLR).
 * Invokes Edge Function or API; relayer may send a small amount of RBTC to the user's address.
 */
export async function requestRelayerGasForSwap(phoneNumber: string): Promise<{ ok: boolean; error?: string }> {
  const trimmed = phoneNumber?.trim();
  if (!trimmed) return { ok: false, error: 'Phone required' };

  const derived = await deriveRSKWalletFromSeed(trimmed);
  if (!derived.ok) return { ok: false, error: derived.error };

  const supabase = getSupabase();
  if (supabase?.functions?.invoke) {
    const { data, error } = await (supabase as any).functions.invoke('relayer-gas', {
      body: { phone: trimmed, recipientAddress: derived.address },
    });
    if (!error && data?.ok === true) return { ok: true };
    return { ok: false, error: data?.error ?? error?.message ?? 'Relayer request failed' };
  }

  try {
    const res = await fetch('/api/relayer/gas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: trimmed, recipientAddress: derived.address }),
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok && json.ok === true) return { ok: true };
    return { ok: false, error: json.error ?? 'Relayer request failed' };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Relayer request failed' };
  }
}

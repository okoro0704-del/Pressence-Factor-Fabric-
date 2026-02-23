/**
 * Listener: when is_fully_verified becomes TRUE in Supabase, trigger gasless mint (5 VIDA to derived RSK wallet).
 * Prefers Supabase Edge Function "gasless-mint" (Relayer); falls back to POST /api/vida/mint.
 */

import { getSupabase } from '../supabase';
import { deriveRSKWalletFromSeed } from './derivedWallet';

export type VerifiedMintListenerCallback = (result: {
  txHash?: string;
  error?: string;
  alreadyMinted?: boolean;
}) => void;

async function triggerGaslessMint(phone: string): Promise<{
  txHash?: string;
  alreadyMinted?: boolean;
  error?: string;
}> {
  const supabase = getSupabase();
  const useEdgeFunction = supabase?.functions?.invoke != null;

  if (useEdgeFunction) {
    const derived = await deriveRSKWalletFromSeed(phone);
    if (!derived.ok) return { error: derived.error };
    const { data, error } = await (supabase as any).functions.invoke('gasless-mint', {
      body: { phone, recipientAddress: derived.address },
    });
    if (!error && data?.ok === true) {
      return {
        txHash: data.txHash,
        alreadyMinted: !!data.txHash && !!data.recipientAddress,
      };
    }
    // Fallback to Next.js API if Edge Function not deployed or fails
  }

  const res = await fetch('/api/vida/mint', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  });
  const json = await res.json().catch(() => ({}));
  if (res.ok) {
    return {
      txHash: json.txHash,
      alreadyMinted: json.alreadyMinted === true,
    };
  }
  return { error: json.error ?? 'Mint request failed' };
}

/**
 * Poll user_profiles for is_fully_verified and vida_mint_tx_hash.
 * When is_fully_verified is TRUE and vida_mint_tx_hash is null, call Edge Function gasless-mint (or /api/vida/mint) and invoke callback.
 * Call cleanup() to stop polling.
 */
export function startVerifiedMintListener(
  phoneNumber: string,
  callback: VerifiedMintListenerCallback,
  options?: { pollIntervalMs?: number }
): () => void {
  const trimmed = phoneNumber?.trim();
  if (!trimmed) return () => {};

  const pollIntervalMs = options?.pollIntervalMs ?? 15000;
  let cancelled = false;

  const poll = async () => {
    if (cancelled) return;
    const supabase = getSupabase();
    if (!supabase) return;

    try {
      const { data } = await (supabase as any)
        .from('user_profiles')
        .select('is_fully_verified, vida_mint_tx_hash')
        .eq('phone_number', trimmed)
        .maybeSingle();

      if (cancelled || !data) return;
      if (!data.is_fully_verified) return;
      if (data.vida_mint_tx_hash) {
        callback({ txHash: data.vida_mint_tx_hash, alreadyMinted: true });
        return;
      }

      const result = await triggerGaslessMint(trimmed);
      if (cancelled) return;
      if (result.txHash) {
        callback({ txHash: result.txHash, alreadyMinted: result.alreadyMinted });
        return;
      }
      callback({ error: result.error ?? 'Mint failed' });
    } catch (e) {
      if (!cancelled) callback({ error: e instanceof Error ? e.message : String(e) });
    }
  };

  const intervalId = setInterval(poll, pollIntervalMs);
  poll();

  return () => {
    cancelled = true;
    clearInterval(intervalId);
  };
}

/**
 * Subscribe to Supabase Realtime for user_profiles row; when is_fully_verified flips to true and no vida_mint_tx_hash, trigger mint.
 * Returns cleanup function.
 */
export function subscribeVerifiedMint(
  phoneNumber: string,
  callback: VerifiedMintListenerCallback
): () => void {
  const trimmed = phoneNumber?.trim();
  if (!trimmed) return () => {};

  const supabase = getSupabase();
  if (!supabase?.channel) {
    return startVerifiedMintListener(trimmed, callback, { pollIntervalMs: 10000 });
  }

  const channel = supabase
    .channel(`vida-mint:${trimmed}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'user_profiles',
        filter: `phone_number=eq.${trimmed}`,
      },
        async (payload: { new: { is_fully_verified?: boolean; vida_mint_tx_hash?: string | null } }) => {
        const n = payload?.new;
        if (!n?.is_fully_verified || n.vida_mint_tx_hash) return;
        try {
          const result = await triggerGaslessMint(trimmed);
          if (result.txHash) callback({ txHash: result.txHash, alreadyMinted: result.alreadyMinted });
          else callback({ error: result.error ?? 'Mint failed' });
        } catch (e) {
          callback({ error: e instanceof Error ? e.message : String(e) });
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

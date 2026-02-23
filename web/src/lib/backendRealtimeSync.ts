/**
 * Backend → Frontend Realtime sync.
 * Subscribe to Supabase Postgres changes for the current user's profile and wallet
 * so when the backend (or another tab/device) updates data, the frontend receives
 * the change and can refresh UI without polling.
 */

import { supabase } from './supabase';

export type BackendSyncCallbacks = {
  onProfileChange?: () => void;
  onWalletChange?: () => void;
};

/**
 * Subscribe to user_profiles and sovereign_internal_wallets changes for the given phone.
 * When a row with matching phone_number is updated/inserted, the corresponding callback is invoked.
 * Returns an unsubscribe function.
 */
export function subscribeToBackendSync(
  phone: string | null,
  callbacks: BackendSyncCallbacks
): () => void {
  const trimmed = phone?.trim();
  if (!trimmed || !supabase?.channel) return () => {};

  const { onProfileChange, onWalletChange } = callbacks;
  const safePhone = trimmed;

  const channelName = `backend_sync_${safePhone.replace(/\D/g, '').slice(-12)}`;
  const channel = (supabase as any)
    .channel(channelName)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'user_profiles' },
      (payload: { new?: Record<string, unknown>; old?: Record<string, unknown> }) => {
        const row = payload?.new ?? payload?.old;
        if (row && typeof row === 'object' && String(row.phone_number ?? '').trim() === safePhone) {
          onProfileChange?.();
        }
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'sovereign_internal_wallets' },
      (payload: { new?: Record<string, unknown>; old?: Record<string, unknown> }) => {
        const row = payload?.new ?? payload?.old;
        if (row && typeof row === 'object' && String(row.phone_number ?? '').trim() === safePhone) {
          onWalletChange?.();
        }
      }
    )
    .subscribe();

  return () => {
    try {
      (channel as { unsubscribe?: () => void }).unsubscribe?.();
    } catch {
      // ignore
    }
    try {
      (supabase as any).removeChannel?.(channel);
    } catch {
      // ignore
    }
  };
}

/**
 * Subscribe to ledger_stats (global) so dashboard pulse bar and PFF Grand Balance
 * refresh when the backend updates totals (e.g. after a mint or vitalization).
 */
export function subscribeToLedgerSync(onLedgerChange: () => void): () => void {
  if (!supabase?.channel) return () => {};
  try {
    const channel = (supabase as any)
      .channel('backend_sync_ledger')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ledger_stats' }, () => {
        onLedgerChange();
      })
      .subscribe();
    return () => {
      try {
        (channel as { unsubscribe?: () => void }).unsubscribe?.();
      } catch {
        // ignore
      }
      try {
        (supabase as any).removeChannel?.(channel);
      } catch {
        // ignore
      }
    };
  } catch {
    return () => {};
  }
}

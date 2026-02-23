/**
 * PFF — Sync status for UI. Red / Yellow / Green.
 * Subscribe to pending count, online, and syncing state.
 */

import { runSync, getPendingCount } from './sync';

export type SyncStatusLabel = 'offline' | 'syncing' | 'synced';

let syncing = false;
const listeners = new Set<() => void>();

export function isSyncing(): boolean {
  return syncing;
}

export function subscribeSyncStatus(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function notify(): void {
  listeners.forEach((cb) => cb());
}

export function notifySyncStatus(): void {
  notify();
}

export async function triggerSync(): Promise<void> {
  if (syncing) return;
  syncing = true;
  notify();
  try {
    await runSync();
  } finally {
    syncing = false;
    notify();
  }
}

export async function getSyncStatus(): Promise<{ label: SyncStatusLabel; pendingCount: number }> {
  const pending = await getPendingCount();
  const online = typeof navigator !== 'undefined' && navigator.onLine;
  if (syncing) return { label: 'syncing', pendingCount: pending };
  if (pending > 0 && !online) return { label: 'offline', pendingCount: pending };
  return { label: 'synced', pendingCount: 0 };
}

export { getPendingCount };

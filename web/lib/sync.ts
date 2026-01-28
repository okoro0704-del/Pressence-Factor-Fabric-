/**
 * PFF — Lagos-Proof Offline Sync.
 * Enqueue encrypted proofs, POST to /api/sync-presence, mark synced. Background Sync retries when offline.
 */

import {
  enqueueProof,
  getPending,
  markSynced,
  getPendingCount,
  decryptPayload,
} from './vault';

const SYNC_API = '/api/sync-presence';

export type SyncState = 'idle' | 'syncing' | 'offline-pending';

export interface SyncStatus {
  state: SyncState;
  pendingCount: number;
}

/** Persist proof to vault (encrypted, pending). */
export async function enqueuePresenceProof(handshakeId: string, proof: unknown): Promise<void> {
  const proofJson = JSON.stringify(proof);
  await enqueueProof(handshakeId, proofJson);
}

/** Enqueue, POST once. Mark synced on 2xx. If fetch fails, workbox-background-sync will retry. */
export async function submitSingleProof(handshakeId: string, proof: unknown): Promise<boolean> {
  await enqueuePresenceProof(handshakeId, proof);
  try {
    const res = await fetch(SYNC_API, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ handshakeId, proof }),
    });
    if (res.ok) {
      await markSynced(handshakeId);
      return true;
    }
  } catch {
    /* offline or network error; queue remains pending, SW may retry */
  }
  return false;
}

/** Run sync: fetch pending, POST each, mark synced on 2xx. Idempotent by handshakeId. */
export async function runSync(): Promise<{ synced: number; failed: number }> {
  const pending = await getPending();
  let synced = 0;
  let failed = 0;
  for (const entry of pending) {
    try {
      const proofJson = await decryptPayload(entry.encryptedPayload);
      const proof = JSON.parse(proofJson) as unknown;
      const res = await fetch(SYNC_API, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handshakeId: entry.handshakeId, proof }),
      });
      if (res.ok) {
        await markSynced(entry.handshakeId);
        synced++;
      } else {
        failed++;
      }
    } catch {
      failed++;
    }
  }
  return { synced, failed };
}

export async function fetchPendingCount(): Promise<number> {
  return getPendingCount();
}

export { getPendingCount };

/**
 * PFF — Local Vault (IndexedDB).
 * Store: pff_sync_queue. AES-256-GCM at-rest encryption for pending Presence Proofs.
 *
 * Fortress Security: session-specific key only. Key is held in memory, never persisted.
 * Device dump of IndexedDB yields encrypted blobs only; without session key, proofs are useless.
 */

import { openDB } from 'idb';

const DB_NAME = 'pff_vault';
const DB_VERSION = 1;
const STORE_QUEUE = 'pff_sync_queue';
const STORE_KEYS = 'pff_keys';

export type SyncStatus = 'pending' | 'synced';

export interface SyncQueueEntry {
  handshakeId: string;
  encryptedPayload: string;
  status: SyncStatus;
  timestamp: number;
}

let dbInstance: Awaited<ReturnType<typeof openDB>> | null = null;
let sessionKey: CryptoKey | null = null;

async function getDb(): Promise<Awaited<ReturnType<typeof openDB>>> {
  if (dbInstance) return dbInstance;
  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_QUEUE)) {
        const q = db.createObjectStore(STORE_QUEUE, { keyPath: 'handshakeId' });
        q.createIndex('by-status', 'status');
        q.createIndex('by-timestamp', 'timestamp');
      }
      if (!db.objectStoreNames.contains(STORE_KEYS)) {
        db.createObjectStore(STORE_KEYS, { keyPath: 'id' });
      }
    },
  });
  return dbInstance;
}

/** Session-only key. Never persisted; lost on tab close. Fortress: dump of IDB alone is useless. */
async function getOrCreateKey(): Promise<CryptoKey> {
  if (sessionKey) return sessionKey;
  sessionKey = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  return sessionKey;
}

const IV_LEN = 12;
const TAG_LEN = 16;

export async function encryptPayload(plain: string): Promise<string> {
  const key = await getOrCreateKey();
  const iv = crypto.getRandomValues(new Uint8Array(IV_LEN));
  const enc = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, tagLength: TAG_LEN * 8 },
    key,
    new TextEncoder().encode(plain)
  );
  const combined = new Uint8Array(iv.length + enc.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(enc), iv.length);
  return b64Encode(combined);
}

export async function decryptPayload(b64: string): Promise<string> {
  const key = await getOrCreateKey();
  const combined = b64Decode(b64);
  const iv = new Uint8Array(combined.subarray(0, IV_LEN));
  const cipher = new Uint8Array(combined.subarray(IV_LEN));
  const dec = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv, tagLength: TAG_LEN * 8 },
    key,
    cipher
  );
  return new TextDecoder().decode(dec);
}

function b64Encode(u8: Uint8Array): string {
  let b64 = '';
  const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  for (let i = 0; i < u8.length; i += 3) {
    const a = u8[i] ?? 0;
    const b = u8[i + 1] ?? 0;
    const c = u8[i + 2] ?? 0;
    b64 += ALPHABET[a >> 2] + ALPHABET[((a & 3) << 4) | (b >> 4)] +
      ALPHABET[((b & 15) << 2) | (c >> 6)] + ALPHABET[c & 63];
  }
  const pad = u8.length % 3;
  const out = pad ? b64.slice(0, b64.length - (3 - pad)) : b64;
  return out.replace(/\+/g, '-').replace(/\//g, '_');
}

function b64Decode(str: string): Uint8Array {
  let s = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = s.length % 4;
  if (pad) s += '='.repeat(4 - pad);
  const bin = atob(s);
  const u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  return u8;
}

/** High-resolution timestamp (monotonic-ish). */
export function highResTimestamp(): number {
  if (typeof performance !== 'undefined' && typeof performance.timeOrigin === 'number') {
    return performance.timeOrigin + performance.now();
  }
  return Date.now();
}

export async function enqueueProof(handshakeId: string, proofJson: string): Promise<void> {
  const encrypted = await encryptPayload(proofJson);
  const entry: SyncQueueEntry = {
    handshakeId,
    encryptedPayload: encrypted,
    status: 'pending',
    timestamp: highResTimestamp(),
  };
  const db = await getDb();
  await db.put(STORE_QUEUE, entry);
}

export async function getPending(): Promise<SyncQueueEntry[]> {
  const db = await getDb();
  const all = (await db.getAllFromIndex(STORE_QUEUE, 'by-status', 'pending')) as SyncQueueEntry[];
  return all.sort((a, b) => a.timestamp - b.timestamp);
}

export async function markSynced(handshakeId: string): Promise<void> {
  const db = await getDb();
  const entry = await db.get(STORE_QUEUE, handshakeId);
  if (entry) {
    await db.put(STORE_QUEUE, { ...entry, status: 'synced' as SyncStatus });
  }
}

export async function getPendingCount(): Promise<number> {
  const db = await getDb();
  return db.countFromIndex(STORE_QUEUE, 'by-status', 'pending');
}

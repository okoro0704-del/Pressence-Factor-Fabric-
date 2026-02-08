/**
 * Sovereign Identity v1 — IndexedDB persistence for citizen_hash.
 * Stored when user completes registration; used for pre-flight recognition and local face match.
 */

const DB_NAME = 'pff_sovereign';
const DB_VERSION = 1;
const STORE_NAME = 'sovereign_identity';
const KEY = 'v1';

export interface SovereignIdentityV1 {
  version: 'sovereign_identity_v1';
  citizen_hash: string;
  phone?: string;
  stored_at: string; // ISO
}

function openDB(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') return Promise.reject(new Error('IndexedDB not available'));
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

/** Store sovereign_identity_v1 (citizen_hash) in IndexedDB. Call on Complete Registration. */
export async function setSovereignIdentity(citizenHash: string, phone?: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const payload: SovereignIdentityV1 & { id: string } = {
      id: KEY,
      version: 'sovereign_identity_v1',
      citizen_hash: citizenHash.trim(),
      phone: phone?.trim(),
      stored_at: new Date().toISOString(),
    };
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(payload);
    req.onsuccess = () => { db.close(); resolve(); };
    req.onerror = () => { db.close(); reject(req.error); };
  });
}

/** Read sovereign_identity_v1 from IndexedDB. */
export async function getSovereignIdentity(): Promise<SovereignIdentityV1 | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(KEY);
      req.onsuccess = () => {
        db.close();
        const v = req.result as (SovereignIdentityV1 & { id?: string }) | undefined;
        if (v?.version === 'sovereign_identity_v1' && v?.citizen_hash) {
          resolve({
            version: 'sovereign_identity_v1',
            citizen_hash: v.citizen_hash,
            phone: v.phone,
            stored_at: v.stored_at ?? new Date(0).toISOString(),
          });
        } else {
          resolve(null);
        }
      };
      req.onerror = () => { db.close(); reject(req.error); };
    });
  } catch {
    return null;
  }
}

/** Clear sovereign identity (e.g. Vitalize New Soul). */
export async function clearSovereignIdentity(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(KEY);
      req.onsuccess = () => { db.close(); resolve(); };
      req.onerror = () => { db.close(); reject(req.error); };
    });
  } catch {
    // ignore
  }
}

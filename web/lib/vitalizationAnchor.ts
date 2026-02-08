/**
 * Persistent Vitalization Recognition — is_vitalized + citizen_hash (face hash) anchor.
 * Stored in Encrypted LocalStorage and a Secure HttpOnly Cookie for recovery.
 * Deep Recovery: if LocalStorage is cleared, restore from presence_handshakes / device ID via Supabase.
 */

import { getSupabase } from './supabase';
import { getCompositeDeviceFingerprint } from './biometricAuth';

const STORAGE_KEY = 'pff_vitalized_anchor';
const COOKIE_NAME = 'pff_vitalized';
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year
/** Key derivation salt (not secret; obfuscation only). Use env in production for real encryption. */
const KEY_SALT = typeof process !== 'undefined' && process.env.NEXT_PUBLIC_VITALIZATION_ANCHOR_SECRET
  ? process.env.NEXT_PUBLIC_VITALIZATION_ANCHOR_SECRET
  : 'pff_vitalization_anchor_v1';

export interface VitalizationAnchor {
  isVitalized: boolean;
  citizenHash: string | null;
  phone?: string;
}

async function deriveKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(KEY_SALT.slice(0, 32).padEnd(32, '0')),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: enc.encode('pff_anchor_salt'), iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encrypt(plain: string): Promise<string> {
  const key = await deriveKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const cipher = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, tagLength: 128 },
    key,
    enc.encode(plain)
  );
  const combined = new Uint8Array(iv.length + cipher.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(cipher), iv.length);
  return btoa(String.fromCharCode(...combined));
}

async function decrypt(b64: string): Promise<string | null> {
  try {
    const key = await deriveKey();
    const combined = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const cipher = combined.slice(12);
    const dec = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv, tagLength: 128 },
      key,
      cipher
    );
    return new TextDecoder().decode(dec);
  } catch {
    return null;
  }
}

/** Read anchor from Encrypted LocalStorage. Does not run deep recovery. */
export async function getVitalizationAnchorFromStorage(): Promise<VitalizationAnchor> {
  if (typeof localStorage === 'undefined') return { isVitalized: false, citizenHash: null };
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw || !raw.trim()) return { isVitalized: false, citizenHash: null };
  const plain = await decrypt(raw);
  if (!plain) return { isVitalized: false, citizenHash: null };
  try {
    const o = JSON.parse(plain) as { isVitalized?: boolean; citizenHash?: string | null; phone?: string };
    return {
      isVitalized: o.isVitalized === true,
      citizenHash: typeof o.citizenHash === 'string' ? o.citizenHash : null,
      phone: typeof o.phone === 'string' ? o.phone : undefined,
    };
  } catch {
    return { isVitalized: false, citizenHash: null };
  }
}

/**
 * Get anchor: first from storage, then try Deep Recovery (device ID -> presence_handshakes / user_profiles).
 */
export async function getVitalizationAnchor(): Promise<VitalizationAnchor> {
  const fromStorage = await getVitalizationAnchorFromStorage();
  if (fromStorage.isVitalized && fromStorage.citizenHash) return fromStorage;
  const recovered = await deepRecoveryVitalizationAnchor();
  return recovered ? await getVitalizationAnchorFromStorage() : fromStorage;
}

/** Synchronous: true only if storage has an anchor (encrypted blob). Use getVitalizationAnchor() for full check + deep recovery. */
export function hasVitalizationAnchorStored(): boolean {
  if (typeof localStorage === 'undefined') return false;
  return !!localStorage.getItem(STORAGE_KEY)?.trim();
}

/**
 * Store is_vitalized and citizen_hash in Encrypted LocalStorage, IndexedDB (sovereign_identity_v1), and Secure HttpOnly Cookie.
 */
export async function setVitalizationAnchor(citizenHash: string, phone?: string): Promise<void> {
  if (typeof localStorage === 'undefined') return;
  const payload = { isVitalized: true, citizenHash: citizenHash.trim(), phone: phone?.trim() };
  const plain = JSON.stringify(payload);
  const cipher = await encrypt(plain);
  localStorage.setItem(STORAGE_KEY, cipher);
  try {
    const { setSovereignIdentity } = await import('./sovereignIdentityDB');
    await setSovereignIdentity(citizenHash.trim(), phone?.trim());
  } catch {
    // IndexedDB best-effort
  }
  try {
    await fetch('/api/vitalization-anchor/cookie', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ citizenHash: citizenHash.trim(), phone: phone?.trim() }),
    });
  } catch {
    // cookie is best-effort; localStorage is source of truth for client
  }
}

/** Clear anchor (e.g. "Vitalize New Soul"). */
export function clearVitalizationAnchor(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
  import('./sovereignIdentityDB').then(({ clearSovereignIdentity }) => clearSovereignIdentity()).catch(() => {});
  try {
    fetch('/api/vitalization-anchor/cookie', { method: 'DELETE' }).catch(() => {});
  } catch {
    // ignore
  }
}

/**
 * Deep Recovery: if LocalStorage is cleared, check device ID against user_profiles (primary_sentinel_device_id)
 * to restore vitalized status and citizen_hash (face_hash). Also try presence_handshakes by anchor_phone if no device match.
 */
export async function deepRecoveryVitalizationAnchor(): Promise<boolean> {
  if (typeof localStorage === 'undefined') return false;
  try {
    const deviceId = await getCompositeDeviceFingerprint();
    const supabase = getSupabase();
    if (!supabase) return false;

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('phone_number, face_hash')
      .eq('primary_sentinel_device_id', deviceId)
      .not('face_hash', 'is', null)
      .limit(1)
      .maybeSingle();

    if (!profileError && profile?.phone_number && profile?.face_hash) {
      const phone = (profile as { phone_number: string }).phone_number.trim();
      const faceHash = (profile as { face_hash: string }).face_hash.trim();
      await setVitalizationAnchor(faceHash, phone);
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

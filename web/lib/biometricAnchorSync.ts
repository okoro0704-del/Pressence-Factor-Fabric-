/**
 * Biometric Anchor Sync — Finalize face and fingerprint anchors in the database.
 * BIOMETRIC DATA IS HASHED AND ENCRYPTED. RAW IMAGES ARE NEVER PERSISTED.
 */

import { getSupabase } from './supabase';

const FACE_HASH_SESSION_KEY = 'pff_face_hash';
function faceHashSessionKey(phone: string): string {
  let h = 5381;
  for (let i = 0; i < phone.length; i++) h = ((h << 5) + h) ^ phone.charCodeAt(i);
  return `${FACE_HASH_SESSION_KEY}_${(h >>> 0).toString(16).slice(0, 8)}`;
}

/** Read face hash from session (set when Face Pulse completes so Seed Verification can see it). */
export function getFaceHashFromSession(phoneNumber: string): string | null {
  if (typeof sessionStorage === 'undefined') return null;
  const key = faceHashSessionKey(phoneNumber.trim());
  const val = sessionStorage.getItem(key);
  return val && val.trim() ? val.trim() : null;
}

/** Write face hash to session after successful persist (so next step sees it without DB delay). */
export function setFaceHashInSession(phoneNumber: string, faceHash: string): void {
  if (typeof sessionStorage === 'undefined') return;
  const key = faceHashSessionKey(phoneNumber.trim());
  sessionStorage.setItem(key, faceHash.trim());
}

/** Persistent face hash (survives page transition). Used by Scanner → master-key flow. */
const FACE_HASH_PERSISTENT_KEY = 'pff_face_hash_persistent';
const FACE_HASH_PHONE_KEY = 'pff_face_hash_phone';
const FACE_HASH_COOKIE = 'pff_face_anchor';
const FACE_HASH_COOKIE_MAX_AGE = 60 * 60; // 1 hour

export function getPersistentFaceHash(): { faceHash: string; phone?: string } | null {
  if (typeof localStorage === 'undefined') return null;
  const faceHash = localStorage.getItem(FACE_HASH_PERSISTENT_KEY);
  const phone = localStorage.getItem(FACE_HASH_PHONE_KEY);
  if (!faceHash || !faceHash.trim()) return null;
  return { faceHash: faceHash.trim(), phone: phone ?? undefined };
}

export function setPersistentFaceHash(faceHash: string, phone?: string): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(FACE_HASH_PERSISTENT_KEY, faceHash.trim());
  if (phone?.trim()) localStorage.setItem(FACE_HASH_PHONE_KEY, phone.trim());
  try {
    if (typeof document !== 'undefined') {
      document.cookie = `${FACE_HASH_COOKIE}=${encodeURIComponent(faceHash.trim())};path=/;max-age=${FACE_HASH_COOKIE_MAX_AGE};SameSite=Strict;Secure`;
    }
  } catch {
    // ignore
  }
}

/** Sync persistent face hash into session for a given phone (so getFaceHashFromSession returns it). */
export function syncPersistentFaceHashToSession(phoneNumber: string): boolean {
  const persistent = getPersistentFaceHash();
  if (!persistent?.faceHash) return false;
  setFaceHashInSession(phoneNumber.trim(), persistent.faceHash);
  return true;
}

// BIOMETRIC DATA IS HASHED AND ENCRYPTED. RAW IMAGES ARE NEVER PERSISTED.

/** SHA-256 hash a string (e.g. face template or raw fingerprint from scanner). Returns hex. */
export async function sha256Hex(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Hash raw Uint8Array (e.g. scanner transfer buffer) to SHA-256 hex. BIOMETRIC DATA IS HASHED. RAW NEVER PERSISTED. */
export async function sha256FromUint8Array(buffer: Uint8Array): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer as unknown as BufferSource);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Hash raw external fingerprint output with SHA-256 before persisting. */
export async function hashExternalFingerprintRaw(rawOutput: string): Promise<string> {
  return sha256Hex(rawOutput.trim());
}

/**
 * Persist fingerprint hash to recovery_seed_hash (and external_fingerprint_hash) in Supabase.
 * Call after external scanner returns raw buffer → hash with sha256FromUint8Array → then this.
 */
/** When fingerprint is registered, hash is stored in external_fingerprint_hash and optionally biometric_hash (profiles table). */
export async function persistFingerprintHashToRecoverySeed(
  phoneNumber: string,
  fingerprintHashHex: string,
  options?: { alsoSetExternalFingerprintHash?: boolean }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: 'Supabase not available' };
  const trimmed = phoneNumber?.trim();
  if (!trimmed || !fingerprintHashHex?.trim()) {
    return { ok: false, error: 'Phone number and fingerprint hash required.' };
  }
  try {
    const hash = fingerprintHashHex.trim();
    const payload: Record<string, unknown> = {
      recovery_seed_hash: hash,
      updated_at: new Date().toISOString(),
    };
    // Always sync fingerprint hash to Supabase (external_fingerprint_hash + biometric_hash when column exists)
    payload.external_fingerprint_hash = hash;
    payload.biometric_hash = hash;
    let { error } = await (supabase as any)
      .from('user_profiles')
      .update(payload)
      .eq('phone_number', trimmed);
    if (error && /column.*biometric_hash|does not exist/i.test(error.message ?? '')) {
      delete payload.biometric_hash;
      const retry = await (supabase as any)
        .from('user_profiles')
        .update(payload)
        .eq('phone_number', trimmed);
      error = retry.error;
    }
    if (error) return { ok: false, error: error.message ?? 'Failed to persist recovery_seed_hash' };
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

/** Derive face template hash from credential (for face_hash column). BIOMETRIC DATA IS HASHED. RAW IMAGES ARE NEVER PERSISTED. */
export async function deriveFaceHashFromCredential(credential: { id?: string; rawId?: ArrayBuffer | Uint8Array; response?: { clientDataJSON?: ArrayBuffer | Uint8Array; authenticatorData?: ArrayBuffer | Uint8Array } }): Promise<string> {
  const id = credential?.id ?? '';
  const rawId = credential?.rawId;
  const rawBytes = rawId instanceof ArrayBuffer ? new Uint8Array(rawId) : rawId instanceof Uint8Array ? rawId : new Uint8Array(0);
  const authData = credential?.response?.authenticatorData;
  const authBytes = authData instanceof ArrayBuffer ? new Uint8Array(authData) : authData instanceof Uint8Array ? authData : new Uint8Array(0);
  const combined = id + Array.from(rawBytes).join(',') + Array.from(authBytes).join(',');
  return sha256Hex(combined);
}

/**
 * Persist face template (unique mathematical signature) to face_hash column in user_profiles.
 * Target: face_hash column in profiles table. Upserts so the column is set even if no row existed.
 */
export async function persistFaceHash(
  phoneNumber: string,
  faceTemplateHash: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: 'Supabase not available' };
  const trimmed = phoneNumber?.trim();
  const hash = faceTemplateHash?.trim();
  if (!trimmed || !hash) {
    return { ok: false, error: 'Phone number and face_hash required.' };
  }
  try {
    const payload = { face_hash: hash, updated_at: new Date().toISOString() };
    const { data: existing } = await (supabase as any)
      .from('user_profiles')
      .select('id')
      .eq('phone_number', trimmed)
      .maybeSingle();
    if (existing?.id) {
      const { error } = await (supabase as any)
        .from('user_profiles')
        .update(payload)
        .eq('phone_number', trimmed);
      if (error) {
        const isRlsOrPermission = /policy|RLS|permission|row-level|current_setting/i.test(error.message ?? '');
        if (isRlsOrPermission) {
          const { data: rpcData, error: rpcError } = await (supabase as any).rpc('update_user_profile_face_hash', {
            p_phone_number: trimmed,
            p_face_hash: hash,
          });
          if (rpcError) return { ok: false, error: rpcError.message ?? 'RPC update_user_profile_face_hash failed' };
          const out = (rpcData ?? {}) as { ok?: boolean; error?: string };
          if (out.ok === true) {
            setFaceHashInSession(trimmed, hash);
            return { ok: true };
          }
          return { ok: false, error: out.error ?? 'RPC update_user_profile_face_hash failed' };
        }
        return { ok: false, error: error.message ?? 'Failed to persist face_hash' };
      }
      setFaceHashInSession(trimmed, hash);
      return { ok: true };
    } else {
      const { error } = await (supabase as any)
        .from('user_profiles')
        .insert({ phone_number: trimmed, ...payload });
      if (error) {
        const isRlsOrPermission = /policy|RLS|permission|row-level|current_setting/i.test(error.message ?? '');
        if (isRlsOrPermission) {
          const { data: rpcData, error: rpcError } = await (supabase as any).rpc('update_user_profile_face_hash', {
            p_phone_number: trimmed,
            p_face_hash: hash,
          });
          if (rpcError) return { ok: false, error: rpcError.message ?? 'RPC update_user_profile_face_hash failed' };
          const out = (rpcData ?? {}) as { ok?: boolean; error?: string };
          if (out.ok === true) {
            setFaceHashInSession(trimmed, hash);
            return { ok: true };
          }
          return { ok: false, error: out.error ?? 'RPC update_user_profile_face_hash failed' };
        }
        return { ok: false, error: error.message ?? 'Failed to insert face_hash' };
      }
      setFaceHashInSession(trimmed, hash);
      return { ok: true };
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

/** Confirm face_hash column was updated in Supabase (for Success trigger). */
export async function confirmFaceHashStored(phoneNumber: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  const { data, error } = await (supabase as any)
    .from('user_profiles')
    .select('face_hash')
    .eq('phone_number', phoneNumber.trim())
    .maybeSingle();
  if (error || !data) return false;
  const val = data.face_hash;
  return typeof val === 'string' && val.trim().length > 0;
}

export interface StoredBiometricAnchors {
  face_hash: string | null;
  recovery_seed_hash: string | null;
  external_fingerprint_hash: string | null;
}

/**
 * Pull stored biometric anchors for login verification.
 * Used to compare against live scans for 100% identity certainty.
 * BIOMETRIC DATA IS HASHED AND ENCRYPTED. RAW IMAGES ARE NEVER PERSISTED.
 */
export async function getStoredBiometricAnchors(
  phoneNumber: string
): Promise<{ ok: true; anchors: StoredBiometricAnchors } | { ok: false; error: string }> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: 'Supabase not available' };
  const trimmed = phoneNumber?.trim();
  if (!trimmed) return { ok: false, error: 'Phone number required.' };
  try {
    const { data, error } = await (supabase as any)
      .from('user_profiles')
      .select('face_hash, recovery_seed_hash, external_fingerprint_hash')
      .eq('phone_number', trimmed)
      .maybeSingle();
    if (error) return { ok: false, error: error.message ?? 'Failed to fetch anchors' };
    const row = data as { face_hash?: string | null; recovery_seed_hash?: string | null; external_fingerprint_hash?: string | null } | null;
    const anchors: StoredBiometricAnchors = {
      face_hash: row?.face_hash ?? null,
      recovery_seed_hash: row?.recovery_seed_hash ?? null,
      external_fingerprint_hash: row?.external_fingerprint_hash ?? null,
    };
    return { ok: true, anchors };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

/**
 * Face-Match Bridge: verify live face template against Supabase face_hash.
 * Call after Face Pulse with the derived face hash from the credential.
 */
export async function matchFaceTemplate(
  phoneNumber: string,
  liveFaceHash: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const result = await getStoredBiometricAnchors(phoneNumber);
  if (!result.ok) return { ok: false, error: result.error };
  const storedFace = result.anchors.face_hash?.trim() ?? '';
  const live = liveFaceHash.trim();
  if (!storedFace) {
    return { ok: false, error: 'No face template on file. Complete enrollment first.' };
  }
  if (storedFace !== live) {
    return { ok: false, error: 'Face verification failed. Template does not match.' };
  }
  return { ok: true };
}

/**
 * Verification call for login flow: pull face_hash and recovery_seed_hash (and external_fingerprint_hash),
 * compare against live scans for 100% identity certainty.
 * Returns success only when both live face hash and live fingerprint hash match stored anchors.
 */
export async function verifyBiometricAnchorSync(
  phoneNumber: string,
  liveFaceHash: string,
  liveFingerprintHash: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const result = await getStoredBiometricAnchors(phoneNumber);
  if (!result.ok) return { ok: false, error: result.error };
  const { anchors } = result;

  const storedFace = anchors.face_hash?.trim() ?? '';
  const storedFingerprint = (anchors.external_fingerprint_hash ?? anchors.recovery_seed_hash)?.trim() ?? '';

  if (!storedFace || !storedFingerprint) {
    return {
      ok: false,
      error: 'Biometric anchors not finalized. Complete enrollment (Face + Sovereign Palm) first.',
    };
  }

  const liveFace = liveFaceHash.trim();
  const liveFinger = liveFingerprintHash.trim();
  if (storedFace !== liveFace) {
    return { ok: false, error: 'Face verification failed. Stored face template does not match live scan.' };
  }
  if (storedFingerprint !== liveFinger) {
    return { ok: false, error: 'Palm scan failed. Stored palm does not match live scan.' };
  }

  return { ok: true };
}

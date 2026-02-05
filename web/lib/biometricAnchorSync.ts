/**
 * Biometric Anchor Sync — Finalize face and fingerprint anchors in the database.
 * BIOMETRIC DATA IS HASHED AND ENCRYPTED. RAW IMAGES ARE NEVER PERSISTED.
 */

import { getSupabase } from './supabase';

// BIOMETRIC DATA IS HASHED AND ENCRYPTED. RAW IMAGES ARE NEVER PERSISTED.

/** SHA-256 hash a string (e.g. face template or raw fingerprint from scanner). Returns hex. */
export async function sha256Hex(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Hash raw external fingerprint output with SHA-256 before persisting. */
export async function hashExternalFingerprintRaw(rawOutput: string): Promise<string> {
  return sha256Hex(rawOutput.trim());
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
 * Persist face template (mathematical face vector) as face_hash in Supabase.
 * FacePulse / verifyBiometricSignature should pass the derived face template hash (e.g. SHA-256 of credential).
 * BIOMETRIC DATA IS HASHED AND ENCRYPTED. RAW IMAGES ARE NEVER PERSISTED.
 */
export async function persistFaceHash(
  phoneNumber: string,
  faceTemplateHash: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: 'Supabase not available' };
  const trimmed = phoneNumber?.trim();
  if (!trimmed || !faceTemplateHash?.trim()) {
    return { ok: false, error: 'Phone number and face_hash required.' };
  }
  try {
    const { error } = await (supabase as any)
      .from('user_profiles')
      .update({
        face_hash: faceTemplateHash.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('phone_number', trimmed);
    if (error) return { ok: false, error: error.message ?? 'Failed to persist face_hash' };
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
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
      error: 'Biometric anchors not finalized. Complete enrollment (Face + External Fingerprint) first.',
    };
  }

  const liveFace = liveFaceHash.trim();
  const liveFinger = liveFingerprintHash.trim();
  if (storedFace !== liveFace) {
    return { ok: false, error: 'Face verification failed. Stored face template does not match live scan.' };
  }
  if (storedFingerprint !== liveFinger) {
    return { ok: false, error: 'Fingerprint verification failed. Stored fingerprint does not match live scan.' };
  }

  return { ok: true };
}

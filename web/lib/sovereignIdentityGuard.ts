/**
 * Sovereign Identity Guard — Minting authority is the Face (human DNA).
 *
 * One face = one mint. Irrespective of how many devices or phone numbers that face
 * uses, they can only mint once. Dependants registered under a parent each have
 * their own face and can mint once per face. Device and phone are NOT the criteria.
 *
 * - Face = who you are → sole basis for minting authority.
 * - Guard is keyed by FaceHash only (getVidaCapMinted(faceHash), rejectMintIfAlreadyMinted(faceHash)).
 */

import { getSupabase } from './supabase';

/**
 * Root Identity model (logical). Stored across user_profiles, authorized_devices, foundation_vault_ledger.
 * - mobileNumberHash: SHA256(e164) — access point / lookup; not the identity, not a secret.
 * - faceHash: SHA-256 of normalized face vector (no raw face data).
 * - deviceHashes: [deviceHash1, ...] — WebAuthn credential IDs hashed; first device = root.
 * - vidaCapMinted: true after first and only mint; enforced by getVidaCapMinted / rejectMintIfAlreadyMinted.
 * - sovereignRootHash: Merkle(faceHash, deviceHash) or Merkle(faceHash, ...deviceHashes).
 */
export type RootIdentityLogical = {
  mobileNumberHash: string;
  faceHash: string;
  deviceHashes: string[];
  vidaCapMinted: boolean;
  sovereignRootHash: string;
};

/** E.164 mobile number → SHA-256 hash. Use for storage/audit; phone_number remains lookup key. */
export async function hashMobileNumber(e164Number: string): Promise<string> {
  const normalized = String(e164Number).trim().replace(/\s/g, '');
  const enc = new TextEncoder().encode(normalized);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * True if this face has already minted Vida Cap. One face = one mint (keyed by FaceHash only).
 * Checks foundation_vault_ledger for seigniorage row with this face_hash.
 */
export async function getVidaCapMintedByFace(faceHash: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  const trimmed = String(faceHash ?? '').trim();
  if (trimmed.length !== 64 || !/^[0-9a-fA-F]+$/.test(trimmed)) return false;
  try {
    const { data: ledger } = await (supabase as any)
      .from('foundation_vault_ledger')
      .select('id')
      .eq('source_type', 'seigniorage')
      .eq('face_hash', trimmed.toLowerCase())
      .limit(1)
      .maybeSingle();
    return !!ledger;
  } catch {
    return false;
  }
}

/** True only when foundation_vault_ledger has a seigniorage row for this identity. We do NOT block on user_profiles.is_minted so old/stale is_minted does not prevent mint. */
export async function getVidaCapMinted(phoneNumber: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  const trimmed = phoneNumber?.trim();
  if (!trimmed) return false;
  try {
    const { data: ledger } = await (supabase as any)
      .from('foundation_vault_ledger')
      .select('id')
      .eq('citizen_id', trimmed)
      .eq('source_type', 'seigniorage')
      .limit(1)
      .maybeSingle();
    if (ledger) return true;
    const { normalizePhoneVariants } = await import('./universalIdentityComparison');
    const variants = normalizePhoneVariants(trimmed);
    for (const v of variants) {
      if (v === trimmed) continue;
      const { data: ledger2 } = await (supabase as any)
        .from('foundation_vault_ledger')
        .select('id')
        .eq('citizen_id', v)
        .eq('source_type', 'seigniorage')
        .limit(1)
        .maybeSingle();
      if (ledger2) return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Reject mint if this face has already minted. Call at the start of any mint path.
 * faceHash is the sole criterion (one face = one mint). Returns { ok: false, error } if already minted.
 */
export async function rejectMintIfAlreadyMintedByFace(
  faceHash: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const already = await getVidaCapMintedByFace(faceHash);
  if (already) {
    return {
      ok: false,
      error: 'Vida Cap already minted for this face. One face can only mint once, regardless of device or number.',
    };
  }
  return { ok: true };
}

/**
 * Reject mint if already minted. Prefer faceHash when available (authority is the face).
 * When only phone is available, falls back to phone-based check for backward compatibility.
 */
export async function rejectMintIfAlreadyMinted(
  phoneOrFaceHash: string,
  options?: { byFace: boolean }
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (options?.byFace) {
    return rejectMintIfAlreadyMintedByFace(phoneOrFaceHash);
  }
  const already = await getVidaCapMinted(phoneOrFaceHash);
  if (already) {
    return {
      ok: false,
      error: 'Vida Cap already minted for this identity. One face can only mint once.',
    };
  }
  return { ok: true };
}

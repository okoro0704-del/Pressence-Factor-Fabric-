/**
 * Ghost Vault — vault and mint using ONLY face_hash.
 * No credential_id or passkey required for initial minting.
 * When a new device later matches this face, check_for_orphan_vault triggers bind prompt.
 * Sentinel fee ($100) is auto-debited even in Ghost mode.
 */

import { getSupabase } from './supabase';

const GHOST_PHONE_PREFIX = 'ghost:';

/** Derive a stable vault identifier from face_hash only (for display or ledger). */
export function deriveVaultAddressFromFaceHash(faceHash: string): string {
  const trimmed = (faceHash ?? '').trim();
  if (!trimmed) return '';
  return '0x' + trimmed.slice(0, 40).toLowerCase();
}

/** Phone key for Ghost profile/wallet (face_hash only; no real phone yet). */
export function ghostPhoneFromFaceHash(faceHash: string): string {
  const trimmed = (faceHash ?? '').trim();
  if (trimmed.length < 16) return '';
  return GHOST_PHONE_PREFIX + trimmed.slice(0, 32).toLowerCase();
}

export function isGhostPhone(phone: string | null | undefined): boolean {
  return typeof phone === 'string' && phone.startsWith(GHOST_PHONE_PREFIX);
}

/**
 * Check if this face_hash matches an existing vault that has no device bound (Ghost / orphan).
 * When true, show prompt: "Identity Found. Bind your 4 VIDA Treasury to this device?"
 */
export async function checkForOrphanVault(
  faceHash: string
): Promise<{ ok: true; isOrphan: boolean; bindPhone?: string } | { ok: false; error: string }> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: 'Supabase not available' };
  const trimmed = (faceHash ?? '').trim();
  if (!trimmed) return { ok: false, error: 'face_hash required' };
  try {
    const { data, error } = await (supabase as any).rpc('check_for_orphan_vault', {
      p_face_hash: trimmed,
    });
    if (error) return { ok: false, error: error.message ?? 'RPC failed' };
    const ok = data?.ok === true;
    const isOrphan = data?.is_orphan === true;
    const bindPhone = data?.bind_phone ?? undefined;
    return { ok: true, isOrphan, bindPhone };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

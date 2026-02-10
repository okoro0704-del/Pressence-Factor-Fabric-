/**
 * Mandatory Sentinel Activation Protocol — fund access requires active Sentinel.
 * Device Handshake: generates unique SentinelID stored in Supabase linked to IdentityAnchor.
 * Sentinel Proxy-Activation: Dependents inherit Sentinel status from their Guardian.
 */

import { supabase } from './supabase';
import { normalizePhoneVariants } from './universalIdentityComparison';

const IDENTITY_ANCHOR_STORAGE_KEY = 'pff_identity_anchor_phone';

/** Store identity anchor phone after gate clear (for dashboard/sentinel checks). */
export function setIdentityAnchorForSession(phone: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(IDENTITY_ANCHOR_STORAGE_KEY, phone);
  } catch {
    // ignore
  }
}

/** Get current session identity anchor phone (from localStorage). */
export function getIdentityAnchorPhone(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(IDENTITY_ANCHOR_STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Clear identity anchor (for Sign Out). Call together with clearPresenceVerification and gate storage clear. */
export function clearIdentityAnchorForSession(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(IDENTITY_ANCHOR_STORAGE_KEY);
    sessionStorage.removeItem('pff_gate_identity_anchor');
    localStorage.removeItem('pff_gate_identity_anchor');
  } catch {
    // ignore
  }
}

/**
 * Clear session for logout but preserve Passkey Anchor and identity for 2-second re-entry.
 * Does NOT delete the Passkey from device hardware; does NOT clear pff_identity_anchor_phone
 * or vitalization anchor so /login can auto-trigger Face/Palm and unlock without re-typing phone.
 */
export function clearSessionForLogout(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem('pff_gate_identity_anchor');
    localStorage.removeItem('pff_gate_identity_anchor');
    localStorage.removeItem('pff_session_phone');
    localStorage.removeItem('pff_session_uid');
    // Do NOT clear IDENTITY_ANCHOR_STORAGE_KEY so instant re-entry on /login works
    // Do NOT clear pff_vitalized_anchor (vitalizationAnchor) — same reason
  } catch {
    // ignore
  }
}

/**
 * Get Guardian phone for a Dependent (from sentinel_identities.metadata.guardian_phone).
 * Returns null if not a dependent or no guardian linked.
 */
export async function getGuardianPhone(dependentPhone: string): Promise<string | null> {
  if (!dependentPhone || !supabase) return null;
  try {
    const variants = normalizePhoneVariants(dependentPhone);
    for (const variant of variants) {
      const { data, error } = await (supabase as any)
        .from('sentinel_identities')
        .select('metadata')
        .eq('phone_number', variant)
        .eq('status', 'ACTIVE')
        .maybeSingle();
      if (!error && data?.metadata?.guardian_phone) {
        const g = String(data.metadata.guardian_phone).trim();
        if (g) return g;
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Link a Guardian to a Minor/Elder identity (store guardian_phone in sentinel_identities.metadata).
 * Call after user confirms Guardian phone for Link Guardian requirement.
 */
export async function linkGuardianToIdentity(
  identityPhone: string,
  guardianPhone: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!identityPhone || !guardianPhone || !supabase) {
    return { ok: false, error: 'Identity phone, guardian phone, or Supabase not available' };
  }
  try {
    const variants = normalizePhoneVariants(identityPhone);
    for (const variant of variants) {
      const { data: row } = await (supabase as any)
        .from('sentinel_identities')
        .select('id, metadata')
        .eq('phone_number', variant)
        .eq('status', 'ACTIVE')
        .maybeSingle();
      if (row) {
        const meta = (row.metadata ?? {}) as Record<string, unknown>;
        const updated = { ...meta, guardian_phone: guardianPhone.trim() };
        const { error } = await (supabase as any)
          .from('sentinel_identities')
          .update({ metadata: updated })
          .eq('id', row.id);
        if (error) return { ok: false, error: error.message ?? 'Update failed' };
        return { ok: true };
      }
    }
    return { ok: false, error: 'Identity not found' };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

/**
 * Get dependents linked to a Guardian (from sentinel_identities.metadata.guardian_phone).
 * Returns minimal list for Family Vault display. Balance can be from getGuardianDependents (global_identities) if available.
 */
export async function getDependentsForGuardian(guardianPhone: string): Promise<{ phone_number: string; full_name: string }[]> {
  if (!guardianPhone || !supabase) return [];
  try {
    const normalized = guardianPhone.trim().replace(/\D/g, '');
    const { data, error } = await (supabase as any)
      .from('sentinel_identities')
      .select('phone_number, full_name, metadata')
      .eq('status', 'ACTIVE');
    if (error || !Array.isArray(data)) return [];
    const out: { phone_number: string; full_name: string }[] = [];
    const gNorm = normalized.replace(/^\+/, '');
    for (const row of data) {
      const meta = (row.metadata ?? {}) as Record<string, unknown>;
      const gPhone = (meta.guardian_phone as string) || '';
      const gNormRow = gPhone.trim().replace(/\D/g, '').replace(/^\+/, '');
      if (gNormRow && (gNormRow === gNorm || gPhone === guardianPhone)) {
        out.push({ phone_number: row.phone_number, full_name: row.full_name || 'Dependent' });
      }
    }
    return out;
  } catch {
    return [];
  }
}

/** Direct check: is this phone present in pff_sentinel_activations? (No guardian proxy.) */
async function isSentinelActiveDirect(identityAnchorPhone: string): Promise<boolean> {
  if (!identityAnchorPhone || !supabase) return false;
  try {
    const { data, error } = await (supabase as any)
      .from('pff_sentinel_activations')
      .select('id')
      .eq('identity_anchor_phone', identityAnchorPhone)
      .limit(1)
      .maybeSingle();
    return !error && !!data;
  } catch {
    return false;
  }
}

/**
 * Check if Sentinel is active for this Identity Anchor.
 * For Dependents: inherits from Guardian — if Guardian's Sentinel is active, returns true.
 */
export async function isSentinelActive(identityAnchorPhone: string): Promise<boolean> {
  if (!identityAnchorPhone || !supabase) return false;
  try {
    const guardianPhone = await getGuardianPhone(identityAnchorPhone);
    if (guardianPhone) {
      return isSentinelActive(guardianPhone);
    }
    return isSentinelActiveDirect(identityAnchorPhone);
  } catch {
    return false;
  }
}

/** Generate a unique SentinelID (mock handshake). */
function generateSentinelId(): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    return 'SEN_' + Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  }
  return 'SEN_' + Date.now().toString(36).toUpperCase() + '_' + Math.random().toString(36).slice(2, 10).toUpperCase();
}

/**
 * Device Handshake: activate Sentinel for Identity Anchor.
 * Generates unique SentinelID and stores in Supabase (pff_sentinel_activations).
 * Returns the SentinelID on success.
 */
export async function activateSentinelHandshake(identityAnchorPhone: string): Promise<
  { ok: true; sentinelId: string } | { ok: false; error: string }
> {
  if (!identityAnchorPhone || !supabase) {
    return { ok: false, error: 'Identity anchor or Supabase not available' };
  }
  try {
    const { data: existing } = await (supabase as any)
      .from('pff_sentinel_activations')
      .select('sentinel_id')
      .eq('identity_anchor_phone', identityAnchorPhone)
      .maybeSingle();
    if (existing?.sentinel_id) {
      return { ok: true, sentinelId: existing.sentinel_id };
    }
    const sentinelId = generateSentinelId();
    const { error } = await (supabase as any)
      .from('pff_sentinel_activations')
      .insert({
        identity_anchor_phone: identityAnchorPhone,
        sentinel_id: sentinelId,
        created_at: new Date().toISOString(),
      });
    if (error) return { ok: false, error: error.message ?? 'Failed to store Sentinel' };
    return { ok: true, sentinelId };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

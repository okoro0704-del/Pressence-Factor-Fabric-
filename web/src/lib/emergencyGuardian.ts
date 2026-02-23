/**
 * Legacy Protection — Emergency Guardian for accounts 65+.
 * Secondary Sentinel can authorize transactions if primary user is unresponsive for 72 hours.
 */

import { supabase } from './supabase';
import { normalizePhoneVariants } from './universalIdentityComparison';
import { isSentinelActive } from './sentinelActivation';

const UNRESPONSIVE_THRESHOLD_MS = 72 * 60 * 60 * 1000; // 72 hours

export interface EmergencyGuardianStatus {
  hasEmergencyGuardian: boolean;
  emergencyGuardianPhone?: string;
  lastActivityAt?: string;
  isUnresponsive: boolean;
  canEmergencyAuthorize: boolean;
}

/**
 * Get Emergency Guardian status for an identity (65+).
 * Reads emergency_guardian_phone and last_activity_at from sentinel_identities.metadata.
 */
export async function getEmergencyGuardianStatus(
  identityPhone: string
): Promise<EmergencyGuardianStatus> {
  if (!identityPhone || !supabase) {
    return { hasEmergencyGuardian: false, isUnresponsive: false, canEmergencyAuthorize: false };
  }
  try {
    const variants = normalizePhoneVariants(identityPhone);
    for (const variant of variants) {
      const { data, error } = await (supabase as any)
        .from('sentinel_identities')
        .select('metadata')
        .eq('phone_number', variant)
        .eq('status', 'ACTIVE')
        .maybeSingle();
      if (error || !data) continue;
      const meta = (data.metadata ?? {}) as Record<string, unknown>;
      const emergencyPhone = (meta.emergency_guardian_phone as string)?.trim();
      const lastAt = (meta.last_activity_at as string) ?? undefined;
      const hasEmergencyGuardian = !!emergencyPhone;
      const lastMs = lastAt ? new Date(lastAt).getTime() : 0;
      const nowMs = Date.now();
      const isUnresponsive = lastMs > 0 && nowMs - lastMs >= UNRESPONSIVE_THRESHOLD_MS;
      const guardianSentinelActive = emergencyPhone ? await isSentinelActive(emergencyPhone) : false;
      const canEmergencyAuthorize = hasEmergencyGuardian && isUnresponsive && guardianSentinelActive;
      return {
        hasEmergencyGuardian,
        emergencyGuardianPhone: emergencyPhone || undefined,
        lastActivityAt: lastAt,
        isUnresponsive,
        canEmergencyAuthorize,
      };
    }
    return { hasEmergencyGuardian: false, isUnresponsive: false, canEmergencyAuthorize: false };
  } catch {
    return { hasEmergencyGuardian: false, isUnresponsive: false, canEmergencyAuthorize: false };
  }
}

/**
 * Set Emergency Guardian for an identity (65+). Stores secondary Sentinel phone in metadata.
 */
export async function setEmergencyGuardian(
  identityPhone: string,
  emergencyGuardianPhone: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!identityPhone || !emergencyGuardianPhone || !supabase) {
    return { ok: false, error: 'Identity phone, emergency guardian phone, or Supabase not available' };
  }
  try {
    const variants = normalizePhoneVariants(identityPhone);
    for (const variant of variants) {
      const { data: row, error: fetchError } = await (supabase as any)
        .from('sentinel_identities')
        .select('id, metadata')
        .eq('phone_number', variant)
        .eq('status', 'ACTIVE')
        .maybeSingle();
      if (fetchError || !row) continue;
      const meta = (row.metadata ?? {}) as Record<string, unknown>;
      const updated = { ...meta, emergency_guardian_phone: emergencyGuardianPhone.trim() };
      const { error: updateError } = await (supabase as any)
        .from('sentinel_identities')
        .update({ metadata: updated })
        .eq('id', row.id);
      if (updateError) return { ok: false, error: updateError.message ?? 'Update failed' };
      return { ok: true };
    }
    return { ok: false, error: 'Identity not found' };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

/**
 * Record primary user activity (call on login or key actions). Updates last_activity_at in metadata.
 * Used to determine 72h unresponsive window for Emergency Guardian.
 */
export async function recordPrimaryActivity(identityPhone: string): Promise<void> {
  if (!identityPhone || !supabase) return;
  try {
    const variants = normalizePhoneVariants(identityPhone);
    const now = new Date().toISOString();
    for (const variant of variants) {
      const { data: row } = await (supabase as any)
        .from('sentinel_identities')
        .select('id, metadata')
        .eq('phone_number', variant)
        .eq('status', 'ACTIVE')
        .maybeSingle();
      if (!row) continue;
      const meta = (row.metadata ?? {}) as Record<string, unknown>;
      const updated = { ...meta, last_activity_at: now };
      await (supabase as any)
        .from('sentinel_identities')
        .update({ metadata: updated })
        .eq('id', row.id);
      return;
    }
  } catch {
    // ignore
  }
}

/**
 * Request Emergency Authorization: secondary Sentinel authorizes on behalf of primary after 72h unresponsive.
 * Caller must be the emergency_guardian_phone and primary must be unresponsive.
 * Returns ok if authorization is allowed (caller can then perform the transaction on behalf of primary).
 */
export async function requestEmergencyAuthorization(
  primaryIdentityPhone: string,
  requestingGuardianPhone: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const status = await getEmergencyGuardianStatus(primaryIdentityPhone);
  if (!status.hasEmergencyGuardian || !status.emergencyGuardianPhone) {
    return { ok: false, error: 'No Emergency Guardian configured for this account' };
  }
  const normalized = (a: string, b: string) =>
    a.trim().replace(/\D/g, '') === b.trim().replace(/\D/g, '');
  if (!normalized(requestingGuardianPhone, status.emergencyGuardianPhone)) {
    return { ok: false, error: 'Only the designated Emergency Guardian can request authorization' };
  }
  if (!status.isUnresponsive) {
    return {
      ok: false,
      error: 'Primary user has been active within 72 hours. Emergency authorization only after 72h unresponsive.',
    };
  }
  if (!status.canEmergencyAuthorize) {
    return {
      ok: false,
      error: 'Emergency Guardian Sentinel must be active to authorize',
    };
  }
  return { ok: true };
}

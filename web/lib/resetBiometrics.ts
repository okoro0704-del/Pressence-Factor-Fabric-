/**
 * Reset My Biometrics — clears primary_sentinel_device_id and stored face hashes
 * for the current user so they can re-enroll (new device / face scan).
 */

import { supabase } from './biometricAuth';

export interface ResetBiometricsResult {
  ok: boolean;
  error?: string;
}

/**
 * Clear primary_sentinel_device_id and primary_sentinel_assigned_at in user_profiles,
 * and remove the sentinel_identities row (face/voice hashes) for this phone.
 * Authorized_devices entries for this phone are left as-is; user can re-enroll as first device.
 */
export async function resetBiometrics(identityAnchorPhone: string): Promise<ResetBiometricsResult> {
  if (!identityAnchorPhone?.trim()) {
    return { ok: false, error: 'Identity anchor (phone) required' };
  }
  const phone = identityAnchorPhone.trim();
  if (!supabase) {
    return { ok: false, error: 'Supabase not available' };
  }
  try {
    const { error: profileError } = await (supabase as any)
      .from('user_profiles')
      .update({
        primary_sentinel_device_id: null,
        primary_sentinel_assigned_at: null,
      })
      .eq('phone_number', phone);

    if (profileError) {
      console.error('[resetBiometrics] user_profiles update failed:', profileError);
      return { ok: false, error: profileError.message ?? 'Failed to clear primary sentinel' };
    }

    const { error: sentinelError } = await (supabase as any)
      .from('sentinel_identities')
      .delete()
      .eq('phone_number', phone);

    if (sentinelError) {
      console.warn('[resetBiometrics] sentinel_identities delete (may not exist):', sentinelError.message);
      // Not fatal — user may not have a sentinel_identities row
    }

    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[resetBiometrics]', msg);
    return { ok: false, error: msg };
  }
}

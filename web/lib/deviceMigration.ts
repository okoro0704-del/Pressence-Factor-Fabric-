/**
 * Sovereign Device Migration — New Device Authorization.
 * When a verified user logs in and device_fingerprint does not match stored primary_sentinel_device_id,
 * we update the binding after a 5-second Face Pulse and send a Security Alert.
 */

import { getSupabase } from './supabase';

const SECURITY_ALERT_MESSAGE =
  'Your Sovereign Account has been bound to a new device. Access from the previous device is now revoked.';

/**
 * Update primary_sentinel_device_id in user_profiles to the new device's fingerprint.
 * Call after successful migration face match.
 */
export async function updatePrimarySentinelDeviceForMigration(
  phoneNumber: string,
  newDeviceFingerprint: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = getSupabase();
  if (!supabase) {
    return { ok: false, error: 'Supabase not available' };
  }
  try {
    const { error } = await (supabase as any)
      .from('user_profiles')
      .update({
        primary_sentinel_device_id: newDeviceFingerprint,
        primary_sentinel_assigned_at: new Date().toISOString(),
      })
      .eq('phone_number', phoneNumber.trim());

    if (error) {
      return { ok: false, error: error.message ?? 'Failed to update device binding' };
    }
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

/**
 * Send Security Alert (email/SMS) after device migration.
 * Message: "Your Sovereign Account has been bound to a new device. Access from the previous device is now revoked."
 * In production: call Supabase Edge Function, Twilio, or your email/SMS API.
 */
export async function sendDeviceMigrationSecurityAlert(phoneNumber: string): Promise<void> {
  const payload = {
    phone_number: phoneNumber.trim(),
    message: SECURITY_ALERT_MESSAGE,
    type: 'DEVICE_MIGRATION_SECURITY_ALERT',
    at: new Date().toISOString(),
  };

  try {
    // Option A: Supabase table for outbound alerts (worker sends email/SMS)
    const supabase = getSupabase();
    if (supabase) {
      const { error } = await (supabase as any).from('security_alerts').insert({
        phone_number: payload.phone_number,
        alert_type: payload.type,
        message: payload.message,
        created_at: payload.at,
      });
      if (!error) {
        console.log('[deviceMigration] Security alert queued for', payload.phone_number);
        return;
      }
    }
  } catch {
    // ignore
  }

  // Option B: Call backend API if available
  const apiUrl = process.env.NEXT_PUBLIC_PFF_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL;
  if (apiUrl) {
    try {
      await fetch(`${apiUrl.replace(/\/$/, '')}/api/security-alert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return;
    } catch {
      // ignore
    }
  }

  console.warn('[deviceMigration] Security alert not sent (no Supabase security_alerts or API). Payload:', payload);
}

/**
 * Phone ID Bridge — On PC, "Phone ID" refers to the linked mobile device's unique identifier.
 * Fetched from user_profiles.primary_sentinel_device_id (and authorized_devices) so the PC app
 * can show "Linked device: XXX" and confirm identity.
 * Main vs sub device: only one device is the main (primary); others must request approval from main.
 */

import { getSupabase } from './supabase';
import { getCompositeDeviceFingerprint } from './biometricAuth';

export interface LinkedDeviceInfo {
  /** Primary sentinel device ID (full, for internal use). */
  deviceId: string;
  /** Masked for display (e.g. last 8 chars). */
  maskedId: string;
  /** Device name/model if available. */
  deviceName: string | null;
}

/**
 * Get the linked mobile/primary device ID for a user from profiles table.
 * Used on PC when we need to show "Phone ID" or "Linked device" for confirmation.
 */
export async function getLinkedMobileDeviceId(
  phoneNumber: string
): Promise<LinkedDeviceInfo | null> {
  const supabase = getSupabase();
  if (!supabase || !phoneNumber?.trim()) return null;
  try {
    const { data, error } = await (supabase as any)
      .from('user_profiles')
      .select('primary_sentinel_device_id, device_model')
      .eq('phone_number', phoneNumber.trim())
      .maybeSingle();
    if (error || !data) return null;
    const raw = data.primary_sentinel_device_id?.trim?.() ?? '';
    if (!raw) return null;
    const maskLen = Math.min(8, Math.max(4, Math.floor(raw.length / 2)));
    const maskedId = raw.length <= maskLen ? raw : `…${raw.slice(-maskLen)}`;
    const deviceName = data.device_model?.trim?.() ?? null;
    return {
      deviceId: raw,
      maskedId,
      deviceName,
    };
  } catch {
    return null;
  }
}

/**
 * True if this phone number already has a main (primary) device and the current device is not it.
 * When true, the site should ask for approval from the main device instead of starting vitalization.
 */
export async function isSubDevice(phoneNumber: string): Promise<boolean> {
  const linked = await getLinkedMobileDeviceId(phoneNumber?.trim() ?? '');
  if (!linked?.deviceId) return false;
  const current = await getCompositeDeviceFingerprint();
  return current !== linked.deviceId;
}

/**
 * True if this phone has a primary device and the current device is that primary (main device).
 * Only the main device should see "Approve login" notifications for this phone.
 */
export async function isCurrentDevicePrimary(phoneNumber: string): Promise<boolean> {
  const linked = await getLinkedMobileDeviceId(phoneNumber?.trim() ?? '');
  if (!linked?.deviceId) return false;
  const current = await getCompositeDeviceFingerprint();
  return current === linked.deviceId;
}

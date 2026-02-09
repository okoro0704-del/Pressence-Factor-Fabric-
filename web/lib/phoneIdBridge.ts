/**
 * Phone ID Bridge — Master device = first device that captured face for this mobile number (stored in primary_sentinel_device_id).
 * That device is locked to the mobile number. When the number is used on another device, sign-in must send
 * a verification request to the master device and wait for approval (login_requests flow).
 * Fetched from user_profiles.primary_sentinel_device_id (and authorized_devices).
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
 * True if this phone has a master device and the current device is not it.
 * When true, sign-in on this device requires sending a verification request to the master device for approval.
 */
export async function isSubDevice(phoneNumber: string): Promise<boolean> {
  const linked = await getLinkedMobileDeviceId(phoneNumber?.trim() ?? '');
  if (!linked?.deviceId) return false;
  const current = await getCompositeDeviceFingerprint();
  return current !== linked.deviceId;
}

/**
 * True if this phone has a master device and the current device is that master (first face-capture device).
 * Only the master device should see "Approve login" / verification notifications for this phone.
 */
export async function isCurrentDevicePrimary(phoneNumber: string): Promise<boolean> {
  const linked = await getLinkedMobileDeviceId(phoneNumber?.trim() ?? '');
  if (!linked?.deviceId) return false;
  const current = await getCompositeDeviceFingerprint();
  return current === linked.deviceId;
}

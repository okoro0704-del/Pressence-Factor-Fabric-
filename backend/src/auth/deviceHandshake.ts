/**
 * PFF Backend — Device Handshake Identity
 * Architect: Isreal Okoro (mrfundzman)
 *
 * Uses User-Agent to identify device vendor (Oppo, iPhone, Redmi) and generate
 * a unique device ID. No hardcoded device names; store result in device_registry (Supabase).
 */

import * as crypto from 'crypto';

export type DeviceVendor = 'Oppo' | 'iPhone' | 'Redmi' | 'Unknown';

/**
 * Parse device vendor from User-Agent string (client sends this; no navigator on server).
 * Detects Oppo, iPhone, and Redmi (Xiaomi/Redmi); otherwise Unknown.
 */
export function parseDeviceFromUserAgent(userAgent: string): DeviceVendor {
  if (!userAgent || typeof userAgent !== 'string') return 'Unknown';
  const ua = userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return 'iPhone';
  if (/oppo|cph\d|p\w*m\d/i.test(ua)) return 'Oppo';
  if (/redmi|xiaomi|mi\s|mi-|mi\d|2201|2210|2310/.test(ua)) return 'Redmi';
  return 'Unknown';
}

/**
 * Generate a unique device ID from phone + userAgent + vendor for device_registry.
 * Stable per device/browser for the same user.
 */
export function generateDeviceUniqueId(phoneNumber: string, userAgent: string): string {
  const vendor = parseDeviceFromUserAgent(userAgent);
  const salt = `${phoneNumber.trim()}|${userAgent}|${vendor}`;
  return crypto.createHash('sha256').update(salt).digest('hex').slice(0, 32);
}

/**
 * Device Identity — User-Agent parsing for Oppo, iPhone, Redmi (mirrors backend auth/deviceHandshake).
 * Used by API route to store unique device ID in device_registry (Supabase).
 */

export type DeviceVendor = 'Oppo' | 'iPhone' | 'Redmi' | 'Unknown';

export function parseDeviceFromUserAgent(userAgent: string): DeviceVendor {
  if (!userAgent || typeof userAgent !== 'string') return 'Unknown';
  const ua = userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return 'iPhone';
  if (/oppo|cph\d|p\w*m\d/i.test(ua)) return 'Oppo';
  if (/redmi|xiaomi|mi\s|mi-|mi\d|2201|2210|2310/.test(ua)) return 'Redmi';
  return 'Unknown';
}

/** Generate unique device ID for device_registry (same algorithm as backend). */
export async function generateDeviceUniqueId(phoneNumber: string, userAgent: string): Promise<string> {
  const vendor = parseDeviceFromUserAgent(userAgent);
  const salt = `${phoneNumber.trim()}|${userAgent}|${vendor}`;
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const h = await sha256HexBrowser(salt);
    return h.slice(0, 32);
  }
  return sha256HexNodeStyle(salt).slice(0, 32);
}

async function sha256HexBrowser(input: string): Promise<string> {
  const enc = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function sha256HexNodeStyle(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    hash = (hash << 5) - hash + c;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(16, '0') + input.length.toString(16);
}

/**
 * GPS/IP-to-Country detection for phone input (login/registration).
 * Caches result in sessionStorage so we don't re-ping every time the user navigates back.
 * Fallback: IP-based geolocation when GPS is denied or unavailable.
 */

const CACHE_KEY = 'pff_detected_country_code';
const CACHE_TS_KEY = 'pff_detected_country_ts';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function getCached(): string | null {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const code = sessionStorage.getItem(CACHE_KEY);
    const ts = sessionStorage.getItem(CACHE_TS_KEY);
    if (!code || !ts) return null;
    const t = parseInt(ts, 10);
    if (isNaN(t) || Date.now() - t > CACHE_TTL_MS) return null;
    return code;
  } catch {
    return null;
  }
}

function setCached(code: string): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(CACHE_KEY, code);
    sessionStorage.setItem(CACHE_TS_KEY, String(Date.now()));
  } catch {
    // ignore
  }
}

/** Fetch country code (ISO Alpha-2) from IP geolocation. */
async function fetchCountryByIP(): Promise<string | null> {
  try {
    const res = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(4000) });
    const data = await res.json();
    const code = data?.country_code;
    if (typeof code === 'string' && code.length === 2) return code.toUpperCase();
  } catch {
    // fallback
  }
  try {
    const res = await fetch('https://ip-api.com/json/?fields=countryCode', { signal: AbortSignal.timeout(4000) });
    const data = await res.json();
    const code = data?.countryCode;
    if (typeof code === 'string' && code.length === 2) return code.toUpperCase();
  } catch {
    // ignore
  }
  return null;
}

/**
 * Get detected country code for the phone input.
 * 1. Use sessionStorage cache if valid (within TTL).
 * 2. Else fetch via IP geolocation, cache and return.
 * 3. Return null if denied/unavailable (caller uses default e.g. Nigeria).
 */
export async function getDetectedCountryCode(): Promise<string | null> {
  const cached = getCached();
  if (cached) return cached;

  const code = await fetchCountryByIP();
  if (code) setCached(code);
  return code;
}

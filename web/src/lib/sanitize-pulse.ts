/**
 * Fortress Security — sanitize National Pulse / realtime stream input.
 * Prevents XSS and "Digital Ghost" injection via leaderboard / PulsePoint data.
 */

const MAX_NATION_LEN = 80;
const SAFE_CHAR = /[A-Za-z0-9\u00C0-\u024F\u1E00-\u1EFF\s.'\-()]/u;

/**
 * Sanitize nation string from presence_handshakes or realtime stream.
 * Allowlist: letters (incl. extended Latin), digits, spaces, . ' - ( ).
 * Strip all other chars. Truncate to MAX_NATION_LEN. Prevents XSS / injection.
 */
export function sanitizeNation(input: unknown): string {
  if (input == null) return '';
  const s = String(input).trim();
  if (s.length === 0) return '';
  const truncated = s.length > MAX_NATION_LEN ? s.slice(0, MAX_NATION_LEN) : s;
  const safe = Array.from(truncated)
    .filter((c) => SAFE_CHAR.test(c))
    .join('');
  return safe;
}

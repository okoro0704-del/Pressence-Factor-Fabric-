/**
 * Cross-Domain Sentinel Handshake — shared constants and URLs.
 * pffsentinel.com/activate?uid=[USER_ID] for Secure Redirect.
 */

/** Base URL for Sentinel activation (pffsentinel.com). Override with NEXT_PUBLIC_SENTINEL_ACTIVATE_URL. */
export function getSentinelActivateBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const env = process.env.NEXT_PUBLIC_SENTINEL_ACTIVATE_URL;
    if (env && env.trim()) return env.trim().replace(/\/$/, '');
    return 'https://pffsentinel.com';
  }
  return process.env.NEXT_PUBLIC_SENTINEL_ACTIVATE_URL?.trim()?.replace(/\/$/, '') ?? 'https://pffsentinel.com';
}

/** Secure Redirect URL: Sentinel site activate page with user id so Sentinel knows which user is paying. */
export function getSentinelActivateUrl(userId: string): string {
  const base = getSentinelActivateBaseUrl();
  const uid = encodeURIComponent(userId);
  return `${base}/activate?uid=${uid}`;
}

/** Base URL of the Main PFF App (for Sentinel → Main webhook after payment). Set NEXT_PUBLIC_MAIN_PFF_APP_URL on the Sentinel site. */
export function getMainPffAppUrl(): string {
  if (typeof window !== 'undefined') {
    const env = process.env.NEXT_PUBLIC_MAIN_PFF_APP_URL;
    if (env && env.trim()) return env.trim().replace(/\/$/, '');
    return '';
  }
  return (process.env.NEXT_PUBLIC_MAIN_PFF_APP_URL ?? '').trim().replace(/\/$/, '') || '';
}

/** Build webhook URL for Success callback from Sentinel to Main PFF App. */
export function getSentinelWebhookUrl(): string {
  const base = getMainPffAppUrl();
  if (!base) return '';
  return `${base}/api/sentinel-webhook`;
}

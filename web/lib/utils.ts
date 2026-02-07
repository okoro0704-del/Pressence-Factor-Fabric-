/**
 * Sovereign Shield — hostname-based production vs sandbox behavior.
 * - Production (custom domain): Public Mode (no OSINT search), no debug UI, no sensitive logs.
 * - Netlify .app URL: Architect Mode (full search), sandbox for testing.
 */

/** Official live domain hostname (e.g. "app.purefreedomfoundation.org"). Set in Netlify: NEXT_PUBLIC_PRODUCTION_DOMAIN. */
function getProductionDomain(): string {
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_PRODUCTION_DOMAIN?.trim()) {
    return process.env.NEXT_PUBLIC_PRODUCTION_DOMAIN.trim().toLowerCase();
  }
  return '';
}

/**
 * True when the app is running on the official custom domain (live).
 * Use to hide debug panels, mask logs, and enforce Public Mode (Ledger Lock).
 */
export function isProductionDomain(): boolean {
  if (typeof window === 'undefined') return false;
  const domain = getProductionDomain();
  if (!domain) return false;
  return window.location.hostname.toLowerCase() === domain;
}

/**
 * True when the app is on the Netlify .app URL or localhost (sandbox).
 * Architect Mode: full search tool and dev affordances for the team.
 */
export function isNetlifySandbox(): boolean {
  if (typeof window === 'undefined') return false;
  const h = window.location.hostname.toLowerCase();
  return h.endsWith('.netlify.app') || h === 'localhost' || h === '127.0.0.1';
}

/**
 * Architect Mode = search tool and full access. True on Netlify URL and localhost; false on production domain.
 * Ledger Lock: on production domain we use Public Mode only (no OSINT search).
 */
export function isArchitectMode(): boolean {
  if (typeof window === 'undefined') return false;
  return !isProductionDomain();
}

/**
 * Architect's Hidden Access — Public Gatekeeper & Feature Flagging.
 * All logic is client-safe: no top-level window/document so static build does not crash.
 */

/** When true: hide Withdraw and Palm Scan for non-vetted users. When false: full Protocol for Architect. */
export const IS_PUBLIC_REVEAL = true;

const ARCHITECT_COOKIE = 'pff_architect_access';
const AUTHORIZED_STORAGE_KEY = 'pff_authorized_identity';

/** Production domain for "public" mode (Manifesto only for non-authorized). */
function getProductionDomain(): string {
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_PRODUCTION_DOMAIN?.trim()) {
    return process.env.NEXT_PUBLIC_PRODUCTION_DOMAIN.trim();
  }
  return 'pff2.netlify.app';
}

/** Default Architect + Sentinel device IDs (can be overridden by NEXT_PUBLIC_AUTHORIZED_DEVICE_IDS comma-separated). */
function getAuthorizedDeviceIds(): string[] {
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_AUTHORIZED_DEVICE_IDS?.trim()) {
    return process.env.NEXT_PUBLIC_AUTHORIZED_DEVICE_IDS.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return [
    'HP-LAPTOP-ROOT-SOVEREIGN-001',
    'DEVICE-3B5B738BB',
  ];
}

/** True when running on the production domain (e.g. pff2.netlify.app). Call only on client. */
export function isProductionDomain(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location?.hostname ?? '';
  const prod = getProductionDomain();
  return host === prod || host.endsWith('.' + prod);
}

/** True when on Netlify deploy-preview URL (e.g. deploy-preview-48--pff2.netlify.app). Full Protocol visible for testing. */
export function isPreviewUrl(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location?.hostname ?? '';
  return host.includes('deploy-preview-');
}

/** Check if current device_id (from storage or composite) is in the authorized list. Runs only on client. */
export function isAuthorizedIdentitySync(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const stored = localStorage.getItem(AUTHORIZED_STORAGE_KEY);
    if (stored === 'true') return true;
    const deviceId = localStorage.getItem('device_id') ?? '';
    const ids = getAuthorizedDeviceIds();
    const match = ids.some((id) => deviceId === id || deviceId.includes(id));
    return match;
  } catch {
    return false;
  }
}

/** Resolve device fingerprint and set pff_authorized_identity if device is in list. Call once on client. */
export async function resolveAuthorizedIdentity(
  getDeviceId: () => Promise<string>
): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    const deviceId = await getDeviceId();
    const ids = getAuthorizedDeviceIds();
    const match = ids.some((id) => deviceId === id || deviceId.includes(id));
    if (match) {
      localStorage.setItem(AUTHORIZED_STORAGE_KEY, 'true');
    }
    return match;
  } catch {
    return false;
  }
}

/** Show full Protocol (Vitalization, Treasury, Gate) when: Preview URL OR Authorized Identity. Else show Manifesto only. */
export function shouldShowFullProtocolSync(): boolean {
  if (typeof window === 'undefined') return true;
  if (isPreviewUrl()) return true;
  if (!isProductionDomain()) return true;
  return isAuthorizedIdentitySync();
}

/** Vetted user: can see Withdraw and Palm Scan when IS_PUBLIC_REVEAL is true. Same as isArchitect. */
export function isVettedUser(): boolean {
  if (typeof window === 'undefined') return false;
  if (!IS_PUBLIC_REVEAL) return true;
  return isArchitect();
}

/** Architect: cookie, env, or authorized device. Used for dashboard access and vetted features. */
export function isArchitect(): boolean {
  if (typeof window === 'undefined') return false;
  const env = process.env.NEXT_PUBLIC_ARCHITECT_ACCESS === 'true' || process.env.NEXT_PUBLIC_ARCHITECT_ACCESS === '1';
  try {
    const cookie = document.cookie.split(';').find((c) => c.trim().startsWith(ARCHITECT_COOKIE + '='));
    const cookieVal = cookie?.split('=')[1]?.trim();
    if (env || cookieVal === 'true' || cookieVal === '1') return true;
    return isAuthorizedIdentitySync();
  } catch {
    return !!env;
  }
}

export function setArchitectAccess(value: boolean): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${ARCHITECT_COOKIE}=${value ? 'true' : 'false'};path=/;max-age=86400*30;samesite=strict`;
}

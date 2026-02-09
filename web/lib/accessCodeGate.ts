/**
 * Access gate until April 7: only owner (architect) devices or users with a valid code can access the site.
 * After April 7, everyone can access.
 */

/** End of April 7, 2026 (start of April 8 UTC). */
export const ACCESS_CUTOFF_DATE = new Date('2026-04-08T00:00:00.000Z');

const STORAGE_KEY = 'pff_access_granted_phone';
const MASTER_ACCESS_KEY = 'pff_master_access';

export function isBeforeAccessCutoff(): boolean {
  return typeof window !== 'undefined' && new Date() < ACCESS_CUTOFF_DATE;
}

/** Permanent master password: one password for you to access the app from any device, anytime. */
export function hasMasterAccess(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(MASTER_ACCESS_KEY) === '1';
  } catch {
    return false;
  }
}

export function setMasterAccess(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(MASTER_ACCESS_KEY, '1');
  } catch {
    // ignore
  }
}

export function clearMasterAccess(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(MASTER_ACCESS_KEY);
  } catch {
    // ignore
  }
}

export function hasAccessGranted(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return !!localStorage.getItem(STORAGE_KEY) || hasMasterAccess();
  } catch {
    return false;
  }
}

export function getAccessGrantedPhone(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setAccessGranted(phone: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, phone.trim());
  } catch {
    // ignore
  }
}

export function clearAccessGranted(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export async function validateMasterPassword(
  password: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const res = await fetch('/api/v1/master-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: password.trim() }),
    });
    const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    if (res.ok && json.ok === true) {
      return { ok: true };
    }
    return { ok: false, error: json.error ?? 'Incorrect password' };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Request failed' };
  }
}

export async function validateAccessCode(
  phoneNumber: string,
  code: string
): Promise<{ ok: true; phone_number: string } | { ok: false; error: string }> {
  try {
    const res = await fetch('/api/v1/access-codes/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone_number: phoneNumber.trim(), code: code.trim() }),
    });
    const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; phone_number?: string };
    if (res.ok && json.ok === true && json.phone_number) {
      return { ok: true, phone_number: json.phone_number };
    }
    return { ok: false, error: json.error ?? 'Invalid code or phone number' };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Validation failed' };
  }
}

export async function generateAccessCode(
  phoneNumber: string,
  createdByPhone?: string
): Promise<{ ok: true; code: string; phone_number: string } | { ok: false; error: string }> {
  try {
    const res = await fetch('/api/v1/access-codes/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone_number: phoneNumber.trim(),
        created_by_phone: createdByPhone?.trim(),
      }),
    });
    const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; code?: string; phone_number?: string };
    if (res.ok && json.ok === true && json.code) {
      return { ok: true, code: json.code, phone_number: json.phone_number ?? phoneNumber };
    }
    return { ok: false, error: json.error ?? 'Failed to generate code' };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Request failed' };
  }
}

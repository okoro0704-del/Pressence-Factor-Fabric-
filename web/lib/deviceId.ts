/**
 * Device ID for registration and device pairing.
 * Ensures device_id is captured immediately so registration is locked to physical hardware.
 */

const DEVICE_ID_KEY = 'device_id';

/**
 * Get or create device_id and persist to localStorage.
 * Call at the start of vitalization flow so registration is bound to this device from second one.
 */
export function ensureDeviceId(): string {
  if (typeof localStorage === 'undefined') {
    return `DEVICE-${Date.now().toString(36).toUpperCase()}`;
  }
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id || !id.trim()) {
    id = `DEVICE-${crypto.randomUUID().substring(0, 8).toUpperCase()}`;
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

/** Key for passing phone to vitalization so user doesn't have to type again. */
export const PFF_VITALIZATION_PHONE_KEY = 'pff_vitalization_phone';

export function setVitalizationPhone(phone: string): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(PFF_VITALIZATION_PHONE_KEY, phone);
  } catch {
    // ignore
  }
}

export function getVitalizationPhone(): string | null {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    return sessionStorage.getItem(PFF_VITALIZATION_PHONE_KEY);
  } catch {
    return null;
  }
}

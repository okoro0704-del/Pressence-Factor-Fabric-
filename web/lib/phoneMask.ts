/**
 * Security masking for phone numbers in UI (shoulder-surfing protection).
 * Used during 3-of-4 Biometric scan to hide full number.
 * Format: +234 ••• ••• 78 (country prefix + masked middle + last 2 digits).
 */

const MASK_CHAR = '•';
const VISIBLE_TAIL = 2;
const PREFIX_LEN = 4; // e.g. +234 or +44  (show + and up to 3 digits for country)

/**
 * Mask phone for display: show country prefix and last N digits, rest as bullets.
 * E.g. +2348012345678 → "+234 ••• ••• 78"
 */
export function maskPhoneForDisplay(phone: string, visibleTailDigits: number = VISIBLE_TAIL): string {
  const trimmed = phone.trim().replace(/\s/g, '');
  if (!trimmed || trimmed.length <= PREFIX_LEN + visibleTailDigits) return trimmed;

  const prefix = trimmed.slice(0, PREFIX_LEN);
  const tail = trimmed.slice(-visibleTailDigits);
  return `${prefix} ${MASK_CHAR.repeat(3)} ${MASK_CHAR.repeat(3)} ${tail}`;
}

/**
 * Master Override — Architect (Isreal) identity: all devices link to single High-Command profile.
 * Architect: Isreal Okoro (mrfundzman)
 *
 * When the user is Isreal (by phone or hash), the app checks for this specific identity
 * across all devices and links them to a single High-Command profile.
 */

/** Hard-coded Master Override: Architect phone (env override for production). */
const MASTER_OVERRIDE_PHONE =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_ARCHITECT_MASTER_PHONE?.trim()) ||
  '';

/** Known Architect identifiers for Master Override (normalized for comparison). */
const ARCHITECT_NORMALIZED_PHONES = new Set<string>(
  [
    MASTER_OVERRIDE_PHONE,
    // Add any known Architect test phones (no PII in repo)
  ].filter(Boolean)
);

/**
 * Returns true if the given phone belongs to the Architect (Isreal).
 * When true, app treats this user as High-Command and links all devices to one profile.
 */
export function isMasterOverride(phone: string | null | undefined): boolean {
  if (!phone?.trim()) return false;
  const normalized = phone.trim().replace(/\s+/g, '');
  if (ARCHITECT_NORMALIZED_PHONES.has(normalized)) return true;
  return false;
}

/**
 * Use a stable hash for Architect so multiple devices can be recognized as same High-Command.
 * Call with Architect's canonical phone to get the single profile key.
 */
export const HIGH_COMMAND_PROFILE_KEY = 'ARCHITECT_HIGH_COMMAND';

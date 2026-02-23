/**
 * Time-based greeting for the Sovereign / Architect experience.
 */

export type TimeOfDay = 'morning' | 'afternoon' | 'evening';

export function getTimeOfDay(): TimeOfDay {
  if (typeof window === 'undefined') return 'afternoon';
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 18) return 'afternoon';
  return 'evening';
}

const GREETINGS: Record<TimeOfDay, string> = {
  morning: 'The Ledger wakes with you, Architect.',
  afternoon: 'The Covenant is steady under the sun.',
  evening: 'Rest well; the Sentinel watches the Vault.',
};

/** Returns the dynamic greeting for the current time of day. */
export function getTimeBasedGreeting(): string {
  return GREETINGS[getTimeOfDay()];
}

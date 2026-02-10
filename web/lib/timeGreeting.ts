/**
 * Time-based greeting for dashboard header.
 * Returns "Good morning" | "Good afternoon" | "Good evening" based on local hour.
 */

export function getTimeBasedGreeting(): 'Good morning' | 'Good afternoon' | 'Good evening' {
  if (typeof window === 'undefined') return 'Good morning';
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Full greeting line: "Good morning, [Name]. Welcome to Vitalie."
 * Uses "there" when name is missing or empty.
 */
export function getWelcomeToVitalieGreeting(displayName: string | null): string {
  const greeting = getTimeBasedGreeting();
  const name = displayName?.trim() || 'there';
  return `${greeting}, ${name}. Welcome to Vitalie.`;
}

/**
 * PFF Frontend — Stasis Timer Lock
 * Global TimerLock set to February 7, 2026, 07:00:00 WAT
 * Architect: Isreal Okoro (mrfundzman)
 *
 * Purpose:
 * - Disable all MINT, SWAP, and ACTIVATE buttons until unveiling
 * - Display countdown to unveiling
 * - Show 'Locked until Unveiling' tooltip on disabled buttons
 */

// WAT (West Africa Time) is UTC+1
// February 7, 2026, 07:00:00 WAT = February 7, 2026, 06:00:00 UTC
export const UNVEILING_DATE = new Date('2026-02-07T06:00:00.000Z');

/**
 * Check if the system is currently in Stasis Lock
 * Returns true if current time is before unveiling date
 */
export function isStasisLocked(): boolean {
  const now = new Date();
  return now < UNVEILING_DATE;
}

/**
 * Get time remaining until unveiling
 * Returns object with days, hours, minutes, seconds
 */
export interface TimeRemaining {
  total: number; // Total milliseconds remaining
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isLocked: boolean;
}

export function getTimeUntilUnveiling(): TimeRemaining {
  const now = new Date();
  const total = UNVEILING_DATE.getTime() - now.getTime();

  if (total <= 0) {
    return {
      total: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isLocked: false,
    };
  }

  const days = Math.floor(total / (1000 * 60 * 60 * 24));
  const hours = Math.floor((total % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((total % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((total % (1000 * 60)) / 1000);

  return {
    total,
    days,
    hours,
    minutes,
    seconds,
    isLocked: true,
  };
}

/**
 * Format time remaining as string
 * Example: "5 days, 12 hours, 34 minutes, 56 seconds"
 */
export function formatTimeRemaining(time: TimeRemaining): string {
  if (!time.isLocked) {
    return 'UNVEILED';
  }

  const parts: string[] = [];

  if (time.days > 0) {
    parts.push(`${time.days} day${time.days !== 1 ? 's' : ''}`);
  }
  if (time.hours > 0) {
    parts.push(`${time.hours} hour${time.hours !== 1 ? 's' : ''}`);
  }
  if (time.minutes > 0) {
    parts.push(`${time.minutes} minute${time.minutes !== 1 ? 's' : ''}`);
  }
  if (time.seconds > 0) {
    parts.push(`${time.seconds} second${time.seconds !== 1 ? 's' : ''}`);
  }

  return parts.join(', ');
}

/**
 * Format countdown for display (compact format)
 * Example: "05d 12h 34m 56s"
 */
export function formatCountdown(time: TimeRemaining): string {
  if (!time.isLocked) {
    return '00d 00h 00m 00s';
  }

  const d = String(time.days).padStart(2, '0');
  const h = String(time.hours).padStart(2, '0');
  const m = String(time.minutes).padStart(2, '0');
  const s = String(time.seconds).padStart(2, '0');

  return `${d}d ${h}h ${m}m ${s}s`;
}

/**
 * Get unveiling date formatted for display
 */
export function getUnveilingDateFormatted(): string {
  return UNVEILING_DATE.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Africa/Lagos', // WAT timezone
    timeZoneName: 'short',
  });
}

/**
 * Stasis Lock tooltip message
 */
export const STASIS_LOCK_MESSAGE = 'Locked until Unveiling';

/**
 * Stasis Lock detailed message
 */
export function getStasisLockDetailedMessage(): string {
  const formatted = getUnveilingDateFormatted();
  return `All MINT, SWAP, and ACTIVATE operations are locked until the Sovereign Unveiling on ${formatted}`;
}


/**
 * 9-Day Learning Grace Period (Vitalization Ritual)
 * During the first 9 days, AI collects data to build the profile but uses relaxed thresholds.
 */

export const LEARNING_MODE_DAYS = 9;

/** Confidence threshold during Learning Mode (60% instead of 99%). */
export const LEARNING_MODE_CONFIDENCE_PERCENT = 60;

/** Variance threshold during Learning Mode: 40% variance = 60% confidence. */
export const LEARNING_MODE_VARIANCE_THRESHOLD = 40;

/** Soft error message replacing aggressive DNA/Architect mismatch. */
export const LEDGER_SYNC_MESSAGE =
  'The Ledger is still synchronizing with your pulse. Please breathe and retry.';

export function getLearningModeMessage(day: number): string {
  return `Vibration mismatch detected. Adjusting to your frequency... AI is in Learning Mode (Day ${day} of ${LEARNING_MODE_DAYS}).`;
}

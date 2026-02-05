/**
 * Triple-tap handler for Architect's Secret Reset.
 * Returns an onClick that triggers nuclearReset() after 3 taps within 500ms (only when reset is enabled).
 */

import { useRef, useCallback } from 'react';
import { isArchitectResetEnabled, nuclearReset } from './architectReset';

const TRIPLE_TAP_WINDOW_MS = 500;

export function useTripleTapReset(): (e: React.MouseEvent) => void {
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  return useCallback((_e: React.MouseEvent) => {
    if (!isArchitectResetEnabled()) return;
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    tapCountRef.current += 1;
    if (tapCountRef.current >= 3) {
      tapCountRef.current = 0;
      tapTimerRef.current = null;
      nuclearReset();
      return;
    }
    tapTimerRef.current = setTimeout(() => {
      tapCountRef.current = 0;
      tapTimerRef.current = null;
    }, TRIPLE_TAP_WINDOW_MS);
  }, []);
}

'use client';

import { useState, useEffect } from 'react';
import { subscribeHandshakes } from '@/lib/pulse-realtime';
import { sanitizeNation } from '@/lib/sanitize-pulse';

const PULSE_DURATION_MS = 2500;

/**
 * Subscribe to handshake events and track which nations are "pulsing" for PulsePoint.
 */
export function usePulsingNations(): Set<string> {
  const [pulsing, setPulsing] = useState<Set<string>>(new Set());

  useEffect(() => {
    const unsub = subscribeHandshakes((ev) => {
      const nation = sanitizeNation(ev.nation);
      if (!nation) return;
      setPulsing((prev) => new Set(prev).add(nation));
      setTimeout(() => {
        setPulsing((prev) => {
          const next = new Set(prev);
          next.delete(nation);
          return next;
        });
      }, PULSE_DURATION_MS);
    });
    return unsub;
  }, []);

  return pulsing;
}

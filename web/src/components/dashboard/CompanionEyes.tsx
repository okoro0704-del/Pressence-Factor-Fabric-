'use client';

/**
 * Companion Eyes — speaks scan cues during Face Pulse and Palm Scan so the Companion guides the user.
 * "Move closer", "Hold still", etc. No UI; voice only (Sovereign Intelligence).
 */

import { useEffect, useRef } from 'react';
import { useSovereignCompanion } from '@/contexts/SovereignCompanionContext';

function speakSovereign(text: string): void {
  if (typeof window === 'undefined' || !text?.trim()) return;
  try {
    const u = new SpeechSynthesisUtterance(text.trim());
    u.rate = 0.9;
    u.pitch = 1;
    u.volume = 1;
    u.lang = 'en-US';
    window.speechSynthesis?.cancel();
    window.speechSynthesis?.speak(u);
  } catch {
    // ignore
  }
}

export function CompanionEyes() {
  const { scanCue } = useSovereignCompanion();
  const prevRef = useRef('');

  useEffect(() => {
    if (scanCue && scanCue !== prevRef.current) {
      prevRef.current = scanCue;
      speakSovereign(scanCue);
    }
    if (!scanCue) prevRef.current = '';
  }, [scanCue]);

  return null;
}

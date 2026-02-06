'use client';

import { useState, useEffect } from 'react';
import { getVitalizationStatus, STREAK_TARGET } from '@/lib/vitalizationRitual';

interface VitalizationCountdownProps {
  phoneNumber: string | null;
}

/**
 * 9-Day Vitalization Unlock Ritual — countdown UI.
 * Shows "Day X of 9: Mastering your DNA..." when streak < 9; hidden when unlocked.
 */
export function VitalizationCountdown({ phoneNumber }: VitalizationCountdownProps) {
  const [status, setStatus] = useState<{ streak: number; unlocked: boolean } | null>(null);

  useEffect(() => {
    if (!phoneNumber?.trim()) {
      setStatus(null);
      return;
    }
    getVitalizationStatus(phoneNumber).then((s) => {
      if (s) setStatus({ streak: s.streak, unlocked: s.unlocked });
      else setStatus(null);
    });
  }, [phoneNumber]);

  if (status == null || status.unlocked) return null;

  const day = Math.min(STREAK_TARGET, status.streak);
  return (
    <div
      className="rounded-xl border-2 border-[#D4AF37]/40 bg-[#D4AF37]/5 p-4 mb-6"
      style={{ boxShadow: '0 0 24px rgba(212, 175, 55, 0.1)' }}
    >
      <p className="text-center text-lg font-semibold uppercase tracking-wider" style={{ color: '#D4AF37' }}>
        Day {day} of {STREAK_TARGET}: Mastering your DNA…
      </p>
      <p className="text-center text-xs text-[#6b6b70] mt-1">
        Complete a Face + Fingerprint scan each day. On Day 9, 0.9 VIDA unlocks to spendable and biometric sensitivity switches to High.
      </p>
    </div>
  );
}

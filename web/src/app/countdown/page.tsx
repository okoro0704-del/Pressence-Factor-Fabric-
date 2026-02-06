'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getCountdownTarget } from '@/lib/manifestoUnveiling';

const GOLD = '#D4AF37';
const GOLD_DIM = 'rgba(212, 175, 55, 0.6)';

function useCountdown(target: Date) {
  const [diff, setDiff] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, ready: false });

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const d = target.getTime() - now.getTime();
      if (d <= 0) {
        setDiff({ days: 0, hours: 0, minutes: 0, seconds: 0, ready: true });
        return;
      }
      setDiff({
        days: Math.floor(d / (24 * 60 * 60 * 1000)),
        hours: Math.floor((d % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000)),
        minutes: Math.floor((d % (60 * 60 * 1000)) / (60 * 1000)),
        seconds: Math.floor((d % (60 * 1000)) / 1000),
        ready: false,
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  return diff;
}

export default function SovereignCountdownPage() {
  const target = getCountdownTarget();
  const { days, hours, minutes, seconds, ready } = useCountdown(target);

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center bg-[#050505] text-center px-6 py-12"
      style={{ color: GOLD }}
    >
      <div className="max-w-lg mx-auto">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] mb-2" style={{ color: GOLD_DIM }}>
          Sovereign Countdown
        </p>
        <p className="text-sm mb-8" style={{ color: '#6b6b70' }}>
          Until the official unveiling
        </p>

        {ready ? (
          <p className="text-lg font-semibold" style={{ color: GOLD }}>
            Launch day has arrived.
          </p>
        ) : (
          <div className="grid grid-cols-4 gap-3 md:gap-6 mb-12">
            <div className="rounded-xl border-2 py-4 px-3" style={{ borderColor: GOLD_DIM }}>
              <div className="text-2xl md:text-4xl font-bold tabular-nums">{days}</div>
              <div className="text-xs uppercase tracking-wider mt-1" style={{ color: '#6b6b70' }}>Days</div>
            </div>
            <div className="rounded-xl border-2 py-4 px-3" style={{ borderColor: GOLD_DIM }}>
              <div className="text-2xl md:text-4xl font-bold tabular-nums">{hours}</div>
              <div className="text-xs uppercase tracking-wider mt-1" style={{ color: '#6b6b70' }}>Hours</div>
            </div>
            <div className="rounded-xl border-2 py-4 px-3" style={{ borderColor: GOLD_DIM }}>
              <div className="text-2xl md:text-4xl font-bold tabular-nums">{minutes}</div>
              <div className="text-xs uppercase tracking-wider mt-1" style={{ color: '#6b6b70' }}>Min</div>
            </div>
            <div className="rounded-xl border-2 py-4 px-3" style={{ borderColor: GOLD_DIM }}>
              <div className="text-2xl md:text-4xl font-bold tabular-nums">{seconds}</div>
              <div className="text-xs uppercase tracking-wider mt-1" style={{ color: '#6b6b70' }}>Sec</div>
            </div>
          </div>
        )}

        <p className="text-sm mb-8 max-w-md mx-auto" style={{ color: '#6b6b70' }}>
          Treasury and Vitalization are locked until the official unveiling.
        </p>

        <Link
          href="/"
          className="inline-block rounded-xl border-2 px-6 py-3 font-semibold transition-colors hover:bg-[#16161a]"
          style={{ borderColor: GOLD, color: GOLD }}
        >
          ← Back to Manifesto
        </Link>
      </div>
    </main>
  );
}

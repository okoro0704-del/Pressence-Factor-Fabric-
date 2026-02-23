'use client';

import { useEffect, useState, useCallback } from 'react';
import { JetBrains_Mono } from 'next/font/google';
import { wealthFromHandshakes, formatWealthTicker } from '@/lib/wealth-ticker';
import { subscribeHandshakes } from '@/lib/pulse-realtime';
import { AnimateNumber } from './AnimateNumber';

const jetbrains = JetBrains_Mono({ weight: '700', subsets: ['latin'] });

const TICKER_API = '/api/wealth-ticker';

export function WealthSecuredTicker() {
  const [totalHandshakes, setTotalHandshakes] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const fetchInitial = useCallback(async () => {
    try {
      const res = await fetch(TICKER_API);
      const data = (await res.json()) as { total_handshakes?: number };
      const n = typeof data.total_handshakes === 'number' ? data.total_handshakes : 0;
      setTotalHandshakes(n);
    } catch {
      setTotalHandshakes(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitial();
  }, [fetchInitial]);

  useEffect(() => {
    const unsub = subscribeHandshakes(() => {
      setTotalHandshakes((prev) => prev + 1);
    });
    return unsub;
  }, []);

  const wealth = Number.isFinite(totalHandshakes)
    ? wealthFromHandshakes(totalHandshakes)
    : 0;
  const formatted = formatWealthTicker(wealth);

  if (loading) {
    return (
      <div
        className={`flex flex-col items-center justify-center rounded-xl border border-[#1a1a1a] px-6 py-4 ${jetbrains.className}`}
        style={{ background: '#0B0B0B', minHeight: 80 }}
      >
        <span className="text-sm" style={{ color: '#FFD700', opacity: 0.7 }}>
          —
        </span>
        <span className="mt-1 text-xs" style={{ color: '#666' }}>
          Wealth Protected
        </span>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col items-center justify-center rounded-xl border px-6 py-4 ${jetbrains.className}`}
      style={{
        background: '#0B0B0B',
        borderColor: 'rgba(255, 215, 0, 0.2)',
        boxShadow: '0 0 20px rgba(255, 215, 0, 0.08)',
      }}
    >
      <div className="flex items-baseline gap-0.5">
        <span
          className="tabular-nums"
          style={{ color: '#FFD700', fontSize: '1.25rem', marginRight: 2 }}
        >
          $
        </span>
        <AnimateNumber
          value={wealth}
          formatted={formatted}
          digitHeight={32}
          className="text-[#FFD700]"
          style={{
            color: '#FFD700',
            fontSize: '1.5rem',
            textShadow: '0 0 12px rgba(255, 215, 0, 0.4)',
          }}
        />
      </div>
      <p
        className="mt-1.5 text-xs font-medium uppercase tracking-wider"
        style={{ color: 'rgba(255, 215, 0, 0.6)' }}
      >
        Wealth Protected
      </p>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { fetchTopVitalizedNations, type TopNationDisplay } from '@/lib/topVitalizedNations';

const GOLD = '#D4AF37';
const GRAY = '#6b6b70';

/** Top 10 Vitalized Nations — highest to lowest. Rendered at bottom of dashboard. */
export function TopVitalizedNations({ className = '' }: { className?: string }) {
  const [nations, setNations] = useState<TopNationDisplay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchTopVitalizedNations().then((list) => {
      if (!cancelled) {
        setNations(list);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <section className={`rounded-xl border p-4 ${className}`} style={{ borderColor: 'rgba(212,175,55,0.25)', background: 'rgba(22,22,26,0.8)' }}>
        <h2 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: GOLD }}>Top 10 Vitalized Nations</h2>
        <p className="text-xs" style={{ color: GRAY }}>Loading…</p>
      </section>
    );
  }

  if (nations.length === 0) {
    return (
      <section className={`rounded-xl border p-4 ${className}`} style={{ borderColor: 'rgba(212,175,55,0.25)', background: 'rgba(22,22,26,0.8)' }}>
        <h2 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: GOLD }}>Top 10 Vitalized Nations</h2>
        <p className="text-xs" style={{ color: GRAY }}>No data yet. Vitalize to see nations here.</p>
      </section>
    );
  }

  return (
    <section className={`rounded-xl border p-4 ${className}`} style={{ borderColor: 'rgba(212,175,55,0.25)', background: 'rgba(22,22,26,0.8)' }}>
      <h2 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: GOLD }}>Top 10 Vitalized Nations</h2>
      <ol className="space-y-2 list-none p-0 m-0">
        {nations.map((n) => (
          <li key={n.countryCode} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 min-w-0">
              <span className="font-mono text-xs shrink-0" style={{ color: GRAY }}>#{n.rank}</span>
              <span className="font-medium truncate" style={{ color: '#e8c547' }}>{n.countryName}</span>
            </span>
            <span className="font-bold font-mono shrink-0" style={{ color: GOLD }}>{n.count.toLocaleString()}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

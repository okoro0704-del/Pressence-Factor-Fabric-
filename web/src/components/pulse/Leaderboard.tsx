'use client';

import { useMemo, useEffect, useState } from 'react';
import { leaderboardRows } from '@/data/pulse-metrics';
import { subscribeHandshakes } from '@/lib/pulse-realtime';
import { sanitizeNation } from '@/lib/sanitize-pulse';

function formatWealth(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n}`;
}

export function Leaderboard() {
  const rows = useMemo(() => leaderboardRows(), []);
  const [liveCounts, setLiveCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const unsub = subscribeHandshakes((ev) => {
      const nation = sanitizeNation(ev.nation);
      if (!nation) return;
      setLiveCounts((prev) => ({
        ...prev,
        [nation]: (prev[nation] ?? 0) + 1,
      }));
    });
    return unsub;
  }, []);

  return (
    <aside className="w-full md:w-80 shrink-0 rounded-xl border border-[#2a2a2e] bg-obsidian-surface overflow-hidden">
      <div className="px-4 py-3 border-b border-[#2a2a2e]">
        <h2 className="text-sm font-bold text-gold-bright uppercase tracking-wider">
          Real-time Leaderboard
        </h2>
        <p className="text-xs text-[#6b6b70] mt-0.5">
          Vitalization Score · Wealth Secured · Live handshakes
        </p>
      </div>
      <div className="overflow-x-auto max-h-[360px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-obsidian-surface z-10">
            <tr className="text-left text-[#6b6b70] border-b border-[#2a2a2e]">
              <th className="px-4 py-2 font-semibold">#</th>
              <th className="px-4 py-2 font-semibold">Nation</th>
              <th className="px-4 py-2 font-semibold text-right">Score</th>
              <th className="px-4 py-2 font-semibold text-right">Wealth</th>
              <th className="px-4 py-2 font-semibold text-right">Live</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.nation}
                className="border-b border-[#1a1a1e] hover:bg-[#1a1a1e] transition-colors"
              >
                <td className="px-4 py-2 text-[#6b6b70] font-mono">
                  {r.rank}
                </td>
                <td className="px-4 py-2 text-white font-medium">{r.nation}</td>
                <td className="px-4 py-2 text-gold text-right font-mono">
                  {r.vitalizationScore}
                </td>
                <td className="px-4 py-2 text-[#6b6b70] text-right font-mono">
                  {formatWealth(r.wealthSecured)}
                </td>
                <td className="px-4 py-2 text-gold-bright text-right font-mono">
                  {liveCounts[r.nation] ?? '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </aside>
  );
}

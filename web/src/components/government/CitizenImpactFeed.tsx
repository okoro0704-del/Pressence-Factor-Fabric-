'use client';

import { useState, useEffect, useRef } from 'react';
import { fetchCitizenImpactFeed, type CitizenImpactEntry } from '@/lib/governmentTreasury';

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  if (diffMs < 60000) return 'Just now';
  if (diffMs < 3600000) return `${Math.floor(diffMs / 60000)}m ago`;
  if (diffMs < 86400000) return `${Math.floor(diffMs / 3600000)}h ago`;
  return d.toLocaleDateString();
}

/**
 * Citizen Impact Feed — live scrolling feed of successful 3-out-of-4 biometric verifications.
 * Each entry: "New Citizen Verified → +5.00 VIDA to Treasury".
 */
export function CitizenImpactFeed() {
  const [entries, setEntries] = useState<CitizenImpactEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const load = () => {
    fetchCitizenImpactFeed(50).then((list) => {
      setEntries(list);
      setLoading(false);
    });
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#0d0d0f] rounded-xl border-2 border-[#D4AF37]/30 overflow-hidden flex flex-col h-[320px]">
      <div className="px-4 py-3 border-b border-[#2a2a2e] shrink-0">
        <h3 className="text-sm font-bold text-[#D4AF37] uppercase tracking-wider">Citizen Impact Feed</h3>
        <p className="text-xs text-[#6b6b70] mt-0.5">3-of-4 biometric verifications → +5.00 VIDA to Treasury</p>
      </div>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth space-y-1 p-3"
      >
        {loading && entries.length === 0 ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 bg-[#2a2a2e] rounded animate-pulse" />
            ))}
          </div>
        ) : (
          entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between gap-3 py-2 px-3 rounded-lg bg-[#16161a]/80 border border-[#2a2a2e] hover:border-[#D4AF37]/30 transition-colors"
            >
              <span className="text-sm text-[#e8c547] font-medium truncate flex-1">
                {entry.message}
              </span>
              <span className="text-xs font-mono text-[#D4AF37] shrink-0">+{entry.amountVida.toFixed(2)} VIDA</span>
              <span className="text-[10px] text-[#6b6b70] shrink-0">{formatTime(entry.createdAt)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

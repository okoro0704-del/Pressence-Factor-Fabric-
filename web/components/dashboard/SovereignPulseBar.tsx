'use client';

import { useState, useEffect } from 'react';
import { fetchLedgerStatsFromSupabase } from '@/lib/ledgerStats';
import { VIDA_USD_VALUE } from '@/lib/economic';

const GOLD = '#D4AF37';
const GRAY = '#6b6b70';

/**
 * Global Pulse Bar — shows exactly what Supabase releases.
 * If no population (no row or total_vitalized_count = 0): only current price of VIDA CAP (static).
 * Otherwise: POPULATION | TREASURY | MINTED | UNIT PRICE.
 */
export function SovereignPulseBar({ className = '' }: { className?: string }) {
  const [stats, setStats] = useState<{
    citizens: number;
    treasuryUsd: number | null;
    totalMintedVida: number | null;
  } | null>(null);

  useEffect(() => {
    fetchLedgerStatsFromSupabase().then((s) => {
      if (!s) {
        setStats(null);
        return;
      }
      setStats({
        citizens: s.totalVitalizedCount,
        treasuryUsd: s.nationalReserveUsd,
        totalMintedVida: s.totalMintedVida,
      });
    });
  }, []);

  const unitPriceStr = `$${VIDA_USD_VALUE.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const hasPopulation = stats != null && stats.citizens > 0;
  const treasuryStr =
    stats?.treasuryUsd != null
      ? `$${stats.treasuryUsd.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
      : '—';
  const mintedStr =
    stats?.totalMintedVida != null
      ? `${(stats.totalMintedVida / 1_000_000).toFixed(1)}M VIDA`
      : '—';

  return (
    <section
      className={`py-2 px-4 border shrink-0 overflow-hidden rounded-xl ${className}`.trim()}
      style={{
        borderColor: 'rgba(212, 175, 55, 0.35)',
        background: 'linear-gradient(180deg, rgba(15,14,10,0.95) 0%, rgba(5,5,5,0.98) 100%)',
      }}
      role="status"
      aria-label="Global Pulse metrics"
    >
      <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-1 text-sm">
        {hasPopulation ? (
          <>
            <span className="flex items-baseline gap-1.5">
              <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: GRAY }}>POPULATION:</span>
              <span className="font-bold font-mono" style={{ color: GOLD }}>{stats!.citizens.toLocaleString()}</span>
            </span>
            <span className="flex items-baseline gap-1.5">
              <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: GRAY }}>TREASURY:</span>
              <span className="font-bold font-mono" style={{ color: GOLD }}>{treasuryStr}</span>
            </span>
            <span className="flex items-baseline gap-1.5">
              <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: GRAY }}>MINTED:</span>
              <span className="font-bold font-mono" style={{ color: GOLD }}>{mintedStr}</span>
            </span>
            <span className="flex items-baseline gap-1.5">
              <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: GRAY }}>UNIT PRICE:</span>
              <span className="font-bold font-mono" style={{ color: GOLD }}>{unitPriceStr}</span>
            </span>
          </>
        ) : (
          <span className="flex items-baseline gap-1.5">
            <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: GRAY }}>Current price of VIDA CAP:</span>
            <span className="font-bold font-mono" style={{ color: GOLD }}>{unitPriceStr}</span>
          </span>
        )}
      </div>
    </section>
  );
}

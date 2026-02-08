'use client';

import { useState, useEffect } from 'react';
import { fetchLedgerStats } from '@/lib/ledgerStats';
import { VIDA_USD_VALUE } from '@/lib/economic';

const GOLD = '#D4AF37';
const GRAY = '#6b6b70';

/**
 * Global Pulse Bar — thin, elegant ticker at top of Commander's Dashboard.
 * POPULATION: [Total Citizens] | TREASURY: $[National Reserve Value] | MINTED: [Total VIDA Supply] | UNIT PRICE: $1,000.00
 * Data from global ledger_stats table (fallback: national_block_reserves + sentinel_telemetry).
 */
export function SovereignPulseBar({ className = '' }: { className?: string }) {
  const [stats, setStats] = useState<{
    citizens: number;
    treasuryUsd: number | null;
    totalMintedVida: number | null;
  }>({ citizens: 0, treasuryUsd: null, totalMintedVida: null });

  useEffect(() => {
    fetchLedgerStats().then((s) => {
      setStats({
        citizens: s.totalVitalizedCount,
        treasuryUsd: s.nationalReserveUsd,
        totalMintedVida: s.totalMintedVida,
      });
    });
  }, []);

  const treasuryStr =
    stats.treasuryUsd != null
      ? `$${stats.treasuryUsd.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
      : '—';
  const mintedStr =
    stats.totalMintedVida != null
      ? `${(stats.totalMintedVida / 1_000_000).toFixed(1)}M VIDA`
      : '—';
  const unitPriceStr = `$${VIDA_USD_VALUE.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <section
      className={`py-2 px-4 border-b shrink-0 overflow-hidden ${className}`.trim()}
      style={{
        borderColor: 'rgba(212, 175, 55, 0.35)',
        background: 'linear-gradient(180deg, rgba(15,14,10,0.95) 0%, rgba(5,5,5,0.98) 100%)',
      }}
      role="status"
      aria-label="Global Pulse metrics"
    >
      <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-1 text-sm">
        <span className="flex items-baseline gap-1.5">
          <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: GRAY }}>POPULATION:</span>
          <span className="font-bold font-mono" style={{ color: GOLD }}>{stats.citizens.toLocaleString()}</span>
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
      </div>
    </section>
  );
}

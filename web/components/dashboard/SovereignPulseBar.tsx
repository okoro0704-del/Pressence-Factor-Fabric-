'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchLedgerStats } from '@/lib/ledgerStats';
import { subscribeToLedgerSync } from '@/lib/backendRealtimeSync';

const GOLD = '#D4AF37';
const GRAY = '#6b6b70';

/** Per vitalization: 1 (project) + 5 (nations) + 5 (citizens) = 11 VIDA CAP in circulation. */
const VIDA_CAP_PER_VITALIZATION = 11;

/**
 * Global Pulse Bar — thin, elegant ticker at top of Commander's Dashboard.
 * POPULATION: Total Vitalized Humans | MINTED VIDA CAP: Total in circulation (11 per vitalized: 1 project + 5 nations + 5 citizens) | UNIT PRICE: $1,000
 * No Treasury row under header. Data from ledger_stats; subscribes to backend Realtime.
 */
export function SovereignPulseBar({ className = '' }: { className?: string }) {
  const [stats, setStats] = useState<{
    citizens: number;
    totalMintedVida: number | null;
  }>({ citizens: 0, totalMintedVida: null });

  const refresh = useCallback(() => {
    fetchLedgerStats().then((s) => {
      const vitalized = s.totalVitalizedCount ?? 0;
      const fromLedger = s.totalMintedVida != null && s.totalMintedVida > 0;
      setStats({
        citizens: vitalized,
        totalMintedVida: fromLedger ? s.totalMintedVida : vitalized * VIDA_CAP_PER_VITALIZATION,
      });
    });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const unsub = subscribeToLedgerSync(refresh);
    return unsub;
  }, [refresh]);

  const mintedInCirculation =
    stats.totalMintedVida != null ? stats.totalMintedVida : stats.citizens * VIDA_CAP_PER_VITALIZATION;
  const unitPriceStr = '$1,000';

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
          <span className="font-bold font-mono" style={{ color: GOLD }} title="Total Vitalized Humans">{stats.citizens.toLocaleString()}</span>
        </span>
        <span className="flex items-baseline gap-1.5">
          <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: GRAY }}>MINTED VIDA CAP:</span>
          <span className="font-bold font-mono" style={{ color: GOLD }} title="Total VIDA CAP in circulation: 1 project + 5 nations + 5 citizens per vitalized human">{mintedInCirculation.toLocaleString('en-US')}</span>
        </span>
        <span className="flex items-baseline gap-1.5">
          <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: GRAY }}>UNIT PRICE:</span>
          <span className="font-bold font-mono" style={{ color: GOLD }} title="Current price per 1 VIDA">{unitPriceStr}</span>
        </span>
      </div>
    </section>
  );
}

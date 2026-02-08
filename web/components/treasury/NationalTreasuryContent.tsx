'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { SovereignPulseBar } from '@/components/dashboard/SovereignPulseBar';
import { NationalReserveCharts } from '@/components/dashboard/NationalReserveCharts';
import { NationalBlockCommand } from '@/components/dashboard/NationalBlockCommand';
import { fetchLedgerStats } from '@/lib/ledgerStats';

const GOLD = '#D4AF37';

/** Treasury = country only: national ledger, charts, elections, block command. */
export function NationalTreasuryContent() {
  const [ledgerStats, setLedgerStats] = useState<{
    totalReserveVida: number;
    totalVitalizedCount: number;
    totalMintedVida: number;
  } | null>(null);

  useEffect(() => {
    fetchLedgerStats().then((s) => {
      setLedgerStats({
        totalReserveVida: s.totalReserveVida,
        totalVitalizedCount: s.totalVitalizedCount,
        totalMintedVida: s.totalMintedVida,
      });
    });
  }, []);

  return (
    <div className="flex flex-col min-h-full">
      <SovereignPulseBar className="mb-6" />
      <section className="rounded-2xl border-2 p-6 mb-8" style={{ borderColor: 'rgba(212,175,55,0.35)', background: 'rgba(22,22,26,0.9)' }}>
        <h2 className="text-lg font-bold uppercase tracking-wider mb-2" style={{ color: GOLD }}>
          National Treasury
        </h2>
        <p className="text-xs text-[#6b6b70] mb-6">
          Public view — everything related to the country. Any Vitalized citizen can see this collective wealth. Data from global ledger_stats.
        </p>
        <div className="flex flex-wrap items-baseline gap-6">
          <div>
            <span className="text-xs font-bold text-[#6b6b70] uppercase tracking-wider">Total Reserve</span>
            <p className="text-2xl font-bold font-mono" style={{ color: GOLD }}>
              {ledgerStats != null
                ? `${ledgerStats.totalReserveVida.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} VIDA`
                : '—'}
            </p>
          </div>
          <div>
            <span className="text-xs font-bold text-[#6b6b70] uppercase tracking-wider">Total Vitalized</span>
            <p className="text-2xl font-bold font-mono" style={{ color: GOLD }}>
              {ledgerStats != null ? ledgerStats.totalVitalizedCount.toLocaleString() : '—'}
            </p>
          </div>
          <div>
            <span className="text-xs font-bold text-[#6b6b70] uppercase tracking-wider">Minted VIDA</span>
            <p className="text-2xl font-bold font-mono" style={{ color: GOLD }}>
              {ledgerStats != null
                ? `${ledgerStats.totalMintedVida.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} VIDA`
                : '—'}
            </p>
          </div>
          <Link
            href="/government/elections/"
            className="text-sm font-bold uppercase tracking-wider ml-auto"
            style={{ color: GOLD }}
          >
            Elections / Voting →
          </Link>
        </div>
        <NationalReserveCharts />
        <div className="mt-6">
          <h3 className="text-xs font-bold text-[#6b6b70] uppercase tracking-wider mb-3">National Block Command</h3>
          <NationalBlockCommand />
        </div>
      </section>
    </div>
  );
}

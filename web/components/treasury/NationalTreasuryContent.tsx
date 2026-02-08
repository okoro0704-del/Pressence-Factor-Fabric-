'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { SovereignPulseBar } from '@/components/dashboard/SovereignPulseBar';
import { NationalReserveCharts } from '@/components/dashboard/NationalReserveCharts';
import { NationalBlockCommand } from '@/components/dashboard/NationalBlockCommand';
import { fetchLedgerStats } from '@/lib/ledgerStats';
import { fetchNationalBlockReserves } from '@/lib/supabaseTelemetry';
import { useUsdToNgnRate } from '@/lib/useUsdToNgnRate';
import { getCountryDisplayName } from '@/lib/countryDisplayName';
import { getCountryCodeForPhone } from '@/lib/userProfileCountry';
import { getIdentityAnchorPhone } from '@/lib/sentinelActivation';
import { VIDA_USD_VALUE } from '@/lib/economic';

const GOLD = '#D4AF37';

function formatUsd(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function formatNaira(n: number) {
  return `₦${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

/** Treasury = country only: national ledger with country name, minted, vitalized, reserve, liquidity, VIDA price in USD and Naira. */
export function NationalTreasuryContent() {
  const { rate: usdToNgn } = useUsdToNgnRate();
  const [ledgerStats, setLedgerStats] = useState<{
    totalReserveVida: number;
    totalVitalizedCount: number;
    totalMintedVida: number;
    nationalReserveUsd: number;
  } | null>(null);
  const [nationalReserves, setNationalReserves] = useState<{
    vida_cap_liquidity: number;
    vida_price_usd: number;
    naira_rate: number;
  } | null>(null);
  const [countryName, setCountryName] = useState<string>('Nigeria');

  useEffect(() => {
    getCountryCodeForPhone(getIdentityAnchorPhone()).then((code) => {
      setCountryName(getCountryDisplayName(code));
    });
  }, []);

  useEffect(() => {
    fetchLedgerStats().then((s) => {
      setLedgerStats({
        totalReserveVida: s.totalReserveVida,
        totalVitalizedCount: s.totalVitalizedCount,
        totalMintedVida: s.totalMintedVida,
        nationalReserveUsd: s.nationalReserveUsd,
      });
    });
  }, []);

  useEffect(() => {
    fetchNationalBlockReserves().then((r) => {
      if (r) {
        setNationalReserves({
          vida_cap_liquidity: r.vida_cap_liquidity,
          vida_price_usd: r.vida_price_usd,
          naira_rate: r.naira_rate,
        });
      }
    });
  }, []);

  const vidaPriceUsd = nationalReserves?.vida_price_usd ?? VIDA_USD_VALUE;
  const vidaPriceNaira = vidaPriceUsd * usdToNgn;

  return (
    <div className="flex flex-col min-h-full">
      <SovereignPulseBar className="mb-6" />
      <section className="rounded-2xl border-2 p-6 mb-8" style={{ borderColor: 'rgba(212,175,55,0.35)', background: 'rgba(22,22,26,0.9)' }}>
        <h2 className="text-lg font-bold uppercase tracking-wider mb-1" style={{ color: GOLD }}>
          {countryName}&apos;s National Treasury
        </h2>
        <p className="text-xs text-[#6b6b70] mb-6">
          Public view — collective wealth for Vitalized citizens. Amounts in VIDA, USD and Naira.
        </p>

        {/* 1 VIDA price */}
        <div className="rounded-xl border border-[#2a2a2e] bg-[#16161a]/60 p-4 mb-6">
          <h3 className="text-xs font-bold text-[#6b6b70] uppercase tracking-wider mb-2">Price of 1 VIDA</h3>
          <p className="text-lg font-bold font-mono" style={{ color: GOLD }}>
            {formatUsd(vidaPriceUsd)} USD
          </p>
          <p className="text-sm font-mono text-[#a0a0a5]">
            {formatNaira(vidaPriceNaira)} Naira
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          {/* Total minted VIDA for the country */}
          <div className="rounded-xl border border-[#2a2a2e] p-4">
            <span className="text-xs font-bold text-[#6b6b70] uppercase tracking-wider">Total Minted VIDA</span>
            <p className="text-xl font-bold font-mono mt-1" style={{ color: GOLD }}>
              {ledgerStats != null
                ? `${ledgerStats.totalMintedVida.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} VIDA`
                : '—'}
            </p>
            {ledgerStats != null && (
              <>
                <p className="text-sm text-[#a0a0a5]">{formatUsd(ledgerStats.totalMintedVida * vidaPriceUsd)} USD</p>
                <p className="text-sm text-[#a0a0a5]">{formatNaira(ledgerStats.totalMintedVida * vidaPriceNaira)} Naira</p>
              </>
            )}
          </div>

          {/* Total Vitalized Citizens */}
          <div className="rounded-xl border border-[#2a2a2e] p-4">
            <span className="text-xs font-bold text-[#6b6b70] uppercase tracking-wider">Total Vitalized Citizens</span>
            <p className="text-2xl font-bold font-mono mt-1" style={{ color: GOLD }}>
              {ledgerStats != null ? ledgerStats.totalVitalizedCount.toLocaleString() : '—'}
            </p>
          </div>

          {/* National locked reserved VIDA CAP */}
          <div className="rounded-xl border border-[#2a2a2e] p-4">
            <span className="text-xs font-bold text-[#6b6b70] uppercase tracking-wider">National Locked Reserved VIDA CAP</span>
            <p className="text-xl font-bold font-mono mt-1" style={{ color: GOLD }}>
              {ledgerStats != null
                ? `${ledgerStats.totalReserveVida.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} VIDA`
                : '—'}
            </p>
            {ledgerStats != null && (
              <>
                <p className="text-sm text-[#a0a0a5]">{formatUsd(ledgerStats.totalReserveVida * vidaPriceUsd)} USD</p>
                <p className="text-sm text-[#a0a0a5]">{formatNaira(ledgerStats.totalReserveVida * vidaPriceNaira)} Naira</p>
              </>
            )}
          </div>

          {/* National Liquidity */}
          <div className="rounded-xl border border-[#2a2a2e] p-4">
            <span className="text-xs font-bold text-[#6b6b70] uppercase tracking-wider">National Liquidity</span>
            <p className="text-xl font-bold font-mono mt-1" style={{ color: GOLD }}>
              {nationalReserves != null
                ? `${nationalReserves.vida_cap_liquidity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} VIDA`
                : ledgerStats != null ? '—' : '—'}
            </p>
            {nationalReserves != null && (
              <>
                <p className="text-sm text-[#a0a0a5]">{formatUsd(nationalReserves.vida_cap_liquidity * nationalReserves.vida_price_usd)} USD</p>
                <p className="text-sm text-[#a0a0a5]">{formatNaira(nationalReserves.vida_cap_liquidity * nationalReserves.vida_price_usd * usdToNgn)} Naira</p>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <Link
            href="/government/elections/"
            className="text-sm font-bold uppercase tracking-wider"
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

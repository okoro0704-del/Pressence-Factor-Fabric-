'use client';

import { useState, useEffect } from 'react';
import { SovereignPulseBar } from '@/components/dashboard/SovereignPulseBar';
import { NationalReserveCharts } from '@/components/dashboard/NationalReserveCharts';
import { NationalBlockCommand } from '@/components/dashboard/NationalBlockCommand';
import { fetchLedgerStatsFromSupabase } from '@/lib/ledgerStats';
import { fetchNationalBlockReserves, type NationalBlockReserves } from '@/lib/supabaseTelemetry';
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

/** Treasury: all data from Supabase. 70% National Lock Block, 30% National Liquidity (VIDA CAP + Liquid Pool in Naira). */
export function NationalTreasuryContent() {
  const { rate: usdToNgn } = useUsdToNgnRate();
  const [ledgerStats, setLedgerStats] = useState<{
    totalReserveVida: number;
    totalVitalizedCount: number;
    totalMintedVida: number;
    nationalReserveUsd: number;
  } | null>(null);
  const [reserves, setReserves] = useState<NationalBlockReserves | null>(null);
  const [countryName, setCountryName] = useState<string>('Nigeria');

  useEffect(() => {
    getCountryCodeForPhone(getIdentityAnchorPhone()).then((code) => {
      setCountryName(getCountryDisplayName(code));
    });
  }, []);

  useEffect(() => {
    fetchLedgerStatsFromSupabase().then((s) => {
      if (s) setLedgerStats(s);
    });
  }, []);

  useEffect(() => {
    fetchNationalBlockReserves().then((r) => {
      if (r) setReserves(r);
    });
  }, []);

  const vidaPriceUsd = reserves?.vida_price_usd ?? VIDA_USD_VALUE;
  const vidaPriceNaira = vidaPriceUsd * usdToNgn;

  return (
    <div className="flex flex-col min-h-full">
      <SovereignPulseBar className="mb-6" />
      <section className="rounded-2xl border-2 p-6 mb-8" style={{ borderColor: 'rgba(212,175,55,0.35)', background: 'rgba(22,22,26,0.9)' }}>
        <h2 className="text-lg font-bold uppercase tracking-wider mb-1" style={{ color: GOLD }}>
          {countryName}&apos;s National Treasury
        </h2>
        <p className="text-xs text-[#6b6b70] mb-6">
          All figures from Supabase. 70% National Lock Block · 30% National Liquidity (VIDA CAP + Liquid Pool in Naira).
        </p>

        {/* 1 VIDA price (from Supabase when available) */}
        <div className="rounded-xl border border-[#2a2a2e] bg-[#16161a]/60 p-4 mb-6">
          <h3 className="text-xs font-bold text-[#6b6b70] uppercase tracking-wider mb-2">Price of 1 VIDA</h3>
          <p className="text-lg font-bold font-mono" style={{ color: GOLD }}>
            {formatUsd(vidaPriceUsd)} USD
          </p>
          <p className="text-sm font-mono text-[#a0a0a5]">
            {formatNaira(vidaPriceNaira)} Naira
          </p>
        </div>

        {/* From Supabase ledger_stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          <div className="rounded-xl border border-[#2a2a2e] p-4">
            <span className="text-xs font-bold text-[#6b6b70] uppercase tracking-wider">Total Vitalized Citizens</span>
            <p className="text-2xl font-bold font-mono mt-1" style={{ color: GOLD }}>
              {ledgerStats != null ? ledgerStats.totalVitalizedCount.toLocaleString() : '—'}
            </p>
            <p className="text-[10px] text-[#6b6b70] mt-1">From Supabase ledger_stats</p>
          </div>

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
            <p className="text-[10px] text-[#6b6b70] mt-1">From Supabase ledger_stats</p>
          </div>
        </div>

        {/* National Lock Block = 70% of the 5 minted (from Supabase national_block_reserves) */}
        <div className="rounded-xl border border-[#2a2a2e] p-4 mb-6">
          <h3 className="text-xs font-bold text-[#6b6b70] uppercase tracking-wider mb-2">National Lock Block (70%)</h3>
          <p className="text-sm text-[#a0a0a5] mb-2">70% of minted VIDA per citizen. From Supabase national_block_reserves.</p>
          <p className="text-xl font-bold font-mono" style={{ color: GOLD }}>
            {reserves != null
              ? `${reserves.national_vault_vida_cap.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} VIDA`
              : '—'}
          </p>
          {reserves != null && (
            <>
              <p className="text-sm text-[#a0a0a5]">{formatUsd(reserves.national_vault_value_usd)} USD</p>
              <p className="text-sm text-[#a0a0a5]">{formatNaira(reserves.national_vault_value_naira)} Naira</p>
            </>
          )}
        </div>

        {/* National Liquidity = 30%: VIDA CAP + Liquid Pool in Naira (from Supabase) */}
        <div className="rounded-xl border border-[#2a2a2e] p-4 mb-6">
          <h3 className="text-xs font-bold text-[#6b6b70] uppercase tracking-wider mb-3">National Liquidity (30%)</h3>
          <p className="text-sm text-[#a0a0a5] mb-4">VIDA CAP and Liquid Pool in Naira. From Supabase national_block_reserves.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-lg border border-[#2a2a2e] bg-[#16161a]/60 p-3">
              <span className="text-[10px] font-bold text-[#6b6b70] uppercase tracking-wider">VIDA CAP</span>
              <p className="text-lg font-bold font-mono mt-1" style={{ color: GOLD }}>
                {reserves != null
                  ? `${reserves.vida_cap_liquidity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} VIDA`
                  : '—'}
              </p>
              {reserves != null && (
                <>
                  <p className="text-xs text-[#a0a0a5]">{formatUsd(reserves.vida_cap_liquidity * reserves.vida_price_usd)} USD</p>
                  <p className="text-xs text-[#a0a0a5]">{formatNaira(reserves.vida_cap_liquidity_value_naira)} Naira</p>
                </>
              )}
            </div>

            <div className="rounded-lg border border-[#2a2a2e] bg-[#16161a]/60 p-3">
              <span className="text-[10px] font-bold text-[#6b6b70] uppercase tracking-wider">Liquid Pool (Naira VIDA)</span>
              <p className="text-lg font-bold font-mono mt-1" style={{ color: GOLD }}>
                {reserves != null
                  ? `${reserves.national_vida_pool_vida_cap.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} VIDA`
                  : '—'}
              </p>
              {reserves != null && (
                <>
                  <p className="text-xs text-[#a0a0a5]">{formatUsd(reserves.national_vida_pool_vida_cap * reserves.vida_price_usd)} USD</p>
                  <p className="text-xs text-[#a0a0a5]">{formatNaira(reserves.national_vida_pool_value_naira)} Naira</p>
                </>
              )}
            </div>
          </div>
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

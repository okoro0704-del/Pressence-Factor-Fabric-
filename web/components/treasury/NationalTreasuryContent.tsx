'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchNationalTreasuryFeed, subscribeToNationalTreasuryFeed, type NationalTreasuryFeed } from '@/lib/nationalTreasuryFeed';
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

/** Treasury: fed by backend (get_national_treasury_feed). Total vitalized citizens, nation minted VIDA CAP, locked, national liquidity, liquid pool. Realtime updates. */
export function NationalTreasuryContent() {
  const { rate: usdToNgn } = useUsdToNgnRate();
  const [feed, setFeed] = useState<NationalTreasuryFeed | null>(null);
  const [countryName, setCountryName] = useState<string>('Nigeria');

  const refresh = useCallback(() => {
    fetchNationalTreasuryFeed().then((f) => {
      if (f.ok) setFeed(f);
    });
  }, []);

  useEffect(() => {
    getCountryCodeForPhone(getIdentityAnchorPhone()).then((code) => {
      setCountryName(getCountryDisplayName(code));
    });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const unsub = subscribeToNationalTreasuryFeed(refresh);
    return unsub;
  }, [refresh]);

  const vidaPriceUsd = feed?.vida_price_usd ?? VIDA_USD_VALUE;
  const vidaPriceNaira = vidaPriceUsd * usdToNgn;

  const nationalLiquidityHalf = feed != null ? (feed.national_liquidity ?? 0) / 2 : 0;
  const nationalLiquidityDisplay = feed != null ? (feed.vida_cap_liquidity != null && feed.vida_cap_liquidity > 0 ? feed.vida_cap_liquidity : nationalLiquidityHalf) : 0;
  const liquidPoolDisplay = feed != null ? (feed.liquid_pool != null && feed.liquid_pool > 0 ? feed.liquid_pool : nationalLiquidityHalf) : 0;
  const totalMintedNationDisplay = feed != null ? (feed.total_minted_vida_cap_nation > 0 ? feed.total_minted_vida_cap_nation : feed.total_minted_vida || feed.total_reserve_vida || 0) : 0;

  return (
    <div className="flex flex-col min-h-full">
      <section className="rounded-2xl border-2 p-6 mb-8" style={{ borderColor: 'rgba(212,175,55,0.35)', background: 'rgba(22,22,26,0.9)' }}>
        <h2 className="text-lg font-bold uppercase tracking-wider mb-6" style={{ color: GOLD }}>
          {countryName}&apos;s National Treasury
        </h2>
        <p className="text-xs text-[#6b6b70] mb-4">Data from National Block. Updates when the backend updates.</p>

        {/* Price of 1 VIDA */}
        <div className="rounded-xl border border-[#2a2a2e] bg-[#16161a]/60 p-4 mb-4">
          <h3 className="text-xs font-bold text-[#6b6b70] uppercase tracking-wider mb-2">Price of 1 VIDA</h3>
          <p className="text-lg font-bold font-mono" style={{ color: GOLD }}>
            {formatUsd(vidaPriceUsd)} USD
          </p>
          <p className="text-sm font-mono text-[#a0a0a5]">{formatNaira(vidaPriceNaira)} Naira</p>
        </div>

        {/* Total Vitalized Citizens (on Earth) */}
        <div className="rounded-xl border border-[#2a2a2e] p-4 mb-4">
          <h3 className="text-xs font-bold text-[#6b6b70] uppercase tracking-wider mb-2">Total Vitalized Citizens</h3>
          <p className="text-2xl font-bold font-mono" style={{ color: GOLD }}>
            {feed != null ? feed.total_vitalized_citizens.toLocaleString() : '—'}
          </p>
          <p className="text-xs text-[#6b6b70] mt-1">Vitalized humans on Earth (National Block feeds treasury from this count).</p>
        </div>

        {/* Total Minted VIDA CAP for the Nation — prefer nation cap, fallback to global total */}
        <div className="rounded-xl border border-[#2a2a2e] p-4 mb-4">
          <h3 className="text-xs font-bold text-[#6b6b70] uppercase tracking-wider mb-2">Total Minted VIDA CAP for the Nation</h3>
          <p className="text-xl font-bold font-mono" style={{ color: GOLD }}>
            {feed != null ? `${totalMintedNationDisplay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} VIDA` : '—'}
          </p>
          {feed != null && (
            <>
              <p className="text-sm text-[#a0a0a5]">{formatUsd(totalMintedNationDisplay * vidaPriceUsd)} USD</p>
              <p className="text-sm text-[#a0a0a5]">{formatNaira(totalMintedNationDisplay * vidaPriceNaira)} Naira</p>
            </>
          )}
        </div>

        {/* Amount of VIDA CAP Locked */}
        <div className="rounded-xl border border-[#2a2a2e] p-4 mb-4">
          <h3 className="text-xs font-bold text-[#6b6b70] uppercase tracking-wider mb-2">VIDA CAP Locked (National Lock Block)</h3>
          <p className="text-xl font-bold font-mono" style={{ color: GOLD }}>
            {feed != null
              ? `${feed.vida_cap_locked.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} VIDA`
              : '—'}
          </p>
          {feed != null && (
            <>
              <p className="text-sm text-[#a0a0a5]">{formatUsd(feed.vida_cap_locked * vidaPriceUsd)} USD</p>
              <p className="text-sm text-[#a0a0a5]">{formatNaira(feed.vida_cap_locked * vidaPriceNaira)} Naira</p>
            </>
          )}
        </div>

        {/* National Liquidity (15% — VIDA CAP Liquidity); half of 30% when only sum is provided */}
        <div className="rounded-xl border border-[#2a2a2e] p-4 mb-4">
          <h3 className="text-xs font-bold text-[#6b6b70] uppercase tracking-wider mb-2">National Liquidity (15%)</h3>
          <p className="text-xl font-bold font-mono" style={{ color: GOLD }}>
            {feed != null ? `${nationalLiquidityDisplay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} VIDA` : '—'}
          </p>
          {feed != null && (
            <>
              <p className="text-sm text-[#a0a0a5]">{formatUsd(nationalLiquidityDisplay * vidaPriceUsd)} USD</p>
              <p className="text-sm text-[#a0a0a5]">{formatNaira(nationalLiquidityDisplay * vidaPriceNaira)} Naira</p>
            </>
          )}
        </div>

        {/* Liquid Pool (15% — National VIDA Pool); half of 30% when only sum is provided */}
        <div className="rounded-xl border border-[#2a2a2e] p-4">
          <h3 className="text-xs font-bold text-[#6b6b70] uppercase tracking-wider mb-2">Liquid Pool (15%)</h3>
          <p className="text-xl font-bold font-mono" style={{ color: GOLD }}>
            {feed != null ? `${liquidPoolDisplay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} VIDA` : '—'}
          </p>
          {feed != null && (
            <>
              <p className="text-sm text-[#a0a0a5]">{formatUsd(liquidPoolDisplay * vidaPriceUsd)} USD</p>
              <p className="text-sm text-[#a0a0a5]">{formatNaira(liquidPoolDisplay * vidaPriceNaira)} Naira</p>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

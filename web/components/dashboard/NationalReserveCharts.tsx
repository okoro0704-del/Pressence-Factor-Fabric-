'use client';

import { useState, useEffect } from 'react';
import { fetchNationalReserve, type NationalReserve } from '@/lib/supabaseTelemetry';
import { getNationalReserveData } from '@/lib/mockDataService';

export function NationalReserveCharts() {
  const [reserve, setReserve] = useState<NationalReserve | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReserveData() {
      setLoading(true);
      const liveData = await fetchNationalReserve();
      
      if (liveData) {
        setReserve(liveData);
      } else {
        setReserve(getNationalReserveData());
      }
      setLoading(false);
    }

    loadReserveData();
  }, []);

  if (loading || !reserve) {
    return (
      <div className="space-y-6">
        <div className="bg-[#16161a] rounded-xl p-6 border border-[#2a2a2e] animate-pulse">
          <div className="h-8 bg-[#2a2a2e] rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-[#2a2a2e] rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#16161a] rounded-xl p-6 border border-[#2a2a2e]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[#6b6b70] uppercase tracking-wider">Vault Balance</h3>
            <span className="text-xs text-[#6b6b70]">{reserve.country}</span>
          </div>
          <div className="space-y-2">
            <p className="text-3xl font-bold text-[#e8c547]">
              {reserve.vault_balance_vida_cap.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-sm text-[#6b6b70]">VIDA CAP</p>
          </div>
        </div>

        <div className="bg-[#16161a] rounded-xl p-6 border border-[#2a2a2e]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[#6b6b70] uppercase tracking-wider">Currency Circulation</h3>
            <span className="text-xs text-[#6b6b70]">Backed</span>
          </div>
          <div className="space-y-2">
            <p className="text-3xl font-bold text-[#e8c547]">
              {reserve.backed_currency_circulation_vida.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-sm text-[#6b6b70]">$VIDA</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#0d0d0f] rounded-lg p-4 border border-[#2a2a2e]">
          <p className="text-xs text-[#6b6b70] mb-1">Backing Ratio</p>
          <p className="text-xl font-bold text-[#c9a227]">{reserve.backing_ratio}</p>
          <p className="text-xs text-green-400 mt-1">Debt-Free</p>
        </div>

        <div className="bg-[#0d0d0f] rounded-lg p-4 border border-[#2a2a2e]">
          <p className="text-xs text-[#6b6b70] mb-1">Infrastructure Burn</p>
          <p className="text-xl font-bold text-[#c9a227]">{reserve.burn_rate_infrastructure}</p>
          <p className="text-xs text-[#6b6b70] mt-1">Monthly</p>
        </div>

        <div className="bg-[#0d0d0f] rounded-lg p-4 border border-[#2a2a2e]">
          <p className="text-xs text-[#6b6b70] mb-1">Monthly Growth</p>
          <p className="text-xl font-bold text-green-400">{reserve.monthly_growth}</p>
          <p className="text-xs text-[#6b6b70] mt-1">VIDA CAP Reserve</p>
        </div>
      </div>

      <div className="bg-[#16161a] rounded-xl p-6 border border-[#2a2a2e]">
        <h3 className="text-sm font-semibold text-[#e8c547] mb-4">Reserve vs Circulation</h3>
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[#6b6b70]">VIDA CAP Reserve</span>
              <span className="text-xs font-mono text-[#e8c547]">
                {reserve.vault_balance_vida_cap.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="h-3 bg-[#0d0d0f] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#c9a227] to-[#e8c547]" style={{ width: '100%' }} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[#6b6b70]">$VIDA Circulation</span>
              <span className="text-xs font-mono text-[#e8c547]">
                {reserve.backed_currency_circulation_vida.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="h-3 bg-[#0d0d0f] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#e8c547] to-[#c9a227]" style={{ width: `${(reserve.backed_currency_circulation_vida / reserve.vault_balance_vida_cap) * 100}%` }} />
            </div>
          </div>
        </div>
        <p className="text-xs text-[#6b6b70] mt-4 text-center">Perfect 1:1 backing ratio maintained</p>
      </div>
    </div>
  );
}

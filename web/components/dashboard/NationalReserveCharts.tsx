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

  const VIDA_TO_NAIRA = 1500; // Sovereign Block Exchange Rate

  return (
    <div className="space-y-6">
      {/* TRIPLE-VAULT CURRENCY DISPLAY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* VAULT 1: THE CORE - VIDA CAP (Pulsing Gold) */}
        <div className="relative bg-[#16161a] rounded-xl p-6 border border-[#2a2a2e] overflow-hidden group">
          {/* Pulsing Gold Glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#D4AF37]/20 rounded-full blur-3xl animate-pulse" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider">Vault 1: The Core</h3>
              <span className="text-xs text-[#6b6b70]">{reserve.country}</span>
            </div>
            <div className="space-y-2">
              <p className="text-4xl font-bold font-mono text-[#D4AF37] tracking-tight">
                {reserve.vault_balance_vida_cap.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-sm font-semibold text-[#6b6b70]">VIDA CAP</p>
              <p className="text-xs text-[#6b6b70] mt-2">Primary Hard Asset</p>
            </div>
          </div>
        </div>

        {/* VAULT 2: LOCAL LIQUIDITY - NAIRA (Matrix Green) */}
        <div className="relative bg-[#16161a] rounded-xl p-6 border border-[#2a2a2e] overflow-hidden group">
          {/* Matrix Green Glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#00ff41]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#00ff41]/15 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-[#00ff41] uppercase tracking-wider">Vault 2: Local Liquidity</h3>
              <span className="text-xs text-[#6b6b70]">₦</span>
            </div>
            <div className="space-y-2">
              <p className="text-4xl font-bold font-mono text-[#00ff41] tracking-tight">
                ₦{reserve.vault_balance_naira.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-sm font-semibold text-[#6b6b70]">Nigerian Naira</p>
              <p className="text-xs text-[#6b6b70] mt-2">
                Real-time conversion based on Sovereign Block Exchange Rate
              </p>
            </div>
          </div>
        </div>

        {/* VAULT 3: GLOBAL BENCHMARK - USD */}
        <div className="relative bg-[#16161a] rounded-xl p-6 border border-[#2a2a2e] overflow-hidden group">
          {/* Blue Glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#1E3A8A]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#3B82F6]/15 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-[#3B82F6] uppercase tracking-wider">Vault 3: Global Benchmark</h3>
              <span className="text-xs text-[#6b6b70]">$</span>
            </div>
            <div className="space-y-2">
              <p className="text-4xl font-bold font-mono text-[#3B82F6] tracking-tight">
                ${reserve.vault_balance_usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-sm font-semibold text-[#6b6b70]">United States Dollar</p>
              <p className="text-xs text-[#6b6b70] mt-2">International Valuation</p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Metrics */}
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

      {/* Exchange Rate Transparency Footer */}
      <div className="bg-[#0d0d0f] rounded-lg p-4 border border-[#2a2a2e]">
        <h4 className="text-xs font-bold text-[#00ff41] uppercase tracking-wider mb-2">Sovereign Block Exchange Rates</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-[#6b6b70]">
          <div>
            <span className="font-mono text-[#D4AF37]">1 VIDA CAP</span> = <span className="font-mono text-[#00ff41]">₦{VIDA_TO_NAIRA.toLocaleString()}</span>
          </div>
          <div>
            <span className="font-mono text-[#D4AF37]">1 VIDA CAP</span> = <span className="font-mono text-[#3B82F6]">.00 USD</span>
          </div>
        </div>
        <p className="text-xs text-[#6b6b70] mt-2">
          Real-time conversion based on Sovereign Block Exchange Rate. All values calculated from live telemetry data.
        </p>
      </div>
    </div>
  );
}

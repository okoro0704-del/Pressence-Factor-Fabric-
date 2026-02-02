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
      {/* THE ARCHITECT'S SOVEREIGN PORTFOLIO HEADER */}
      <div className="bg-gradient-to-r from-[#050505] via-[#0d0d0f] to-[#050505] rounded-xl p-6 border-2 border-[#D4AF37]/30">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#D4AF37] mb-2 tracking-wider">THE ARCHITECT'S SOVEREIGN PORTFOLIO</h2>
          <div className="flex items-center justify-center gap-4 text-sm text-[#6b6b70]">
            <span>Total Minted: <span className="font-mono text-[#D4AF37]">{reserve.sovereign_share_vida * 2} VIDA CAP</span></span>
            <span className="text-[#D4AF37]">•</span>
            <span>Sovereign Share (50%): <span className="font-mono text-[#D4AF37]">{reserve.sovereign_share_vida} VIDA CAP</span></span>
          </div>
          <div className="mt-3 text-xs text-[#6b6b70]">
            Total Value: <span className="font-mono text-[#00ff41]">₦{reserve.total_value_naira.toLocaleString()}</span> | <span className="font-mono text-[#3B82F6]"></span>
          </div>
        </div>
      </div>

      {/* 70/15/15 LIQUIDITY SPLIT - TRIPLE-VAULT DISPLAY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* CARD 1: NATIONAL VAULT (70%) - LOCKED RESERVES */}
        <div className="relative bg-[#050505] rounded-xl p-6 border-2 border-[#D4AF37]/50 overflow-hidden group">
          {/* Pulsing Gold Glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/20 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#D4AF37]/30 rounded-full blur-3xl animate-pulse" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider">Card 1: National Vault</h3>
              <span className="text-xs font-mono text-[#D4AF37]">70%</span>
            </div>
            <div className="space-y-2">
              <p className="text-5xl font-bold font-mono text-[#D4AF37] tracking-tight">
                {reserve.national_vault_vida.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-sm font-semibold text-[#D4AF37]">VIDA CAP</p>
              <p className="text-xs text-[#6b6b70] mt-2 uppercase tracking-wide">🔒 Locked Reserves</p>
              <div className="mt-3 pt-3 border-t border-[#D4AF37]/20">
                <p className="text-xs text-[#6b6b70]">Value: <span className="font-mono text-[#D4AF37]">₦{(reserve.national_vault_vida * 1000 * 1400).toLocaleString()}</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 2: NATIONAL LIQUIDITY (15%) - ACTIVE SUPPLY */}
        <div className="relative bg-[#050505] rounded-xl p-6 border-2 border-[#D4AF37]/30 overflow-hidden group">
          {/* Gold Glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#D4AF37]/15 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider">Card 2: National Liquidity</h3>
              <span className="text-xs font-mono text-[#D4AF37]">15%</span>
            </div>
            <div className="space-y-2">
              <p className="text-5xl font-bold font-mono text-[#D4AF37] tracking-tight">
                {reserve.national_liquidity_vida.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-sm font-semibold text-[#D4AF37]">VIDA CAP</p>
              <p className="text-xs text-[#6b6b70] mt-2 uppercase tracking-wide">⚡ Active Supply</p>
              <div className="mt-3 pt-3 border-t border-[#D4AF37]/20">
                <p className="text-xs text-[#6b6b70]">Value: <span className="font-mono text-[#D4AF37]">₦{(reserve.national_liquidity_vida * 1000 * 1400).toLocaleString()}</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 3: NAIRA-VIDA (15%) - LOCAL CURRENCY */}
        <div className="relative bg-[#050505] rounded-xl p-6 border-2 border-[#00ff41]/50 overflow-hidden group">
          {/* Matrix Green Glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#00ff41]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#00ff41]/20 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-[#00ff41] uppercase tracking-wider">Card 3: Naira-VIDA</h3>
              <span className="text-xs font-mono text-[#00ff41]">15%</span>
            </div>
            <div className="space-y-2">
              <p className="text-4xl font-bold font-mono text-[#00ff41] tracking-tight">
                ₦{reserve.naira_vida_value_naira.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-sm font-semibold text-[#6b6b70]">Nigerian Naira</p>
              <p className="text-xs text-[#6b6b70] mt-2">
                {reserve.naira_vida_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} VIDA × $1,000 × ₦1,400
              </p>
              <div className="mt-3 pt-3 border-t border-[#00ff41]/20">
                <p className="text-xs text-[#6b6b70]">Local Currency Equivalent</p>
              </div>
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

      {/* Genesis Hash Seal - Verification Footer */}
      <div className="bg-[#0d0d0f] rounded-lg p-4 border-2 border-[#D4AF37]/30">
        <h4 className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider mb-2">🔐 Genesis Hash Seal</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-[#6b6b70]">
          <div>
            <span className="font-mono text-[#D4AF37]">1 VIDA CAP</span> = <span className="font-mono text-[#3B82F6]">$1,000 USD</span>
          </div>
          <div>
            <span className="font-mono text-[#D4AF37]">1 USD</span> = <span className="font-mono text-[#00ff41]">₦1,400</span>
          </div>
        </div>
        <p className="text-xs text-[#6b6b70] mt-2">
          All values locked and verified by Sovereign Block Exchange Rate. Total Portfolio: {reserve.sovereign_share_vida} VIDA CAP = ₦{reserve.total_value_naira.toLocaleString()}
        </p>
      </div>
    </div>
  );
}

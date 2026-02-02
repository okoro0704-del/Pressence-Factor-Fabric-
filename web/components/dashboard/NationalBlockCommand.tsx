'use client';

import { useState, useEffect } from 'react';
import { fetchNationalBlockReserves, type NationalBlockReserves } from '@/lib/supabaseTelemetry';

export function NationalBlockCommand() {
  const [reserves, setReserves] = useState<NationalBlockReserves | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReservesData() {
      setLoading(true);
      const liveData = await fetchNationalBlockReserves();
      
      if (liveData) {
        setReserves(liveData);
      }
      setLoading(false);
    }

    loadReservesData();
  }, []);

  if (loading || !reserves) {
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
      {/* NATIONAL BLOCK COMMAND HEADER */}
      <div className="bg-gradient-to-r from-[#1e3a8a] via-[#2563eb] to-[#1e3a8a] rounded-xl p-6 border-2 border-[#3b82f6]/50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#c0c0c0] mb-2 tracking-wider">NATIONAL BLOCK COMMAND</h2>
          <p className="text-sm text-[#a0a0a0]">Dual Vault System: National VIDA Currency Circulation</p>
          <div className="mt-3 text-xs text-[#6b6b70]">
            Total National Reserves: <span className="font-mono text-[#3b82f6]">{(reserves.national_vault_vida_cap + reserves.vida_cap_liquidity + reserves.national_vida_pool_vida_cap).toLocaleString()} VIDA CAP</span>
          </div>
        </div>
      </div>

      {/* DUAL VAULT SYSTEM */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: NATIONAL STABILITY RESERVE (70%) */}
        <div className="relative bg-[#0a0a0f] rounded-xl p-6 border-2 border-[#3b82f6]/50 overflow-hidden">
          {/* Royal Blue Glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#3b82f6]/20 to-transparent opacity-50" />
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#3b82f6]/30 rounded-full blur-3xl animate-pulse" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#3b82f6] uppercase tracking-wider">National Stability Reserve</h3>
              <span className="text-xs font-mono text-[#c0c0c0] bg-[#3b82f6]/20 px-3 py-1 rounded-full">70%</span>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-6xl font-bold font-mono text-[#3b82f6] tracking-tight">
                  {reserves.national_vault_vida_cap.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-sm font-semibold text-[#c0c0c0] mt-2">VIDA CAP</p>
              </div>
              
              <div className="pt-4 border-t border-[#3b82f6]/20">
                <p className="text-xs text-[#6b6b70] mb-2 uppercase tracking-wide">
                  🔒 {reserves.national_vault_locked ? 'LOCKED' : 'UNLOCKED'} - High-Security Reserve
                </p>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-[#6b6b70]">Naira Value</p>
                    <p className="font-mono text-[#00ff41]">₦{reserves.national_vault_value_naira.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[#6b6b70]">USD Value</p>
                    <p className="font-mono text-[#3b82f6]">${reserves.national_vault_value_usd.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: NATIONAL LIQUIDITY (30%) - TWO SUB-SECTIONS */}
        <div className="space-y-4">
          {/* SUB-SECTION 1: VIDA CAP LIQUIDITY (15%) */}
          <div className="relative bg-[#0a0a0f] rounded-xl p-6 border-2 border-[#c0c0c0]/30 overflow-hidden">
            {/* Silver Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#c0c0c0]/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#c0c0c0]/15 rounded-full blur-3xl" />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-[#c0c0c0] uppercase tracking-wider">VIDA CAP Liquidity</h4>
                <span className="text-xs font-mono text-[#c0c0c0] bg-[#c0c0c0]/10 px-2 py-1 rounded-full">15%</span>
              </div>
              
              <div className="space-y-2">
                <p className="text-4xl font-bold font-mono text-[#c0c0c0] tracking-tight">
                  {reserves.vida_cap_liquidity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs font-semibold text-[#6b6b70]">VIDA CAP</p>
                <p className="text-xs text-[#6b6b70] mt-2">⚡ Inter-Block Settlements</p>
                
                <div className="pt-3 border-t border-[#c0c0c0]/20 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-[#6b6b70]">Available</p>
                    <p className="font-mono text-[#c0c0c0]">{reserves.vida_cap_liquidity_available.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[#6b6b70]">Reserved</p>
                    <p className="font-mono text-[#c0c0c0]">{reserves.vida_cap_liquidity_reserved.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SUB-SECTION 2: NATIONAL VIDA POOL (15%) */}
          <div className="relative bg-[#0a0a0f] rounded-xl p-6 border-2 border-[#3b82f6]/50 overflow-hidden">
            {/* Royal Blue Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#3b82f6]/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#3b82f6]/20 rounded-full blur-3xl" />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-[#3b82f6] uppercase tracking-wider">National VIDA Pool</h4>
                <span className="text-xs font-mono text-[#3b82f6] bg-[#3b82f6]/10 px-2 py-1 rounded-full">15%</span>
              </div>

              <div className="space-y-2">
                <p className="text-4xl font-bold font-mono text-[#3b82f6] tracking-tight">
                  ₦{reserves.national_vida_pool_value_naira.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs font-semibold text-[#6b6b70]">National VIDA (Naira Equivalent)</p>
                <p className="text-xs text-[#6b6b70] mt-2">
                  {reserves.national_vida_pool_vida_cap.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} VIDA CAP × $1,000 × ₦1,400
                </p>

                <div className="pt-3 border-t border-[#3b82f6]/20 grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-[#6b6b70]">Minted</p>
                    <p className="font-mono text-[#3b82f6]">{reserves.national_vida_minted.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[#6b6b70]">Circulating</p>
                    <p className="font-mono text-[#00ff41]">{reserves.national_vida_circulating.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[#6b6b70]">Burned</p>
                    <p className="font-mono text-red-400">{reserves.national_vida_burned.toLocaleString()}</p>
                  </div>
                </div>

                <p className="text-xs text-[#6b6b70] mt-2">💰 Citizen Circulation Currency</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* NATIONAL VIDA CURRENCY DEFINITION */}
      <div className="bg-[#0a0a0f] rounded-lg p-6 border-2 border-[#3b82f6]/30">
        <h4 className="text-sm font-bold text-[#3b82f6] uppercase tracking-wider mb-3">National VIDA Currency Definition</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-[#6b6b70]">
          <div>
            <p className="font-semibold text-[#c0c0c0] mb-2">What is National VIDA?</p>
            <p className="text-xs">
              National VIDA is a separate currency entity from VIDA CAP, designed to circulate within the National Block for everyday transactions.
              It is backed 1:1 by the National VIDA Pool (15% of Sovereign Share).
            </p>
          </div>
          <div>
            <p className="font-semibold text-[#c0c0c0] mb-2">Supply Logic</p>
            <p className="text-xs">
              The National VIDA supply is minted from the 0.75 VIDA CAP pool (₦1,050,000 equivalent).
              Citizens can use National VIDA for local transactions, while VIDA CAP remains reserved for inter-block settlements.
            </p>
          </div>
        </div>
      </div>

      {/* DUAL VAULT VERIFICATION FOOTER */}
      <div className="bg-[#0a0a0f] rounded-lg p-4 border-2 border-[#c0c0c0]/30">
        <h4 className="text-xs font-bold text-[#c0c0c0] uppercase tracking-wider mb-2">🔐 Dual Vault Verification</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-[#6b6b70]">
          <div>
            <span className="font-mono text-[#3b82f6]">National Vault (70%)</span>: <span className="font-mono text-[#c0c0c0]">{reserves.national_vault_vida_cap} VIDA CAP</span>
          </div>
          <div>
            <span className="font-mono text-[#c0c0c0]">VIDA CAP Liquidity (15%)</span>: <span className="font-mono text-[#c0c0c0]">{reserves.vida_cap_liquidity} VIDA CAP</span>
          </div>
          <div>
            <span className="font-mono text-[#3b82f6]">National VIDA Pool (15%)</span>: <span className="font-mono text-[#c0c0c0]">{reserves.national_vida_pool_vida_cap} VIDA CAP</span>
          </div>
        </div>
        <p className="text-xs text-[#6b6b70] mt-2">
          Last Updated: {new Date(reserves.last_updated).toLocaleString()} | All values locked and verified by National Block Command
        </p>
      </div>
    </div>
  );
}



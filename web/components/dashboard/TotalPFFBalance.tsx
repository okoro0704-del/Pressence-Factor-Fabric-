'use client';

import { useState, useEffect } from 'react';
import type { PFFBalanceBreakdown } from '@/lib/pffAggregation';
import { useTranslation } from '@/lib/i18n/TranslationContext';

interface TotalPFFBalanceProps {
  breakdown: PFFBalanceBreakdown;
}

/**
 * TOTAL PFF BALANCE - THE GRAND TOTAL
 * Primary display showing ultimate truth of user's wealth
 * Formula: (Fundzman by UBA) + (External Accounts) + (20% Spendable VIDA Value)
 */
export function TotalPFFBalance({ breakdown }: TotalPFFBalanceProps) {
  const { t } = useTranslation();
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 1000);
    return () => clearTimeout(timer);
  }, [breakdown.totalPFFBalance]);

  return (
    <div className="relative bg-gradient-to-br from-[#1a1a1e] via-[#0d0d0f] to-[#1a1a1e] rounded-3xl p-10 border-4 border-[#e8c547] overflow-hidden">
      {/* Heavy Gold Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#e8c547]/20 via-transparent to-[#c9a227]/20 animate-pulse" />
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#e8c547]/30 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-[#c9a227]/30 rounded-full blur-3xl" />
      
      {/* Animated Border Glow */}
      <div className="absolute inset-0 rounded-3xl shadow-[0_0_60px_rgba(232,197,71,0.6),0_0_120px_rgba(232,197,71,0.4),0_0_180px_rgba(232,197,71,0.2)]" />

      <div className="relative z-10 space-y-6">
        {/* Title */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3">
            <span className="text-4xl">⚡</span>
            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#e8c547] via-[#ffd700] to-[#e8c547] uppercase tracking-wider">
              {t('pff.totalPFFBalance')}
            </h2>
            <span className="text-4xl">⚡</span>
          </div>
          <p className="text-sm text-[#c9a227] font-semibold uppercase tracking-widest">
            The Ultimate Truth of Your Wealth
          </p>
        </div>

        {/* Grand Total */}
        <div className="text-center space-y-3">
          <div className={`transition-all duration-500 ${isAnimating ? 'scale-110' : 'scale-100'}`}>
            <p className="text-7xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-[#ffd700] via-[#e8c547] to-[#ffd700] tracking-tight drop-shadow-[0_0_30px_rgba(232,197,71,0.8)]">
              ₦{breakdown.totalPFFBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="flex items-center justify-center gap-2">
            <div className="h-1 w-16 bg-gradient-to-r from-transparent via-[#e8c547] to-transparent" />
            <p className="text-xs text-[#a0a0a5] uppercase tracking-wider">Nigerian Naira</p>
            <div className="h-1 w-16 bg-gradient-to-r from-transparent via-[#e8c547] to-transparent" />
          </div>
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t-2 border-[#e8c547]/30">
          {/* Fundzman by UBA */}
          <div className="bg-[#16161a]/80 backdrop-blur-sm rounded-xl p-5 border border-[#EE3124]/50">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🏦</span>
              <h3 className="text-xs font-bold text-[#EE3124] uppercase tracking-wider">Fundzman by UBA</h3>
            </div>
            <p className="text-2xl font-bold font-mono text-[#f5f5f5]">
              ₦{breakdown.fundzmanByUBA.balance_naira.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[10px] text-[#6b6b70] mt-1 uppercase">Sovereign Default</p>
          </div>

          {/* Legacy Accounts */}
          <div className="bg-[#16161a]/80 backdrop-blur-sm rounded-xl p-5 border border-[#6b6b70]/50">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🔗</span>
              <h3 className="text-xs font-bold text-[#a0a0a5] uppercase tracking-wider">Legacy Banks</h3>
            </div>
            <p className="text-2xl font-bold font-mono text-[#f5f5f5]">
              ₦{breakdown.legacyAccountsTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[10px] text-[#6b6b70] mt-1 uppercase">
              {breakdown.legacyAccounts.length} Account{breakdown.legacyAccounts.length !== 1 ? 's' : ''} Linked
            </p>
          </div>

          {/* VIDA Vault */}
          <div className="bg-[#16161a]/80 backdrop-blur-sm rounded-xl p-5 border border-[#e8c547]/50">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">💎</span>
              <h3 className="text-xs font-bold text-[#e8c547] uppercase tracking-wider">VIDA Vault</h3>
            </div>
            <p className="text-2xl font-bold font-mono text-[#f5f5f5]">
              ₦{breakdown.vidaVault.naira_equivalent.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[10px] text-[#6b6b70] mt-1 uppercase">
              {breakdown.vidaVault.spendable_vida.toFixed(2)} VIDA CAP (20% Liquid)
            </p>
          </div>
        </div>

        {/* Formula Display */}
        <div className="bg-[#0d0d0f]/60 backdrop-blur-sm rounded-lg p-4 border border-[#2a2a2e]">
          <p className="text-xs text-center text-[#6b6b70] font-mono">
            <span className="text-[#EE3124]">Fundzman</span> + <span className="text-[#a0a0a5]">Legacy</span> + <span className="text-[#e8c547]">VIDA</span> = <span className="text-[#ffd700] font-bold">TOTAL PFF</span>
          </p>
        </div>
      </div>
    </div>
  );
}


'use client';

import { useState, useEffect } from 'react';
import { fetchReserveCounter } from '@/lib/governmentTreasury';

/**
 * 50% Reserve Counter — real-time stat card aggregating all 5.00 VIDA entries
 * directed to government_treasury_vault (sovereign_mint_ledger).
 */
export function TreasuryReserveCounter() {
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetchReserveCounter().then((v) => {
      setTotal(v);
      setLoading(false);
    });
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading && total === null) {
    return (
      <div className="bg-[#0d0d0f] rounded-xl p-6 border-2 border-[#D4AF37]/40 animate-pulse">
        <p className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider mb-2">50% Reserve Counter</p>
        <div className="h-12 bg-[#2a2a2e] rounded w-1/2" />
      </div>
    );
  }

  return (
    <div className="bg-[#0d0d0f] rounded-xl p-6 border-2 border-[#D4AF37]/50 shadow-[0_0_40px_rgba(212,175,55,0.15)]">
      <p className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider mb-2">50% Reserve Counter</p>
      <p className="text-4xl font-bold font-mono text-[#D4AF37]">
        {(total ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>
      <p className="text-sm text-[#6b6b70] mt-1">VIDA CAP (government_treasury_vault)</p>
      <p className="text-xs text-[#6b6b70] mt-2">All 5.00 VIDA entries from sovereign_mint_ledger</p>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { fetchReserveCounter } from '@/lib/governmentTreasury';
import { ShieldCheck } from 'lucide-react';

/**
 * Tax-Free Labor Compliance — Article VI (Zero-Tax).
 * Displays total 50% reserves as the primary alternative to traditional income tax.
 */
export function TaxFreeLaborCompliance() {
  const [totalReserve, setTotalReserve] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchReserveCounter().then((v) => {
      if (!cancelled) {
        setTotalReserve(v);
        setLoading(false);
      }
    });
    const interval = setInterval(() => {
      fetchReserveCounter().then((v) => {
        if (!cancelled) setTotalReserve(v);
      });
    }, 20000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <section className="bg-[#0d0d0f] rounded-xl p-6 border-2 border-[#D4AF37]/40">
      <div className="flex items-center gap-2 mb-3">
        <ShieldCheck className="w-5 h-5 text-[#D4AF37]" />
        <h3 className="text-sm font-bold text-[#D4AF37] uppercase tracking-wider">
          Tax-Free Labor Compliance
        </h3>
      </div>
      <p className="text-xs text-[#a0a0a5] mb-4">
        Article VI — The 50% Government Reserve is the primary alternative to traditional income tax. Labor verified on the Protocol is tax-free at point of earnings; the National Reserve is funded by sovereign handshake allocation.
      </p>
      {loading && totalReserve === null ? (
        <div className="h-14 bg-[#2a2a2e] rounded w-2/3 animate-pulse" />
      ) : (
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-[#D4AF37]">
            {(totalReserve ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-sm text-[#6b6b70]">VIDA CAP (50% Reserve)</span>
        </div>
      )}
      <p className="text-xs text-[#6b6b70] mt-2">
        Status: Compliant — Reserve accrual replaces income tax for Protocol participants.
      </p>
    </section>
  );
}

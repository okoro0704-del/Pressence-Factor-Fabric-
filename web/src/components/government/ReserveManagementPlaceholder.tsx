'use client';

import { useState, useEffect } from 'react';
import { fetchTotalDllrConvertedInBlock } from '@/lib/governmentTreasury';

/**
 * Reserve Management — placeholder section for total DLLR converted by citizens in block.
 */
export function ReserveManagementPlaceholder() {
  const [totalDllr, setTotalDllr] = useState<number | null>(null);

  useEffect(() => {
    fetchTotalDllrConvertedInBlock().then(setTotalDllr);
  }, []);

  return (
    <div className="bg-[#0d0d0f] rounded-xl p-6 border-2 border-[#2a2a2e]">
      <h3 className="text-sm font-bold text-[#D4AF37] uppercase tracking-wider mb-2">Reserve Management</h3>
      <p className="text-xs text-[#6b6b70] mb-4">
        Total DLLR converted by citizens in this block (Sovryn bridge).
      </p>
      <div className="flex items-center gap-4">
        <div className="rounded-lg border border-[#2a2a2e] bg-[#16161a] px-4 py-3 min-w-[160px]">
          <p className="text-[10px] text-[#6b6b70] uppercase tracking-wider">Total DLLR (Block)</p>
          <p className="text-2xl font-bold font-mono text-[#D4AF37] mt-1">
            {totalDllr !== null
              ? totalDllr.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
              : '—'}
          </p>
        </div>
        <p className="text-xs text-[#6b6b70]">
          Placeholder: connect to Sovryn / backend for live DLLR conversion totals.
        </p>
      </div>
    </div>
  );
}

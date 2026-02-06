'use client';

import Link from 'next/link';
import { ProtectedRoute } from '@/components/dashboard/ProtectedRoute';
import { UnifiedSovereignTreasury } from '@/components/treasury/UnifiedSovereignTreasury';

/**
 * Unified Sovereign Treasury — single dashboard: VIDA, DLLR, USDT, vNGN.
 * Swap modal (VIDA ↔ DLLR ↔ USDT ↔ vNGN), Receive (RSK QR), Withdraw to Bank placeholder.
 */
export default function TreasuryPage() {
  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-[#0d0d0f] pb-20 safe-area-pb flex flex-col items-center">
        <header className="sticky top-0 z-10 w-full border-b border-[#2a2a2e] bg-[#16161a]/95 backdrop-blur px-4 py-3 safe-area-top">
          <div className="flex items-center justify-between max-w-lg mx-auto w-full">
            <h1 className="text-lg font-bold bg-gradient-to-r from-[#e8c547] to-[#c9a227] bg-clip-text text-transparent">
              Sovereign Treasury
            </h1>
            <Link
              href="/dashboard"
              className="text-sm font-medium text-[#c9a227] hover:text-[#e8c547] transition-colors"
            >
              ← Dashboard
            </Link>
          </div>
        </header>
        <div className="w-full max-w-lg mx-auto flex-1 px-4">
          <UnifiedSovereignTreasury />
        </div>
      </main>
    </ProtectedRoute>
  );
}

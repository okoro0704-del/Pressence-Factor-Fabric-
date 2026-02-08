'use client';

import Link from 'next/link';
import { ProtectedRoute } from '@/components/dashboard/ProtectedRoute';
import { NationalTreasuryContent } from '@/components/treasury/NationalTreasuryContent';
import { ElectionsContent } from '@/components/treasury/ElectionsContent';

/** Treasury: national stats, lock block, liquidity, charts, block command; Elections / National Referendum at the bottom. */
export default function TreasuryPage() {
  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-[#0d0d0f] pb-20 md:pb-0 safe-area-pb flex flex-col">
        <header className="shrink-0 border-b border-[#2a2a2e] bg-[#16161a]/95 backdrop-blur px-4 py-3 safe-area-top">
          <div className="relative flex items-center justify-center min-h-[2.5rem] max-w-4xl mx-auto w-full">
            <Link
              href="/dashboard"
              className="absolute left-0 flex items-center justify-center w-10 h-10 -ml-2 rounded-lg text-[#c9a227] hover:text-[#e8c547] hover:bg-[#2a2a2e] transition-colors"
              aria-label="Back to Dashboard"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-lg font-bold bg-gradient-to-r from-[#e8c547] to-[#c9a227] bg-clip-text text-transparent">
              National Treasury
            </h1>
          </div>
        </header>
        <div className="flex-1 p-4 md:p-6 max-w-4xl mx-auto w-full">
          <NationalTreasuryContent />
          <ElectionsContent insideTreasury embedded />
        </div>
      </main>
    </ProtectedRoute>
  );
}

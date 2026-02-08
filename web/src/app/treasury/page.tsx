'use client';

import Link from 'next/link';
import { ProtectedRoute } from '@/components/dashboard/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { NationalTreasuryContent } from '@/components/treasury/NationalTreasuryContent';

/** Treasury = everything related to the country: national ledger, charts, elections, block command. */
export default function TreasuryPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <main className="min-h-screen bg-[#0d0d0f] pb-20 safe-area-pb flex flex-col">
          <header className="shrink-0 border-b border-[#2a2a2e] bg-[#16161a]/95 backdrop-blur px-4 py-3 safe-area-top">
            <div className="flex items-center justify-between max-w-4xl mx-auto w-full">
              <h1 className="text-lg font-bold bg-gradient-to-r from-[#e8c547] to-[#c9a227] bg-clip-text text-transparent">
                National Treasury
              </h1>
              <Link href="/wallet/" className="text-sm font-medium text-[#c9a227] hover:text-[#e8c547] transition-colors">
                ← Wallet
              </Link>
            </div>
          </header>
          <div className="flex-1 p-4 md:p-6 max-w-4xl mx-auto w-full">
            <NationalTreasuryContent />
          </div>
        </main>
      </AppShell>
    </ProtectedRoute>
  );
}

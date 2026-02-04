'use client';

import Link from 'next/link';
import { GovernmentAdminGuard } from '@/components/government/GovernmentAdminGuard';
import { SovereignSealWatermark } from '@/components/government/SovereignSealWatermark';
import { TreasuryReserveCounter } from '@/components/government/TreasuryReserveCounter';
import { TaxFreeLaborCompliance } from '@/components/government/TaxFreeLaborCompliance';
import { CitizenImpactFeed } from '@/components/government/CitizenImpactFeed';
import { ReserveManagementPlaceholder } from '@/components/government/ReserveManagementPlaceholder';
import { TreasuryGrowthChart } from '@/components/government/TreasuryGrowthChart';

/**
 * National Government Treasury Dashboard — GOVERNMENT_ADMIN only.
 * Secure route: web/app/government/treasury
 */
export default function GovernmentTreasuryPage() {
  return (
    <GovernmentAdminGuard>
      <main className="min-h-screen bg-[#050505] text-[#f5f5f5] relative">
        <SovereignSealWatermark />

        <header className="relative z-10 border-b border-[#2a2a2e] bg-[#0d0d0f]/95 backdrop-blur px-4 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-[#D4AF37] to-[#e8c547] bg-clip-text text-transparent tracking-tight">
                National Government Treasury
              </h1>
              <p className="text-xs text-[#6b6b70] mt-0.5">
                50% Reserve · Citizen Impact · Reserve Management
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/government/elections"
                className="text-sm font-medium text-[#D4AF37] hover:text-[#e8c547] transition-colors"
              >
                Elections →
              </Link>
              <Link
                href="/dashboard"
                className="text-sm font-medium text-[#D4AF37] hover:text-[#e8c547] transition-colors"
              >
                ← Dashboard
              </Link>
            </div>
          </div>
        </header>

        <div className="relative z-10 max-w-6xl mx-auto p-4 md:p-6 space-y-6">
          {/* 50% Reserve Counter */}
          <section>
            <TreasuryReserveCounter />
          </section>

          {/* Tax-Free Labor Compliance — Article VI (Zero-Tax) */}
          <section>
            <TaxFreeLaborCompliance />
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Citizen Impact Feed */}
            <section>
              <CitizenImpactFeed />
            </section>

            {/* Reserve Management placeholder */}
            <section>
              <ReserveManagementPlaceholder />
            </section>
          </div>

          {/* Treasury Growth (30 days) */}
          <section>
            <TreasuryGrowthChart />
          </section>
        </div>
      </main>
    </GovernmentAdminGuard>
  );
}

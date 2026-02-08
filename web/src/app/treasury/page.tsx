'use client';

import Link from 'next/link';
import { ProtectedRoute } from '@/components/dashboard/ProtectedRoute';
import { Vote } from 'lucide-react';

const GOLD = '#D4AF37';

/** Treasury page: only Elections / Voting. */
export default function TreasuryPage() {
  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-[#0d0d0f] pb-20 md:pb-0 safe-area-pb flex flex-col">
        <div className="flex-1 p-4 md:p-6 max-w-4xl mx-auto w-full flex flex-col items-center justify-center">
          <Link
            href="/government/elections"
            className="rounded-2xl border-2 p-8 flex flex-col items-center justify-center gap-4 transition-colors hover:border-[#D4AF37]/60 w-full max-w-sm"
            style={{ borderColor: 'rgba(212,175,55,0.4)', background: 'rgba(212,175,55,0.08)' }}
          >
            <Vote className="w-14 h-14" style={{ color: GOLD }} aria-hidden />
            <span className="text-xl font-bold uppercase tracking-wider" style={{ color: GOLD }}>
              Elections / Voting
            </span>
          </Link>
        </div>
      </main>
    </ProtectedRoute>
  );
}

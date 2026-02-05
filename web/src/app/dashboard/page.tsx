'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { DashboardContent } from '@/components/sovryn/DashboardContent';
import { ProtectedRoute } from '@/components/dashboard/ProtectedRoute';
import { InstallSmartBanner } from '@/components/InstallSmartBanner';
import { getMintStatus, MINT_STATUS_PENDING_HARDWARE } from '@/lib/mintStatus';
import { getIdentityAnchorPhone } from '@/lib/sentinelActivation';

/**
 * DASHBOARD PAGE - PROTECTED
 * Requires 4-layer authentication to access
 * Users without verified presence are redirected to gate
 * Shows "Unauthorized Access" when redirected from /government or /sentinel without correct role
 * When mint_status is PENDING_HARDWARE (mobile initial reg): Silver Dashboard with hub instructions.
 * Hydration: render only after mount to prevent dead screen (HTML visible but JS not attached).
 */
export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [pendingHardware, setPendingHardware] = useState(false);
  const searchParams = useSearchParams();
  const unauthorized = searchParams.get('unauthorized') === '1';
  const showMintedBanner = searchParams.get('minted') === '1';

  useEffect(() => {
    setMounted(true);
    console.log('Interaction Layer Active', '(dashboard)');
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const phone = getIdentityAnchorPhone();
    if (!phone) return;
    getMintStatus(phone).then((res) => {
      if (res.ok && res.mint_status === MINT_STATUS_PENDING_HARDWARE) {
        setPendingHardware(true);
      }
    });
  }, [mounted]);

  if (!mounted) {
    return null;
  }

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-[#0d0d0f] pb-36 md:pb-0">
        {pendingHardware && (
          <div
            className="bg-[#C0C0C0]/25 border-b border-[#C0C0C0]/60 px-4 py-4 text-center text-[#a0a0a8] text-sm font-semibold uppercase tracking-wider"
            role="status"
          >
            Vitalization Incomplete. Visit a Sentinel Hub with an Industrial Scanner to mint your 5 VIDA CAP.
          </div>
        )}
        {showMintedBanner && (
          <div
            className="bg-[#D4AF37]/20 border-b border-[#D4AF37]/50 px-4 py-3 text-center text-[#D4AF37] text-sm font-bold uppercase tracking-wider"
            role="status"
          >
            5 VIDA CAP SUCCESSFULLY MINTED
          </div>
        )}
        {unauthorized && (
          <div
            className="bg-red-500/20 border-b border-red-500/50 px-4 py-3 text-center text-red-400 text-sm font-medium"
            role="alert"
          >
            Unauthorized Access. You do not have the required role for that page.
          </div>
        )}
        <DashboardContent />
        <InstallSmartBanner />
      </main>
    </ProtectedRoute>
  );
}

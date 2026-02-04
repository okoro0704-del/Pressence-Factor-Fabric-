'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { DashboardContent } from '@/components/sovryn/DashboardContent';
import { ProtectedRoute } from '@/components/dashboard/ProtectedRoute';
import { InstallSmartBanner } from '@/components/InstallSmartBanner';

/**
 * DASHBOARD PAGE - PROTECTED
 * Requires 4-layer authentication to access
 * Users without verified presence are redirected to gate
 * Shows "Unauthorized Access" when redirected from /government or /sentinel without correct role
 * Hydration: render only after mount to prevent dead screen (HTML visible but JS not attached).
 */
export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const searchParams = useSearchParams();
  const unauthorized = searchParams.get('unauthorized') === '1';

  useEffect(() => {
    setMounted(true);
    console.log('Interaction Layer Active', '(dashboard)');
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-[#0d0d0f] pb-36 md:pb-0">
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

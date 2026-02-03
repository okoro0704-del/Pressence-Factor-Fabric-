'use client';

import { DashboardContent } from '@/components/sovryn/DashboardContent';
import { ProtectedRoute } from '@/components/dashboard/ProtectedRoute';

/**
 * DASHBOARD PAGE - PROTECTED
 * Requires 4-layer authentication to access
 * Users without verified presence are redirected to gate
 */
export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-[#0d0d0f]">
        <DashboardContent />
      </main>
    </ProtectedRoute>
  );
}

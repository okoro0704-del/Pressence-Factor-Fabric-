'use client';

import { ProtectedRoute } from '@/components/dashboard/ProtectedRoute';
import { ElectionsContent } from '@/components/treasury/ElectionsContent';

/** Treasury page: Elections / Voting inside Treasury. */
export default function TreasuryPage() {
  return (
    <ProtectedRoute>
      <ElectionsContent insideTreasury />
    </ProtectedRoute>
  );
}

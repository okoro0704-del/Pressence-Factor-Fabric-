'use client';

import { GovernmentAdminGuard } from '@/components/government/GovernmentAdminGuard';
import { ElectionsContent } from '@/components/treasury/ElectionsContent';

/**
 * Government Elections — admin route. Same Elections/Voting UI as Treasury; guarded for GOVERNMENT_ADMIN.
 * Treasury tab shows Elections inside it for all users; this route is for direct admin access.
 */
export default function GovernmentElectionsPage() {
  return (
    <GovernmentAdminGuard>
      <ElectionsContent insideTreasury={false} />
    </GovernmentAdminGuard>
  );
}

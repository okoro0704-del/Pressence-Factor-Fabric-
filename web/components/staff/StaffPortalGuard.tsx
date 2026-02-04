'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getIdentityAnchorPhone } from '@/lib/sentinelActivation';
import { getCurrentUserRole, setRoleCookie, canAccessStaffPortal } from '@/lib/roleAuth';

interface StaffPortalGuardProps {
  children: React.ReactNode;
}

/**
 * STAFF PORTAL — PROTECTED ROUTE
 * Only users with role SENTINEL_STAFF, GOVERNMENT_ADMIN, or MASTER_ARCHITECT can access.
 */
export function StaffPortalGuard({ children }: StaffPortalGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    const identityAnchor = getIdentityAnchorPhone();
    const check = async () => {
      if (!identityAnchor) {
        setAllowed(false);
        router.replace('/dashboard?unauthorized=1');
        return;
      }
      const role = await getCurrentUserRole(identityAnchor);
      if (canAccessStaffPortal(role)) {
        setRoleCookie(role);
        setAllowed(true);
      } else {
        setAllowed(false);
        router.replace('/dashboard?unauthorized=1');
      }
    };
    check();
  }, [pathname, router]);

  if (allowed === null) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-lg text-[#D4AF37] font-semibold">Verifying Staff Access...</p>
        </div>
      </div>
    );
  }

  if (!allowed) {
    return null;
  }

  return <>{children}</>;
}

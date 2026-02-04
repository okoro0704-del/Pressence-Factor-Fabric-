'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getIdentityAnchorPhone } from '@/lib/sentinelActivation';
import { getCurrentUserRole, setRoleCookie, canAccessGovernment, logAdminAction } from '@/lib/roleAuth';
import { isGovernmentAdmin } from '@/lib/governmentTreasury';

interface GovernmentAdminGuardProps {
  children: React.ReactNode;
}

/**
 * GOVERNMENT TREASURY — PROTECTED ROUTE
 * Only users with role GOVERNMENT_ADMIN or MASTER_ARCHITECT can access.
 * Role from Supabase user_profiles; fallback to localStorage/env allowlist.
 */
export function GovernmentAdminGuard({ children }: GovernmentAdminGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    const identityAnchor = getIdentityAnchorPhone();
    const check = async () => {
      let ok = isGovernmentAdmin();
      if (identityAnchor) {
        const role = await getCurrentUserRole(identityAnchor);
        if (canAccessGovernment(role)) {
          ok = true;
          setRoleCookie(role);
          await logAdminAction({
            actor_identity_anchor: identityAnchor,
            action_type: 'TREASURY_VIEW',
          });
        }
      }
      setAllowed(ok);
      if (!ok) router.replace('/dashboard?unauthorized=1');
    };
    check();
  }, [pathname, router]);

  if (allowed === null) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-lg text-[#D4AF37] font-semibold">Verifying Government Access...</p>
        </div>
      </div>
    );
  }

  if (!allowed) {
    return null;
  }

  return <>{children}</>;
}

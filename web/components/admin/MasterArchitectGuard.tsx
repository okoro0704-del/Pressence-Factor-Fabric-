'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getIdentityAnchorPhone } from '@/lib/sentinelActivation';
import { getCurrentUserRole, setRoleCookie, canAccessMaster, logAdminAction } from '@/lib/roleAuth';

interface MasterArchitectGuardProps {
  children: React.ReactNode;
}

/**
 * Protects /master routes. Only MASTER_ARCHITECT can access.
 * Redirects others to /dashboard with unauthorized warning.
 */
export function MasterArchitectGuard({ children }: MasterArchitectGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    const identityAnchor = getIdentityAnchorPhone();
    if (!identityAnchor) {
      setAllowed(false);
      router.replace('/dashboard?unauthorized=1');
      return;
    }
    getCurrentUserRole(identityAnchor).then((role) => {
      const ok = canAccessMaster(role);
      setAllowed(ok);
      if (ok) {
        setRoleCookie(role);
        logAdminAction({ actor_identity_anchor: identityAnchor, action_type: 'MASTER_VIEW' });
      }
      if (!ok) router.replace('/dashboard?unauthorized=1');
    });
  }, [pathname, router]);

  if (allowed === null) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-lg text-[#D4AF37] font-semibold">Verifying Master Access...</p>
        </div>
      </div>
    );
  }

  if (!allowed) return null;
  return <>{children}</>;
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getIdentityAnchorPhone } from '@/lib/sentinelActivation';
import { getCurrentUserRole, setRoleCookie, canAccessMaster, logAdminAction } from '@/lib/roleAuth';

/** Preserve intended destination so after login we can redirect to architect (or other) page. */
function getDashboardRedirectWithNext(pathname: string): string {
  const next = pathname?.startsWith('/') ? pathname : '/master/command-center';
  return `/dashboard?next=${encodeURIComponent(next)}`;
}

const DEV_BACKDOOR_KEY = 'pff_dev_backdoor_secret';

/**
 * Dev Backdoor: if localStorage[DEV_BACKDOOR_KEY] equals NEXT_PUBLIC_DEV_BACKDOOR_SECRET, allow entry.
 * Set NEXT_PUBLIC_DEV_BACKDOOR_SECRET in Netlify; then in browser console: localStorage.setItem('pff_dev_backdoor_secret', 'YOUR_SECRET')
 */
function isDevBackdoorAllowed(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const secret = process.env.NEXT_PUBLIC_DEV_BACKDOOR_SECRET?.trim();
    const stored = localStorage.getItem(DEV_BACKDOOR_KEY)?.trim();
    return !!secret && !!stored && secret === stored;
  } catch {
    return false;
  }
}

interface MasterArchitectGuardProps {
  children: React.ReactNode;
}

/**
 * Protects /master routes. Only MASTER_ARCHITECT can access.
 * Redirects others to /dashboard with unauthorized warning.
 * Dev Backdoor: allow if pff_dev_backdoor_secret in localStorage matches NEXT_PUBLIC_DEV_BACKDOOR_SECRET.
 */
export function MasterArchitectGuard({ children }: MasterArchitectGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  const ADMIN_PHONE = process.env.NEXT_PUBLIC_ADMIN_PHONE?.trim() ?? '';

  useEffect(() => {
    if (isDevBackdoorAllowed()) {
      setAllowed(true);
      setRoleCookie('MASTER_ARCHITECT');
      return;
    }
    const identityAnchor = getIdentityAnchorPhone();
    if (!identityAnchor) {
      setAllowed(false);
      router.replace(getDashboardRedirectWithNext(pathname || '/master/command-center') + '&unauthorized=1');
      return;
    }
    if (ADMIN_PHONE && identityAnchor.replace(/\s/g, '') === ADMIN_PHONE.replace(/\s/g, '')) {
      setAllowed(true);
      setRoleCookie('MASTER_ARCHITECT');
      logAdminAction({ actor_identity_anchor: identityAnchor, action_type: 'MASTER_VIEW' });
      return;
    }
    getCurrentUserRole(identityAnchor).then((role) => {
      const ok = canAccessMaster(role);
      setAllowed(ok);
      if (ok) {
        setRoleCookie(role);
        logAdminAction({ actor_identity_anchor: identityAnchor, action_type: 'MASTER_VIEW' });
      }
      if (!ok) router.replace(getDashboardRedirectWithNext(pathname || '/master/command-center') + '&unauthorized=1');
    });
  }, [pathname, router, ADMIN_PHONE]);

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

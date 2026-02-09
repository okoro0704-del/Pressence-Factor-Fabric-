'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getIdentityAnchorPhone } from '@/lib/sentinelActivation';
import { checkFourPillarsComplete } from '@/lib/fourPillars';
import { ROUTES } from '@/lib/constants';

const PROTECTED_PATHS = [
  ROUTES.DASHBOARD,
  '/wallet',
  '/treasury',
  '/settings',
  '/companion',
  '/pulse',
];

function isProtectedPath(path: string): boolean {
  if (!path) return false;
  return PROTECTED_PATHS.some((p) => path === p || path.startsWith(p + '/'));
}

/**
 * Blocks site access until all four pillars (Face ID, Palm Scan, Device ID, GPS) are saved in Supabase for the anchor phone.
 * Redirects to vitalization if user has session but four pillars are not complete.
 */
export function FourPillarsGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isProtectedPath(pathname ?? '')) return;

    const phone = getIdentityAnchorPhone();
    if (!phone?.trim()) return;

    let cancelled = false;
    checkFourPillarsComplete(phone).then((complete) => {
      if (cancelled) return;
      if (!complete) {
        router.replace(`${ROUTES.VITALIZATION}?phone=${encodeURIComponent(phone)}`);
      }
    });
    return () => { cancelled = true; };
  }, [pathname, router]);

  return <>{children}</>;
}

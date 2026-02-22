'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getIdentityAnchorPhone } from '@/lib/sentinelActivation';
import { checkFourPillarsComplete } from '@/lib/fourPillars';
import { shouldNeverRedirectBack } from '@/lib/vitalizationState';
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
 * Blocks site access until all four pillars are saved, unless user is already vitalized (session).
 * When shouldNeverRedirectBack() is true, do NOT redirect — keeps user on dashboard and stops flicker.
 */
export function FourPillarsGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const didRedirectRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isProtectedPath(pathname ?? '')) return;

    // Already vitalized in session: stay on current page (dashboard/tabs). No redirect = no flicker.
    if (shouldNeverRedirectBack()) return;

    const phone = getIdentityAnchorPhone();
    if (!phone?.trim()) return;

    let cancelled = false;
    checkFourPillarsComplete(phone).then((complete) => {
      if (cancelled) return;
      if (didRedirectRef.current) return;
      if (!complete) {
        didRedirectRef.current = true;
        router.replace(`${ROUTES.VITALIZATION}?phone=${encodeURIComponent(phone)}`);
      }
    });
    return () => { cancelled = true; };
  }, [pathname, router]);

  return <>{children}</>;
}

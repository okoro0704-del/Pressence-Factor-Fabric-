'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { shouldNeverRedirectBack } from '@/lib/vitalizationState';
import { ROUTES } from '@/lib/constants';

interface SovereignAuthGuardProps {
  children: ReactNode;
}

/**
 * Global guard: when user is VITALIZED (vitalization_complete / is_vitalized), force-push to Dashboard.
 * Prevents any redirect back to registration or scan pages.
 */
export function SovereignAuthGuard({ children }: SovereignAuthGuardProps) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!shouldNeverRedirectBack()) return;
    const path = pathname ?? '';
    // Do NOT redirect from / — root page runs face+palm verification then sends to dashboard.
    const isVitalizationOrRegistration =
      path === ROUTES.VITALIZATION ||
      path.startsWith(ROUTES.VITALIZATION + '/') ||
      path === '/registration' ||
      path.startsWith('/registration/');
    if (isVitalizationOrRegistration) {
      router.replace(ROUTES.DASHBOARD);
    }
  }, [pathname, router]);

  return <>{children}</>;
}

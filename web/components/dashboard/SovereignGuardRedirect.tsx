'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isAlreadyVerified } from '@/lib/sovereignGuard';

/** When on /registration or /vitalization and user is already 3/4 or 4/4, redirect to dashboard. No loops. */
export function SovereignGuardRedirect({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const path = pathname ?? window.location.pathname;
    if (path !== '/registration' && path !== '/vitalization') return;
    if (isAlreadyVerified()) {
      router.replace('/dashboard');
    }
  }, [pathname, router]);

  return <>{children}</>;
}

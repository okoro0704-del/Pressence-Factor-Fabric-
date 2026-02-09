'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { isBeforeAccessCutoff, hasAccessGranted, hasMasterAccess } from '@/lib/accessCodeGate';
import { isArchitect } from '@/lib/publicRevealAccess';

const PUBLIC_PATHS = ['/', '/manifesto', '/countdown', '/education', '/get-app', '/partners', '/login', '/recover'];
function isPublicPath(path: string): boolean {
  if (!path) return true;
  if (PUBLIC_PATHS.some((p) => path === p || path.startsWith(p + '/'))) return true;
  return false;
}

/**
 * Until April 7: only owner (architect) or users with a valid access code can use the app.
 * Redirects to / if unauthenticated and trying to access a protected route.
 */
export function AccessGateClient() {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;
    if (isPublicPath(pathname ?? '')) return;
    if (!isBeforeAccessCutoff()) return;
    if (isArchitect()) return;
    if (hasAccessGranted()) return;
    if (hasMasterAccess()) return;
    router.replace('/?need_code=1');
  }, [mounted, pathname, router]);

  return null;
}

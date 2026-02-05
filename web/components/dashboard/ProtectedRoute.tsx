'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useGlobalPresenceGateway } from '@/contexts/GlobalPresenceGateway';
import { getIdentityAnchorPhone } from '@/lib/sentinelActivation';
import { getMintStatusForPresence, MINT_STATUS_PENDING_HARDWARE, MINT_STATUS_MINTED } from '@/lib/mintStatus';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/** Hard Navigation Lock: do not redirect to gate while vault/session is hydrating (avoid bounce). */
const HYDRATION_GRACE_MS = 600;

/**
 * PROTECTED ROUTE WRAPPER
 * Redirects to 4-Layer Gate if presence is not verified.
 * If user has mint_status PENDING_HARDWARE or MINTED, allow through (do not show gate again).
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isPresenceVerified, loading, setPresenceVerified } = useGlobalPresenceGateway();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isChecking, setIsChecking] = useState(true);
  const [graceElapsed, setGraceElapsed] = useState(false);

  useEffect(() => {
    if (pathname === '/') {
      setIsChecking(false);
      return;
    }
    const t = setTimeout(() => setGraceElapsed(true), HYDRATION_GRACE_MS);
    return () => clearTimeout(t);
  }, [pathname]);

  useEffect(() => {
    if (pathname === '/' || loading) return;

    let cancelled = false;

    const run = async () => {
      if (isPresenceVerified) {
        if (!cancelled) setIsChecking(false);
        return;
      }
      const phone = getIdentityAnchorPhone();
      if (phone) {
        const res = await getMintStatusForPresence(phone);
        if (!cancelled && res.ok && (res.mint_status === MINT_STATUS_PENDING_HARDWARE || res.mint_status === MINT_STATUS_MINTED || res.is_minted)) {
          setPresenceVerified(true);
          setIsChecking(false);
          return;
        }
      }
      if (!graceElapsed) return;
      if (!cancelled && !isPresenceVerified) {
        setIsChecking(false);
        console.warn('[ProtectedRoute] Presence not verified, redirecting to gate');
        const next = searchParams.get('next') || pathname;
        const gateUrl = next && next !== '/' ? `/?next=${encodeURIComponent(next)}` : '/';
        router.replace(gateUrl);
      } else if (!cancelled) {
        setIsChecking(false);
      }
    };

    run();
    return () => { cancelled = true; };
  }, [isPresenceVerified, loading, pathname, router, searchParams, setPresenceVerified, graceElapsed]);

  useEffect(() => {
    if (isPresenceVerified) setIsChecking(false);
  }, [isPresenceVerified]);

  if (loading || isChecking) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-lg text-[#D4AF37] font-semibold">Verifying Presence...</p>
        </div>
      </div>
    );
  }

  if (!isPresenceVerified) return null;

  return <>{children}</>;
}


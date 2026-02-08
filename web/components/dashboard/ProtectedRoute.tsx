'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useGlobalPresenceGateway } from '@/contexts/GlobalPresenceGateway';
import { getIdentityAnchorPhone } from '@/lib/sentinelActivation';
import { getMintStatusForPresence, getMintStatus, MINT_STATUS_PENDING_HARDWARE, MINT_STATUS_MINTED } from '@/lib/mintStatus';
import { getVitalizationStatus, DEVICE_NOT_ANCHORED_MESSAGE, shouldNeverRedirectBack } from '@/lib/vitalizationState';
import { ROUTES } from '@/lib/constants';

const SOV_STATUS_MESSAGE_KEY = 'pff_sov_status_message';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/** Hard Navigation Lock: do not redirect to gate while vault/session is hydrating (avoid bounce). */
const HYDRATION_GRACE_MS = 600;

/**
 * PROTECTED ROUTE WRAPPER — Single source of truth for vitalization state.
 * - no_citizen_record → force /vitalization (registration).
 * - needs_restore → /vitalization/restore-identity.
 * - vitalized / no_user → then presence check; if not verified, redirect to gate with status message (not error).
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isPresenceVerified, loading, setPresenceVerified } = useGlobalPresenceGateway();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isChecking, setIsChecking] = useState(true);
  const [graceElapsed, setGraceElapsed] = useState(false);
  const vitalizationCheckedRef = useRef(false);

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
      // Hard rule: once vitalization is complete, never redirect back except on explicit logout.
      if (shouldNeverRedirectBack()) {
        if (!cancelled) {
          setPresenceVerified(true);
          vitalizationCheckedRef.current = true;
          setIsChecking(false);
        }
        return;
      }

      const status = await getVitalizationStatus();
      if (cancelled) return;

      if (status === 'no_citizen_record') {
        try { sessionStorage.setItem(SOV_STATUS_MESSAGE_KEY, DEVICE_NOT_ANCHORED_MESSAGE); } catch { /* ignore */ }
        router.replace(ROUTES.VITALIZATION);
        vitalizationCheckedRef.current = true;
        return;
      }
      if (status === 'needs_restore') {
        try { sessionStorage.removeItem(SOV_STATUS_MESSAGE_KEY); } catch { /* ignore */ }
        router.replace(ROUTES.VITALIZATION_RESTORE_IDENTITY);
        vitalizationCheckedRef.current = true;
        return;
      }

      vitalizationCheckedRef.current = true;

      if (isPresenceVerified) {
        if (!cancelled) setIsChecking(false);
        return;
      }
      const phone = getIdentityAnchorPhone();
      if (phone) {
        let allowed = pathname.startsWith('/dashboard');
        if (!allowed) {
          const res = await getMintStatusForPresence(phone);
          if (res.ok && (res.mint_status === MINT_STATUS_PENDING_HARDWARE || res.mint_status === MINT_STATUS_MINTED || res.is_minted)) {
            allowed = true;
          } else {
            const direct = await getMintStatus(phone);
            if (direct.ok && (direct.mint_status === MINT_STATUS_PENDING_HARDWARE || direct.mint_status === MINT_STATUS_MINTED)) {
              allowed = true;
            }
          }
        }
        if (!cancelled && allowed) {
          setPresenceVerified(true);
          setIsChecking(false);
          return;
        }
      }
      if (!graceElapsed) return;
      if (!cancelled && !isPresenceVerified) {
        setIsChecking(false);
        try { sessionStorage.setItem(SOV_STATUS_MESSAGE_KEY, DEVICE_NOT_ANCHORED_MESSAGE); } catch { /* ignore */ }
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

/** Read status message set when redirecting to gate (Device not yet Anchored). Clear after read so it shows once. */
export function readAndClearSovStatusMessage(): string | null {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const msg = sessionStorage.getItem(SOV_STATUS_MESSAGE_KEY);
    if (msg) sessionStorage.removeItem(SOV_STATUS_MESSAGE_KEY);
    return msg;
  } catch {
    return null;
  }
}


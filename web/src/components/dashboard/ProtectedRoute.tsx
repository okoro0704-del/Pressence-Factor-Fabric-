'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useGlobalPresenceGateway } from '@/contexts/GlobalPresenceGateway';
import { getVitalizationStatus, DEVICE_NOT_ANCHORED_MESSAGE, shouldNeverRedirectBack } from '@/lib/vitalizationState';
import { ROUTES } from '@/lib/constants';

const SOV_STATUS_MESSAGE_KEY = 'pff_sov_status_message';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/** Hard Navigation Lock: do not redirect to gate while vault/session is hydrating (avoid bounce). */
const HYDRATION_GRACE_MS = 400;

/**
 * PROTECTED ROUTE — Only redirect for registration state. No liveness/presence/camera.
 * - no_citizen_record → /vitalization (sign-up).
 * - needs_restore → /vitalization/restore-identity.
 * - Otherwise: show children. Vitalization required only for sign-in and device-approval.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { loading, setPresenceVerified } = useGlobalPresenceGateway();
  const router = useRouter();
  const pathname = usePathname();
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
    if (pathname === '/' || !graceElapsed) return;

    let cancelled = false;

    const run = async () => {
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
      setPresenceVerified(true);
      if (!cancelled) setIsChecking(false);
    };

    run();
    return () => { cancelled = true; };
  }, [loading, pathname, router, setPresenceVerified, graceElapsed]);

  if (loading && !vitalizationCheckedRef.current) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-lg text-[#D4AF37] font-semibold">Loading…</p>
        </div>
      </div>
    );
  }

  if (isChecking) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <p className="text-sm text-[#6b6b70]">Loading…</p>
      </div>
    );
  }

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


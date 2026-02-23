'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { checkGhostSession } from '@/lib/ghostSessionCheck';
import { isSessionLocked, clearSessionLocked } from '@/lib/sovereignSSO';

interface GhostSessionGuardProps {
  children: ReactNode;
}

/**
 * Hard Reset Safety Valve — runs at app start.
 * If auth has a session but no matching user_profiles row (ghost), sign out, clear storage, redirect to /vitalization.
 * If session was locked (kill-switch), clear flag and redirect to Shield (/).
 */
export function GhostSessionGuard({ children }: GhostSessionGuardProps) {
  const router = useRouter();
  const [status, setStatus] = useState<'checking' | 'ok' | 'cleared'>('checking');

  useEffect(() => {
    let cancelled = false;
    if (typeof window !== 'undefined' && isSessionLocked()) {
      clearSessionLocked();
      router.replace('/');
      setStatus('ok');
      return;
    }
    checkGhostSession().then((result) => {
      if (cancelled) return;
      if (result === 'cleared') {
        setStatus('cleared');
        router.replace('/vitalization');
      } else {
        if (typeof window !== 'undefined' && isSessionLocked()) {
          clearSessionLocked();
          router.replace('/');
        }
        setStatus('ok');
      }
    });
    return () => { cancelled = true; };
  }, [router]);

  if (status === 'cleared') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d0d0f] text-[#a0a0a5]">
        <p className="text-sm">Redirecting to vitalization…</p>
      </div>
    );
  }

  if (status === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d0d0f] text-[#6b6b70]">
        <p className="text-sm">Checking session…</p>
      </div>
    );
  }

  return <>{children}</>;
}

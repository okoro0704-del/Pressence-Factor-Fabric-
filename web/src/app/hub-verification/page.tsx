'use client';

import { useState, useEffect } from 'react';
import { FourLayerGate } from '@/components/dashboard/FourLayerGate';
import { AppErrorBoundary } from '@/components/AppErrorBoundary';

/**
 * HUB VERIFICATION (PC) — Sentinel Hub with Industrial Scanner
 * Simplified Web login for users who completed mobile initial registration (PENDING_HARDWARE).
 * Triggers External Fingerprint Listener; on success sets mint_status MINTED and mints 5 VIDA CAP, then redirects to /dashboard?minted=1.
 */
export default function HubVerificationPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-[#050505]"
        style={{ color: '#6b6b70' }}
        aria-busy="true"
        aria-live="polite"
      >
        <p className="text-sm">Loading Hub Verification...</p>
      </div>
    );
  }

  return (
    <AppErrorBoundary>
      <FourLayerGate hubVerification />
    </AppErrorBoundary>
  );
}

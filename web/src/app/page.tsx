'use client';

import { useState, useEffect } from 'react';
import { SovereignManifestoLanding } from '@/components/SovereignManifestoLanding';
import { FourLayerGate } from '@/components/dashboard/FourLayerGate';
import { AppErrorBoundary } from '@/components/AppErrorBoundary';
import {
  isPreviewUrl,
  isProductionDomain,
  resolveAuthorizedIdentity,
  shouldShowFullProtocolSync,
} from '@/lib/publicRevealAccess';
import { getCompositeDeviceFingerprint } from '@/lib/biometricAuth';

/**
 * ROOT PAGE — Public Gatekeeper (Architect's Hidden Access)
 * - Production domain + not authorized → Manifesto & Countdown only.
 * - Preview URL (deploy-preview-*--*) → Full Protocol for testing.
 * - Authorized device_id (Architect / Sentinel list) → Full Protocol (Vitalization, Treasury, Gate).
 * All logic is client-side so Netlify static build does not crash.
 */
export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [showFullProtocol, setShowFullProtocol] = useState(false);
  const [resolving, setResolving] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') {
      setResolving(false);
      return;
    }
    setMounted(true);

    const run = async () => {
      if (isPreviewUrl()) {
        setShowFullProtocol(true);
        setResolving(false);
        return;
      }
      if (!isProductionDomain()) {
        setShowFullProtocol(true);
        setResolving(false);
        return;
      }
      try {
        await resolveAuthorizedIdentity(getCompositeDeviceFingerprint);
      } catch {
        // ignore
      }
      setShowFullProtocol(shouldShowFullProtocolSync());
      setResolving(false);
    };

    run();
  }, []);

  if (!mounted || resolving) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-[#050505]"
        style={{ color: '#6b6b70' }}
        aria-busy="true"
      >
        <p className="text-sm">Loading…</p>
      </div>
    );
  }

  if (showFullProtocol) {
    return (
      <AppErrorBoundary>
        <div className="min-h-screen flex flex-col bg-[#050505]">
          <div className="flex-1">
            <FourLayerGate />
          </div>
        </div>
      </AppErrorBoundary>
    );
  }

  return <SovereignManifestoLanding />;
}

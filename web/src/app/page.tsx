'use client';

import { useState, useEffect } from 'react';
import { SovereignManifestoLanding } from '@/components/SovereignManifestoLanding';
import { SovereignAwakeningProvider } from '@/contexts/SovereignAwakeningContext';
import { FourLayerGate } from '@/components/dashboard/FourLayerGate';
import { AnchoredLanding } from '@/components/auth/AnchoredLanding';
import { AppErrorBoundary } from '@/components/AppErrorBoundary';
import {
  isPreviewUrl,
  isProductionDomain,
  resolveAuthorizedIdentity,
  shouldShowFullProtocolSync,
} from '@/lib/publicRevealAccess';
import { getCompositeDeviceFingerprint } from '@/lib/biometricAuth';
import { getVitalizationAnchor } from '@/lib/vitalizationAnchor';

/**
 * ROOT PAGE — Public Gatekeeper (Architect's Hidden Access)
 * - Pre-flight: if device is anchored (is_vitalized + citizen_hash), show single elegant Face Scan circle (AnchoredLanding).
 * - Otherwise: Full Protocol (FourLayerGate) or Manifesto.
 */
export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [showFullProtocol, setShowFullProtocol] = useState(false);
  const [resolving, setResolving] = useState(true);
  const [anchored, setAnchored] = useState<boolean | null>(null);

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

  useEffect(() => {
    if (!mounted || !showFullProtocol || resolving) return;
    let cancelled = false;
    getVitalizationAnchor().then((a) => {
      if (cancelled) return;
      setAnchored(a.isVitalized && !!a.citizenHash);
    });
    return () => { cancelled = true; };
  }, [mounted, showFullProtocol, resolving]);

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
    if (anchored === null) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#050505]" style={{ color: '#6b6b70' }} aria-busy="true">
          <p className="text-sm">Loading…</p>
        </div>
      );
    }
    if (anchored) {
      return (
        <AppErrorBoundary>
          <AnchoredLanding />
        </AppErrorBoundary>
      );
    }
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

  return (
    <SovereignAwakeningProvider>
      <SovereignManifestoLanding />
    </SovereignAwakeningProvider>
  );
}

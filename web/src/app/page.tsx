'use client';

import { useState, useEffect } from 'react';
import { SovereignManifestoLanding } from '@/components/SovereignManifestoLanding';
import { SovereignAwakeningProvider } from '@/contexts/SovereignAwakeningContext';
import { AppErrorBoundary } from '@/components/AppErrorBoundary';
import {
  isPreviewUrl,
  isProductionDomain,
  resolveAuthorizedIdentity,
  shouldShowFullProtocolSync,
} from '@/lib/publicRevealAccess';
import { getCompositeDeviceFingerprint } from '@/lib/biometricAuth';

/**
 * ROOT PAGE — Single landing: Manifesto. Phone number is entered once in the vitalization flow (Identity Anchor step).
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
      <div className="min-h-screen flex items-center justify-center bg-[#050505]" style={{ color: '#6b6b70' }} aria-busy="true">
        <p className="text-sm">Loading…</p>
      </div>
    );
  }

  if (showFullProtocol) {
    return (
      <AppErrorBoundary>
        <SovereignAwakeningProvider>
          <SovereignManifestoLanding />
        </SovereignAwakeningProvider>
      </AppErrorBoundary>
    );
  }

  return (
    <SovereignAwakeningProvider>
      <SovereignManifestoLanding />
    </SovereignAwakeningProvider>
  );
}

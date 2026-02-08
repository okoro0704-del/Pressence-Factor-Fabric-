'use client';

import { useState, useEffect } from 'react';
import { SovereignManifestoLanding } from '@/components/SovereignManifestoLanding';
import { SovereignAwakeningProvider } from '@/contexts/SovereignAwakeningContext';
import { PhoneFirstLanding } from '@/components/auth/PhoneFirstLanding';
import { AppErrorBoundary } from '@/components/AppErrorBoundary';
import {
  isPreviewUrl,
  isProductionDomain,
  resolveAuthorizedIdentity,
  shouldShowFullProtocolSync,
} from '@/lib/publicRevealAccess';
import { getCompositeDeviceFingerprint } from '@/lib/biometricAuth';

/**
 * ROOT PAGE — Phone number first (country code not persistent), then "Continue to Biometric Scan".
 * Biometric runs without opening camera (device Face ID / Windows Hello). Has account → dashboard; no account → vitalization.
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
        <PhoneFirstLanding />
      </AppErrorBoundary>
    );
  }

  return (
    <SovereignAwakeningProvider>
      <SovereignManifestoLanding />
    </SovereignAwakeningProvider>
  );
}

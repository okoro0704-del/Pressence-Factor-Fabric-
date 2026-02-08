'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { readAndClearSovStatusMessage } from '@/components/dashboard/ProtectedRoute';
import { isVitalizationComplete, isVitalizedFlag, shouldNeverRedirectBack } from '@/lib/vitalizationState';
import { ROUTES } from '@/lib/constants';

const GOLD = '#D4AF37';
const SILENT_CHECK_MS = 3000;

/**
 * ROOT PAGE — Silent Login & Clean Vitalization
 * - Silent recognition: no passkey prompt, no error messages on load. Check local identity only (storage).
 * - If VITALIZED flag or anchored (citizen_hash): show only Welcome Home face scan (AnchoredLanding).
 * - If no local identity after 3s: show single "Begin Vitalization" button. One-way: once vitalized, never show registration again.
 */
export default function Home() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [showFullProtocol, setShowFullProtocol] = useState(false);
  const [resolving, setResolving] = useState(true);
  const [anchored, setAnchored] = useState<boolean | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [lockdownRedirecting, setLockdownRedirecting] = useState(false);
  const [showBeginVitalization, setShowBeginVitalization] = useState(false);
  const [showGate, setShowGate] = useState(false);

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
    setStatusMessage((prev) => prev ?? readAndClearSovStatusMessage());
  }, [mounted, showFullProtocol, resolving]);

  // Silent check: local identity only (no credentials.get, no errors). One-way: VITALIZED flag or anchor.
  useEffect(() => {
    if (!mounted || !showFullProtocol || resolving) return;
    if (isVitalizedFlag()) {
      setAnchored(true);
      return;
    }
    let cancelled = false;
    getVitalizationAnchor().then((a) => {
      if (cancelled) return;
      setAnchored(a.isVitalized && !!a.citizenHash);
    });
    return () => { cancelled = true; };
  }, [mounted, showFullProtocol, resolving]);

  // Conditional prompt: only if no local identity after 3s, show "Begin Vitalization"
  useEffect(() => {
    if (!mounted || !showFullProtocol || resolving || anchored !== false) return;
    const t = setTimeout(() => setShowBeginVitalization(true), SILENT_CHECK_MS);
    return () => clearTimeout(t);
  }, [mounted, showFullProtocol, resolving, anchored]);

  // State lockdown: never return to gate/scanner once vitalization is complete — go straight to dashboard unless user explicitly logs out.
  useEffect(() => {
    if (!mounted || !showFullProtocol || resolving) return;
    if (shouldNeverRedirectBack() || isVitalizationComplete()) {
      setLockdownRedirecting(true);
      router.replace(ROUTES.DASHBOARD);
    }
  }, [mounted, showFullProtocol, resolving, router]);

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
    if (lockdownRedirecting || (!anchored && isVitalizationComplete())) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#050505]" style={{ color: '#6b6b70' }}>
          <p className="text-sm">Redirecting to Dashboard…</p>
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
    if (showGate) {
      return (
        <AppErrorBoundary>
          <div className="min-h-screen flex flex-col bg-[#050505]">
            {statusMessage && (
              <div className="flex-shrink-0 py-3 px-4 text-center text-sm border-b border-[#2a2a2e]" style={{ color: '#a0a0a5', background: 'rgba(212, 175, 55, 0.08)' }} role="status">
                {statusMessage}
              </div>
            )}
            <div className="flex-1">
              <FourLayerGate />
            </div>
          </div>
        </AppErrorBoundary>
      );
    }
    if (showBeginVitalization) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] p-6">
          <div
            className="absolute inset-0 opacity-30 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 40%, rgba(212, 175, 55, 0.12) 0%, transparent 60%)' }}
            aria-hidden
          />
          <button
            type="button"
            onClick={() => setShowGate(true)}
            className="relative z-10 px-10 py-4 rounded-2xl font-semibold text-base uppercase tracking-wider transition-all focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 focus:ring-offset-2 focus:ring-offset-[#050505] hover:opacity-95"
            style={{
              background: 'linear-gradient(145deg, rgba(212, 175, 55, 0.2) 0%, rgba(212, 175, 55, 0.08) 100%)',
              border: '2px solid rgba(212, 175, 55, 0.5)',
              color: GOLD,
              boxShadow: '0 0 40px rgba(212, 175, 55, 0.15)',
            }}
          >
            Begin Vitalization
          </button>
        </div>
      );
    }
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]" style={{ color: '#6b6b70' }} aria-busy="true">
        <p className="text-sm">Loading…</p>
      </div>
    );
  }

  return (
    <SovereignAwakeningProvider>
      <SovereignManifestoLanding />
    </SovereignAwakeningProvider>
  );
}

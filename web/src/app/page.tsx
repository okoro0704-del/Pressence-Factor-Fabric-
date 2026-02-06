'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FourLayerGate } from '@/components/dashboard/FourLayerGate';
import { AppErrorBoundary } from '@/components/AppErrorBoundary';
import { useGlobalPresenceGateway } from '@/contexts/GlobalPresenceGateway';

/**
 * ROOT PAGE - 4-LAYER HANDSHAKE GATE
 * Mandatory authentication gate for entire PFF system.
 * Hard Navigation Lock: if user already has presence verified or mint_status PENDING/MINTED, replace to dashboard (no gate re-entry).
 * Identity Re-Link: ?forceGate=1 shows the gate anyway (e.g. after "Perform Face Pulse" from swap).
 * Friction removal: hide "Install app" strip on mobile and when already running as PWA (standalone).
 */
export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [showInstallStrip, setShowInstallStrip] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isPresenceVerified, loading } = useGlobalPresenceGateway();
  const forceGate = searchParams.get('forceGate') === '1';

  useEffect(() => {
    setMounted(true);
    console.log('Interaction Layer Active', '(root)');
  }, []);

  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;
    const standalone =
      (window as Window & { standalone?: boolean }).standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches;
    const isMobile = /Android|iPhone|iPad|iPod|webOS|Mobile/i.test(navigator.userAgent);
    setShowInstallStrip(!standalone && !isMobile);
  }, [mounted]);

  useEffect(() => {
    if (!mounted || loading) return;
    if (isPresenceVerified && !forceGate) {
      router.replace('/dashboard');
    }
  }, [mounted, loading, isPresenceVerified, forceGate, router]);

  if (!mounted) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-[#050505]"
        style={{ color: '#6b6b70' }}
        aria-busy="true"
        aria-live="polite"
        data-testid="home-loading"
      >
        <p className="text-sm">Loading...</p>
      </div>
    );
  }

  if (!loading && isPresenceVerified && !forceGate) {
    return null;
  }

  return (
    <AppErrorBoundary>
      <div className="min-h-screen flex flex-col bg-[#050505]">
        {showInstallStrip && (
          <div className="shrink-0 text-center py-4 px-4 safe-area-top bg-gradient-to-r from-[#0d0d0f] via-[#16161a] to-[#0d0d0f] border-b border-[#D4AF37]/30 transition-opacity duration-500">
            <p className="text-sm font-semibold tracking-wide text-[#D4AF37]">
              The Protocol requires a mobile anchor. Install the app to secure your 1 VIDA.
            </p>
            <p className="text-xs text-[#6b6b70] mt-1">PWA — Add to Home Screen for full experience</p>
          </div>
        )}
        <div className="flex-1 transition-opacity duration-500">
          <FourLayerGate />
        </div>
      </div>
    </AppErrorBoundary>
  );
}

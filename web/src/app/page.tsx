'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FourLayerGate } from '@/components/dashboard/FourLayerGate';
import { AppErrorBoundary } from '@/components/AppErrorBoundary';
import { useGlobalPresenceGateway } from '@/contexts/GlobalPresenceGateway';

/**
 * ROOT PAGE - 4-LAYER HANDSHAKE GATE
 * Mandatory authentication gate for entire PFF system.
 * Hard Navigation Lock: if user already has presence verified or mint_status PENDING/MINTED, replace to dashboard (no gate re-entry).
 */
export default function Home() {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { isPresenceVerified, loading } = useGlobalPresenceGateway();

  useEffect(() => {
    setMounted(true);
    console.log('Interaction Layer Active', '(root)');
  }, []);

  useEffect(() => {
    if (!mounted || loading) return;
    if (isPresenceVerified) {
      router.replace('/dashboard');
    }
  }, [mounted, loading, isPresenceVerified, router]);

  if (!mounted) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-[#050505]"
        style={{ color: '#6b6b70' }}
        aria-busy="true"
        aria-live="polite"
      >
        <p className="text-sm">Loading...</p>
      </div>
    );
  }

  if (!loading && isPresenceVerified) {
    return null;
  }

  return (
    <AppErrorBoundary>
      <FourLayerGate />
    </AppErrorBoundary>
  );
}

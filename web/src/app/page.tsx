'use client';

import { useState, useEffect } from 'react';
import { SovereignManifestoLanding } from '@/components/SovereignManifestoLanding';
import { SovereignAwakeningProvider } from '@/contexts/SovereignAwakeningContext';
import { AppErrorBoundary } from '@/components/AppErrorBoundary';

/**
 * ROOT PAGE — Full Manifesto and VITALIZE. Owner can log in from their devices; others need a code until April 7.
 */
export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]" style={{ color: '#6b6b70' }} aria-busy="true">
        <p className="text-sm">Loading…</p>
      </div>
    );
  }

  return (
    <AppErrorBoundary>
      <SovereignAwakeningProvider>
        <SovereignManifestoLanding />
      </SovereignAwakeningProvider>
    </AppErrorBoundary>
  );
}

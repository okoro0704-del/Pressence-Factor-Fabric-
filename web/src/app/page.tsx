'use client';

import { useState, useEffect } from 'react';
import { FourLayerGate } from '@/components/dashboard/FourLayerGate';
import { AppErrorBoundary } from '@/components/AppErrorBoundary';

/**
 * ROOT PAGE - 4-LAYER HANDSHAKE GATE
 * Mandatory authentication gate for entire PFF system
 * UI only becomes interactive after client mount to prevent hydration mismatches.
 */
export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    console.log('Interaction Layer Active', '(root)');
  }, []);

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

  return (
    <AppErrorBoundary>
      <FourLayerGate />
    </AppErrorBoundary>
  );
}

'use client';

import { useState } from 'react';
import { GrandmasterAuth } from '@/components/dashboard/GrandmasterAuth';
import { DependentDashboard } from '@/components/dashboard/DependentDashboard';
import { AuthStatus, type BiometricAuthResult } from '@/lib/biometricAuth';
import type { GlobalIdentity } from '@/lib/phoneIdentity';

/**
 * GRANDMASTER MODE PAGE
 * 4-Layer Biometric Authentication + Simplified Dependent Dashboard
 * Elderly-First UI with zero text fields and extra-large buttons
 */
export default function GrandmasterPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [identity, setIdentity] = useState<GlobalIdentity | null>(null);

  const handleAuthSuccess = (authenticatedIdentity: GlobalIdentity) => {
    setIdentity(authenticatedIdentity);
    setAuthenticated(true);
  };

  return (
    <div>
      {!authenticated ? (
        <GrandmasterAuth onAuthSuccess={handleAuthSuccess} />
      ) : identity ? (
        <DependentDashboard identity={identity} />
      ) : (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center">
          <p className="text-4xl text-[#e8c547]">Loading...</p>
        </div>
      )}
    </div>
  );
}


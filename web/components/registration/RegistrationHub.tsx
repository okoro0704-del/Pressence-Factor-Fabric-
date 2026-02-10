'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { PersonalRegistration } from './PersonalRegistration';
import { AuthenticateOthers } from './AuthenticateOthers';
import { AuthenticateDependents } from './AuthenticateDependents';

type RegistrationTier = 'personal' | 'others' | 'dependents';

export function RegistrationHub() {
  const searchParams = useSearchParams();
  const tierParam = searchParams.get('tier');
  const [activeTier, setActiveTier] = useState<RegistrationTier>(
    tierParam === 'dependents' ? 'dependents' : tierParam === 'others' ? 'others' : 'personal'
  );
  useEffect(() => {
    if (tierParam === 'dependents' || tierParam === 'others') setActiveTier(tierParam);
  }, [tierParam]);

  return (
    <div className="min-h-screen bg-[#050505] py-12 px-4">
      {/* Header */}
      <header className="max-w-6xl mx-auto mb-12">
        <div className="text-center mb-8">
          <h1 
            className="text-4xl font-black tracking-tight mb-3"
            style={{ 
              color: '#D4AF37',
              textShadow: '0 0 30px rgba(212, 175, 55, 0.5)'
            }}
          >
            🏛️ REGISTRATION HUB
          </h1>
          <p className="text-lg" style={{ color: '#6b6b70' }}>
            Three-Tiered Identity Onboarding System
          </p>
          <p className="text-sm mt-2" style={{ color: '#4a4a4e' }}>
            Personal · Sovereign Partners · Dependents
          </p>
        </div>

        {/* Tier Selector */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => setActiveTier('personal')}
            className={`px-6 py-3 rounded-lg font-bold text-sm uppercase tracking-wider transition-all duration-300 ${
              activeTier === 'personal'
                ? 'bg-gradient-to-r from-[#D4AF37] to-[#c9a227] text-black shadow-[0_0_30px_rgba(212,175,55,0.4)]'
                : 'bg-[#16161a] text-[#6b6b70] border border-[#2a2a2e] hover:border-[#D4AF37]/50'
            }`}
          >
            Tier 1: Personal
          </button>
          <button
            onClick={() => setActiveTier('others')}
            className={`px-6 py-3 rounded-lg font-bold text-sm uppercase tracking-wider transition-all duration-300 ${
              activeTier === 'others'
                ? 'bg-gradient-to-r from-[#D4AF37] to-[#c9a227] text-black shadow-[0_0_30px_rgba(212,175,55,0.4)]'
                : 'bg-[#16161a] text-[#6b6b70] border border-[#2a2a2e] hover:border-[#D4AF37]/50'
            }`}
          >
            Tier 2: Authenticate Others
          </button>
          <button
            onClick={() => setActiveTier('dependents')}
            className={`px-6 py-3 rounded-lg font-bold text-sm uppercase tracking-wider transition-all duration-300 ${
              activeTier === 'dependents'
                ? 'bg-gradient-to-r from-[#D4AF37] to-[#c9a227] text-black shadow-[0_0_30px_rgba(212,175,55,0.4)]'
                : 'bg-[#16161a] text-[#6b6b70] border border-[#2a2a2e] hover:border-[#D4AF37]/50'
            }`}
          >
            Tier 3: Dependents
          </button>
        </div>
      </header>

      {/* Active Tier Content */}
      <div className="max-w-6xl mx-auto">
        {activeTier === 'personal' && <PersonalRegistration />}
        {activeTier === 'others' && <AuthenticateOthers />}
        {activeTier === 'dependents' && <AuthenticateDependents />}
      </div>
    </div>
  );
}


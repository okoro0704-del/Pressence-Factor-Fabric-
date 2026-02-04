'use client';

import { useState } from 'react';
import { SteppedRegistrationFlow } from './SteppedRegistrationFlow';
import { AccountType } from '@/lib/phoneIdentity';

export function AuthenticateDependents() {
  const [showFlow, setShowFlow] = useState(false);

  if (showFlow) {
    return (
      <SteppedRegistrationFlow
        accountType={AccountType.DEPENDENT}
        title="Authenticate Dependent"
        subtitle="Register elderly or minor linked to your account"
        onComplete={() => setShowFlow(false)}
        onCancel={() => setShowFlow(false)}
        guardianPhone="+2348012345678" // TODO: Get from current user context
      />
    );
  }

  return (
    <div 
      className="rounded-2xl border p-8"
      style={{
        background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.05) 0%, rgba(0, 0, 0, 0.3) 100%)',
        borderColor: 'rgba(212, 175, 55, 0.3)',
        boxShadow: '0 0 40px rgba(212, 175, 55, 0.1)'
      }}
    >
      <div className="flex items-start gap-6">
        <div className="flex-shrink-0">
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
            style={{
              background: 'linear-gradient(135deg, #D4AF37 0%, #c9a227 100%)',
              boxShadow: '0 0 30px rgba(212, 175, 55, 0.4)'
            }}
          >
            👨‍👩‍👧‍👦
          </div>
        </div>

        <div className="flex-1">
          <h2 className="text-2xl font-bold mb-2" style={{ color: '#D4AF37' }}>
            Tier 3: Authenticate Dependents
          </h2>
          <p className="text-sm mb-6" style={{ color: '#6b6b70' }}>
            Register elderly or minors linked directly to your account (the Architect). These accounts are managed by you and cryptographically linked to your 4-layer ID.
          </p>

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full" style={{ background: '#D4AF37' }} />
              <p className="text-sm" style={{ color: '#a0a0a5' }}>
                Simplified 4-Layer Scan for Dependent
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full" style={{ background: '#D4AF37' }} />
              <p className="text-sm" style={{ color: '#a0a0a5' }}>
                Cryptographically Linked to Your Account
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full" style={{ background: '#D4AF37' }} />
              <p className="text-sm" style={{ color: '#a0a0a5' }}>
                Auto-Created PFF Sovereign Account
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full" style={{ background: '#D4AF37' }} />
              <p className="text-sm" style={{ color: '#a0a0a5' }}>
                Managed Access (Guardian Controls)
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowFlow(true)}
            className="px-8 py-3 rounded-lg font-bold text-sm uppercase tracking-wider transition-all duration-300 hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #D4AF37 0%, #c9a227 100%)',
              color: '#0d0d0f',
              boxShadow: '0 0 20px rgba(212, 175, 55, 0.4)'
            }}
          >
            Register Dependent
          </button>
        </div>
      </div>
    </div>
  );
}


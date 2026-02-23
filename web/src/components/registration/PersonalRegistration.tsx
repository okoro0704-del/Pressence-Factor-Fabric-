'use client';

import { useState } from 'react';
import { SteppedRegistrationFlow } from './SteppedRegistrationFlow';
import { AccountType } from '@/lib/phoneIdentity';

export function PersonalRegistration() {
  const [showFlow, setShowFlow] = useState(false);

  if (showFlow) {
    return (
      <SteppedRegistrationFlow
        accountType={AccountType.SOVEREIGN_OPERATOR}
        title="Personal Registration"
        subtitle="Register your primary device and identity"
        onComplete={() => setShowFlow(false)}
        onCancel={() => setShowFlow(false)}
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
            👤
          </div>
        </div>

        <div className="flex-1">
          <h2 className="text-2xl font-bold mb-2" style={{ color: '#D4AF37' }}>
            Tier 1: Personal Registration
          </h2>
          <p className="text-sm mb-6" style={{ color: '#6b6b70' }}>
            Register your primary device and identity. This creates your Sovereign Operator account with full access to the PFF system.
          </p>

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full" style={{ background: '#D4AF37' }} />
              <p className="text-sm" style={{ color: '#a0a0a5' }}>
                4-Layer Biometric Authentication (Face, Voice, Hardware, Genesis)
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full" style={{ background: '#D4AF37' }} />
              <p className="text-sm" style={{ color: '#a0a0a5' }}>
                Phone Number Collection (Global Identity Link)
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
                VIDA CAP Vault Initialization (50/50 Split)
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
            Start Personal Registration
          </button>
        </div>
      </div>
    </div>
  );
}


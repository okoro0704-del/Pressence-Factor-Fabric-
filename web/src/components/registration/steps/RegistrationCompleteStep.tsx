'use client';

import { type GlobalIdentity } from '@/lib/phoneIdentity';

interface RegistrationCompleteStepProps {
  identity: GlobalIdentity;
  dependents: GlobalIdentity[];
  onFinish: () => void;
}

export function RegistrationCompleteStep({ identity, dependents, onFinish }: RegistrationCompleteStepProps) {
  const hasDependents = dependents.length > 0;

  return (
    <div 
      className="rounded-xl border p-8"
      style={{
        background: 'rgba(0, 0, 0, 0.6)',
        borderColor: 'rgba(212, 175, 55, 0.3)',
        boxShadow: '0 0 30px rgba(212, 175, 55, 0.1)'
      }}
    >
      {/* Success Icon */}
      <div className="flex justify-center mb-6">
        <div 
          className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
          style={{
            background: 'linear-gradient(135deg, #D4AF37 0%, #c9a227 100%)',
            boxShadow: '0 0 40px rgba(212, 175, 55, 0.5)'
          }}
        >
          ✓
        </div>
      </div>

      <h3 className="text-3xl font-black mb-3 text-center" style={{ color: '#D4AF37' }}>
        Registration Complete!
      </h3>
      <p className="text-sm text-center mb-8" style={{ color: '#6b6b70' }}>
        All accounts have been successfully registered and cryptographically linked
      </p>

      {/* Primary Account Summary */}
      <div 
        className="rounded-lg border p-6 mb-6"
        style={{
          background: 'rgba(212, 175, 55, 0.05)',
          borderColor: 'rgba(212, 175, 55, 0.3)'
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
            style={{
              background: 'linear-gradient(135deg, #D4AF37 0%, #c9a227 100%)'
            }}
          >
            👤
          </div>
          <div>
            <p className="font-bold text-lg" style={{ color: '#D4AF37' }}>
              {identity.full_name}
            </p>
            <p className="text-sm" style={{ color: '#6b6b70' }}>
              {identity.phone_number}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span style={{ color: '#6b6b70' }}>Account Type:</span>
            <span className="font-bold" style={{ color: '#D4AF37' }}>
              {identity.account_type === 'SOVEREIGN_OPERATOR' ? 'Sovereign Operator' : 'Dependent'}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span style={{ color: '#6b6b70' }}>Global Identity Hash:</span>
            <span className="font-mono text-xs" style={{ color: '#a0a0a5' }}>
              {identity.global_identity_hash.substring(0, 16)}...
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span style={{ color: '#6b6b70' }}>PFF Sovereign Account:</span>
            <span className="font-bold" style={{ color: '#D4AF37' }}>
              Auto-Created ✓
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span style={{ color: '#6b6b70' }}>VIDA CAP Vault:</span>
            <span className="font-bold" style={{ color: '#D4AF37' }}>
              Initialized (50/50 Split)
            </span>
          </div>
        </div>
      </div>

      {/* Dependents Summary */}
      {hasDependents && (
        <div 
          className="rounded-lg border p-6 mb-6"
          style={{
            background: 'rgba(0, 127, 255, 0.05)',
            borderColor: 'rgba(0, 127, 255, 0.3)'
          }}
        >
          <p className="font-bold text-sm mb-4" style={{ color: '#007FFF' }}>
            Linked Dependents ({dependents.length})
          </p>
          <div className="space-y-3">
            {dependents.map((dep) => (
              <div 
                key={dep.id}
                className="rounded-lg border p-3"
                style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  borderColor: 'rgba(0, 127, 255, 0.2)'
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl">👶</div>
                  <div className="flex-1">
                    <p className="font-bold text-sm" style={{ color: '#007FFF' }}>
                      {dep.full_name}
                    </p>
                    <p className="text-xs" style={{ color: '#6b6b70' }}>
                      {dep.phone_number}
                    </p>
                  </div>
                  <div className="text-xs" style={{ color: '#4a4a4e' }}>
                    Managed Account
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next Steps */}
      <div 
        className="rounded-lg border p-4 mb-6"
        style={{
          background: 'rgba(0, 0, 0, 0.4)',
          borderColor: '#2a2a2e'
        }}
      >
        <p className="font-bold text-sm mb-3" style={{ color: '#D4AF37' }}>
          What's Next?
        </p>
        <div className="space-y-2 text-xs" style={{ color: '#a0a0a5' }}>
          <div className="flex items-start gap-2">
            <span>•</span>
            <span>Access your dashboard to view VIDA CAP balance and transactions</span>
          </div>
          <div className="flex items-start gap-2">
            <span>•</span>
            <span>Link additional bank accounts via Presence Factor Fabric (PFF) integration</span>
          </div>
          <div className="flex items-start gap-2">
            <span>•</span>
            <span>Swap VIDA CAP to DLLR for Bitcoin-secured stablecoin liquidity</span>
          </div>
          <div className="flex items-start gap-2">
            <span>•</span>
            <span>Manage dependent accounts and set spending limits</span>
          </div>
        </div>
      </div>

      {/* Finish Button */}
      <div className="flex justify-center">
        <button
          onClick={onFinish}
          className="px-12 py-4 rounded-lg font-bold text-sm uppercase tracking-wider transition-all duration-300 hover:scale-105"
          style={{
            background: 'linear-gradient(135deg, #D4AF37 0%, #c9a227 100%)',
            color: '#0d0d0f',
            boxShadow: '0 0 30px rgba(212, 175, 55, 0.5)'
          }}
        >
          Return to Registration Hub
        </button>
      </div>
    </div>
  );
}


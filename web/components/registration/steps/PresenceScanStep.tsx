'use client';

import { useState } from 'react';
import { AccountType, type GlobalIdentity, generateIdentityHash } from '@/lib/phoneIdentity';
import { resolveSovereignByPresence, AuthStatus, AuthLayer, type BiometricAuthResult } from '@/lib/biometricAuth';
import { IdentityAnchorInput } from '@/components/auth/IdentityAnchorInput';

interface PresenceScanStepProps {
  accountType: AccountType;
  guardianPhone?: string;
  onComplete: (identity: GlobalIdentity) => void;
  onCancel: () => void;
}

export function PresenceScanStep({ accountType, guardianPhone, onComplete, onCancel }: PresenceScanStepProps) {
  const [authStatus, setAuthStatus] = useState<AuthStatus>(AuthStatus.IDLE);
  const [currentLayer, setCurrentLayer] = useState<AuthLayer | null>(null);
  const [result, setResult] = useState<BiometricAuthResult | null>(null);
  const [identityAnchor, setIdentityAnchor] = useState<{ phone: string; name: string } | null>(null);

  const handleAnchorVerified = (payload: { phoneNumber: string; fullName: string }) => {
    setIdentityAnchor({ phone: payload.phoneNumber, name: payload.fullName });
  };

  const handleStartScan = async () => {
    if (!identityAnchor) {
      alert('Identity anchor required. Please enter phone number first.');
      return;
    }

    setAuthStatus(AuthStatus.SCANNING);
    setResult(null);

    const authResult = await resolveSovereignByPresence(
      identityAnchor.phone,
      (layer, status) => {
        setCurrentLayer(layer);
        setAuthStatus(status);
      }
    );

    setResult(authResult);

    if (authResult.success && authResult.identity) {
      // Create GlobalIdentity from biometric result
      const globalIdentity: GlobalIdentity = {
        id: crypto.randomUUID(),
        phone_number: authResult.identity.phone_number,
        global_identity_hash: await generateIdentityHash(authResult.identity.phone_number),
        account_type: accountType,
        full_name: authResult.identity.full_name,
        guardian_phone: guardianPhone,
        linked_bank_accounts: [],
        vida_balance: 0,
        spendable_vida: 0,
        locked_vida: 0,
        created_at: new Date().toISOString(),
        last_active: new Date().toISOString(),
        status: 'ACTIVE',
      };

      // Wait 2 seconds to show success state
      setTimeout(() => {
        onComplete(globalIdentity);
      }, 2000);
    }
  };

  const layers = [
    { layer: AuthLayer.BIOMETRIC_SIGNATURE, icon: '👤', label: 'Face Recognition' },
    { layer: AuthLayer.VOICE_PRINT, icon: '🎤', label: 'Voice Print' },
    { layer: AuthLayer.HARDWARE_TPM, icon: '🔐', label: 'Hardware TPM' },
    { layer: AuthLayer.GENESIS_HANDSHAKE, icon: '🤝', label: 'Genesis Handshake' },
  ];

  return (
    <div 
      className="rounded-xl border p-8"
      style={{
        background: 'rgba(0, 0, 0, 0.6)',
        borderColor: 'rgba(212, 175, 55, 0.3)',
        boxShadow: '0 0 30px rgba(212, 175, 55, 0.1)'
      }}
    >
      <h3 className="text-2xl font-bold mb-6 text-center" style={{ color: '#D4AF37' }}>
        Step 1: Scan Presence
      </h3>

      {/* 4-Layer Status Display */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {layers.map(({ layer, icon, label }) => {
          const isPassed = result?.layersPassed?.includes(layer);
          const isActive = currentLayer === layer;
          const isFailed = result && !result.success && result.layer === layer;

          return (
            <div
              key={layer}
              className={`rounded-lg border p-4 transition-all duration-300 ${isActive ? 'scale-105' : ''}`}
              style={{
                background: isPassed 
                  ? 'rgba(212, 175, 55, 0.1)' 
                  : isFailed 
                  ? 'rgba(239, 68, 68, 0.1)'
                  : 'rgba(0, 0, 0, 0.4)',
                borderColor: isPassed 
                  ? '#D4AF37' 
                  : isFailed 
                  ? '#ef4444'
                  : isActive 
                  ? 'rgba(212, 175, 55, 0.5)'
                  : '#2a2a2e',
                boxShadow: isActive ? '0 0 20px rgba(212, 175, 55, 0.3)' : 'none'
              }}
            >
              <div className="flex items-center gap-3">
                <div className="text-3xl">{icon}</div>
                <div className="flex-1">
                  <p className="font-bold text-sm" style={{ color: isPassed ? '#D4AF37' : isFailed ? '#ef4444' : '#6b6b70' }}>
                    {label}
                  </p>
                  <p className="text-xs mt-1" style={{ color: '#4a4a4e' }}>
                    {isPassed ? '✓ Complete' : isFailed ? '✗ Failed' : isActive ? 'Scanning...' : 'Pending'}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Error Message */}
      {result && !result.success && (
        <div 
          className="rounded-lg border p-4 mb-6"
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            borderColor: '#ef4444'
          }}
        >
          <p className="text-sm font-bold" style={{ color: '#ef4444' }}>
            {result.errorMessage || 'Authentication failed. Please try again.'}
          </p>
        </div>
      )}

      {/* Success Message */}
      {result && result.success && (
        <div 
          className="rounded-lg border p-4 mb-6"
          style={{
            background: 'rgba(212, 175, 55, 0.1)',
            borderColor: '#D4AF37'
          }}
        >
          <p className="text-sm font-bold" style={{ color: '#D4AF37' }}>
            ✓ All 4 layers verified! Proceeding to next step...
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={onCancel}
          className="px-6 py-3 rounded-lg font-bold text-sm uppercase tracking-wider transition-all duration-300"
          style={{
            background: '#16161a',
            color: '#6b6b70',
            border: '2px solid #2a2a2e'
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleStartScan}
          disabled={authStatus === AuthStatus.SCANNING || (result !== null && result.success)}
          className="px-8 py-3 rounded-lg font-bold text-sm uppercase tracking-wider transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: 'linear-gradient(135deg, #D4AF37 0%, #c9a227 100%)',
            color: '#0d0d0f',
            boxShadow: '0 0 20px rgba(212, 175, 55, 0.4)'
          }}
        >
          {authStatus === AuthStatus.SCANNING ? 'Scanning...' : result?.success ? 'Complete' : 'Start 4-Layer Scan'}
        </button>
      </div>
    </div>
  );
}


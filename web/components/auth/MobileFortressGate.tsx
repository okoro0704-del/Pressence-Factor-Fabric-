'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { resolveSovereignByPresence, AuthStatus, AuthLayer } from '@/lib/biometricAuth';
import { verifyRemoteAuthSession } from '@/lib/remoteAuth';
import { generateIdentityHash } from '@/lib/phoneIdentity';
import { executeHardIdentityReset } from '@/lib/identityReset';
import { getIdentityAnchorPhone } from '@/lib/sentinelActivation';

interface MobileFortressGateProps {
  sessionId: string;
}

export function MobileFortressGate({ sessionId }: MobileFortressGateProps) {
  const [authStatus, setAuthStatus] = useState<AuthStatus>(AuthStatus.IDLE);
  const [currentLayer, setCurrentLayer] = useState<AuthLayer | null>(null);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleResetIdentity = async () => {
    setResetting(true);
    setError('');
    const result = await executeHardIdentityReset();
    if (!result.ok) {
      setError(result.error ?? 'Reset failed');
      setResetting(false);
    }
    // On success, executeHardIdentityReset redirects to /vitalization?reset=1
  };

  const handleStartAuth = async () => {
    setAuthStatus(AuthStatus.SCANNING);
    setError('');

    try {
      const phone = getIdentityAnchorPhone();
      if (!phone?.trim()) {
        setError('Identity anchor required. Complete 4-layer gate first.');
        setAuthStatus(AuthStatus.FAILED);
        return;
      }
      // Perform 4-layer biometric scan
      const authResult = await resolveSovereignByPresence(phone, (layer: AuthLayer | null, status: AuthStatus) => {
        setCurrentLayer(layer != null ? 1 : 0);
        setAuthStatus(status);
      });

      if (!authResult.success || !authResult.identity) {
        setError(authResult.errorMessage || 'Authentication failed');
        setAuthStatus(AuthStatus.FAILED);
        return;
      }

      // Generate identity hash
      const identityHash = await generateIdentityHash(authResult.identity.phone_number);

      // Get device ID
      const deviceId = localStorage.getItem('pff_device_id') || 'unknown';

      // Verify remote auth session
      const verified = await verifyRemoteAuthSession(sessionId, deviceId, identityHash);

      if (verified) {
        setSuccess(true);
        setAuthStatus(AuthStatus.BANKING_UNLOCKED);
      } else {
        setError('Failed to verify session. Please try again.');
        setAuthStatus(AuthStatus.FAILED);
      }
    } catch (err) {
      console.error('Error during remote auth:', err);
      setError('An error occurred during authentication');
      setAuthStatus(AuthStatus.FAILED);
    }
  };

  const layers = [
    { layer: AuthLayer.BIOMETRIC_SIGNATURE, icon: '👤', label: 'Face Recognition' },
    { layer: AuthLayer.VOICE_PRINT, icon: '🎤', label: 'Voice Print' },
    { layer: AuthLayer.HARDWARE_TPM, icon: '🔐', label: 'Hardware TPM' },
    { layer: AuthLayer.GENESIS_HANDSHAKE, icon: '🤝', label: 'Genesis Handshake' },
  ];

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
      <div 
        className="max-w-md w-full rounded-2xl border p-8"
        style={{
          background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.05) 0%, rgba(0, 0, 0, 0.6) 100%)',
          borderColor: 'rgba(212, 175, 55, 0.3)',
          boxShadow: '0 0 60px rgba(212, 175, 55, 0.2)'
        }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🏰</div>
          <h1 className="text-2xl font-black mb-3" style={{ color: '#D4AF37', textShadow: '0 0 30px rgba(212, 175, 55, 0.5)' }}>
            PFF Fortress Gate
          </h1>
          <p className="text-sm" style={{ color: '#6b6b70' }}>
            Complete the 4 Layers of Truth to unlock your desktop
          </p>
        </div>

        {/* Success State */}
        {success ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-6 animate-pulse">✅</div>
            <h2 className="text-2xl font-bold mb-3" style={{ color: '#D4AF37' }}>
              Verification Complete!
            </h2>
            <p className="text-sm mb-6" style={{ color: '#6b6b70' }}>
              Your desktop has been unlocked. You can close this window.
            </p>
            <div 
              className="rounded-lg border p-4"
              style={{
                background: 'rgba(212, 175, 55, 0.1)',
                borderColor: 'rgba(212, 175, 55, 0.3)'
              }}
            >
              <p className="text-xs font-bold" style={{ color: '#D4AF37' }}>
                ✓ Desktop authentication successful
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* 4-Layer Status Display */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              {layers.map(({ layer, icon, label }) => {
                const isActive = currentLayer === layer;
                const isPassed = authStatus === AuthStatus.BANKING_UNLOCKED || 
                  (currentLayer !== null && layers.findIndex(l => l.layer === currentLayer) > layers.findIndex(l => l.layer === layer));

                return (
                  <div
                    key={layer}
                    className={`rounded-lg border p-3 transition-all duration-300 ${isActive ? 'scale-105' : ''}`}
                    style={{
                      background: isPassed 
                        ? 'rgba(212, 175, 55, 0.1)' 
                        : isActive 
                        ? 'rgba(212, 175, 55, 0.05)'
                        : 'rgba(0, 0, 0, 0.4)',
                      borderColor: isPassed 
                        ? '#D4AF37' 
                        : isActive 
                        ? 'rgba(212, 175, 55, 0.5)'
                        : '#2a2a2e',
                      boxShadow: isActive ? '0 0 20px rgba(212, 175, 55, 0.3)' : 'none'
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="text-2xl">{icon}</div>
                      <div className="flex-1">
                        <p className="font-bold text-xs" style={{ color: isPassed ? '#D4AF37' : '#6b6b70' }}>
                          {label}
                        </p>
                        <p className="text-xs mt-1" style={{ color: '#4a4a4e' }}>
                          {isPassed ? '✓' : isActive ? '...' : '○'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Error Message */}
            {error && (
              <div 
                className="rounded-lg border p-4 mb-6"
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  borderColor: '#ef4444'
                }}
              >
                <p className="text-sm font-bold" style={{ color: '#ef4444' }}>
                  {error}
                </p>
              </div>
            )}

            {/* Start Button */}
            <button
              onClick={handleStartAuth}
              disabled={authStatus === AuthStatus.SCANNING}
              className="w-full px-8 py-4 rounded-lg font-bold text-sm uppercase tracking-wider transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #c9a227 100%)',
                color: '#0d0d0f',
                boxShadow: '0 0 30px rgba(212, 175, 55, 0.4)'
              }}
            >
              {authStatus === AuthStatus.SCANNING ? 'Scanning...' : 'Start 4-Layer Verification'}
            </button>

            {/* Reset Identity — clears all local storage and resets is_fully_verified in DB */}
            <button
              type="button"
              onClick={handleResetIdentity}
              disabled={resetting}
              className="w-full mt-4 px-6 py-3 rounded-lg text-sm font-medium border border-[#2a2a2e] hover:bg-[#2a2a2e] disabled:opacity-50 transition-colors"
              style={{ color: '#6b6b70' }}
            >
              {resetting ? 'Resetting…' : 'Reset Identity'}
            </button>

            {/* Info */}
            <div className="mt-6 text-center">
              <p className="text-xs" style={{ color: '#6b6b70' }}>
                This will authenticate your desktop session
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}


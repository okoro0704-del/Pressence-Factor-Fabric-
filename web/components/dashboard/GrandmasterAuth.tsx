'use client';

import { useState } from 'react';
import {
  resolveIdentityByPresence,
  requestGuardianOverride,
  AuthLayer,
  AuthStatus,
  type BiometricAuthResult,
} from '@/lib/biometricAuth';

interface GrandmasterAuthProps {
  onAuthSuccess?: (identity: any) => void;
}

export function GrandmasterAuth({ onAuthSuccess }: GrandmasterAuthProps) {
  const [authStatus, setAuthStatus] = useState<AuthStatus>(AuthStatus.IDLE);
  const [currentLayer, setCurrentLayer] = useState<AuthLayer | null>(null);
  const [result, setResult] = useState<BiometricAuthResult | null>(null);
  const [showGuardianRequest, setShowGuardianRequest] = useState(false);

  const guardianPhone = '+2348012345678';

  const getStatusColor = () => {
    switch (authStatus) {
      case AuthStatus.SCANNING:
        return 'from-red-600 to-red-700';
      case AuthStatus.IDENTIFIED:
        return 'from-[#c9a227] to-[#e8c547]';
      case AuthStatus.BANKING_UNLOCKED:
        return 'from-green-600 to-green-700';
      case AuthStatus.FAILED:
        return 'from-red-600 to-red-700';
      default:
        return 'from-[#3b82f6] to-[#2563eb]';
    }
  };

  const getStatusIcon = () => {
    switch (authStatus) {
      case AuthStatus.SCANNING:
        return '🔴';
      case AuthStatus.IDENTIFIED:
        return '🟡';
      case AuthStatus.BANKING_UNLOCKED:
        return '🟢';
      case AuthStatus.FAILED:
        return '❌';
      default:
        return '👤';
    }
  };

  const getStatusText = () => {
    switch (authStatus) {
      case AuthStatus.SCANNING:
        return currentLayer === AuthLayer.BIOMETRIC_SIGNATURE
          ? 'SCANNING FACE'
          : currentLayer === AuthLayer.VOICE_PRINT
          ? 'LISTENING TO VOICE'
          : currentLayer === AuthLayer.HARDWARE_TPM
          ? 'CHECKING DEVICE'
          : 'VERIFYING IDENTITY';
      case AuthStatus.IDENTIFIED:
        return 'IDENTITY CONFIRMED';
      case AuthStatus.BANKING_UNLOCKED:
        return 'BANKING UNLOCKED';
      case AuthStatus.FAILED:
        return 'AUTHENTICATION FAILED';
      default:
        return 'READY TO AUTHENTICATE';
    }
  };

  const handleAuthenticate = async () => {
    setAuthStatus(AuthStatus.SCANNING);
    setResult(null);
    setShowGuardianRequest(false);

    const authResult = await resolveIdentityByPresence((layer, status) => {
      setCurrentLayer(layer);
      setAuthStatus(status);
    });

    setResult(authResult);

    if (!authResult.success) {
      setShowGuardianRequest(true);
    } else if (authResult.identity && onAuthSuccess) {
      setTimeout(() => {
        onAuthSuccess(authResult.identity);
      }, 2000);
    }
  };

  const handleGuardianRequest = async () => {
    const response = await requestGuardianOverride(
      result?.phoneNumber || 'unknown',
      guardianPhone,
      result?.errorMessage || 'Authentication failed'
    );

    if (response.success) {
      alert(response.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center space-y-6">
          <div
            className={`mx-auto w-48 h-48 rounded-full bg-gradient-to-br ${getStatusColor()} flex items-center justify-center shadow-2xl ${
              authStatus === AuthStatus.SCANNING ? 'animate-pulse' : ''
            }`}
          >
            <span className="text-8xl">{getStatusIcon()}</span>
          </div>

          <h1 className="text-6xl font-bold text-[#e8c547] uppercase tracking-wider">
            {getStatusText()}
          </h1>

          {authStatus === AuthStatus.SCANNING && currentLayer === AuthLayer.VOICE_PRINT && (
            <p className="text-3xl text-[#f5f5f5] font-semibold">
              Say: <span className="text-[#e8c547]">"I am Vitalized"</span>
            </p>
          )}
        </div>

        {authStatus === AuthStatus.IDLE && (
          <button
            onClick={handleAuthenticate}
            className="w-full py-12 bg-gradient-to-r from-[#c9a227] to-[#e8c547] hover:from-[#e8c547] hover:to-[#c9a227] text-black font-bold text-5xl rounded-2xl transition-all duration-300 shadow-2xl shadow-[#e8c547]/30 uppercase tracking-wider"
          >
            🔐 AUTHENTICATE ME
          </button>
        )}

        {authStatus === AuthStatus.BANKING_UNLOCKED && result?.identity && (
          <div className="bg-gradient-to-br from-green-600/20 to-green-700/10 border-4 border-green-500 rounded-2xl p-8 text-center space-y-4">
            <h2 className="text-4xl font-bold text-green-400">✓ WELCOME BACK</h2>
            <p className="text-3xl text-[#f5f5f5] font-semibold">{result.identity.full_name}</p>
            <p className="text-2xl text-[#6b6b70] font-mono">{result.phoneNumber}</p>
            <div className="pt-4">
              <p className="text-xl text-green-400">Banking Access Authorized</p>
              <p className="text-5xl font-bold text-[#e8c547] mt-2">
                {result.identity.spendable_vida.toFixed(2)} VIDA
              </p>
            </div>
          </div>
        )}

        {authStatus === AuthStatus.FAILED && showGuardianRequest && (
          <div className="bg-gradient-to-br from-red-600/20 to-red-700/10 border-4 border-red-500 rounded-2xl p-8 text-center space-y-6">
            <h2 className="text-4xl font-bold text-red-400">❌ AUTHENTICATION FAILED</h2>
            <p className="text-2xl text-[#f5f5f5]">{result?.errorMessage}</p>
            
            <button
              onClick={handleGuardianRequest}
              className="w-full py-8 bg-gradient-to-r from-[#3b82f6] to-[#2563eb] hover:from-[#2563eb] hover:to-[#3b82f6] text-white font-bold text-3xl rounded-xl transition-all duration-300 shadow-lg uppercase tracking-wider"
            >
              📞 CALL GUARDIAN
            </button>
          </div>
        )}

        {result && result.layersPassed.length > 0 && (
          <div className="bg-[#16161a] rounded-xl p-6 border border-[#2a2a2e]">
            <h3 className="text-2xl font-bold text-[#e8c547] mb-4 text-center">SECURITY LAYERS</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { layer: AuthLayer.BIOMETRIC_SIGNATURE, icon: '👤', name: 'Face/Fingerprint' },
                { layer: AuthLayer.VOICE_PRINT, icon: '🎤', name: 'Voice Print' },
                { layer: AuthLayer.HARDWARE_TPM, icon: '🔒', name: 'Trusted Device' },
                { layer: AuthLayer.GENESIS_HANDSHAKE, icon: '🤝', name: 'Genesis Vault' },
              ].map(({ layer, icon, name }) => (
                <div
                  key={layer}
                  className={`p-4 rounded-lg border-2 ${
                    result.layersPassed.includes(layer)
                      ? 'bg-green-500/20 border-green-500'
                      : 'bg-[#0d0d0f] border-[#2a2a2e]'
                  }`}
                >
                  <div className="text-center">
                    <span className="text-4xl">{icon}</span>
                    <p className="text-lg font-semibold text-[#f5f5f5] mt-2">{name}</p>
                    {result.layersPassed.includes(layer) && (
                      <p className="text-sm text-green-400 mt-1">✓ Verified</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
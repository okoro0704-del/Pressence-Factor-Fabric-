'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { JetBrains_Mono } from 'next/font/google';
import {
  resolveSovereignByPresence,
  AuthLayer,
  AuthStatus,
  type BiometricAuthResult,
} from '@/lib/biometricAuth';
import type { GlobalIdentity } from '@/lib/phoneIdentity';
import { VaultDoorAnimation } from './VaultDoorAnimation';
import { useGlobalPresenceGateway } from '@/contexts/GlobalPresenceGateway';

const jetbrains = JetBrains_Mono({ weight: ['400', '600', '700'], subsets: ['latin'] });

/**
 * 4-LAYER HANDSHAKE GATE
 * Mandatory authentication gate for entire PFF system
 * No access to any page without completing all 4 layers
 */
export function FourLayerGate() {
  const [authStatus, setAuthStatus] = useState<AuthStatus>(AuthStatus.IDLE);
  const [currentLayer, setCurrentLayer] = useState<AuthLayer | null>(null);
  const [result, setResult] = useState<BiometricAuthResult | null>(null);
  const [showVaultAnimation, setShowVaultAnimation] = useState(false);
  const router = useRouter();
  const { setPresenceVerified } = useGlobalPresenceGateway();

  const getLayerIcon = (layer: AuthLayer) => {
    switch (layer) {
      case AuthLayer.BIOMETRIC_SIGNATURE:
        return '👤';
      case AuthLayer.VOICE_PRINT:
        return '🎤';
      case AuthLayer.HARDWARE_TPM:
        return '🔐';
      case AuthLayer.GENESIS_HANDSHAKE:
        return '🤝';
      default:
        return '🔒';
    }
  };

  const getLayerName = (layer: AuthLayer) => {
    switch (layer) {
      case AuthLayer.BIOMETRIC_SIGNATURE:
        return 'Face Recognition';
      case AuthLayer.VOICE_PRINT:
        return 'Voice Print';
      case AuthLayer.HARDWARE_TPM:
        return 'Hardware ID';
      case AuthLayer.GENESIS_HANDSHAKE:
        return 'Genesis Handshake';
      default:
        return 'Unknown';
    }
  };

  const getLayerStatus = (layer: AuthLayer) => {
    if (!currentLayer) return 'pending';
    const layers = [
      AuthLayer.BIOMETRIC_SIGNATURE,
      AuthLayer.VOICE_PRINT,
      AuthLayer.HARDWARE_TPM,
      AuthLayer.GENESIS_HANDSHAKE,
    ];
    const currentIndex = layers.indexOf(currentLayer);
    const layerIndex = layers.indexOf(layer);

    if (layerIndex < currentIndex) return 'complete';
    if (layerIndex === currentIndex) return 'active';
    return 'pending';
  };

  const handleStartAuthentication = async () => {
    setAuthStatus(AuthStatus.SCANNING);
    setResult(null);

    const authResult = await resolveSovereignByPresence((layer, status) => {
      setCurrentLayer(layer);
      setAuthStatus(status);
    });

    setResult(authResult);

    if (authResult.success && authResult.identity) {
      // Mark presence as verified in global context
      setPresenceVerified(true);

      // Show vault door animation
      setShowVaultAnimation(true);
    } else {
      setAuthStatus(AuthStatus.FAILED);
    }
  };

  const handleVaultAnimationComplete = () => {
    // Redirect to dashboard after vault animation
    router.push('/dashboard');
  };

  if (showVaultAnimation) {
    return <VaultDoorAnimation onComplete={handleVaultAnimationComplete} />;
  }

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      {/* Background Glow */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          background: 'radial-gradient(circle at center, rgba(212, 175, 55, 0.2) 0%, rgba(5, 5, 5, 0) 70%)',
        }}
      />

      {/* Main Gate Container */}
      <div className="relative max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="text-6xl mb-4 animate-pulse">🔐</div>
          <h1 
            className={`text-4xl font-bold text-[#D4AF37] uppercase tracking-wider mb-4 ${jetbrains.className}`}
            style={{ textShadow: '0 0 30px rgba(212, 175, 55, 0.6)' }}
          >
            Presence Required
          </h1>
          <p className="text-lg text-[#6b6b70]">
            Complete 4-Layer Biometric Authentication to Enter
          </p>
        </div>

        {/* 4-Layer Status Display */}
        <div className="mb-8 space-y-4">
          {[
            AuthLayer.BIOMETRIC_SIGNATURE,
            AuthLayer.VOICE_PRINT,
            AuthLayer.HARDWARE_TPM,
            AuthLayer.GENESIS_HANDSHAKE,
          ].map((layer, index) => {
            const status = getLayerStatus(layer);
            return (
              <div
                key={layer}
                className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                  status === 'complete'
                    ? 'border-green-500 bg-green-500/10'
                    : status === 'active'
                    ? 'border-[#D4AF37] bg-[#D4AF37]/10 animate-pulse'
                    : 'border-[#2a2a2e] bg-[#1a1a1e]'
                }`}
                style={{
                  boxShadow: status === 'active' ? '0 0 30px rgba(212, 175, 55, 0.4)' : 'none',
                }}
              >
                <div className="flex items-center gap-4">
                  <div className="text-3xl">{getLayerIcon(layer)}</div>
                  <div className="flex-1">
                    <h3 className={`font-bold ${jetbrains.className} ${
                      status === 'complete' ? 'text-green-500' : status === 'active' ? 'text-[#D4AF37]' : 'text-[#6b6b70]'
                    }`}>
                      Layer {index + 1}: {getLayerName(layer)}
                    </h3>
                    <p className="text-xs text-[#6b6b70]">
                      {status === 'complete' && '✅ Verified'}
                      {status === 'active' && '🔄 Scanning...'}
                      {status === 'pending' && '⏳ Waiting'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Authentication Button or Status */}
        {authStatus === AuthStatus.IDLE && (
          <button
            onClick={handleStartAuthentication}
            className="w-full py-6 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#C9A227] hover:from-[#e8c547] hover:to-[#D4AF37] text-black font-bold text-xl uppercase tracking-wider transition-all duration-300"
            style={{ boxShadow: '0 0 40px rgba(212, 175, 55, 0.6)' }}
          >
            🔓 Begin Authentication
          </button>
        )}

        {authStatus === AuthStatus.SCANNING && (
          <div className="text-center py-6">
            <div className="text-4xl mb-4 animate-spin">⚡</div>
            <p className="text-[#D4AF37] font-bold text-lg">Scanning...</p>
          </div>
        )}

        {authStatus === AuthStatus.FAILED && result && (
          <div className="p-6 rounded-lg bg-red-500/10 border-2 border-red-500">
            <p className="text-red-500 font-bold text-center mb-4">❌ Authentication Failed</p>
            <p className="text-sm text-[#6b6b70] text-center mb-4">{result.errorMessage}</p>
            <button
              onClick={handleStartAuthentication}
              className="w-full py-3 rounded-lg bg-red-500 hover:bg-red-600 text-white font-bold uppercase tracking-wider transition-all duration-300"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-xs text-[#4a4a4e]">
            PFF — Presence Factor Fabric
          </p>
          <p className="text-xs text-[#4a4a4e] mt-1">
            Architect: Isreal Okoro (mrfundzman)
          </p>
        </div>
      </div>
    </div>
  );
}


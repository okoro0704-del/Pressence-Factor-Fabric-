'use client';

import { useState, useEffect } from 'react';
import {
  resolveSovereignByPresence,
  AuthLayer,
  AuthStatus,
  type BiometricAuthResult,
} from '@/lib/biometricAuth';
import type { GlobalIdentity } from '@/lib/phoneIdentity';

interface PresenceOverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPresenceVerified: (identity: GlobalIdentity) => void;
  currentDeviceOwner?: string; // Phone number of device owner (child)
}

/**
 * PRESENCE OVERRIDE MODAL
 * Allows temporary "Guest Presence Scan" on any device
 * Elderly parent can authenticate on child's phone
 * Ignores local device phone number and resolves to scanned person's identity
 */
export function PresenceOverrideModal({
  isOpen,
  onClose,
  onPresenceVerified,
  currentDeviceOwner,
}: PresenceOverrideModalProps) {
  const [authStatus, setAuthStatus] = useState<AuthStatus>(AuthStatus.IDLE);
  const [currentLayer, setCurrentLayer] = useState<AuthLayer | null>(null);
  const [result, setResult] = useState<BiometricAuthResult | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setAuthStatus(AuthStatus.IDLE);
      setCurrentLayer(null);
      setResult(null);
    }
  }, [isOpen]);

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
        return 'SOVEREIGN IDENTITY VERIFIED';
      case AuthStatus.BANKING_UNLOCKED:
        return 'ACCESS GRANTED';
      case AuthStatus.FAILED:
        return 'VERIFICATION FAILED';
      default:
        return 'READY TO SCAN';
    }
  };

  const handleStartScan = async () => {
    setAuthStatus(AuthStatus.SCANNING);
    setResult(null);

    const authResult = await resolveSovereignByPresence(currentDeviceOwner ?? '', (layer: AuthLayer | null, status: AuthStatus) => {
      setCurrentLayer(layer);
      setAuthStatus(status);
    });

    setResult(authResult);

    if (authResult.success && authResult.identity) {
      // Wait 2 seconds to show success state
      setTimeout(() => {
        onPresenceVerified(authResult.identity!);
      }, 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="max-w-2xl w-full bg-[#16161a] rounded-3xl border-4 border-[#e8c547] shadow-2xl shadow-[#e8c547]/30 p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h2 className="text-4xl font-bold text-[#e8c547] uppercase tracking-wider">
            🔐 AUTHENTICATE DEPENDENT PRESENCE
          </h2>
          <p className="text-xl text-[#6b6b70]">
            Scan biometric signature to authorize temporary access
          </p>
          {currentDeviceOwner && (
            <p className="text-sm text-[#3b82f6] font-mono">
              Device Owner: {currentDeviceOwner}
            </p>
          )}
        </div>

        {/* Status Indicator */}
        <div className="text-center space-y-4">
          <div
            className={`mx-auto w-32 h-32 rounded-full bg-gradient-to-br ${getStatusColor()} flex items-center justify-center shadow-2xl ${
              authStatus === AuthStatus.SCANNING ? 'animate-pulse' : ''
            }`}
          >
            <span className="text-6xl">{getStatusIcon()}</span>
          </div>

          <h3 className="text-3xl font-bold text-[#e8c547] uppercase">
            {getStatusText()}
          </h3>

          {authStatus === AuthStatus.SCANNING && currentLayer === AuthLayer.VOICE_PRINT && (
            <p className="text-2xl text-[#f5f5f5] font-semibold">
              Say: <span className="text-[#e8c547]">"I am Vitalized"</span>
            </p>
          )}
        </div>

        {/* Success Banner */}
        {authStatus === AuthStatus.BANKING_UNLOCKED && result?.identity && (
          <div className="bg-gradient-to-r from-[#c9a227] to-[#e8c547] rounded-2xl p-6 text-center space-y-2 animate-pulse">
            <h3 className="text-3xl font-bold text-black uppercase">
              ✓ SOVEREIGN IDENTITY VERIFIED
            </h3>
            <p className="text-2xl font-bold text-black">{result.identity.full_name}</p>
            <p className="text-xl text-black/80">ACCESS GRANTED</p>
          </div>
        )}

        {/* Error Message */}
        {authStatus === AuthStatus.FAILED && result && (
          <div className="bg-gradient-to-br from-red-600/20 to-red-700/10 border-2 border-red-500 rounded-2xl p-6 text-center space-y-2">
            <h3 className="text-2xl font-bold text-red-400">❌ VERIFICATION FAILED</h3>
            <p className="text-lg text-[#f5f5f5]">{result.errorMessage}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          {authStatus === AuthStatus.IDLE && (
            <>
              <button
                onClick={handleStartScan}
                className="flex-1 py-6 bg-gradient-to-r from-[#c9a227] to-[#e8c547] hover:from-[#e8c547] hover:to-[#c9a227] text-black font-bold text-2xl rounded-xl transition-all duration-300 shadow-lg uppercase tracking-wider"
              >
                🔐 START SCAN
              </button>
              <button
                onClick={onClose}
                className="px-8 py-6 bg-[#2a2a2e] hover:bg-[#3a3a3e] text-[#f5f5f5] font-bold text-2xl rounded-xl transition-colors"
              >
                CANCEL
              </button>
            </>
          )}

          {authStatus === AuthStatus.FAILED && (
            <>
              <button
                onClick={handleStartScan}
                className="flex-1 py-6 bg-gradient-to-r from-[#3b82f6] to-[#2563eb] hover:from-[#2563eb] hover:to-[#3b82f6] text-white font-bold text-2xl rounded-xl transition-all duration-300 shadow-lg uppercase"
              >
                TRY AGAIN
              </button>
              <button
                onClick={onClose}
                className="px-8 py-6 bg-[#2a2a2e] hover:bg-[#3a3a3e] text-[#f5f5f5] font-bold text-2xl rounded-xl transition-colors"
              >
                CANCEL
              </button>
            </>
          )}
        </div>

        {/* Layer Progress */}
        {result && result.layersPassed.length > 0 && (
          <div className="bg-[#0d0d0f] rounded-xl p-4 border border-[#2a2a2e]">
            <h4 className="text-lg font-bold text-[#e8c547] mb-3 text-center">SECURITY LAYERS</h4>
            <div className="grid grid-cols-2 gap-3">
              {[
                { layer: AuthLayer.BIOMETRIC_SIGNATURE, icon: '👤', name: 'Face/Palm' },
                { layer: AuthLayer.VOICE_PRINT, icon: '🎤', name: 'Voice Print' },
                { layer: AuthLayer.HARDWARE_TPM, icon: '🔒', name: 'Device Check' },
                { layer: AuthLayer.GENESIS_HANDSHAKE, icon: '🤝', name: 'Genesis Vault' },
              ].map(({ layer, icon, name }) => (
                <div
                  key={layer}
                  className={`p-3 rounded-lg border-2 ${
                    result.layersPassed.includes(layer)
                      ? 'bg-green-500/20 border-green-500'
                      : 'bg-[#16161a] border-[#2a2a2e]'
                  }`}
                >
                  <div className="text-center">
                    <span className="text-3xl">{icon}</span>
                    <p className="text-sm font-semibold text-[#f5f5f5] mt-1">{name}</p>
                    {result.layersPassed.includes(layer) && (
                      <p className="text-xs text-green-400 mt-1">✓ Verified</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Privacy Notice */}
        <div className="bg-[#3b82f6]/10 border border-[#3b82f6]/30 rounded-xl p-4">
          <p className="text-sm text-[#3b82f6] text-center">
            🔒 <strong>Privacy Isolation:</strong> Session will revert to device owner after transaction completes. No data stored on this device.
          </p>
        </div>
      </div>
    </div>
  );
}


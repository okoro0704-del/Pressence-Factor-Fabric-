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
import { isVocalResonanceExempt, isIdentityMinor, type BiometricIdentityRecord } from '@/lib/universalIdentityComparison';
import type { LanguageCode } from '@/lib/i18n/config';
import { ConfirmLanguageScreen } from '@/components/auth/ConfirmLanguageScreen';
import { VocalInstructionScreen } from '@/components/auth/VocalInstructionScreen';
import { VaultDoorAnimation } from './VaultDoorAnimation';
import { useGlobalPresenceGateway } from '@/contexts/GlobalPresenceGateway';
import { IdentityAnchorInput } from '@/components/auth/IdentityAnchorInput';
import { BiologicalMismatchScreen } from '@/components/auth/BiologicalMismatchScreen';
import { MismatchEventType } from '@/lib/identityMismatchDetection';
import {
  initializeZeroPersistenceSession,
  resetSessionToLayer1,
  getSessionStatus,
  SessionStatus,
} from '@/lib/sessionManagement';
import { LayerStatusBar } from './LayerStatusBar';
import { AwaitingMasterAuthorization } from '@/components/auth/AwaitingMasterAuthorization';
import { GuardianRecoveryRequest } from '@/components/auth/GuardianRecoveryRequest';
import { GuardianRecoveryStatus } from '@/components/auth/GuardianRecoveryStatus';
import {
  getCurrentDeviceInfo,
  isDeviceAuthorized,
  getPrimaryDevice,
  createVitalizationRequest,
  assignPrimarySentinel,
  updateDeviceLastUsed,
} from '@/lib/multiDeviceVitalization';
import { maskPhoneForDisplay } from '@/lib/phoneMask';
import { mintFoundationSeigniorage } from '@/lib/foundationSeigniorage';

const jetbrains = JetBrains_Mono({ weight: ['400', '600', '700'], subsets: ['latin'] });

/**
 * 4-LAYER HANDSHAKE GATE (UNIVERSAL 1-TO-1 IDENTITY MATCHING)
 * Mandatory authentication gate for entire PFF system
 * Requires Identity Anchor (phone number) BEFORE biometric scan
 * No access to any page without completing all 4 layers
 */
export function FourLayerGate() {
  const [authStatus, setAuthStatus] = useState<AuthStatus>(AuthStatus.IDLE);
  const [currentLayer, setCurrentLayer] = useState<AuthLayer | null>(null);
  const [result, setResult] = useState<BiometricAuthResult | null>(null);
  const [showVaultAnimation, setShowVaultAnimation] = useState(false);
  const [identityAnchor, setIdentityAnchor] = useState<{ phone: string; name: string; vocalExempt?: boolean; isMinor?: boolean } | null>(null);
  /** PRE-VITALIZATION: Confirm Language → Vocal Instruction → Identity Anchor (always show before login) */
  const [languageConfirmed, setLanguageConfirmed] = useState<LanguageCode | null>(null);
  const [showVocalInstruction, setShowVocalInstruction] = useState(false);
  const [showMismatchScreen, setShowMismatchScreen] = useState(false);
  const [mismatchData, setMismatchData] = useState<{
    type: MismatchEventType;
    variance: number;
    similarity: number;
  } | null>(null);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>(SessionStatus.NO_SESSION);
  const [showAwaitingAuth, setShowAwaitingAuth] = useState(false);
  const [vitalizationRequestId, setVitalizationRequestId] = useState<string | null>(null);
  const [primaryDeviceInfo, setPrimaryDeviceInfo] = useState<{
    device_name: string;
    last_4_digits: string;
    device_id?: string;
  } | null>(null);
  const [showGuardianRecovery, setShowGuardianRecovery] = useState(false);
  const [showGuardianRecoveryStatus, setShowGuardianRecoveryStatus] = useState(false);
  const [guardianRecoveryRequestId, setGuardianRecoveryRequestId] = useState<string | null>(null);
  /** DEVICE HANDSHAKE: true when login failed on new/unrecognized device — show "Verify from an authorized device" */
  const [showVerifyFromAuthorizedDevice, setShowVerifyFromAuthorizedDevice] = useState(false);
  const router = useRouter();
  const { setPresenceVerified } = useGlobalPresenceGateway();

  // ZERO-PERSISTENCE SESSION INITIALIZATION
  // Reset to Layer 1 on every entry (app initialization or foreground)
  useEffect(() => {
    console.log('🔐 Initializing Zero-Persistence Session Management');

    // Initialize zero-persistence session management
    initializeZeroPersistenceSession();

    // Reset to Layer 1 on every entry
    resetSessionToLayer1();

    // Update session status
    setSessionStatus(getSessionStatus());

    console.log('✅ Session reset to Layer 1 - All 4 layers required');
  }, []);

  // Update session status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setSessionStatus(getSessionStatus());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

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

  /** MINOR: UI focuses exclusively on Face and Fingerprint (2 layers). ELDER: skip Voice (3 layers). Default: 4 layers. */
  const requiredLayers = identityAnchor?.isMinor
    ? [AuthLayer.BIOMETRIC_SIGNATURE, AuthLayer.HARDWARE_TPM]
    : identityAnchor?.vocalExempt
      ? [AuthLayer.BIOMETRIC_SIGNATURE, AuthLayer.HARDWARE_TPM, AuthLayer.GENESIS_HANDSHAKE]
      : [AuthLayer.BIOMETRIC_SIGNATURE, AuthLayer.VOICE_PRINT, AuthLayer.HARDWARE_TPM, AuthLayer.GENESIS_HANDSHAKE];

  const getLayerStatus = (layer: AuthLayer) => {
    if (!currentLayer) return 'pending';
    const currentIndex = requiredLayers.indexOf(currentLayer);
    const layerIndex = requiredLayers.indexOf(layer);
    if (layerIndex === -1) return 'pending';
    if (layerIndex < currentIndex) return 'complete';
    if (layerIndex === currentIndex) return 'active';
    return 'pending';
  };

  /** KILL AUTO-VERIFY: Only transition to biometric scan step. Verification happens only after real-time hardware scan. */
  const handleAnchorVerified = (payload: { phoneNumber: string; fullName: string; identity?: BiometricIdentityRecord }) => {
    const vocalExempt = payload.identity ? isVocalResonanceExempt(payload.identity) : false;
    const isMinor = payload.identity ? isIdentityMinor(payload.identity) : false;
    setIdentityAnchor({
      phone: payload.phoneNumber,
      name: payload.fullName,
      vocalExempt,
      isMinor,
    });
  };

  const handleStartAuthentication = async () => {
    if (!identityAnchor) {
      alert('Identity anchor required. Please enter phone number first.');
      return;
    }

    setAuthStatus(AuthStatus.SCANNING);
    setResult(null);
    setShowVerifyFromAuthorizedDevice(false);

    const deviceInfo = getCurrentDeviceInfo();
    const isNewDevice = !(await isDeviceAuthorized(identityAnchor.phone, deviceInfo.deviceId));
    const authResult = await resolveSovereignByPresence(
      identityAnchor.phone,
      (layer, status) => {
        setCurrentLayer(layer);
        setAuthStatus(status);
      },
      {
        skipVoiceLayer: identityAnchor.vocalExempt === true,
        requireAllLayers: isNewDevice,
      }
    );

    setResult(authResult);

    if (authResult.success && authResult.identity) {
      const isAuthorized = !isNewDevice;

      if (!isAuthorized) {
        // SECONDARY DEVICE DETECTED - Show "Awaiting Master Authorization" screen
        console.log('🔐 Secondary device detected - requesting vitalization');

        // Get primary device info
        const primaryDevice = await getPrimaryDevice(identityAnchor.phone);

        if (!primaryDevice) {
          // No primary device found - this is the FIRST DEVICE
          // Assign as PRIMARY_SENTINEL
          console.log('✅ First device detected - assigning as PRIMARY_SENTINEL');

          // Get IP address (simplified - in production use a proper IP detection service)
          const ipAddress = 'unknown';

          // Get geolocation (simplified - in production use browser Geolocation API)
          const geolocation = {
            city: 'Lagos',
            country: 'Nigeria',
            latitude: 6.5244,
            longitude: 3.3792,
          };

          // Assign as primary sentinel
          await assignPrimarySentinel(
            identityAnchor.phone,
            identityAnchor.name,
            deviceInfo,
            ipAddress,
            geolocation
          );

          console.log('✅ PRIMARY_SENTINEL assigned - proceeding to dashboard');
          await mintFoundationSeigniorage(identityAnchor.phone);
          setPresenceVerified(true);
          setShowVaultAnimation(true);
          return;
        }

        // Get IP address (simplified - in production use a proper IP detection service)
        const ipAddress = 'unknown';

        // Get geolocation (simplified - in production use browser Geolocation API)
        const geolocation = {
          city: 'Lagos',
          country: 'Nigeria',
          latitude: 6.5244,
          longitude: 3.3792,
        };

        // Create vitalization request for secondary device
        const requestId = await createVitalizationRequest(
          identityAnchor.phone,
          deviceInfo,
          ipAddress,
          geolocation
        );

        // Show "Awaiting Master Authorization" screen
        setVitalizationRequestId(requestId);
        setPrimaryDeviceInfo({
          device_name: primaryDevice.device_name,
          last_4_digits: primaryDevice.last_4_digits,
        });
        setShowAwaitingAuth(true);
        return;
      }

      // Device is authorized - update last used timestamp
      await updateDeviceLastUsed(deviceInfo.deviceId);

      // Foundation Seigniorage: dual-mint (10 VIDA user, 1 VIDA foundation) when gate clears
      await mintFoundationSeigniorage(identityAnchor.phone);

      // Proceed to dashboard
      setPresenceVerified(true);
      setShowVaultAnimation(true);
    } else {
      setAuthStatus(AuthStatus.FAILED);
      const deviceInfo = getCurrentDeviceInfo();
      const unrecognized = identityAnchor ? !(await isDeviceAuthorized(identityAnchor.phone, deviceInfo.deviceId)) : false;
      setShowVerifyFromAuthorizedDevice(unrecognized);

      // Check if this is a biological mismatch (high similarity but not exact match)
      // Parse error message to determine mismatch type
      const errorMsg = authResult.errorMessage || '';
      let mismatchType = MismatchEventType.BIOLOGICAL_HASH_MISMATCH;

      if (errorMsg.includes('twin') || errorMsg.includes('Twin')) {
        mismatchType = MismatchEventType.TWIN_DETECTED;
      } else if (errorMsg.includes('family') || errorMsg.includes('Family')) {
        mismatchType = MismatchEventType.FAMILY_MEMBER_DETECTED;
      } else if (errorMsg.includes('harmonic') || errorMsg.includes('Harmonic')) {
        mismatchType = MismatchEventType.VOCAL_HARMONIC_MISMATCH;
      }

      // Extract variance from error message (if available)
      const varianceMatch = errorMsg.match(/(\d+\.\d+)%/);
      const variance = varianceMatch ? parseFloat(varianceMatch[1]) : 5.0;

      // Show biological mismatch screen
      setMismatchData({
        type: mismatchType,
        variance,
        similarity: 100 - variance,
      });
      setShowMismatchScreen(true);
    }
  };

  const handleMismatchDismiss = () => {
    setShowMismatchScreen(false);
    setMismatchData(null);
    setAuthStatus(AuthStatus.IDLE);
    setCurrentLayer(null);
    setResult(null);
    setShowVerifyFromAuthorizedDevice(false);
  };

  const handleVaultAnimationComplete = () => {
    // Redirect to dashboard after vault animation
    router.push('/dashboard');
  };

  const handleVitalizationApproved = async () => {
    console.log('✅ Vitalization approved - transitioning to dashboard');
    setShowAwaitingAuth(false);
    if (identityAnchor) await mintFoundationSeigniorage(identityAnchor.phone);
    setPresenceVerified(true);
    setShowVaultAnimation(true);
  };

  const handleVitalizationDenied = () => {
    console.log('❌ Vitalization denied - resetting authentication');
    setShowAwaitingAuth(false);
    setVitalizationRequestId(null);
    setPrimaryDeviceInfo(null);
    setAuthStatus(AuthStatus.IDLE);
    setCurrentLayer(null);
    setResult(null);
    setIdentityAnchor(null);
    alert('Device authorization denied by primary device. Please try again or contact support.');
  };

  const handleShowGuardianRecovery = () => {
    console.log('🛡️ Showing Guardian Recovery UI');
    setShowAwaitingAuth(false);
    setShowGuardianRecovery(true);
  };

  /** DEVICE HANDSHAKE: Verify from an authorized device — fetch primary and show Guardian Recovery */
  const handleVerifyFromAuthorizedDevice = async () => {
    if (!identityAnchor) return;
    const primary = await getPrimaryDevice(identityAnchor.phone);
    setPrimaryDeviceInfo(
      primary
        ? {
            device_name: primary.device_name,
            last_4_digits: primary.last_4_digits,
            device_id: primary.device_id,
          }
        : null
    );
    setShowGuardianRecovery(true);
  };

  const handleGuardianRecoveryRequestCreated = (requestId: string) => {
    console.log('✅ Guardian recovery request created:', requestId);
    setGuardianRecoveryRequestId(requestId);
    setShowGuardianRecovery(false);
    setShowGuardianRecoveryStatus(true);
  };

  const handleGuardianRecoveryCancel = () => {
    console.log('❌ Guardian recovery cancelled');
    setShowGuardianRecovery(false);
    setAuthStatus(AuthStatus.IDLE);
    setCurrentLayer(null);
    setResult(null);
  };

  const handleGuardianRecoveryApproved = async () => {
    console.log('✅ Guardian recovery approved - new primary device assigned');
    setShowGuardianRecoveryStatus(false);
    setGuardianRecoveryRequestId(null);
    if (identityAnchor) await mintFoundationSeigniorage(identityAnchor.phone);
    setPresenceVerified(true);
    setShowVaultAnimation(true);
  };

  const handleGuardianRecoveryExpired = () => {
    console.log('⏰ Guardian recovery request expired');
    setShowGuardianRecoveryStatus(false);
    setGuardianRecoveryRequestId(null);
    alert('Guardian recovery request expired. Please try again.');
    setAuthStatus(AuthStatus.IDLE);
    setCurrentLayer(null);
    setResult(null);
  };

  const handleGuardianRecoveryDenied = () => {
    console.log('❌ Guardian recovery denied');
    setShowGuardianRecoveryStatus(false);
    setGuardianRecoveryRequestId(null);
    alert('Guardian recovery request was denied.');
    setAuthStatus(AuthStatus.IDLE);
    setCurrentLayer(null);
    setResult(null);
  };

  // Show "Awaiting Master Authorization" screen (secondary device)
  if (showAwaitingAuth && vitalizationRequestId && primaryDeviceInfo) {
    const deviceInfo = getCurrentDeviceInfo();
    return (
      <AwaitingMasterAuthorization
        requestId={vitalizationRequestId}
        primaryDeviceName={primaryDeviceInfo.device_name}
        primaryDeviceLast4={primaryDeviceInfo.last_4_digits}
        deviceName={deviceInfo.deviceName}
        onApproved={handleVitalizationApproved}
        onDenied={handleVitalizationDenied}
        onLostPrimaryDevice={handleShowGuardianRecovery}
      />
    );
  }

  // Show biological mismatch screen
  if (showMismatchScreen && mismatchData) {
    return (
      <BiologicalMismatchScreen
        mismatchType={mismatchData.type}
        variance={mismatchData.variance}
        similarityScore={mismatchData.similarity}
        accountOwnerName={identityAnchor?.name}
        onDismiss={handleMismatchDismiss}
      />
    );
  }

  if (showVaultAnimation) {
    return <VaultDoorAnimation onComplete={handleVaultAnimationComplete} />;
  }

  const screenBg = (
    <div
      className="absolute inset-0 opacity-20"
      style={{
        background: 'radial-gradient(circle at center, rgba(212, 175, 55, 0.2) 0%, rgba(5, 5, 5, 0) 70%)',
      }}
    />
  );

  // PRE-VITALIZATION: Confirm Language (before vitalization or login)
  if (!languageConfirmed && !showVocalInstruction) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
        {screenBg}
        <ConfirmLanguageScreen
          onConfirm={(code) => {
            setLanguageConfirmed(code);
            setShowVocalInstruction(true);
          }}
        />
      </div>
    );
  }

  // PRE-VITALIZATION: Vocal Instruction (what to say + Read text or Repeat after audio)
  if (showVocalInstruction && !identityAnchor) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
        {screenBg}
        <VocalInstructionScreen
          languageCode={languageConfirmed || 'en'}
          onContinue={() => setShowVocalInstruction(false)}
        />
      </div>
    );
  }

  // Identity Anchor Input (after language + vocal instruction)
  if (!identityAnchor) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
        {screenBg}
        <div className="relative max-w-2xl w-full">
          <IdentityAnchorInput
            onAnchorVerified={handleAnchorVerified}
            title="Identity Anchor Required"
            subtitle="Enter your phone number to proceed to hardware biometric scan. Verification occurs only after the scan."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      {/* 4/4 Layers Verified Status Bar */}
      <LayerStatusBar />

      {/* Background Glow */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background: 'radial-gradient(circle at center, rgba(212, 175, 55, 0.2) 0%, rgba(5, 5, 5, 0) 70%)',
        }}
      />

      {/* Main Gate Container */}
      <div className="relative max-w-2xl w-full">
        {/* Identity Anchor Display */}
        <div
          className="rounded-lg border p-4 mb-6"
          style={{
            background: 'rgba(212, 175, 55, 0.05)',
            borderColor: 'rgba(212, 175, 55, 0.3)'
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold mb-1" style={{ color: '#6b6b70' }}>
                Identity Anchor Locked
              </p>
              <p className="text-sm font-bold" style={{ color: '#D4AF37' }}>
                {identityAnchor.name}
              </p>
              <p className="text-xs font-mono" style={{ color: '#a0a0a5' }} title="Phone masked for privacy">
                {maskPhoneForDisplay(identityAnchor.phone)}
              </p>
            </div>
            <div className="text-3xl">🔗</div>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="text-6xl mb-4 animate-pulse">🔐</div>
          <h1
            className={`text-4xl font-bold text-[#D4AF37] uppercase tracking-wider mb-4 ${jetbrains.className}`}
            style={{ textShadow: '0 0 30px rgba(212, 175, 55, 0.6)' }}
          >
            1-to-1 Identity Verification
          </h1>
          <p className="text-lg text-[#6b6b70]">
            Complete 4-Layer Biometric Authentication (0.5% Variance Threshold)
          </p>
        </div>

        {/* 4-Layer Status Display (MINOR EXEMPTION: 3 layers when isMinor — no Voice) */}
        <div className="mb-8 space-y-4">
          {requiredLayers.map((layer, index) => {
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
            <div className="flex flex-col gap-3">
              <button
                onClick={handleStartAuthentication}
                className="w-full py-3 rounded-lg bg-red-500 hover:bg-red-600 text-white font-bold uppercase tracking-wider transition-all duration-300"
              >
                Retry
              </button>
              {showVerifyFromAuthorizedDevice && (
                <button
                  onClick={handleVerifyFromAuthorizedDevice}
                  className="w-full py-3 rounded-lg border-2 border-[#D4AF37] text-[#D4AF37] font-bold uppercase tracking-wider transition-all duration-300 hover:bg-[#D4AF37]/10"
                >
                  Verify from an authorized device
                </button>
              )}
            </div>
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

      {/* Guardian Recovery Request UI */}
      {showGuardianRecovery && identityAnchor && (
        <GuardianRecoveryRequest
          phoneNumber={identityAnchor.phone}
          fullName={identityAnchor.name}
          oldPrimaryDeviceId={primaryDeviceInfo?.device_id ?? primaryDeviceInfo?.device_name ?? null}
          onRecoveryRequestCreated={handleGuardianRecoveryRequestCreated}
          onCancel={handleGuardianRecoveryCancel}
        />
      )}

      {/* Guardian Recovery Status UI */}
      {showGuardianRecoveryStatus && guardianRecoveryRequestId && (
        <GuardianRecoveryStatus
          requestId={guardianRecoveryRequestId}
          onApproved={handleGuardianRecoveryApproved}
          onExpired={handleGuardianRecoveryExpired}
          onDenied={handleGuardianRecoveryDenied}
        />
      )}
    </div>
  );
}


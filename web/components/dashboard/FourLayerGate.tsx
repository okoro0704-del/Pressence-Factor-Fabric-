'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { JetBrains_Mono } from 'next/font/google';
import {
  resolveSovereignByPresence,
  AuthLayer,
  AuthStatus,
  type BiometricAuthResult,
  type PresencePillar,
  startLocationRequestFromUserGesture,
  getCompositeDeviceFingerprint,
  SCAN_TIMEOUT_MS,
} from '@/lib/biometricAuth';
import { PresenceProgressRing } from './PresenceProgressRing';
import type { GlobalIdentity } from '@/lib/phoneIdentity';
import { isVocalResonanceExempt, isIdentityMinor, type BiometricIdentityRecord } from '@/lib/universalIdentityComparison';
import type { LanguageCode } from '@/lib/i18n/config';
import { getStoredLanguage } from '@/lib/i18n/config';
import { ConfirmLanguageScreen } from '@/components/auth/ConfirmLanguageScreen';
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
import { hasSignedConstitution } from '@/lib/legalApprovals';
import { setIdentityAnchorForSession, getIdentityAnchorPhone, isSentinelActive } from '@/lib/sentinelActivation';
import { getCurrentUserRole, setRoleCookie, canAccessMaster, canAccessGovernment, getProfileWithPrimarySentinel } from '@/lib/roleAuth';
import { ensureGenesisIfEmpty } from '@/lib/auth';
import { SovereignConstitution } from '@/components/auth/SovereignConstitution';
import { setSessionIdentity } from '@/lib/sessionIsolation';
import { enterGuestMode, isGuestMode, logGuestAccessIfNeeded } from '@/lib/guestMode';
import { NewDeviceAuthorizationScreen } from '@/components/auth/NewDeviceAuthorizationScreen';
import { updatePrimarySentinelDeviceForMigration, sendDeviceMigrationSecurityAlert } from '@/lib/deviceMigration';
import { SacredRecordScreen } from '@/components/auth/SacredRecordScreen';
import { SeedVerificationStep } from '@/components/auth/SeedVerificationStep';
import {
  generateMnemonic12,
  mnemonicToWords,
  pick3RandomIndices,
  verify3Words,
} from '@/lib/recoverySeed';
import { storeRecoverySeed, hasRecoverySeed, confirmRecoverySeedStored } from '@/lib/recoverySeedStorage';
import type { DeviceInfo } from '@/lib/multiDeviceVitalization';
import { RecoverMyAccountScreen } from '@/components/auth/RecoverMyAccountScreen';

const jetbrains = JetBrains_Mono({ weight: ['400', '600', '700'], subsets: ['latin'] });

/**
 * 4-LAYER HANDSHAKE GATE (UNIVERSAL 1-TO-1 IDENTITY MATCHING)
 * Mandatory authentication gate for entire PFF system
 * Requires Identity Anchor (phone number) BEFORE biometric scan
 * No access to any page without completing all 4 layers
 */
export function FourLayerGate() {
  const [mounted, setMounted] = useState(false);
  const [authStatus, setAuthStatus] = useState<AuthStatus>(AuthStatus.IDLE);
  const [currentLayer, setCurrentLayer] = useState<AuthLayer | null>(null);
  const [result, setResult] = useState<BiometricAuthResult | null>(null);
  const [showVaultAnimation, setShowVaultAnimation] = useState(false);
  const [identityAnchor, setIdentityAnchor] = useState<{
    phone: string;
    name: string;
    vocalExempt?: boolean;
    isMinor?: boolean;
    guardianPhone?: string;
    isDependent?: boolean;
  } | null>(null);
  /** Dependent flow: show "Guardian Authorization Detected. Sentinel Secure." and skip full biometric. */
  const [showGuardianAuthorizationBypass, setShowGuardianAuthorizationBypass] = useState(false);
  /** PRE-VITALIZATION: Confirm Language → Identity Anchor (Voice step removed — Triple-Pillar only). Restored from storage so remount doesn't bounce back. */
  const [languageConfirmed, setLanguageConfirmed] = useState<LanguageCode | null>(null);
  /** Recover My Account: enter phone + 12 words to unbind from lost device */
  const [showRecoverFlow, setShowRecoverFlow] = useState(false);

  const GATE_IDENTITY_STORAGE_KEY = 'pff_gate_identity_anchor';
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
  /** Admin Portal: 3-of-4 biometric for admin; only MASTER_ARCHITECT or GOVERNMENT_ADMIN can open panel */
  const [adminPortalScanning, setAdminPortalScanning] = useState(false);
  const [adminPortalError, setAdminPortalError] = useState<string | null>(null);
  /** Sovereign Constitution Entry Gate: must sign constitution before 10 VIDA mint; re-sign if version changed */
  const [showConstitutionGate, setShowConstitutionGate] = useState(false);
  /** 5s scan timeout: show Retry or Master Device Bypass */
  const [showTimeoutBypass, setShowTimeoutBypass] = useState(false);
  /** Debug Info: show current user UUID for manual SQL promotion */
  const [showDebugModal, setShowDebugModal] = useState(false);
  const [debugUuid, setDebugUuid] = useState<string>('');
  /** Progress Ring: Device Signature → GPS Presence → Sovereign Face (Triple-Pillar; no Voice). */
  const [pillarDevice, setPillarDevice] = useState(false);
  const [pillarLocation, setPillarLocation] = useState(false);
  const [pillarFace, setPillarFace] = useState(false);
  /** Location permission required — show gold popup to allow access */
  const [showLocationPermissionPopup, setShowLocationPermissionPopup] = useState(false);
  /** GPS taking >3s — show "Syncing with Local Mesh..." (indoor mode) */
  const [gpsTakingLong, setGpsTakingLong] = useState(false);
  /** First-time MASTER_ARCHITECT: role is Master but device ID empty — show Enrollment Mode to capture Master Key */
  const [showEnrollmentModeForMaster, setShowEnrollmentModeForMaster] = useState(false);
  const [enrollmentCapturing, setEnrollmentCapturing] = useState(false);
  /** New Device Authorization: device_fingerprint does not match primary_sentinel_device_id — require 5s Face Pulse then update binding */
  const [showNewDeviceAuthorization, setShowNewDeviceAuthorization] = useState(false);
  const [newDeviceMigrationScanning, setNewDeviceMigrationScanning] = useState(false);
  const [newDeviceMigrationError, setNewDeviceMigrationError] = useState<string | null>(null);
  /** Sovereign Recovery Key (Master Seed): first device enrollment — Sacred Record + 3-word verification */
  const [showSacredRecord, setShowSacredRecord] = useState(false);
  const [generatedSeed, setGeneratedSeed] = useState<string | null>(null);
  const [showSeedVerification, setShowSeedVerification] = useState(false);
  const [verificationIndices, setVerificationIndices] = useState<number[]>([]);
  const [seedVerificationError, setSeedVerificationError] = useState<string | null>(null);
  const [seedVerificationLoading, setSeedVerificationLoading] = useState(false);
  const [sacredRecordDeviceContext, setSacredRecordDeviceContext] = useState<{
    deviceInfo: DeviceInfo;
    compositeDeviceId: string;
  } | null>(null);
  /** Success shield after 3-word verification: "5 VIDA CAP SUCCESSFULLY MINTED" in gold (minting press visual) */
  const [showSeedSuccessShield, setShowSeedSuccessShield] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setPresenceVerified } = useGlobalPresenceGateway();

  // Restore pillar state from localStorage so refresh doesn't require re-verifying HW/GPS
  useEffect(() => {
    if (!identityAnchor) return;
    const PILLAR_CACHE_MS = 24 * 60 * 60 * 1000;
    try {
      const hwTs = localStorage.getItem('pff_pillar_hw_ts');
      const locTs = localStorage.getItem('pff_pillar_location_ts');
      if (hwTs && Date.now() - parseInt(hwTs, 10) < PILLAR_CACHE_MS) setPillarDevice(true);
      if (locTs && Date.now() - parseInt(locTs, 10) < PILLAR_CACHE_MS) setPillarLocation(true);
    } catch {
      // ignore
    }
  }, [identityAnchor?.phone]);

  // Hydration sync + restore language/identity so redirect from architect (or any protected route) doesn't bounce back to language
  useEffect(() => {
    setMounted(true);
    console.log('Interaction Layer Active', '(FourLayerGate)');
    if (typeof window === 'undefined') return;
    const storedLang = getStoredLanguage();
    if (storedLang) setLanguageConfirmed(storedLang);
    try {
      const raw = sessionStorage.getItem(GATE_IDENTITY_STORAGE_KEY) || localStorage.getItem(GATE_IDENTITY_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { phone: string; name: string; vocalExempt?: boolean; isMinor?: boolean; guardianPhone?: string; isDependent?: boolean };
        if (parsed?.phone && parsed?.name) {
          setIdentityAnchor({
            phone: parsed.phone,
            name: parsed.name,
            vocalExempt: parsed.vocalExempt,
            isMinor: parsed.isMinor,
            guardianPhone: parsed.guardianPhone,
            isDependent: parsed.isDependent,
          });
          return;
        }
      }
      const savedPhone = getIdentityAnchorPhone();
      if (savedPhone) {
        setIdentityAnchor({
          phone: savedPhone,
          name: 'Sovereign',
          vocalExempt: undefined,
          isMinor: undefined,
          guardianPhone: undefined,
          isDependent: undefined,
        });
      }
    } catch {
      // ignore invalid stored identity
    }
  }, []);

  // First-time flag: MASTER_ARCHITECT with empty device ID → Enrollment Mode (bypass verification)
  useEffect(() => {
    if (!identityAnchor?.phone) return;
    getProfileWithPrimarySentinel(identityAnchor.phone).then((profile) => {
      if (!profile) return;
      const emptyDevice = !profile.primary_sentinel_device_id || profile.primary_sentinel_device_id.trim() === '';
      if (profile.role === 'MASTER_ARCHITECT' && emptyDevice) {
        setShowEnrollmentModeForMaster(true);
      }
    });
  }, [identityAnchor?.phone]);

  // ZERO-PERSISTENCE SESSION INITIALIZATION
  // Reset to Layer 1 on every entry (app initialization or foreground)
  useEffect(() => {
    if (!mounted) return;
    console.log('🔐 Initializing Zero-Persistence Session Management');

    // Initialize zero-persistence session management
    initializeZeroPersistenceSession();

    // Reset to Layer 1 on every entry
    resetSessionToLayer1();

    // Update session status
    setSessionStatus(getSessionStatus());

    console.log('✅ Session reset to Layer 1 - All 4 layers required');
  }, [mounted]);

  // Update session status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setSessionStatus(getSessionStatus());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // When GPS pillar is active and scanning, after 3s show "Syncing with Local Mesh..." (indoor mode)
  useEffect(() => {
    if (currentLayer !== AuthLayer.GPS_LOCATION || authStatus !== AuthStatus.SCANNING) return;
    const t = setTimeout(() => setGpsTakingLong(true), 3000);
    return () => clearTimeout(t);
  }, [currentLayer, authStatus]);

  const getLayerIcon = (layer: AuthLayer) => {
    switch (layer) {
      case AuthLayer.BIOMETRIC_SIGNATURE:
        return '👤';
      case AuthLayer.VOICE_PRINT:
        return '🔐';
      case AuthLayer.HARDWARE_TPM:
        return '🔐';
      case AuthLayer.GENESIS_HANDSHAKE:
        return '🤝';
      case AuthLayer.GPS_LOCATION:
        return '📍';
      default:
        return '🔒';
    }
  };

  /** Triple-Pillar Shield labels: no Voice/Touch ID — use Hardware Fingerprint Verified */
  const getLayerName = (layer: AuthLayer) => {
    switch (layer) {
      case AuthLayer.BIOMETRIC_SIGNATURE:
        return 'Sovereign Face';
      case AuthLayer.VOICE_PRINT:
        return 'Hardware Fingerprint Verified';
      case AuthLayer.HARDWARE_TPM:
        return 'Device Signature';
      case AuthLayer.GENESIS_HANDSHAKE:
        return 'Genesis Handshake';
      case AuthLayer.GPS_LOCATION:
        return 'GPS Presence';
      default:
        return 'Unknown';
    }
  };

  /** Scanning-state copy for Triple-Pillar sequence; GPS >3s shows indoor mode. */
  const getLayerScanningLabel = (layer: AuthLayer) => {
    if (layer === AuthLayer.GPS_LOCATION && gpsTakingLong) {
      return 'Syncing with Local Mesh...';
    }
    switch (layer) {
      case AuthLayer.HARDWARE_TPM:
        return 'Scanning Device Signature...';
      case AuthLayer.GPS_LOCATION:
        return 'Acquiring GPS Presence...';
      case AuthLayer.BIOMETRIC_SIGNATURE:
        return 'Resolving Sovereign Face...';
      case AuthLayer.VOICE_PRINT:
        return 'Verifying Hardware Fingerprint...';
      case AuthLayer.GENESIS_HANDSHAKE:
        return 'Genesis Handshake...';
      default:
        return 'Verifying...';
    }
  };

  /** Triple-Pillar only: Device → GPS → Face. Voice layer removed (obsolete). MINOR: 2 layers (Face + Device). */
  const requiredLayers = identityAnchor?.isMinor
    ? [AuthLayer.BIOMETRIC_SIGNATURE, AuthLayer.HARDWARE_TPM]
    : [AuthLayer.BIOMETRIC_SIGNATURE, AuthLayer.HARDWARE_TPM, AuthLayer.GENESIS_HANDSHAKE];

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
  const handleAnchorVerified = (payload: {
    phoneNumber: string;
    fullName: string;
    identity?: BiometricIdentityRecord;
    guardianPhone?: string;
    isDependent?: boolean;
  }) => {
    const vocalExempt = payload.identity ? isVocalResonanceExempt(payload.identity) : false;
    const isMinor = payload.identity ? isIdentityMinor(payload.identity) : false;
    const anchor = {
      phone: payload.phoneNumber,
      name: payload.fullName,
      vocalExempt,
      isMinor,
      guardianPhone: payload.guardianPhone,
      isDependent: payload.isDependent === true,
    };
    setIdentityAnchor(anchor);
    try {
      const json = JSON.stringify(anchor);
      sessionStorage.setItem(GATE_IDENTITY_STORAGE_KEY, json);
      localStorage.setItem(GATE_IDENTITY_STORAGE_KEY, json);
    } catch {
      // ignore
    }
  };

  const biometricPendingRef = useRef(false);

  /** Triple-Pillar success: Device + GPS + Face verified (no Voice). Transition to Success/Dashboard. */
  const goToDashboard = useCallback(async () => {
    if (!identityAnchor) return;
    const signed = await hasSignedConstitution(identityAnchor.phone);
    if (!signed) {
      setShowConstitutionGate(true);
      return;
    }
    await mintFoundationSeigniorage(identityAnchor.phone);
    setIdentityAnchorForSession(identityAnchor.phone);
    ensureGenesisIfEmpty(identityAnchor.phone, identityAnchor.name).catch(() => {});
    setPresenceVerified(true);
    setSessionIdentity(identityAnchor.phone);
    await logGuestAccessIfNeeded();
    setShowVaultAnimation(true);
  }, [identityAnchor]);

  const handleStartAuthentication = useCallback(async () => {
    if (!identityAnchor) {
      alert('Identity anchor required. Please enter phone number first.');
      return;
    }
    if (biometricPendingRef.current) return;
    biometricPendingRef.current = true;

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([100, 50, 100, 50, 200]);
    }

    startLocationRequestFromUserGesture(identityAnchor.phone);

    setAuthStatus(AuthStatus.SCANNING);
    setResult(null);
    setShowVerifyFromAuthorizedDevice(false);
    setShowTimeoutBypass(false);
    setGpsTakingLong(false);
    setPillarDevice(false);
    setPillarLocation(false);
    setPillarFace(false);

    try {
      // DEPENDENT BYPASS: Guardian Authorization — skip Voice/Face resonance; inherit Sentinel from Guardian.
      if (identityAnchor.isDependent && identityAnchor.guardianPhone) {
        const guardianSentinelActive = await isSentinelActive(identityAnchor.guardianPhone);
        if (guardianSentinelActive) {
          setShowGuardianAuthorizationBypass(true);
          setAuthStatus(AuthStatus.IDLE);
          return;
        }
        setAuthStatus(AuthStatus.IDLE);
        alert('Your guardian must activate their Sentinel to unlock your wallet. Ask them to complete activation at /sentinel.');
        return;
      }

      const deviceInfo = getCurrentDeviceInfo();
    const compositeDeviceId = await getCompositeDeviceFingerprint();

    // New Hardware Detection: if verified user's device_fingerprint does not match stored primary_sentinel_device_id → New Device Authorization
    const profile = await getProfileWithPrimarySentinel(identityAnchor.phone);
    const storedPrimaryId = profile?.primary_sentinel_device_id?.trim() ?? '';
    if (storedPrimaryId && compositeDeviceId !== storedPrimaryId) {
      setShowNewDeviceAuthorization(true);
      setAuthStatus(AuthStatus.IDLE);
      biometricPendingRef.current = false;
      return;
    }

    const isNewDevice = !(await isDeviceAuthorized(identityAnchor.phone, compositeDeviceId));
    const authResult = await resolveSovereignByPresence(
      identityAnchor.phone,
      (layer, status) => {
        setCurrentLayer(layer);
        setAuthStatus(status);
      },
      {
        skipVoiceLayer: true,
        requireAllLayers: isNewDevice,
        registeredCountryCode: 'NG',
        onPillarComplete: (pillar: PresencePillar) => {
          if (pillar === 'device') setPillarDevice(true);
          if (pillar === 'location') setPillarLocation(true);
          if (pillar === 'face') setPillarFace(true);
        },
      }
    );

    setResult(authResult);
    if (authResult.locationPermissionRequired) setShowLocationPermissionPopup(true);

    if (authResult.timedOut) {
      setAuthStatus(AuthStatus.FAILED);
      setShowTimeoutBypass(true);
      setShowVerifyFromAuthorizedDevice(true);
      return;
    }

    // Triple-Pillar success: Device + GPS + Face verified (no Voice). → goToDashboard().
    if (authResult.success && authResult.identity) {
      const isAuthorized = !isNewDevice;

      if (!isAuthorized) {
        // SECONDARY DEVICE DETECTED - Show "Awaiting Master Authorization" screen
        console.log('🔐 Secondary device detected - requesting vitalization');

        // Get primary device info
        const primaryDevice = await getPrimaryDevice(identityAnchor.phone);

        if (!primaryDevice) {
          // No primary device found - this is the FIRST DEVICE
          const hasSeed = await hasRecoverySeed(identityAnchor.phone);
          if (!hasSeed) {
            // Sovereign Recovery Key: generate 12-word phrase, show Sacred Record, then 3-word verification
            console.log('✅ First device detected - generating Master Key (Sacred Record)');
            const seed = generateMnemonic12();
            setGeneratedSeed(seed);
            setSacredRecordDeviceContext({ deviceInfo, compositeDeviceId });
            setShowSacredRecord(true);
            setAuthStatus(AuthStatus.IDLE);
            biometricPendingRef.current = false;
            return;
          }

          // Already has recovery seed — assign as PRIMARY_SENTINEL
          console.log('✅ First device detected - assigning as PRIMARY_SENTINEL');

          const ipAddress = 'unknown';
          const geolocation = {
            city: 'Lagos',
            country: 'Nigeria',
            latitude: 6.5244,
            longitude: 3.3792,
          };

          await assignPrimarySentinel(
            identityAnchor.phone,
            identityAnchor.name,
            deviceInfo,
            ipAddress,
            geolocation,
            compositeDeviceId
          );

          console.log('✅ PRIMARY_SENTINEL assigned - check constitution then proceed');
          await goToDashboard();
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

        const requestId = await createVitalizationRequest(
          identityAnchor.phone,
          deviceInfo,
          ipAddress,
          geolocation,
          compositeDeviceId
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

      await updateDeviceLastUsed(compositeDeviceId);

      // Triple-Pillar success (Device + GPS + Face): go to dashboard — no Voice step
      await goToDashboard();
    } else {
      setAuthStatus(AuthStatus.FAILED);
      const deviceInfo = getCurrentDeviceInfo();
      const compositeForCheck = await getCompositeDeviceFingerprint();
      const unrecognized = identityAnchor ? !(await isDeviceAuthorized(identityAnchor.phone, compositeForCheck)) : false;
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
    } finally {
      biometricPendingRef.current = false;
    }
  }, [identityAnchor, goToDashboard]);

  const handleMismatchDismiss = () => {
    setShowMismatchScreen(false);
    setMismatchData(null);
    setAuthStatus(AuthStatus.IDLE);
    setCurrentLayer(null);
    setResult(null);
    setShowVerifyFromAuthorizedDevice(false);
    setShowTimeoutBypass(false);
  };

  const handleVaultAnimationComplete = () => {
    const next = searchParams.get('next');
    if (next && typeof next === 'string' && next.startsWith('/') && !next.startsWith('//')) {
      router.push(next);
    } else {
      router.push('/dashboard');
    }
  };

  const handleDebugInfo = async () => {
    try {
      const supabase = (await import('@/lib/supabase')).getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      const uuid = user?.id ?? 'Not signed in';
      setDebugUuid(uuid);
      setShowDebugModal(true);
    } catch (e) {
      setDebugUuid('Error: ' + (e instanceof Error ? e.message : String(e)));
      setShowDebugModal(true);
    }
  };

  const handleVitalizationApproved = async () => {
    console.log('✅ Vitalization approved - check constitution then proceed');
    setShowAwaitingAuth(false);
    if (!identityAnchor) return;
    const signed = await hasSignedConstitution(identityAnchor.phone);
    if (!signed) {
      setShowConstitutionGate(true);
      return;
    }
    await mintFoundationSeigniorage(identityAnchor.phone);
    setIdentityAnchorForSession(identityAnchor.phone);
    setPresenceVerified(true);
    setSessionIdentity(identityAnchor.phone);
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

  /** Admin Portal: 3-of-4 biometric scan; only MASTER_ARCHITECT or GOVERNMENT_ADMIN can open panel */
  const handleAdminPortalClick = async () => {
    if (!identityAnchor) return;
    setAdminPortalError(null);
    setAdminPortalScanning(true);
    try {
      const authResult = await resolveSovereignByPresence(
        identityAnchor.phone,
        (layer, status) => {
          setCurrentLayer(layer);
          setAuthStatus(status);
        },
        { skipVoiceLayer: true, requireAllLayers: false }
      );
      if (authResult.success && authResult.identity) {
        const role = await getCurrentUserRole(identityAnchor.phone);
        setRoleCookie(role);
        if (canAccessMaster(role)) {
          router.push('/master/dashboard');
          return;
        }
        if (canAccessGovernment(role)) {
          router.push('/government/treasury');
          return;
        }
        setAdminPortalError('Unauthorized Access. Only MASTER_ARCHITECT or GOVERNMENT_ADMIN can open the Admin Portal.');
      } else {
        setAdminPortalError('Biometric verification failed. Access denied.');
      }
    } catch {
      setAdminPortalError('Verification failed. Access denied.');
    } finally {
      setAdminPortalScanning(false);
      setAuthStatus(AuthStatus.IDLE);
      setCurrentLayer(null);
    }
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
    console.log('✅ Guardian recovery approved - check constitution then proceed');
    setShowGuardianRecoveryStatus(false);
    setGuardianRecoveryRequestId(null);
    if (!identityAnchor) return;
    const signed = await hasSignedConstitution(identityAnchor.phone);
    if (!signed) {
      setShowConstitutionGate(true);
      return;
    }
    await mintFoundationSeigniorage(identityAnchor.phone);
    setIdentityAnchorForSession(identityAnchor.phone);
    ensureGenesisIfEmpty(identityAnchor.phone, identityAnchor.name).catch(() => {});
    setPresenceVerified(true);
    setSessionIdentity(identityAnchor.phone);
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

  /** Enrollment Mode: MASTER_ARCHITECT with empty device — capture current device as Master Key (bypass full verification). */
  const handleEnrollmentCaptureMasterKey = async () => {
    if (!identityAnchor) return;
    setEnrollmentCapturing(true);
    try {
      const compositeDeviceId = await getCompositeDeviceFingerprint();
      const deviceInfo = getCurrentDeviceInfo();
      const ipAddress = 'unknown';
      const geolocation = { city: 'Lagos', country: 'Nigeria', latitude: 6.5244, longitude: 3.3792 };
      await assignPrimarySentinel(
        identityAnchor.phone,
        identityAnchor.name,
        deviceInfo,
        ipAddress,
        geolocation,
        compositeDeviceId
      );
      setShowEnrollmentModeForMaster(false);
      const signed = await hasSignedConstitution(identityAnchor.phone);
      if (!signed) {
        setShowConstitutionGate(true);
        return;
      }
      await mintFoundationSeigniorage(identityAnchor.phone);
      setIdentityAnchorForSession(identityAnchor.phone);
      ensureGenesisIfEmpty(identityAnchor.phone, identityAnchor.name).catch(() => {});
      setPresenceVerified(true);
      setSessionIdentity(identityAnchor.phone);
      setShowVaultAnimation(true);
    } catch (e) {
      console.error('[Enrollment Mode] Capture failed:', e);
      alert('Failed to save Master Key. Try again.');
    } finally {
      setEnrollmentCapturing(false);
    }
  };

  /** New Device Authorization: 5-second Face Pulse then update primary_sentinel_device_id and send Security Alert */
  const handleNewDeviceAuthorize = async () => {
    if (!identityAnchor) return;
    if (newDeviceMigrationScanning) return;
    setNewDeviceMigrationError(null);
    setNewDeviceMigrationScanning(true);
    startLocationRequestFromUserGesture(identityAnchor.phone);
    try {
      const compositeDeviceId = await getCompositeDeviceFingerprint();
      const authResult = await resolveSovereignByPresence(
        identityAnchor.phone,
        (layer, status) => {
          setCurrentLayer(layer);
          setAuthStatus(status);
        },
        {
          skipVoiceLayer: true,
          requireAllLayers: true,
          migrationMode: true,
          registeredCountryCode: 'NG',
          onPillarComplete: (pillar: PresencePillar) => {
            if (pillar === 'device') setPillarDevice(true);
            if (pillar === 'location') setPillarLocation(true);
            if (pillar === 'face') setPillarFace(true);
          },
        }
      );
      if (!authResult.success || !authResult.identity) {
        setNewDeviceMigrationError(authResult.errorMessage ?? 'Face Pulse verification failed. Try again.');
        return;
      }
      const updateResult = await updatePrimarySentinelDeviceForMigration(identityAnchor.phone, compositeDeviceId);
      if (!updateResult.ok) {
        setNewDeviceMigrationError(updateResult.error ?? 'Failed to update device binding.');
        return;
      }
      await sendDeviceMigrationSecurityAlert(identityAnchor.phone);
      setShowNewDeviceAuthorization(false);
      const signed = await hasSignedConstitution(identityAnchor.phone);
      if (!signed) {
        setShowConstitutionGate(true);
        return;
      }
      await mintFoundationSeigniorage(identityAnchor.phone);
      setIdentityAnchorForSession(identityAnchor.phone);
      ensureGenesisIfEmpty(identityAnchor.phone, identityAnchor.name).catch(() => {});
      setPresenceVerified(true);
      setSessionIdentity(identityAnchor.phone);
      setShowVaultAnimation(true);
    } catch (e) {
      setNewDeviceMigrationError(e instanceof Error ? e.message : 'Verification failed. Try again.');
    } finally {
      setNewDeviceMigrationScanning(false);
      setAuthStatus(AuthStatus.IDLE);
      setCurrentLayer(null);
    }
  };

  const handleNewDeviceCancel = () => {
    setShowNewDeviceAuthorization(false);
    setNewDeviceMigrationError(null);
    setAuthStatus(AuthStatus.IDLE);
  };

  /** Sacred Record: user acknowledged — show 3-word verification. */
  const handleSacredRecordAcknowledged = () => {
    setShowSacredRecord(false);
    setVerificationIndices(pick3RandomIndices());
    setSeedVerificationError(null);
    setShowSeedVerification(true);
  };

  /** Seed verification passed — store seed, confirm DB has recovery_seed_encrypted, then show Success shield. */
  const handleSeedVerificationPassed = async (answers: string[]) => {
    if (!identityAnchor || !generatedSeed || verificationIndices.length !== 3 || !sacredRecordDeviceContext) return;
    if (!verify3Words(generatedSeed, verificationIndices, answers)) {
      setSeedVerificationError('Words do not match. Check your Master Key and try again.');
      return;
    }
    setSeedVerificationError(null);
    setSeedVerificationLoading(true);
    try {
      const storeResult = await storeRecoverySeed(identityAnchor.phone, generatedSeed, identityAnchor.name);
      if (!storeResult.ok) {
        setSeedVerificationError(storeResult.error ?? 'Failed to save recovery seed.');
        return;
      }
      const confirmed = await confirmRecoverySeedStored(identityAnchor.phone);
      if (!confirmed) {
        setSeedVerificationError('Recovery seed was not confirmed in the database. Try again or use Admin Schema Refresh.');
        return;
      }
      setShowSeedVerification(false);
      setShowSeedSuccessShield(true);
    } finally {
      setSeedVerificationLoading(false);
    }
  };

  /** After Success shield — assign primary sentinel and proceed to dashboard (seed already stored and confirmed). */
  const handleSeedSuccessContinue = async () => {
    if (!identityAnchor || !sacredRecordDeviceContext) return;
    const ctx = sacredRecordDeviceContext;
    setGeneratedSeed(null);
    setSacredRecordDeviceContext(null);
    setShowSeedSuccessShield(false);

    const { deviceInfo, compositeDeviceId } = ctx;
    const ipAddress = 'unknown';
    const geolocation = { city: 'Lagos', country: 'Nigeria', latitude: 6.5244, longitude: 3.3792 };
    await assignPrimarySentinel(
      identityAnchor.phone,
      identityAnchor.name,
      deviceInfo,
      ipAddress,
      geolocation,
      compositeDeviceId
    );
    const signed = await hasSignedConstitution(identityAnchor.phone);
    if (!signed) {
      setShowConstitutionGate(true);
      return;
    }
    await mintFoundationSeigniorage(identityAnchor.phone);
    setIdentityAnchorForSession(identityAnchor.phone);
    ensureGenesisIfEmpty(identityAnchor.phone, identityAnchor.name).catch(() => {});
    setPresenceVerified(true);
    setSessionIdentity(identityAnchor.phone);
    await logGuestAccessIfNeeded();
    setShowVaultAnimation(true);
  };

  /** Dependent flow: user confirmed "Guardian Authorization Detected. Sentinel Secure." — proceed to dashboard. */
  const handleGuardianAuthorizationConfirm = async () => {
    if (!identityAnchor) return;
    setShowGuardianAuthorizationBypass(false);
    const signed = await hasSignedConstitution(identityAnchor.phone);
    if (!signed) {
      setShowConstitutionGate(true);
      return;
    }
    await mintFoundationSeigniorage(identityAnchor.phone);
    setIdentityAnchorForSession(identityAnchor.phone);
    ensureGenesisIfEmpty(identityAnchor.phone, identityAnchor.name).catch(() => {});
    setPresenceVerified(true);
    setSessionIdentity(identityAnchor.phone);
    setShowVaultAnimation(true);
  };

  /** After Biometric Signature on Sovereign Constitution — record already done in component; mint and proceed. */
  const handleConstitutionAccepted = async () => {
    if (!identityAnchor) return;
    setShowConstitutionGate(false);
    await mintFoundationSeigniorage(identityAnchor.phone);
    setIdentityAnchorForSession(identityAnchor.phone);
    ensureGenesisIfEmpty(identityAnchor.phone, identityAnchor.name).catch(() => {});
    setPresenceVerified(true);
    setSessionIdentity(identityAnchor.phone);
    setShowVaultAnimation(true);
  };

  // Avoid rendering interactive content until mounted (prevents hydration mismatch / unresponsive UI)
  if (!mounted) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-[#050505]"
        style={{ color: '#6b6b70' }}
        aria-busy="true"
        aria-live="polite"
      >
        <p className="text-sm">Loading...</p>
      </div>
    );
  }

  // DEPENDENT BYPASS: Guardian Authorization Detected — skip Voice/Face; Sentinel inherited from Guardian.
  if (showGuardianAuthorizationBypass && identityAnchor) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 transition-all duration-200">
        <div
          className="rounded-2xl border p-8 max-w-md w-full text-center transition-all duration-200"
          style={{
            background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.08) 0%, rgba(0, 0, 0, 0.9) 100%)',
            borderColor: 'rgba(212, 175, 55, 0.4)',
            boxShadow: '0 0 60px rgba(212, 175, 55, 0.2)',
          }}
        >
          <div className="text-6xl mb-6">🛡️</div>
          <h2 className={`text-2xl font-bold text-[#D4AF37] uppercase tracking-wider mb-4 ${jetbrains.className}`}>
            Guardian Authorization Detected. Sentinel Secure.
          </h2>
          <p className="text-sm text-[#a0a0a5] mb-6">
            Your guardian&apos;s Sentinel is active. Hardware Fingerprint check bypassed. Proceeding with secure access.
          </p>
          <button
            type="button"
            onClick={handleGuardianAuthorizationConfirm}
            className="relative z-50 w-full py-4 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#C9A227] hover:from-[#e8c547] hover:to-[#D4AF37] text-black font-bold text-lg uppercase tracking-wider transition-all duration-300 cursor-pointer"
            style={{ boxShadow: '0 0 30px rgba(212, 175, 55, 0.5)' }}
          >
            Continue to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Sovereign Constitution Entry Gate — must sign (Biometric Signature) before 10 VIDA mint; re-sign if version changed
  if (showConstitutionGate && identityAnchor) {
    return (
      <SovereignConstitution
        identityAnchorPhone={identityAnchor.phone}
        skipVoiceLayer={identityAnchor.vocalExempt === true}
        onAccept={handleConstitutionAccepted}
      />
    );
  }

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

  // Sovereign Recovery Key: Sacred Record (12 words) — first device enrollment
  if (showSacredRecord && identityAnchor && generatedSeed) {
    const words = mnemonicToWords(generatedSeed);
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(circle at center, rgba(212, 175, 55, 0.2) 0%, rgba(5, 5, 5, 0) 70%)' }}
          aria-hidden
        />
        <SacredRecordScreen words={words} onAcknowledged={handleSacredRecordAcknowledged} />
      </div>
    );
  }

  // Success shield — minting press: "5 VIDA CAP SUCCESSFULLY MINTED" in gold
  if (showSeedSuccessShield && identityAnchor) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 30%, rgba(212, 175, 55, 0.25) 0%, rgba(92, 71, 22, 0.1) 40%, rgba(5, 5, 5, 0) 70%)' }}
          aria-hidden
        />
        <div
          className="relative z-10 rounded-2xl border-2 p-8 max-w-md w-full text-center overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, rgba(30, 28, 22, 0.98) 0%, rgba(15, 14, 10, 0.99) 100%)',
            borderColor: 'rgba(212, 175, 55, 0.6)',
            boxShadow: '0 0 60px rgba(212, 175, 55, 0.25), inset 0 1px 0 rgba(212, 175, 55, 0.15)',
          }}
        >
          {/* Minting press / digital forge: stamp drops onto 5 VIDA plate */}
          <div className="relative flex flex-col items-center mb-6 h-24" aria-hidden>
            <motion.div
              className="absolute left-1/2 -translate-x-1/2 w-24 h-4 rounded-b-lg bg-gradient-to-b from-[#4a4035] to-[#2a2520] border-x-2 border-b-2 border-[#D4AF37]/50 z-10"
              style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.7)' }}
              initial={{ y: -32 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            />
            <div className="absolute bottom-0 w-36 h-14 rounded-lg flex items-center justify-center border-2 border-[#D4AF37]/60 bg-gradient-to-b from-[#2a2520] to-[#1a1815]" style={{ boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.5), 0 4px 16px rgba(212,175,55,0.25)' }}>
              <span className="text-xl font-bold font-mono text-[#D4AF37] tracking-tight">5 VIDA</span>
            </div>
          </div>
          <h2 className={`text-2xl font-bold uppercase tracking-wider mb-4 ${jetbrains.className}`} style={{ color: '#D4AF37' }}>
            5 VIDA CAP SUCCESSFULLY MINTED
          </h2>
          <p className="text-sm text-[#a0a0a5] mb-8">
            Your Master Key is verified. Continue to complete device binding and access your dashboard.
          </p>
          <button
            type="button"
            onClick={handleSeedSuccessContinue}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#C9A227] hover:from-[#e8c547] hover:to-[#D4AF37] text-black font-bold text-lg uppercase tracking-wider transition-all cursor-pointer"
            style={{ boxShadow: '0 0 30px rgba(212, 175, 55, 0.5)' }}
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  // Seed Verification — 3 random words before finishing registration
  if (showSeedVerification && identityAnchor && verificationIndices.length === 3) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(circle at center, rgba(212, 175, 55, 0.2) 0%, rgba(5, 5, 5, 0) 70%)' }}
          aria-hidden
        />
        <SeedVerificationStep
          indices={verificationIndices}
          onVerify={handleSeedVerificationPassed}
          onBack={() => {
            setShowSeedVerification(false);
            setShowSacredRecord(true);
            setSeedVerificationError(null);
          }}
          error={seedVerificationError}
          loading={seedVerificationLoading}
        />
      </div>
    );
  }

  // New Device Authorization: device_fingerprint !== primary_sentinel_device_id — 5s Face Pulse then update binding + Security Alert
  if (showNewDeviceAuthorization && identityAnchor) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(circle at center, rgba(212, 175, 55, 0.2) 0%, rgba(5, 5, 5, 0) 70%)' }}
          aria-hidden
        />
        <NewDeviceAuthorizationScreen
          onAuthorize={handleNewDeviceAuthorize}
          onCancel={handleNewDeviceCancel}
          loading={newDeviceMigrationScanning}
          error={newDeviceMigrationError}
        />
      </div>
    );
  }

  // First-time MASTER_ARCHITECT: device ID empty — Enrollment Mode (bypass verification, capture Master Key)
  if (showEnrollmentModeForMaster && identityAnchor) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at center, rgba(212, 175, 55, 0.2) 0%, rgba(5, 5, 5, 0) 70%)',
          }}
          aria-hidden="true"
        />
        <div
          className="relative z-10 rounded-2xl border-2 p-8 max-w-md w-full text-center"
          style={{
            background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.08) 0%, rgba(0, 0, 0, 0.9) 100%)',
            borderColor: 'rgba(212, 175, 55, 0.4)',
            boxShadow: '0 0 60px rgba(212, 175, 55, 0.2)',
          }}
        >
          <div className="text-5xl mb-4">🔑</div>
          <h2 className={`text-xl font-bold text-[#D4AF37] uppercase tracking-wider mb-3 ${jetbrains.className}`}>
            Enrollment Mode — Master Key
          </h2>
          <p className="text-sm text-[#a0a0a5] mb-6">
            Your device ID is empty. Capture your current phone&apos;s fingerprint (Canvas + Hardware UUID) as the Master Key. This is not a thumbprint — it&apos;s the Device ID.
          </p>
          <button
            type="button"
            onClick={handleEnrollmentCaptureMasterKey}
            disabled={enrollmentCapturing}
            className="relative z-50 w-full py-4 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#C9A227] hover:from-[#e8c547] hover:to-[#D4AF37] text-black font-bold text-lg uppercase tracking-wider transition-all duration-300 cursor-pointer disabled:opacity-70"
            style={{ boxShadow: '0 0 30px rgba(212, 175, 55, 0.5)' }}
          >
            {enrollmentCapturing ? 'Capturing…' : 'Capture Master Key'}
          </button>
          <button
            type="button"
            onClick={() => setShowEnrollmentModeForMaster(false)}
            className="mt-4 w-full py-2 rounded-lg border border-[#D4AF37]/50 text-[#a0a0a5] hover:bg-[#D4AF37]/10 text-sm transition-colors"
          >
            Skip — Do full verification
          </button>
        </div>
      </div>
    );
  }

  const screenBg = (
    <div
      className="absolute inset-0 opacity-20 pointer-events-none"
      style={{
        background: 'radial-gradient(circle at center, rgba(212, 175, 55, 0.2) 0%, rgba(5, 5, 5, 0) 70%)',
      }}
      aria-hidden="true"
    />
  );

  // PRE-VITALIZATION: Confirm Language → then Identity Anchor (Voice step removed)
  if (!languageConfirmed) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
        {screenBg}
        <ConfirmLanguageScreen
          onConfirm={(code) => setLanguageConfirmed(code)}
        />
      </div>
    );
  }

  // Recover My Account — enter phone + 12 words to unbind from lost device (navigate to RecoverMyAccountScreen)
  if (showRecoverFlow) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(circle at center, rgba(212, 175, 55, 0.2) 0%, rgba(5, 5, 5, 0) 70%)' }}
          aria-hidden
        />
        <RecoverMyAccountScreen
          onComplete={() => setShowRecoverFlow(false)}
          onCancel={() => setShowRecoverFlow(false)}
        />
      </div>
    );
  }

  // Identity Anchor Input (after language + vocal instruction)
  if (!identityAnchor) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4">
        {screenBg}
        <div className="relative max-w-2xl w-full flex-1 flex flex-col justify-center">
          <IdentityAnchorInput
            onAnchorVerified={handleAnchorVerified}
            title="Identity Anchor Required"
            subtitle="Enter your phone number to proceed to hardware biometric scan. Verification occurs only after the scan."
          />
        </div>
        <button
            type="button"
            onClick={() => setShowRecoverFlow(true)}
            className="mt-3 text-sm font-medium text-[#e8c547] hover:text-[#c9a227] transition-colors underline"
          >
            Lost Device? Recover Account
          </button>
        <button
          type="button"
          onClick={handleDebugInfo}
          className="mt-4 text-xs font-mono border rounded px-3 py-1.5 transition-colors"
          style={{ color: '#6b6b70', borderColor: 'rgba(212, 175, 55, 0.3)' }}
        >
          Debug Info
        </button>
        {showDebugModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80" onClick={() => setShowDebugModal(false)}>
            <div className="bg-[#0d0d0f] border rounded-lg p-6 max-w-md w-full shadow-xl" style={{ borderColor: 'rgba(212, 175, 55, 0.3)' }} onClick={(e) => e.stopPropagation()}>
              <p className="text-xs font-bold mb-1" style={{ color: '#D4AF37' }}>Current user UUID (for SQL promotion)</p>
              <p className="font-mono text-sm break-all mb-4" style={{ color: '#a0a0a5' }}>{debugUuid}</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { try { navigator.clipboard.writeText(debugUuid); } catch {} setShowDebugModal(false); }}
                  className="px-4 py-2 rounded font-bold text-black"
                  style={{ background: '#D4AF37' }}
                >
                  Copy &amp; Close
                </button>
                <button type="button" onClick={() => setShowDebugModal(false)} className="px-4 py-2 rounded border" style={{ borderColor: 'rgba(212, 175, 55, 0.5)', color: '#a0a0a5' }}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 relative transition-all duration-200">
      {/* 4/4 Layers Verified Status Bar — 200ms for instant feedback */}
      <LayerStatusBar />

      {/* Background Glow — pointer-events-none so it does not block clicks */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, rgba(212, 175, 55, 0.2) 0%, rgba(5, 5, 5, 0) 70%)',
        }}
        aria-hidden="true"
      />

      {/* Main Gate Container — z-10 so buttons receive clicks above background */}
      <div className="relative z-10 max-w-2xl w-full">
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
        <div className="text-center mb-8">
          <div className="text-6xl mb-4 animate-pulse">🔐</div>
          <h1
            className={`text-4xl font-bold text-[#D4AF37] uppercase tracking-wider mb-4 ${jetbrains.className}`}
            style={{ textShadow: '0 0 30px rgba(212, 175, 55, 0.6)' }}
          >
            Triple-Pillar Shield
          </h1>
          <p className="text-lg text-[#6b6b70]">
            {authStatus === AuthStatus.SCANNING
              ? 'Device Signature → GPS Presence → Sovereign Face (5s)'
              : 'Device Signature · GPS Presence · Sovereign Face · Hardware Fingerprint Verified'}
          </p>
        </div>

        {/* Progress Ring: Triple-Pillar Shield — Device Sig. → GPS Presence → Sovereign Face (no Voice) */}
        {authStatus === AuthStatus.SCANNING && (
          <div className="mb-8 transition-all duration-200">
            <PresenceProgressRing
              deviceVerified={pillarDevice}
              locationVerified={pillarLocation}
              faceVerified={pillarFace}
              showVoice={false}
            />
          </div>
        )}

        {/* 4-Layer Status Display when not scanning (summary) */}
        {authStatus !== AuthStatus.SCANNING && (
          <div className="mb-8 space-y-4 transition-all duration-200">
            {requiredLayers.map((layer, index) => {
              const status = getLayerStatus(layer);
              return (
                <div
                  key={layer}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 ${
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
                        Pillar {index + 1}: {getLayerName(layer)}
                      </h3>
                      <p className="text-xs text-[#6b6b70]">
                        {status === 'complete' && '✅ Verified'}
                        {status === 'active' && getLayerScanningLabel(layer)}
                        {status === 'pending' && '⏳ Waiting'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Authentication Button — z-50 above mesh; 200ms transition */}
        <motion.button
          type="button"
          onClick={handleStartAuthentication}
          disabled={authStatus === AuthStatus.SCANNING}
          className="relative z-50 w-full min-h-[48px] py-4 px-6 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#C9A227] hover:from-[#e8c547] hover:to-[#D4AF37] text-black font-bold text-xl uppercase tracking-wider transition-all duration-200 disabled:opacity-90 disabled:pointer-events-none flex items-center justify-center gap-3 touch-manipulation cursor-pointer"
          style={{ boxShadow: '0 0 40px rgba(212, 175, 55, 0.6)' }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          {authStatus === AuthStatus.SCANNING ? (
            <>
              <svg className="w-6 h-6 animate-spin shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Scanning…</span>
            </>
          ) : (
            <>⚒ Finalize Minting</>
          )}
        </motion.button>

        <button
          type="button"
          onClick={() => setShowRecoverFlow(true)}
          className="relative z-50 mt-3 w-full text-sm font-medium text-[#e8c547] hover:text-[#c9a227] transition-colors underline"
        >
          Lost Device? Recover Account
        </button>

        <button
          type="button"
          onClick={handleDebugInfo}
          className="mt-6 text-xs font-mono border rounded px-3 py-1.5 transition-colors"
          style={{ color: '#6b6b70', borderColor: 'rgba(212, 175, 55, 0.3)' }}
        >
          Debug Info
        </button>

        {showDebugModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80" onClick={() => setShowDebugModal(false)}>
            <div className="bg-[#0d0d0f] border rounded-lg p-6 max-w-md w-full shadow-xl" style={{ borderColor: 'rgba(212, 175, 55, 0.3)' }} onClick={(e) => e.stopPropagation()}>
              <p className="text-xs font-bold mb-1" style={{ color: '#D4AF37' }}>Current user UUID (for SQL promotion)</p>
              <p className="font-mono text-sm break-all mb-4" style={{ color: '#a0a0a5' }}>{debugUuid}</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { try { navigator.clipboard.writeText(debugUuid); } catch {} setShowDebugModal(false); }}
                  className="px-4 py-2 rounded font-bold text-black"
                  style={{ background: '#D4AF37' }}
                >
                  Copy &amp; Close
                </button>
                <button type="button" onClick={() => setShowDebugModal(false)} className="px-4 py-2 rounded border" style={{ borderColor: 'rgba(212, 175, 55, 0.5)', color: '#a0a0a5' }}>Close</button>
              </div>
            </div>
          </div>
        )}

        {showLocationPermissionPopup && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80" onClick={() => setShowLocationPermissionPopup(false)}>
            <div className="bg-[#0d0d0f] border-2 rounded-xl p-6 max-w-md w-full shadow-xl text-center" style={{ borderColor: '#D4AF37', boxShadow: '0 0 40px rgba(212, 175, 55, 0.3)' }} onClick={(e) => e.stopPropagation()}>
              <p className="text-lg font-bold mb-4" style={{ color: '#D4AF37' }}>Location Blocked by Browser</p>
              <p className="text-sm text-[#a0a0a5] mb-6">
                Please click the Lock icon in your address bar and select &quot;Allow Location&quot; to authorize the minting protocol and finalize your 5 VIDA cap.
              </p>
              <button
                type="button"
                onClick={() => setShowLocationPermissionPopup(false)}
                className="w-full py-3 rounded-lg font-bold text-black uppercase tracking-wider"
                style={{ background: '#D4AF37', boxShadow: '0 0 20px rgba(212, 175, 55, 0.5)' }}
              >
                OK
              </button>
            </div>
          </div>
        )}

        {authStatus === AuthStatus.FAILED && result && (
          <div className="p-6 rounded-lg bg-red-500/10 border-2 border-red-500 transition-all duration-200">
            <p className="text-red-500 font-bold text-center mb-4">
              {result.timedOut ? '⏱️ Verification Timed Out (5s)' : '❌ Authentication Failed'}
              {result.twoPillarsOnly && ' — Only 2/4 pillars met'}
            </p>
            <p className="text-sm text-[#6b6b70] text-center mb-4">{result.errorMessage}</p>
            {(result.timedOut || result.twoPillarsOnly) && (
              <p className="text-xs text-[#e8c547] text-center mb-4">
                Use Verification with Master Device or Elderly-First Manual Bypass.
              </p>
            )}
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowTimeoutBypass(false);
                  handleStartAuthentication();
                }}
                className="relative z-50 w-full py-3 rounded-lg bg-red-500 hover:bg-red-600 text-white font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer"
              >
                Retry
              </button>
              {(showVerifyFromAuthorizedDevice || result.timedOut || result.twoPillarsOnly) && (
                <button
                  type="button"
                  onClick={handleVerifyFromAuthorizedDevice}
                  className="relative z-50 w-full py-3 rounded-lg border-2 border-[#D4AF37] text-[#D4AF37] font-bold uppercase tracking-wider transition-all duration-200 hover:bg-[#D4AF37]/10 cursor-pointer"
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
          <button
            type="button"
            onClick={handleAdminPortalClick}
            disabled={adminPortalScanning}
            className="relative z-50 mt-4 text-[10px] text-[#4a4a4e] hover:text-[#6b6b70] underline underline-offset-2 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {adminPortalScanning ? 'Verifying...' : 'Admin Portal'}
          </button>
          {adminPortalError && (
            <p className="mt-2 text-xs text-red-500 max-w-sm mx-auto" role="alert">
              {adminPortalError}
            </p>
          )}
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


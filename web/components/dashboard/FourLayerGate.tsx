'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { JetBrains_Mono } from 'next/font/google';
import {
  resolveSovereignByPresence,
  verifyHubEnrollment,
  verifyLocation,
  AuthLayer,
  AuthStatus,
  type BiometricAuthResult,
  type PresencePillar,
  startLocationRequestFromUserGesture,
  startGpsWatch,
  getCompositeDeviceFingerprint,
  SCAN_TIMEOUT_MS,
  MOBILE_SCAN_TIMEOUT_MS,
  GPS_EARTH_ANCHOR_SEARCHING_MESSAGE,
} from '@/lib/biometricAuth';
import { PresenceProgressRing } from './PresenceProgressRing';
import type { GlobalIdentity } from '@/lib/phoneIdentity';
import { resolvePhoneToIdentity } from '@/lib/phoneIdentity';
import { isVocalResonanceExempt, isIdentityMinor, type BiometricIdentityRecord } from '@/lib/universalIdentityComparison';
import type { LanguageCode } from '@/lib/i18n/config';
import { getStoredLanguage } from '@/lib/i18n/config';
import { useTranslation } from '@/lib/i18n/TranslationContext';
import { ConfirmLanguageScreen } from '@/components/auth/ConfirmLanguageScreen';
import { VaultDoorAnimation } from './VaultDoorAnimation';
import { useGlobalPresenceGateway } from '@/contexts/GlobalPresenceGateway';
import { IdentityAnchorInput } from '@/components/auth/IdentityAnchorInput';
import { ManualLocationInputScreen } from '@/components/auth/ManualLocationInputScreen';
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
import { isProductionDomain } from '@/lib/utils';
import { setHumanityScoreVerified } from '@/lib/humanityScore';
import { mintFoundationSeigniorage } from '@/lib/foundationSeigniorage';
import { setMintStatus, getMintStatus, ensureMintedAndBalance, MINT_STATUS_PENDING_HARDWARE, MINT_STATUS_MINTED } from '@/lib/mintStatus';
import { hasSignedConstitution } from '@/lib/legalApprovals';
import { setIdentityAnchorForSession, getIdentityAnchorPhone, isSentinelActive } from '@/lib/sentinelActivation';
import { getCurrentUserRole, setRoleCookie, getProfileWithPrimarySentinel } from '@/lib/roleAuth';
import { ensureGenesisIfEmpty } from '@/lib/auth';
import { isFirstRegistration, creditArchitectVidaGrant } from '@/lib/masterArchitectInit';
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
import { storeRecoverySeedWithFaceAndMint, hasRecoverySeed, confirmRecoverySeedStored, confirmFaceAndSeedStored } from '@/lib/recoverySeedStorage';
import { getStoredBiometricAnchors, getFaceHashFromSession, syncPersistentFaceHashToSession, deriveFaceHashFromCredential } from '@/lib/biometricAnchorSync';
import { setVitalizationAnchor, getVitalizationAnchor, clearVitalizationAnchor, type VitalizationAnchor as VitalizationAnchorType } from '@/lib/vitalizationAnchor';
import { getTimeBasedGreeting } from '@/lib/timeBasedGreeting';
import type { DeviceInfo } from '@/lib/multiDeviceVitalization';
import { RecoverMyAccountScreen } from '@/components/auth/RecoverMyAccountScreen';
import { BiometricPillar, type BiometricPillarHandle } from '@/components/auth/BiometricPillar';
import { AwaitingLoginApproval } from '@/components/auth/AwaitingLoginApproval';
import { LoginRequestListener } from '@/components/dashboard/LoginRequestListener';
import { LoginQRDisplay } from '@/components/auth/LoginQRDisplay';
import { ArchitectVisionCapture } from '@/components/auth/ArchitectVisionCapture';
import { speakSovereignAlignmentFailed, speakVitalizationSuccess } from '@/lib/sovereignVoice';
import { useBiometricSession } from '@/contexts/BiometricSessionContext';
import { createLoginRequest, verifyFaceAndCreateLoginRequest, completeLoginBridge } from '@/lib/loginRequest';
import { setTripleAnchorVerified } from '@/lib/tripleAnchor';
import { getAssertion, createCredential, isWebAuthnSupported } from '@/lib/webauthn';
import { getLinkedMobileDeviceId, isSubDevice } from '@/lib/phoneIdBridge';
import { useSoftStart, incrementTrustLevel } from '@/lib/trustLevel';
import { recordDailyScan, getVitalizationStatus, DAILY_UNLOCK_VIDA_AMOUNT } from '@/lib/vitalizationRitual';
import { LEARNING_MODE_DAYS, getLearningModeMessage, LEDGER_SYNC_MESSAGE } from '@/lib/learningMode';
import { getBiometricStrictness, strictnessToConfig } from '@/lib/biometricStrictness';
import dynamic from 'next/dynamic';
import { saveFourPillars, savePillarsAt75, getCurrentGeolocation, generateAndSaveSovereignRoot, generateAndSaveSovereignRootFaceDevice } from '@/lib/fourPillars';
import { getSupabase } from '@/lib/supabase';
import { deriveDeviceHashFromCredentialId } from '@/lib/sovereignRoot';
import { IdentityState } from '@/lib/identityState';

/**
 * Face + Device pipeline (no palm): bind WebAuthn credential and generate sovereign hash.
 * Binding = create a new passkey for this site (createCredential). Do NOT use getAssertion first —
 * that would show "Sign in with QR code or security key" instead of "Create passkey for this website".
 * DeviceHash = SHA-256(credentialId). Fail gracefully if WebAuthn unavailable.
 */
async function runDeviceBindingAndSovereignHash(
  phone: string,
  faceHash: string,
  deviceId: string,
  displayName: string
): Promise<{ ok: true; deviceHash: string } | { ok: false; error: string }> {
  if (!isWebAuthnSupported()) {
    return { ok: false, error: 'Device binding requires WebAuthn/Passkeys. Please use a supported browser.' };
  }
  let credentialId: string;
  try {
    const created = await createCredential(phone, displayName);
    if (!created?.id) return { ok: false, error: 'Passkey creation was cancelled or failed.' };
    credentialId = created.id;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg || 'Device binding failed.' };
  }
  const deviceHash = await deriveDeviceHashFromCredentialId(credentialId);
  const saved = await generateAndSaveSovereignRootFaceDevice(phone, faceHash, deviceHash, deviceId);
  if (!saved.ok) return saved;
  const { linkPasskeyToDeviceAnchors } = await import('@/lib/deviceAnchors');
  await linkPasskeyToDeviceAnchors(credentialId, phone, faceHash);
  return { ok: true, deviceHash };
}

import { DailyUnlockCelebration } from '@/components/dashboard/DailyUnlockCelebration';
import { useSovereignCompanion } from '@/contexts/SovereignCompanionContext';
import { IS_PUBLIC_REVEAL, isVettedUser, isArchitect, isDesktop } from '@/lib/publicRevealAccess';
import { ENABLE_GPS_AS_FOURTH_PILLAR, ROUTES } from '@/lib/constants';
import { setVitalizationComplete } from '@/lib/vitalizationState';
import { anchorIdentityToDevice } from '@/lib/sovereignSSO';
import { recordClockIn, getLastClockInCoords } from '@/lib/workPresence';
import { QuadPillarGrid } from '@/components/dashboard/QuadPillarShield';

const jetbrains = JetBrains_Mono({ weight: ['400', '600', '700'], subsets: ['latin'] });

const VERIFIED_PILLARS_KEY = 'pff_verified_pillars';
const VERIFIED_PILLARS_TTL_MS = 5 * 60 * 1000; // 5 min — resume without re-scanning
/** Session persistence: when user starts scan, set so refresh keeps them on gate. */
const SOV_STATUS_KEY = 'sov_status';

function hashForStorage(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i);
  return (h >>> 0).toString(16).slice(0, 10);
}

function saveVerifiedPillar(phone: string, pillar: 'face' | 'palm' | 'device'): void {
  try {
    if (typeof sessionStorage === 'undefined') return;
    const key = `${VERIFIED_PILLARS_KEY}_${hashForStorage(phone)}`;
    const raw = sessionStorage.getItem(key);
    const data = raw ? (JSON.parse(raw) as Record<string, number>) : {};
    data[pillar] = Date.now();
    sessionStorage.setItem(key, JSON.stringify(data));
  } catch {
    // ignore
  }
}

function getVerifiedPillarsForResume(phone: string): { face: boolean; palm: boolean; device: boolean } | null {
  try {
    if (typeof sessionStorage === 'undefined') return null;
    const key = `${VERIFIED_PILLARS_KEY}_${hashForStorage(phone)}`;
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const data = JSON.parse(raw) as Record<string, number>;
    const now = Date.now();
    if (now - (data.face ?? 0) > VERIFIED_PILLARS_TTL_MS) return null;
    if (now - (data.device ?? 0) > VERIFIED_PILLARS_TTL_MS) return null;
    // Palm optional (removed from UI); device binding = second pillar. For resume, face + device suffice.
    const palmOk = (data.palm ?? data.device ?? 0) > 0 && now - (data.palm ?? data.device ?? 0) <= VERIFIED_PILLARS_TTL_MS;
    return { face: true, palm: palmOk, device: true };
  } catch {
    return null;
  }
}

function clearVerifiedPillars(phone: string): void {
  try {
    if (typeof sessionStorage === 'undefined') return;
    const key = `${VERIFIED_PILLARS_KEY}_${hashForStorage(phone)}`;
    sessionStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export interface FourLayerGateProps {
  /** Hub verification (PC): force external fingerprint, then set MINTED and mint; redirect to /dashboard?minted=1 */
  hubVerification?: boolean;
}

/**
 * 4-LAYER HANDSHAKE GATE (UNIVERSAL 1-TO-1 IDENTITY MATCHING)
 * Mandatory authentication gate for entire PFF system
 * Requires Identity Anchor (phone number) BEFORE biometric scan
 * No access to any page without completing all 4 layers
 */
export function FourLayerGate({ hubVerification = false }: FourLayerGateProps = {}) {
  const { t } = useTranslation();
  const { setVerified: setBiometricSessionVerified } = useBiometricSession();
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
  /** PRE-VITALIZATION: Confirm Language → Identity Anchor. App download is optional (by choice), not required for flow. */
  const [languageConfirmed, setLanguageConfirmed] = useState<LanguageCode | null>(null);
  /** Recover My Account: enter phone + 12 words to unbind from lost device */
  const [showRecoverFlow, setShowRecoverFlow] = useState(false);

  const GATE_IDENTITY_STORAGE_KEY = 'pff_gate_identity_anchor';
  const [showMismatchScreen, setShowMismatchScreen] = useState(false);
  const [mismatchData, setMismatchData] = useState<{
    type: MismatchEventType;
    variance: number;
    similarity: number;
    useSoftMessage?: boolean;
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
  /** Sovereign Constitution Entry Gate: must sign constitution before 10 VIDA mint; re-sign if version changed */
  const [showConstitutionGate, setShowConstitutionGate] = useState(false);
  /** 5s scan timeout: show Retry or Master Device Bypass */
  const [showTimeoutBypass, setShowTimeoutBypass] = useState(false);
  /** Debug Info: show current user UUID for manual SQL promotion */
  const [showDebugModal, setShowDebugModal] = useState(false);
  const [debugUuid, setDebugUuid] = useState<string>('');
  /** Progress Ring: Sovereign Face → Device (Passkey) → Identity Anchor (Triple-Pillar). Optional 4th: GPS. */
  const [pillarFace, setPillarFace] = useState(false);
  const [pillarPalm, setPillarPalm] = useState(false);
  const [pillarDevice, setPillarDevice] = useState(false);
  const [pillarLocation, setPillarLocation] = useState(false);
  /** Resolve ref for second pillar (Device binding) — resolved when passkey binding completes. */
  const palmResolveRef = useRef<(() => void) | null>(null);
  /** Quad-Pillar: all 4 pillars passed; show Clock-In button before proceeding. */
  const [quadPillarAwaitingClockIn, setQuadPillarAwaitingClockIn] = useState(false);
  /** Location permission required — show gold popup to allow access */
  const [showLocationPermissionPopup, setShowLocationPermissionPopup] = useState(false);
  /** GPS taking >3s — show "Initializing Protocol..." (indoor mode) */
  const [gpsTakingLong, setGpsTakingLong] = useState(false);
  /** GPS no response after 10s — show Self-Certify so user is not stuck */
  const [gpsSelfCertifyAvailable, setGpsSelfCertifyAvailable] = useState(false);
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
  /** Industrial-only: scanner serial + fingerprint hash from last successful verification (for Sentinel ID tagging). */
  const [lastExternalScannerSerial, setLastExternalScannerSerial] = useState<string | null>(null);
  /** Architect Vision: camera + face mesh overlay during Face Pulse; closes when face verified (gold freeze) or on cancel/fail */
  const [showArchitectVision, setShowArchitectVision] = useState(false);
  /** When true, Architect Vision shows gold freeze then onComplete; when false/null, scanning or closed */
  const [architectVerificationSuccess, setArchitectVerificationSuccess] = useState<boolean | null>(null);
  const architectSuccessRef = useRef<{
    authResult: BiometricAuthResult;
    identityAnchor: { phone: string; name: string; vocalExempt?: boolean; isMinor?: boolean; guardianPhone?: string; isDependent?: boolean };
    isNewDevice: boolean;
    deviceInfo: DeviceInfo;
    compositeDeviceId: string;
    effectiveMobile: boolean;
  } | null>(null);
  const [lastExternalFingerprintHash, setLastExternalFingerprintHash] = useState<string | null>(null);
  /** Mobile short-circuit: hide Fingerprint pillar; Complete Initial Registration and set mint_status PENDING_HARDWARE. */
  const [isMobile, setIsMobile] = useState(false);
  /** Login via phone: computer creates login_request → phone approves → computer (Realtime) logs into Vault. */
  const [loginRequestId, setLoginRequestId] = useState<string | null>(null);
  const [showAwaitingLoginApproval, setShowAwaitingLoginApproval] = useState(false);
  /** Hard Navigation Lock: 1s transition spinner before replace to dashboard so DB can catch up; prevents back-stack re-entry. */
  const [transitioningToDashboard, setTransitioningToDashboard] = useState(false);
  /** Master Architect Initialization: first person to register in empty DB gets Low sensitivity + Architect role + 5 VIDA. */
  const [isFirstRun, setIsFirstRun] = useState(false);
  /** Phone ID Bridge: on PC, show linked mobile device ID from profiles (primary_sentinel_device_id). */
  const [linkedDevice, setLinkedDevice] = useState<{ maskedId: string; deviceName: string | null } | null>(null);
  /** Soft Start: first 10 logins use LOW sensitivity (no strict lighting/confidence barriers). */
  const [softStart, setSoftStart] = useState(true);
  /** Daily Unlock Celebration: full-screen overlay when recordDailyScan confirms $100 (0.1 VIDA) added (Days 2–9). */
  const [showDailyUnlockCelebration, setShowDailyUnlockCelebration] = useState(false);
  const [celebrationData, setCelebrationData] = useState<{ streak: number; newSpendableVida?: number; isDay9: boolean } | null>(null);
  /** Legacy state (unused; palm scan removed). Kept to avoid breaking refs. */
  const [showPalmPulse, setShowPalmPulse] = useState(false);
  const [showSovereignPalmScan, setShowSovereignPalmScan] = useState(false);
  /** Device binding / second-pillar error message. */
  const [palmPulseError, setPalmPulseError] = useState<string | null>(null);
  /** Device (Passkey) binding: show after face verified so user clicks to trigger WebAuthn (browser requires user gesture). */
  const [showDeviceBindingPrompt, setShowDeviceBindingPrompt] = useState(false);
  const [deviceBindingParams, setDeviceBindingParams] = useState<{
    phone: string;
    faceHash: string;
    deviceId: string;
    displayName: string;
  } | null>(null);
  const deviceBindingOnSuccessRef = useRef<(() => void) | null>(null);
  /** Architect Mode: when active in session, show Debug Info on mobile too. */
  const [architectMode, setArchitectMode] = useState(false);
  /** Face Pulse fail count: after 2 failures show "Use Backup Anchor" (Sovereign Palm + Device ID only). */
  const [faceFailCount, setFaceFailCount] = useState(0);
  /** 9-Day Learning Mode: when streak < 9, failed verification does NOT block; show soft message. */
  const learningModeRef = useRef<{ active: boolean; day: number }>({ active: false, day: 1 });
  /** Show Learning Mode message instead of BiologicalMismatchScreen when in grace period. */
  const [showLearningModeMessage, setShowLearningModeMessage] = useState(false);
  /** Registration flow: subtle toast instead of mismatch lockout (Scan not clear. Please try again.) */
  const [scanToast, setScanToast] = useState<string | null>(null);
  /** When presence_handshakes write fails (e.g. identity_mesh_hash column missing). */
  const [ledgerSyncError, setLedgerSyncError] = useState(false);
  /** GPS failed: manual city/country entry to proceed */
  const [showManualLocationInput, setShowManualLocationInput] = useState(false);
  const gpsFailureAuthRef = useRef<{ identityAnchor: typeof identityAnchor } | null>(null);
  const gpsAutoRedirectDoneRef = useRef(false);
  /** At 75% (Face + Device): save hash, mint VIDA CAP, set Vitalized — run once; reset on resetVerification. */
  const at75FiredRef = useRef(false);
  /** Biometric sensitivity for Architect Vision: from profile slider; overridden by soft-start (streak < 10 or first run) to 0.3 / no brightness. */
  const [visionConfidenceThreshold, setVisionConfidenceThreshold] = useState(0.3);
  const [visionEnforceBrightness, setVisionEnforceBrightness] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setPresenceVerified } = useGlobalPresenceGateway();
  const { setSpendableVidaAnimation } = useSovereignCompanion();
  /** Persistent Vitalization: when device has is_vitalized anchor, show instant login (face-only) or "Vitalize Someone Else". */
  const [instantLoginAnchor, setInstantLoginAnchor] = useState<VitalizationAnchorType | null>(null);
  const [showInstantLoginScreen, setShowInstantLoginScreen] = useState(false);
  const [instantLoginScanning, setInstantLoginScanning] = useState(false);
  const [instantLoginError, setInstantLoginError] = useState<string | null>(null);
  const [showWelcomeHome, setShowWelcomeHome] = useState(false);
  const [welcomeGreeting, setWelcomeGreeting] = useState('');
  const skipInstantLoginRef = useRef(false);

  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      setIsMobile(/Android|iPhone|iPad|iPod|webOS|Mobile/i.test(navigator.userAgent));
    }
  }, []);

  useEffect(() => {
    if (typeof sessionStorage === 'undefined') return;
    setArchitectMode(sessionStorage.getItem('pff_architect_mode') === '1');
  }, []);

  /** Persistent Vitalization: on mount, try getVitalizationAnchor (runs deep recovery if storage cleared). If is_vitalized, show instant-login screen. */
  useEffect(() => {
    if (skipInstantLoginRef.current) return;
    let cancelled = false;
    getVitalizationAnchor().then((anchor) => {
      if (cancelled) return;
      if (anchor.isVitalized && anchor.citizenHash) {
        setInstantLoginAnchor(anchor);
        setShowInstantLoginScreen(true);
      }
    });
    return () => { cancelled = true; };
  }, []);

  /** When user enters phone number: if this device already has confirmation for that phone (face + palm saved), show instant login so they can open with face scan. */
  useEffect(() => {
    const phone = identityAnchor?.phone?.trim();
    if (!phone || skipInstantLoginRef.current || showInstantLoginScreen) return;
    let cancelled = false;
    getVitalizationAnchor().then((anchor) => {
      if (cancelled) return;
      if (anchor.isVitalized && anchor.citizenHash && (anchor.phone ?? '').trim() === phone) {
        setInstantLoginAnchor(anchor);
        setShowInstantLoginScreen(true);
      }
    });
    return () => { cancelled = true; };
  }, [identityAnchor?.phone, showInstantLoginScreen]);

  /** Sub device: when phone is entered on a different device, show face-verify screen. Only same face can request access; different face never gains access. */
  const [showSubDeviceFaceVerify, setShowSubDeviceFaceVerify] = useState(false);
  const [subDeviceFaceError, setSubDeviceFaceError] = useState<string | null>(null);
  const subDeviceDetectedRef = useRef<string | null>(null);
  useEffect(() => {
    const phone = identityAnchor?.phone?.trim();
    if (!phone || showInstantLoginScreen || showAwaitingLoginApproval || loginRequestId || showSubDeviceFaceVerify) return;
    if (subDeviceDetectedRef.current === phone) return;
    let cancelled = false;
    isSubDevice(phone).then((sub) => {
      if (cancelled) return;
      if (sub) {
        subDeviceDetectedRef.current = phone;
        setSubDeviceFaceError(null);
        setShowSubDeviceFaceVerify(true);
      }
    });
    return () => { cancelled = true; };
  }, [identityAnchor?.phone, showInstantLoginScreen, showAwaitingLoginApproval, loginRequestId, showSubDeviceFaceVerify]);

  const handleInstantLoginFaceScan = useCallback(async () => {
    const phone = instantLoginAnchor?.phone ?? getIdentityAnchorPhone();
    if (!instantLoginAnchor?.citizenHash || !phone) return;
    setInstantLoginError(null);
    setInstantLoginScanning(true);
    try {
      const assertion = await getAssertion();
      if (!assertion?.credential) {
        setInstantLoginError('Face scan cancelled or unavailable. Try again.');
        return;
      }
      const cred = assertion.credential;
      const credentialForHash = {
        id: cred.id,
        rawId: cred.rawId,
        response: {
          clientDataJSON: cred.response.clientDataJSON,
          authenticatorData: cred.response.authenticatorData,
        },
      };
      const liveHash = await deriveFaceHashFromCredential(credentialForHash);
      const stored = (instantLoginAnchor.citizenHash ?? '').trim();
      if (liveHash.trim() !== stored) {
        setInstantLoginError('Face did not match. Try again or use Vitalize New Soul.');
        return;
      }
      setIdentityAnchorForSession(phone);
      setPresenceVerified(true);
      setSessionIdentity(phone);
      setWelcomeGreeting(getTimeBasedGreeting());
      setShowWelcomeHome(true);
      try { localStorage.removeItem(SOV_STATUS_KEY); } catch { /* ignore */ }
      setTimeout(() => router.replace(ROUTES.DASHBOARD), 2600);
    } catch (e) {
      setInstantLoginError(e instanceof Error ? e.message : 'Face scan failed. Try again.');
    } finally {
      setInstantLoginScanning(false);
    }
  }, [instantLoginAnchor, router, setPresenceVerified]);

  const handleVitalizeSomeoneElse = useCallback(() => {
    clearVitalizationAnchor();
    skipInstantLoginRef.current = true;
    setInstantLoginAnchor(null);
    setShowInstantLoginScreen(false);
  }, []);

  /** Debug Info: only on non-production; on mobile, only when Architect Mode is active in session. */
  const showDebugInfo = !isProductionDomain() && (!isMobile || architectMode);

  // Phone ID Bridge: on PC, fetch linked mobile device ID from profiles for display
  useEffect(() => {
    if (!identityAnchor?.phone || isMobile) {
      setLinkedDevice(null);
      return;
    }
    getLinkedMobileDeviceId(identityAnchor.phone).then((info) => {
      if (info) setLinkedDevice({ maskedId: info.maskedId, deviceName: info.deviceName });
      else setLinkedDevice(null);
    });
  }, [identityAnchor?.phone, isMobile]);

  // Soft Start: use low sensitivity for first 10 successful logins
  useEffect(() => {
    if (!identityAnchor?.phone) return;
    useSoftStart(identityAnchor.phone).then(setSoftStart);
  }, [identityAnchor?.phone]);

  // Master Architect Initialization: detect empty DB so first registrant gets Low sensitivity and Architect role
  useEffect(() => {
    if (!identityAnchor?.phone) return;
    isFirstRegistration().then((r) => {
      if (r.isFirst) setIsFirstRun(true);
    });
  }, [identityAnchor?.phone]);

  // Wire Biometric Slider to Face Pulse: fetch strictness + vitalization streak; soft-start (streak < 10 or first run) forces 0.3 / no brightness
  useEffect(() => {
    if (!identityAnchor?.phone) return;
    let cancelled = false;
    Promise.all([
      getVitalizationStatus(identityAnchor.phone),
      getBiometricStrictness(identityAnchor.phone),
    ]).then(([status, strictness]) => {
      if (cancelled) return;
      const streak = status?.streak ?? 0;
      const enforceSoftStart = streak < 10 || isFirstRun;
      if (enforceSoftStart) {
        setVisionConfidenceThreshold(0.3);
        setVisionEnforceBrightness(false);
      } else {
        const config = strictnessToConfig(strictness);
        setVisionConfidenceThreshold(config.confidenceThreshold);
        setVisionEnforceBrightness(config.enforceBrightnessCheck);
      }
    });
    return () => { cancelled = true; };
  }, [identityAnchor?.phone, isFirstRun]);

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

  /** Reset all Approved statuses so user must do a fresh scan every time (e.g. on exit). */
  const resetVerification = useCallback(() => {
    at75FiredRef.current = false;
    setPillarFace(false);
    setPillarPalm(false);
    setPillarDevice(false);
    setPillarLocation(false);
    setQuadPillarAwaitingClockIn(false);
    setResult(null);
    setAuthStatus(AuthStatus.IDLE);
    setCurrentLayer(null);
    setShowTimeoutBypass(false);
    setShowVerifyFromAuthorizedDevice(false);
    setShowMismatchScreen(false);
    setMismatchData(null);
    setShowLearningModeMessage(false);
    setGpsTakingLong(false);
    setGpsSelfCertifyAvailable(false);
    gpsAutoRedirectDoneRef.current = false;
    setLedgerSyncError(false);
    try {
      if (typeof localStorage !== 'undefined') {
        const keys: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k?.startsWith('pff_pillar_')) keys.push(k);
        }
        keys.forEach((k) => localStorage.removeItem(k));
      }
    } catch {
      // ignore
    }
  }, []);

  /** Hydrate pillar state from backend so already-confirmed pillars stay; no going back to registration. */
  const hydratePillarsDoneRef = useRef<string | null>(null);
  useEffect(() => {
    const phone = identityAnchor?.phone?.trim();
    if (!phone || !mounted) return;
    if (hydratePillarsDoneRef.current === phone) return;
    hydratePillarsDoneRef.current = phone;
    const supabase = getSupabase();
    if (!supabase) return;
    (async () => {
      try {
        const { data } = await (supabase as any)
          .from('user_profiles')
          .select('face_hash, palm_hash, anchor_device_id, anchor_geolocation')
          .eq('phone_number', phone)
          .maybeSingle();
        if (!data) return;
        setPillarFace((prev) => prev || !!(data.face_hash && String(data.face_hash).trim()));
        setPillarPalm((prev) => prev || !!(data.palm_hash && String(data.palm_hash).trim()));
        setPillarDevice((prev) => prev || !!(data.anchor_device_id && String(data.anchor_device_id).trim()));
        const geo = data.anchor_geolocation;
        if (geo && (typeof geo === 'object' ? (geo.latitude != null && geo.longitude != null) : false)) {
          setPillarLocation((prev) => prev || true);
        }
      } catch {
        // ignore
      }
    })();
  }, [identityAnchor?.phone, mounted]);

  // Hydration sync + restore language/identity so redirect from architect (or any protected route) doesn't bounce back to language
  useEffect(() => {
    setMounted(true);
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

  // ZERO-PERSISTENCE SESSION INITIALIZATION
  // Reset to Layer 1 on every entry (app initialization or foreground)
  useEffect(() => {
    if (!mounted) return;
    initializeZeroPersistenceSession();
    resetSessionToLayer1();
    setSessionStatus(getSessionStatus());
  }, [mounted]);

  // Update session status periodically (ref so we can clear when all pillars verified — stops flickering)
  const sessionStatusIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    const interval = setInterval(() => {
      setSessionStatus(getSessionStatus());
    }, 1000);
    sessionStatusIntervalRef.current = interval;
    return () => {
      if (sessionStatusIntervalRef.current) clearInterval(sessionStatusIntervalRef.current);
      sessionStatusIntervalRef.current = null;
    };
  }, []);

  // On exit: clear all Approved statuses so next entry requires fresh scan
  useEffect(() => {
    return () => {
      resetVerification();
    };
  }, [resetVerification]);

  // When GPS pillar is active and scanning, after 5s show "Initializing Protocol..." and Grant Location button
  useEffect(() => {
    if (currentLayer !== AuthLayer.GPS_LOCATION || authStatus !== AuthStatus.SCANNING) return;
    const t = setTimeout(() => setGpsTakingLong(true), 5000);
    return () => clearTimeout(t);
  }, [currentLayer, authStatus]);

  // If GPS doesn't respond in 10s, allow Self-Certify so user is not stuck (Pillar 4)
  useEffect(() => {
    if (authStatus !== AuthStatus.SCANNING || pillarLocation || !identityAnchor || !ENABLE_GPS_AS_FOURTH_PILLAR) return;
    const t = setTimeout(() => setGpsSelfCertifyAvailable(true), 10000);
    return () => clearTimeout(t);
  }, [authStatus, pillarLocation, identityAnchor]);

  // Auto-trigger: when face + device + anchor verified and GPS not, redirect to GPS Manual Setup (one-way flow)
  const gpsRedirectToManualSetupDoneRef = useRef(false);
  useEffect(() => {
    if (!ENABLE_GPS_AS_FOURTH_PILLAR || pillarLocation || gpsRedirectToManualSetupDoneRef.current) return;
    if (pillarFace && pillarPalm) {
      gpsRedirectToManualSetupDoneRef.current = true;
      setAuthStatus(AuthStatus.IDLE);
      router.push(ROUTES.VITALIZATION_GPS_MANUAL_SETUP);
    }
  }, [pillarFace, pillarPalm, pillarDevice, pillarLocation, router]);

  // GPS backgrounding: start watchPosition while camera (Face scan) is active so Pillar 4 locks coords in background
  useEffect(() => {
    if (!identityAnchor?.phone || !ENABLE_GPS_AS_FOURTH_PILLAR) return;
    const cameraActive = showArchitectVision;
    if (!cameraActive) return;
    const unwatch = startGpsWatch(identityAnchor.phone);
    return unwatch;
  }, [showArchitectVision, identityAnchor?.phone]);

  /** At 75% (Face + Device): save hash to Supabase, mint VIDA CAP, set Vitalized. Run once. */
  useEffect(() => {
    if (!identityAnchor?.phone || at75FiredRef.current) return;
    const at75 = pillarFace && pillarPalm; // Face + Device (Passkey) = 75% — triggers mint
    if (!at75) return;
    at75FiredRef.current = true;
    (async () => {
      try {
        const phone = identityAnchor.phone.trim();
        const supabase = getSupabase();
        const { data: profile } = supabase
          ? await (supabase as any).from('user_profiles').select('face_hash, palm_hash, anchor_device_id').eq('phone_number', phone).maybeSingle()
          : { data: null };
        const faceHash = (profile?.face_hash ?? getFaceHashFromSession(phone) ?? '').trim();
        const secondHash = (profile?.palm_hash ?? '').trim(); // device hash stored in palm_hash column
        const deviceInfo = getCurrentDeviceInfo();
        const deviceId = (profile?.anchor_device_id ?? deviceInfo?.deviceId ?? '').trim() || (deviceInfo?.deviceId ?? '');
        const hashesValid = faceHash.length === 64 && secondHash.length === 64 && /^[0-9a-fA-F]+$/.test(faceHash) && /^[0-9a-fA-F]+$/.test(secondHash);
        if (hashesValid && deviceId) {
          const save = await savePillarsAt75(phone, faceHash, secondHash, deviceId);
          if (save.ok) {
            await mintFoundationSeigniorage(phone, { faceHash });
            setVitalizationComplete();
            const rootResult = await generateAndSaveSovereignRoot(faceHash, secondHash, phone, deviceId, 'default');
            if (!rootResult.ok) {
              console.warn('Sovereign root (Merkle) save failed:', rootResult.error);
            }
            void setVitalizationAnchor(faceHash, phone, secondHash);
            void anchorIdentityToDevice(faceHash, phone);
          }
        }
      } catch (_) {
        at75FiredRef.current = false;
      }
    })();
  }, [identityAnchor?.phone, pillarFace, pillarPalm]);

  /** Architect Override: when all 4 pillars verified, save Face+Device+GPS to Supabase, then save passkey to device, then set state before QuadPillarGrid redirects. */
  const handleAllPillarsVerified = useCallback(async () => {
    if (sessionStatusIntervalRef.current) {
      clearInterval(sessionStatusIntervalRef.current);
      sessionStatusIntervalRef.current = null;
    }
    const phone = identityAnchor?.phone?.trim();
    const displayName = identityAnchor?.name?.trim() || phone || 'Sovereign';
    if (phone) {
      try {
        const supabase = getSupabase();
        const { data: profile } = supabase
          ? await (supabase as any).from('user_profiles').select('face_hash, palm_hash').eq('phone_number', phone).maybeSingle()
          : { data: null };
        const faceHash = (profile?.face_hash ?? getFaceHashFromSession(phone) ?? '').trim();
        const palmHash = (profile?.palm_hash ?? '').trim();
        const deviceInfo = getCurrentDeviceInfo();
        const deviceId = deviceInfo?.deviceId ?? '';
        const geo = await getCurrentGeolocation();
        const hashesValid = faceHash.length === 64 && palmHash.length === 64 && /^[0-9a-fA-F]+$/.test(faceHash) && /^[0-9a-fA-F]+$/.test(palmHash);
        if (hashesValid && deviceId && geo) {
          await saveFourPillars(phone, faceHash, palmHash, deviceId, geo);
          const rootResult = await generateAndSaveSovereignRoot(faceHash, palmHash, phone, deviceId, 'default');
          if (!rootResult.ok) {
            console.warn('Sovereign root (Merkle) save failed:', rootResult.error);
          }
          // Confirm to this device: phone + face + palm so site opens when phone is entered or camera sees face/palm.
          void setVitalizationAnchor(faceHash, phone, palmHash);
          void anchorIdentityToDevice(faceHash, phone);
        }
        // After successful vitalization: save passkey for the site to this device (no prompt before vitalization).
        try {
          await createCredential(phone, displayName);
        } catch (_) {
          // passkey registration optional; user can still use the site
        }
      } catch (_) {
        // non-blocking; FourPillarsGuard will redirect back if not saved
      }
    }
    setPresenceVerified(true);
    if (phone) setIdentityAnchorForSession(phone);
    setVitalizationComplete();
  }, [identityAnchor?.phone, identityAnchor?.name, setPresenceVerified]);

  const getLayerIcon = (layer: AuthLayer) => {
    switch (layer) {
      case AuthLayer.BIOMETRIC_SIGNATURE:
        return '👤';
      case AuthLayer.SOVEREIGN_PALM:
      case AuthLayer.VOICE_PRINT:
        return '🔑';
      case AuthLayer.HARDWARE_TPM:
        return '📱';
      case AuthLayer.GENESIS_HANDSHAKE:
        return '🤝';
      case AuthLayer.GPS_LOCATION:
        return '📍';
      default:
        return '🔒';
    }
  };

  /** Triple-Pillar Shield labels: Face → Device → Phone Anchor → GPS. Identity = Face + Device. */
  const getLayerName = (layer: AuthLayer) => {
    switch (layer) {
      case AuthLayer.BIOMETRIC_SIGNATURE:
        return 'Sovereign Face';
      case AuthLayer.SOVEREIGN_PALM:
        return 'Device';
      case AuthLayer.VOICE_PRINT:
        return 'Device';
      case AuthLayer.HARDWARE_TPM:
        return 'Phone Anchor';
      case AuthLayer.GENESIS_HANDSHAKE:
        return 'Phone Anchor';
      case AuthLayer.GPS_LOCATION:
        return 'GPS Presence';
      default:
        return 'Unknown';
    }
  };

  /** Scanning-state copy for Face → Device → Identity Anchor; GPS >3s shows indoor mode. */
  const getLayerScanningLabel = (layer: AuthLayer) => {
    if (layer === AuthLayer.GPS_LOCATION && gpsTakingLong) {
      return 'Initializing Protocol...';
    }
    switch (layer) {
      case AuthLayer.SOVEREIGN_PALM:
        return 'Binding this device (Passkey)...';
      case AuthLayer.HARDWARE_TPM:
        return 'Verifying Phone Anchor (device on record)...';
      case AuthLayer.GPS_LOCATION:
        return 'Acquiring GPS Presence...';
      case AuthLayer.BIOMETRIC_SIGNATURE:
        return 'Resolving Sovereign Face...';
      case AuthLayer.VOICE_PRINT:
        return 'Binding this device...';
      case AuthLayer.GENESIS_HANDSHAKE:
        return 'Phone Anchor...';
      default:
        return 'Verifying...';
    }
  };

  /** Face → Device → Identity Anchor (Phone). Optional 4th: GPS. Minors: Face + Identity Anchor. One face = one mint. */
  const effectiveMobile = isMobile && !hubVerification;
  const requiredLayers = identityAnchor?.isMinor
    ? [AuthLayer.BIOMETRIC_SIGNATURE, AuthLayer.HARDWARE_TPM]
    : [
        AuthLayer.BIOMETRIC_SIGNATURE,
        AuthLayer.SOVEREIGN_PALM,
        AuthLayer.HARDWARE_TPM,
        ...(ENABLE_GPS_AS_FOURTH_PILLAR ? [AuthLayer.GPS_LOCATION] : []),
      ];

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
    const isBeginVitalization = !payload.identity || payload.fullName === 'Citizen';
    if (isBeginVitalization) {
      setPillarFace(false);
      setPillarPalm(false);
      setPillarDevice(false);
      setPillarLocation(false);
      clearVerifiedPillars(payload.phoneNumber);
      try {
        if (typeof localStorage !== 'undefined') {
          const keys: string[] = [];
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k?.startsWith('pff_pillar_')) keys.push(k);
          }
          keys.forEach((k) => localStorage.removeItem(k));
        }
      } catch {
        // ignore
      }
    }
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
    setIdentityAnchorForSession(payload.phoneNumber);
    try {
      const json = JSON.stringify(anchor);
      sessionStorage.setItem(GATE_IDENTITY_STORAGE_KEY, json);
      localStorage.setItem(GATE_IDENTITY_STORAGE_KEY, json);
    } catch {
      // ignore
    }
  };

  const biometricPendingRef = useRef(false);
  const biometricPillarRef = useRef<BiometricPillarHandle>(null);

  /** Triple-Pillar success: Device + GPS + Face verified (no Voice). Transition to Success/Dashboard. Mobile: skip mint when PENDING_HARDWARE. Hub: always set MINTED and mint, then redirect. Mint authority = face (one face = one mint). */
  const goToDashboard = useCallback(async () => {
    if (!identityAnchor) return;
    const signed = await hasSignedConstitution(identityAnchor.phone);
    if (!signed) {
      setShowConstitutionGate(true);
      return;
    }
    const stored = await getStoredBiometricAnchors(identityAnchor.phone);
    const faceHashForMint = getFaceHashFromSession(identityAnchor.phone) ?? (stored.ok ? (stored.anchors.face_hash?.trim() ?? null) : null);
    const mintOpts = faceHashForMint && faceHashForMint.length === 64 ? { faceHash: faceHashForMint } : undefined;
    if (hubVerification) {
      await setMintStatus(identityAnchor.phone, MINT_STATUS_MINTED);
      await mintFoundationSeigniorage(identityAnchor.phone, mintOpts);
    } else {
      const mintRes = await getMintStatus(identityAnchor.phone);
      if (!(mintRes.ok && mintRes.mint_status === MINT_STATUS_PENDING_HARDWARE)) {
        await mintFoundationSeigniorage(identityAnchor.phone, mintOpts);
      }
    }
    await ensureMintedAndBalance(identityAnchor.phone);
    setIdentityAnchorForSession(identityAnchor.phone);
    ensureGenesisIfEmpty(identityAnchor.phone, identityAnchor.name).catch(() => {});
    setPresenceVerified(true);
    setSessionIdentity(identityAnchor.phone);
    const faceHash = faceHashForMint ?? (stored.ok ? (stored.anchors.face_hash?.trim() ?? null) : null);
    const palmHash = stored.ok ? (stored.anchors.palm_hash?.trim() ?? null) : null;
    if (faceHash) {
      void setVitalizationAnchor(faceHash, identityAnchor.phone, palmHash ?? undefined);
      void anchorIdentityToDevice(faceHash, identityAnchor.phone);
    }
    await logGuestAccessIfNeeded();
    try {
      localStorage.removeItem(SOV_STATUS_KEY);
    } catch {
      // ignore
    }
    if (hubVerification) {
      setAuthStatus(AuthStatus.IDLE);
      setCurrentLayer(null);
      setTransitioningToDashboard(true);
      setTimeout(() => {
        router.replace(`${ROUTES.DASHBOARD}?minted=1`);
      }, 1000);
      return;
    }
    setAuthStatus(AuthStatus.IDLE);
    setCurrentLayer(null);
    setShowVaultAnimation(true);
  }, [identityAnchor, hubVerification, router]);

  const handleStartAuthentication = useCallback(async () => {
    if (!identityAnchor) {
      alert('Identity anchor required. Please enter phone number first.');
      return;
    }
    if (biometricPendingRef.current) return;
    biometricPendingRef.current = true;

    try {
      localStorage.setItem(SOV_STATUS_KEY, 'vitalizing');
    } catch {
      // ignore
    }

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([100, 50, 100, 50, 200]);
    }

    // GPS is not requested during vitalization; only if Face+Device pass and GPS fails do we show the "Set up GPS" page.
    const resumePillars = getVerifiedPillarsForResume(identityAnchor.phone);

    setAuthStatus(AuthStatus.SCANNING);
    setResult(null);
    setPalmPulseError(null);
    setLedgerSyncError(false);
    setShowVerifyFromAuthorizedDevice(false);
    setShowTimeoutBypass(false);
    setShowMismatchScreen(false);
    setMismatchData(null);
    setShowLearningModeMessage(false);
    setGpsTakingLong(false);
    const [vitalizationStatus, mintRes] = await Promise.all([
      getVitalizationStatus(identityAnchor.phone),
      getMintStatus(identityAnchor.phone),
    ]);
    const streak = vitalizationStatus?.streak ?? 0;
    const isLearningMode = streak < LEARNING_MODE_DAYS;
    const learningModeDay = Math.min(Math.max(1, streak), LEARNING_MODE_DAYS);
    learningModeRef.current = { active: isLearningMode, day: learningModeDay };
    const isVitalized = mintRes.ok && mintRes.mint_status === MINT_STATUS_MINTED;
    setPillarFace(resumePillars?.face ?? false);
    setPillarPalm(resumePillars?.palm ?? false);
    setPillarDevice(resumePillars?.device ?? false);
    setPillarLocation(false);
    setQuadPillarAwaitingClockIn(false);
    palmResolveRef.current = null;

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

    // New Hardware Detection: if device is not primary, check if it is an authorized secondary device before showing New Device screen
    const profile = await getProfileWithPrimarySentinel(identityAnchor.phone);
    const storedPrimaryId = profile?.primary_sentinel_device_id?.trim() ?? '';
    if (storedPrimaryId && compositeDeviceId !== storedPrimaryId) {
      const isAuthorizedSecondary = await isDeviceAuthorized(identityAnchor.phone, compositeDeviceId);
      if (!isAuthorizedSecondary) {
        setShowNewDeviceAuthorization(true);
        setAuthStatus(AuthStatus.IDLE);
        biometricPendingRef.current = false;
        return;
      }
    }

    const isNewDevice = !(await isDeviceAuthorized(identityAnchor.phone, compositeDeviceId));

    // Hub: verify face first so person at Hub matches original phone signup, then accept external fingerprint
    if (hubVerification) {
      const faceOk = await verifyHubEnrollment(identityAnchor.phone);
      if (!faceOk.ok) {
        setFaceFailCount((c) => c + 1);
        setAuthStatus(AuthStatus.FAILED);
        setResult({ success: false, status: AuthStatus.FAILED, layer: AuthLayer.BIOMETRIC_SIGNATURE, errorMessage: faceOk.error, layersPassed: [] });
        biometricPendingRef.current = false;
        return;
      }
    }

    if (!resumePillars) {
      setShowArchitectVision(true);
    }

    const palmPromise = identityAnchor.isMinor
      ? undefined
      : new Promise<void>((resolve) => {
          palmResolveRef.current = () => resolve();
        });
    const authResult = await resolveSovereignByPresence(
      identityAnchor.phone,
      (layer, status) => {
        if (layer !== AuthLayer.GPS_LOCATION || ENABLE_GPS_AS_FOURTH_PILLAR) setCurrentLayer(layer);
        setAuthStatus(status);
      },
      {
        skipVoiceLayer: true,
        requireAllLayers: isNewDevice,
        registeredCountryCode: 'NG',
        useExternalScanner: hubVerification ? true : !isMobile,
        skipDevicePillarForMobile: hubVerification ? false : false,
        scanTimeoutMs: isMobile ? MOBILE_SCAN_TIMEOUT_MS : undefined,
        requestLocationFirstForMobile: false,
        skipGpsDuringScan: ENABLE_GPS_AS_FOURTH_PILLAR,
        palmVerificationPromise: resumePillars ? Promise.resolve() : palmPromise,
        resumePillars123: false,
        learningMode: learningModeRef.current.active,
        onPillarComplete: async (pillar: PresencePillar) => {
          if (typeof console !== 'undefined' && console.log) {
            console.log(`[QuadPillar] Pillar verified: ${pillar}`);
          }
          if (pillar === 'face') {
            setPillarFace(true);
            saveVerifiedPillar(identityAnchor.phone, 'face');
            setShowArchitectVision(false);
            if (!identityAnchor.isMinor) {
              // Face + Device: show "Bind this device" so user clicks (browser requires user gesture for passkey).
              const faceHash = getFaceHashFromSession(identityAnchor.phone)?.trim() ?? '';
              const deviceId = await getCompositeDeviceFingerprint();
              if (faceHash && faceHash.length === 64 && deviceId) {
                setDeviceBindingParams({
                  phone: identityAnchor.phone,
                  faceHash,
                  deviceId,
                  displayName: identityAnchor.name || `PFF — ${identityAnchor.phone.slice(-4)}`,
                });
                deviceBindingOnSuccessRef.current = () => {
                  setPillarPalm(true);
                  saveVerifiedPillar(identityAnchor.phone, 'device');
                  palmResolveRef.current?.();
                  palmResolveRef.current = null;
                  speakVitalizationSuccess();
                };
                setShowDeviceBindingPrompt(true);
              }
            }
            biometricPillarRef.current?.triggerExternalCapture();
          }
          if (pillar === 'device') {
            setPillarDevice(true);
            saveVerifiedPillar(identityAnchor.phone, 'device');
          }
          if (pillar === 'location') setPillarLocation(true);
        },
      }
    );

    setResult(authResult);
    if (authResult.success && authResult.externalScannerSerialNumber != null) {
      setLastExternalScannerSerial(authResult.externalScannerSerialNumber);
      setLastExternalFingerprintHash(authResult.externalFingerprintHash ?? null);
    }
    if (authResult.locationPermissionRequired) setShowLocationPermissionPopup(true);

    if (authResult.timedOut) {
      setShowArchitectVision(false);
      const faceAndPalmPassed =
        authResult.layersPassed?.includes(AuthLayer.BIOMETRIC_SIGNATURE) &&
        authResult.layersPassed?.includes(AuthLayer.SOVEREIGN_PALM);
      const gpsFailed = ENABLE_GPS_AS_FOURTH_PILLAR && !authResult.layersPassed?.includes(AuthLayer.GPS_LOCATION);
      if (faceAndPalmPassed && gpsFailed) {
        setResult({ ...authResult, errorMessage: GPS_EARTH_ANCHOR_SEARCHING_MESSAGE });
      }
      speakSovereignAlignmentFailed();
      setFaceFailCount((c) => c + 1);
      setAuthStatus(AuthStatus.FAILED);
      setShowTimeoutBypass(true);
      setShowVerifyFromAuthorizedDevice(true);
      return;
    }

    // Quad-Pillar or Triple-Pillar success
    if (authResult.success && authResult.identity) {
      setLedgerSyncError(!!authResult.ledgerSyncError);
      clearVerifiedPillars(identityAnchor.phone);
      architectSuccessRef.current = {
        authResult,
        identityAnchor,
        isNewDevice,
        deviceInfo,
        compositeDeviceId,
        effectiveMobile,
      };
      if (ENABLE_GPS_AS_FOURTH_PILLAR) {
        // GPS was skipped during scan; try once now. Only show "Set up GPS" page if it fails.
        const locationResult = await verifyLocation('NG', identityAnchor.phone);
        const coords = locationResult.success && locationResult.coords
          ? locationResult.coords
          : authResult.lastLocationCoords ?? getLastClockInCoords();
        if (coords) {
          recordClockIn(identityAnchor.phone, coords).catch(() => {});
          setPillarLocation(true);
          setQuadPillarAwaitingClockIn(false);
          setShowArchitectVision(true);
          setArchitectVerificationSuccess(true);
          return;
        }
        // GPS failed: redirect to dedicated page (one-way ticket to dashboard).
        router.push(ROUTES.VITALIZATION_GPS_MANUAL_SETUP);
        return;
      }
      setArchitectVerificationSuccess(true);
      return;
    } else {
      setShowArchitectVision(false);
      speakSovereignAlignmentFailed();
      setFaceFailCount((c) => c + 1);
      setAuthStatus(AuthStatus.FAILED);
      const deviceInfo = getCurrentDeviceInfo();
      const compositeForCheck = await getCompositeDeviceFingerprint();
      const unrecognized = identityAnchor ? !(await isDeviceAuthorized(identityAnchor.phone, compositeForCheck)) : false;
      setShowVerifyFromAuthorizedDevice(unrecognized);

      // Biometrics captured but GPS failed — show Earth-Anchor message
      const faceAndPalmPassed =
        authResult.layersPassed?.includes(AuthLayer.BIOMETRIC_SIGNATURE) &&
        authResult.layersPassed?.includes(AuthLayer.SOVEREIGN_PALM);
      const gpsFailed = ENABLE_GPS_AS_FOURTH_PILLAR && !authResult.layersPassed?.includes(AuthLayer.GPS_LOCATION);
      const useEarthAnchorMsg = faceAndPalmPassed && gpsFailed;
      const rawError = useEarthAnchorMsg ? GPS_EARTH_ANCHOR_SEARCHING_MESSAGE : (authResult.errorMessage || '');
      const isDnaOrBiologicalError = /DNA|Architect|biological|Template does not match|face.*match|mismatch/i.test(rawError);
      const errorMsg = isDnaOrBiologicalError ? LEDGER_SYNC_MESSAGE : rawError;
      let mismatchType = MismatchEventType.BIOLOGICAL_HASH_MISMATCH;

      if (errorMsg.includes('twin') || rawError.includes('twin') || rawError.includes('Twin')) {
        mismatchType = MismatchEventType.TWIN_DETECTED;
      } else if (errorMsg.includes('family') || rawError.includes('family') || rawError.includes('Family')) {
        mismatchType = MismatchEventType.FAMILY_MEMBER_DETECTED;
      } else if (errorMsg.includes('harmonic') || rawError.includes('harmonic') || rawError.includes('Harmonic')) {
        mismatchType = MismatchEventType.VOCAL_HARMONIC_MISMATCH;
      }

      // Extract variance from error message (if available)
      const varianceMatch = rawError.match(/(\d+\.?\d*)%/);
      const variance = varianceMatch ? parseFloat(varianceMatch[1]) : 5.0;

      if (useEarthAnchorMsg && faceAndPalmPassed && gpsFailed) {
        router.push(ROUTES.VITALIZATION_GPS_MANUAL_SETUP);
      } else if (!isVitalized) {
        setScanToast('retry');
        setAuthStatus(AuthStatus.IDLE);
        setShowArchitectVision(true);
      } else if (learningModeRef.current.active) {
        setShowLearningModeMessage(true);
      } else {
        // Sentinel Lock: full Biological Signature Mismatch UI only in SovereignVault / high-value flows.
        // At the Gate (Architect), never block with mismatch screen — use friendly retry button only.
        setScanToast('retry');
        setAuthStatus(AuthStatus.IDLE);
        setShowArchitectVision(true);
      }
    }
    } finally {
      biometricPendingRef.current = false;
    }
  }, [identityAnchor, goToDashboard, isMobile, hubVerification]);

  /** Run after second pillar (Palm Pulse or fallback fingerprint) is verified. Uses architect payload p. */
  const proceedAfterSecondPillar = useCallback(
    async (p: NonNullable<typeof architectSuccessRef.current>) => {
      const { authResult, identityAnchor: anchor, isNewDevice: newDev, deviceInfo, compositeDeviceId: compId, effectiveMobile: mobile } = p;
      const isAuthorized = !newDev;
      if (!isAuthorized) {
        const primaryDevice = await getPrimaryDevice(anchor.phone);
        if (!primaryDevice) {
          const hasSeed = await hasRecoverySeed(anchor.phone);
          if (!hasSeed) {
            const seed = generateMnemonic12();
            setGeneratedSeed(seed);
            setSacredRecordDeviceContext({ deviceInfo, compositeDeviceId: compId });
            setShowSacredRecord(true);
            setAuthStatus(AuthStatus.IDLE);
            biometricPendingRef.current = false;
            return;
          }
          const ipAddress = 'unknown';
          const geolocation = { city: 'Lagos', country: 'Nigeria', latitude: 6.5244, longitude: 3.3792 };
          await assignPrimarySentinel(anchor.phone, anchor.name, deviceInfo, ipAddress, geolocation, compId, authResult.externalScannerSerialNumber ?? null, authResult.externalFingerprintHash ?? null, isFirstRun);
          if (isFirstRun) {
            await creditArchitectVidaGrant(anchor.phone);
          }
          if (mobile) await setMintStatus(anchor.phone, MINT_STATUS_PENDING_HARDWARE);
          // Mint Vida Cap ONLY on Root Identity creation. Authority = face (one face = one mint).
          const faceHashForMint = getFaceHashFromSession(anchor.phone)?.trim() ?? '';
          const mintRes = await mintFoundationSeigniorage(anchor.phone, faceHashForMint.length === 64 ? { faceHash: faceHashForMint } : undefined);
          if (!mintRes.ok && !mintRes.error?.includes('already minted')) {
            console.warn('[FourLayerGate] Root identity mint:', mintRes.error);
          }
          const ritual = await recordDailyScan(anchor.phone);
          if (ritual.ok && (ritual.unlockedToday || ritual.justUnlocked)) {
            setCelebrationData({ streak: ritual.streak, newSpendableVida: ritual.newSpendableVida, isDay9: ritual.justUnlocked ?? false });
            if (ritual.newSpendableVida != null) {
              setSpendableVidaAnimation({ from: ritual.newSpendableVida - DAILY_UNLOCK_VIDA_AMOUNT, to: ritual.newSpendableVida });
            }
            setShowDailyUnlockCelebration(true);
          } else {
            await goToDashboard();
          }
          return;
        }
        const ipAddress = 'unknown';
        const geolocation = { city: 'Lagos', country: 'Nigeria', latitude: 6.5244, longitude: 3.3792 };
        const requestId = await createVitalizationRequest(anchor.phone, deviceInfo, ipAddress, geolocation, compId, authResult.externalScannerSerialNumber ?? null, authResult.externalFingerprintHash ?? null);
        setVitalizationRequestId(requestId);
        setPrimaryDeviceInfo({ device_name: primaryDevice.device_name, last_4_digits: primaryDevice.last_4_digits });
        setShowAwaitingAuth(true);
        return;
      }
      await updateDeviceLastUsed(compId);
      if (authResult.externalScannerSerialNumber != null) await setHumanityScoreVerified(anchor.phone);
      await incrementTrustLevel(anchor.phone);
      const ritual = await recordDailyScan(anchor.phone);
      if (ritual.ok && (ritual.unlockedToday || ritual.justUnlocked)) {
        setCelebrationData({ streak: ritual.streak, newSpendableVida: ritual.newSpendableVida, isDay9: ritual.justUnlocked ?? false });
        if (ritual.newSpendableVida != null) {
          setSpendableVidaAnimation({ from: ritual.newSpendableVida - DAILY_UNLOCK_VIDA_AMOUNT, to: ritual.newSpendableVida });
        }
        setShowDailyUnlockCelebration(true);
      } else {
        await goToDashboard();
      }
    },
    [goToDashboard, isFirstRun, setSpendableVidaAnimation]
  );

  /** Face + Device (no palm): after face verified, bind WebAuthn and generate sovereign hash. */
  const handleArchitectVisionComplete = useCallback(async () => {
    setBiometricSessionVerified();
    setShowArchitectVision(false);
    setArchitectVerificationSuccess(null);
    const p = architectSuccessRef.current;
    if (!p) return;
    const { authResult, identityAnchor: anchor, compositeDeviceId } = p;
    if (authResult.externalScannerSerialNumber != null) {
      setLastExternalScannerSerial(authResult.externalScannerSerialNumber);
      setLastExternalFingerprintHash(authResult.externalFingerprintHash ?? null);
    }
    setTripleAnchorVerified('face');
    setTripleAnchorVerified('device');
    setPalmPulseError(null);
    if (IS_PUBLIC_REVEAL && !isVettedUser()) {
      setTripleAnchorVerified('fingerprint');
      await proceedAfterSecondPillar(p);
      return;
    }
    // Device binding (WebAuthn): show prompt so user clicks (browser requires user gesture for passkey).
    const faceHash = getFaceHashFromSession(anchor.phone)?.trim() ?? '';
    if (!faceHash || faceHash.length !== 64) {
      setPalmPulseError('Face hash not ready. Please try again.');
      return;
    }
    const deviceId = compositeDeviceId ?? '';
    setDeviceBindingParams({
      phone: anchor.phone,
      faceHash,
      deviceId,
      displayName: anchor.name || `PFF — ${anchor.phone.slice(-4)}`,
    });
    deviceBindingOnSuccessRef.current = () => {
      setTripleAnchorVerified('fingerprint');
      setPillarPalm(true);
      palmResolveRef.current?.();
      palmResolveRef.current = null;
      proceedAfterSecondPillar(p);
    };
    setShowDeviceBindingPrompt(true);
  }, [setBiometricSessionVerified, proceedAfterSecondPillar]);

  /** User clicked "Bind this device" — run WebAuthn with user gesture so passkey create/get is allowed. */
  const handleDeviceBindingClick = useCallback(async () => {
    const params = deviceBindingParams;
    if (!params) return;
    setPalmPulseError(null);
    try {
      const result = await runDeviceBindingAndSovereignHash(
        params.phone,
        params.faceHash,
        params.deviceId,
        params.displayName
      );
      if (result.ok) {
        void setVitalizationAnchor(params.faceHash, params.phone, result.deviceHash);
        void anchorIdentityToDevice(params.faceHash, params.phone);
        deviceBindingOnSuccessRef.current?.();
        deviceBindingOnSuccessRef.current = null;
        setDeviceBindingParams(null);
        setShowDeviceBindingPrompt(false);
      } else {
        setPalmPulseError(result.error);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setPalmPulseError(msg || 'Device binding failed.');
    }
  }, [deviceBindingParams]);

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
    try { localStorage.removeItem(SOV_STATUS_KEY); } catch { /* ignore */ }
    setTransitioningToDashboard(true);
    const next = searchParams.get('next');
    const raw = next && typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') ? next : ROUTES.DASHBOARD;
    const target = raw === ROUTES.VITALIZATION || raw.startsWith(ROUTES.VITALIZATION + '/') ? ROUTES.DASHBOARD : raw;
    const url = target === ROUTES.DASHBOARD ? `${ROUTES.DASHBOARD}?initial_release=1` : target;
    if (identityAnchor?.phone && target === ROUTES.DASHBOARD && typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('pff_initial_release_phone', identityAnchor.phone);
    }
    setTimeout(() => {
      router.replace(url);
    }, 1000);
  };

  const handleDebugInfo = async () => {
    try {
      const supabase = (await import('@/lib/supabase')).getSupabase();
      if (isProductionDomain()) return;
      const { data: { user } } = await supabase.auth.getUser();
      const uuid = user?.id ?? 'Not signed in';
      setDebugUuid(uuid);
      setShowDebugModal(true);
    } catch (e) {
      if (isProductionDomain()) return;
      setDebugUuid('Error: ' + (e instanceof Error ? e.message : String(e)));
      setShowDebugModal(true);
    }
  };

  /** When primary device approves new device: link only, do NOT mint (Vida Cap once per human). */
  const handleVitalizationApproved = async () => {
    setShowAwaitingAuth(false);
    if (!identityAnchor) return;
    const signed = await hasSignedConstitution(identityAnchor.phone);
    if (!signed) {
      setShowConstitutionGate(true);
      return;
    }
    setIdentityAnchorForSession(identityAnchor.phone);
    setPresenceVerified(true);
    setSessionIdentity(identityAnchor.phone);
    setAuthStatus(AuthStatus.IDLE);
    setCurrentLayer(null);
    setShowVaultAnimation(true);
  };

  const handleVitalizationDenied = () => {
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
    setShowAwaitingAuth(false);
    setShowGuardianRecovery(true);
  };

  /** Backup Anchor: Sovereign Palm + Device ID only (no face). After 2 face failures, show button; on click verify palm + device then run success flow. */
  const handleBackupAnchor = useCallback(async () => {
    if (!identityAnchor) return;
    try {
      const fpResult = await getAssertion();
      if (!fpResult) {
        setResult((r) => (r ? { ...r, errorMessage: 'Passkey verification failed or was cancelled.' } : r));
        return;
      }
      const compId = await getCompositeDeviceFingerprint();
      const authorized = await isDeviceAuthorized(identityAnchor.phone, compId);
      if (!authorized) {
        setResult((r) => (r ? { ...r, errorMessage: 'This device is not authorized. Use an authorized device or Verify from an authorized device.' } : r));
        return;
      }
      const identity = await resolvePhoneToIdentity(identityAnchor.phone);
      if (!identity) {
        setResult((r) => (r ? { ...r, errorMessage: 'Could not load identity. Try again or verify from an authorized device.' } : r));
        return;
      }
      const deviceInfo = getCurrentDeviceInfo();
      const effectiveMobile = /iPhone|iPad|Android/i.test(typeof navigator !== 'undefined' ? navigator.userAgent : '');
      const authResult: BiometricAuthResult = {
        success: true,
        status: AuthStatus.IDENTIFIED,
        layer: null,
        identity,
        layersPassed: [AuthLayer.BIOMETRIC_SIGNATURE],
      };
      architectSuccessRef.current = {
        authResult,
        identityAnchor,
        isNewDevice: false,
        deviceInfo,
        compositeDeviceId: compId,
        effectiveMobile,
      };
      setAuthStatus(AuthStatus.IDLE);
      setResult(null);
      setShowVerifyFromAuthorizedDevice(false);
      setShowTimeoutBypass(false);
      setArchitectVerificationSuccess(true);
      setShowArchitectVision(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setResult((r) => (r ? { ...r, errorMessage: `Backup Anchor failed: ${msg}` } : r));
    }
  }, [identityAnchor]);

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
    setGuardianRecoveryRequestId(requestId);
    setShowGuardianRecovery(false);
    setShowGuardianRecoveryStatus(true);
  };

  const handleGuardianRecoveryCancel = () => {
    setShowGuardianRecovery(false);
    setAuthStatus(AuthStatus.IDLE);
    setCurrentLayer(null);
    setResult(null);
  };

  const handleGuardianRecoveryApproved = async () => {
    setShowGuardianRecoveryStatus(false);
    setGuardianRecoveryRequestId(null);
    if (!identityAnchor) return;
    const signed = await hasSignedConstitution(identityAnchor.phone);
    if (!signed) {
      setShowConstitutionGate(true);
      return;
    }
    // Device linking / recovery: do NOT mint (Vida Cap only on root identity creation).
    setIdentityAnchorForSession(identityAnchor.phone);
    ensureGenesisIfEmpty(identityAnchor.phone, identityAnchor.name).catch(() => {});
    setPresenceVerified(true);
    setSessionIdentity(identityAnchor.phone);
    setShowVaultAnimation(true);
  };

  const handleGuardianRecoveryExpired = () => {
    setShowGuardianRecoveryStatus(false);
    setGuardianRecoveryRequestId(null);
    alert('Guardian recovery request expired. Please try again.');
    setAuthStatus(AuthStatus.IDLE);
    setCurrentLayer(null);
    setResult(null);
  };

  const handleGuardianRecoveryDenied = () => {
    setShowGuardianRecoveryStatus(false);
    setGuardianRecoveryRequestId(null);
    alert('Guardian recovery request was denied.');
    setAuthStatus(AuthStatus.IDLE);
    setCurrentLayer(null);
    setResult(null);
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
          useExternalScanner: true,
          onPillarComplete: (pillar: PresencePillar) => {
            if (pillar === 'device') setPillarDevice(true);
            if (pillar === 'location') setPillarLocation(true);
            if (pillar === 'face') {
              setPillarFace(true);
              biometricPillarRef.current?.triggerExternalCapture();
            }
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
      // New device linking: do NOT mint (Vida Cap only once per human on first device).
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

  /** Login via phone: on APPROVED, fetch user from request row → set session → redirect; cleanup login_requests row. */
  const handleLoginRequestApproved = useCallback(async () => {
    const requestId = loginRequestId;
    const anchor = identityAnchor;
    setShowAwaitingLoginApproval(false);
    setLoginRequestId(null);
    if (!requestId) return;

    setTransitioningToDashboard(true);

    const result = await completeLoginBridge(requestId);
    if (!result.ok) {
      setTransitioningToDashboard(false);
      setLoginRequestId(requestId);
      setShowAwaitingLoginApproval(true);
      return;
    }

    setPresenceVerified(true);
    try { localStorage.removeItem(SOV_STATUS_KEY); } catch { /* ignore */ }
    router.replace(ROUTES.DASHBOARD);
  }, [loginRequestId, router]);

  const handleLoginRequestDenied = useCallback(() => {
    setShowAwaitingLoginApproval(false);
    setLoginRequestId(null);
    alert('Login was denied on your phone. Try again or use biometrics on this device.');
  }, []);

  /** Computer: create login_request with laptop device_id (Trusted Device), then show Session QR. Phone scans → Realtime → Triple Lock animation → Dashboard. */
  const handleLoginViaPhone = useCallback(async () => {
    if (!identityAnchor) return;
    const deviceInfoObj = getCurrentDeviceInfo();
    const compositeDeviceId = await getCompositeDeviceFingerprint();
    const deviceInfo: Record<string, unknown> = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      laptop_device_id: compositeDeviceId,
      laptop_device_name: deviceInfoObj.deviceName ?? 'Trusted Laptop',
    };
    const res = await createLoginRequest(identityAnchor.phone, identityAnchor.name, deviceInfo);
    if (res.ok) {
      setLoginRequestId(res.requestId);
      setShowAwaitingLoginApproval(true);
    } else {
      alert(res.error || 'Failed to create login request.');
    }
  }, [identityAnchor]);

  /** Sub device: verify face with backend; only same face can create login request. Different face = access denied. */
  const [subDeviceVerifyLoading, setSubDeviceVerifyLoading] = useState(false);
  const handleSubDeviceVerifyFace = useCallback(async () => {
    if (!identityAnchor?.phone) return;
    setSubDeviceFaceError(null);
    setSubDeviceVerifyLoading(true);
    try {
      const assertion = await getAssertion();
      if (!assertion?.credential) {
        setSubDeviceFaceError('Face scan cancelled or unavailable. Try again.');
        return;
      }
      const cred = assertion.credential;
      const credentialForHash = {
        id: cred.id,
        rawId: cred.rawId,
        response: {
          clientDataJSON: cred.response.clientDataJSON,
          authenticatorData: cred.response.authenticatorData,
        },
      };
      const liveHash = await deriveFaceHashFromCredential(credentialForHash);
      if (!liveHash?.trim()) {
        setSubDeviceFaceError('Could not verify face. Try again.');
        return;
      }
      const deviceInfoObj = getCurrentDeviceInfo();
      const compositeDeviceId = await getCompositeDeviceFingerprint();
      const deviceInfo: Record<string, unknown> = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        laptop_device_id: compositeDeviceId,
        laptop_device_name: deviceInfoObj.deviceName ?? 'New device',
      };
      const res = await verifyFaceAndCreateLoginRequest(
        identityAnchor.phone,
        liveHash.trim(),
        identityAnchor.name ?? 'Sovereign',
        deviceInfo
      );
      if (res.ok) {
        setLoginRequestId(res.requestId);
        setShowAwaitingLoginApproval(true);
        setShowSubDeviceFaceVerify(false);
      } else {
        setSubDeviceFaceError(res.error ?? 'Access denied. This number is linked to another identity.');
      }
    } catch (e) {
      setSubDeviceFaceError(e instanceof Error ? e.message : 'Face verification failed. Try again.');
    } finally {
      setSubDeviceVerifyLoading(false);
    }
  }, [identityAnchor]);

  /** Add this device by requesting approval from primary (phone). Creates vitalization request; mobile approves and laptop is added to authorized_devices. */
  const handleRequestAddFromPhone = async () => {
    if (!identityAnchor) return;
    setNewDeviceMigrationError(null);
    const primary = await getPrimaryDevice(identityAnchor.phone);
    if (!primary) {
      setNewDeviceMigrationError('No primary device on file. Use "Authorize only this device" to make this device primary.');
      return;
    }
    setPrimaryDeviceInfo({
      device_name: primary.device_name,
      last_4_digits: primary.last_4_digits,
      device_id: primary.device_id,
    });
    try {
      const deviceInfo = getCurrentDeviceInfo();
      const compositeDeviceId = await getCompositeDeviceFingerprint();
      const ipAddress = 'unknown';
      const geolocation = { city: 'Unknown', country: '', latitude: 0, longitude: 0 };
      const requestId = await createVitalizationRequest(
        identityAnchor.phone,
        deviceInfo,
        ipAddress,
        geolocation,
        compositeDeviceId
      );
      setVitalizationRequestId(requestId);
      setShowNewDeviceAuthorization(false);
      setShowAwaitingAuth(true);
      setNewDeviceMigrationError(null);
    } catch (e) {
      setNewDeviceMigrationError(e instanceof Error ? e.message : 'Failed to create request. Try again.');
    }
  };

  /** Sacred Record: user acknowledged — show 3-word verification. */
  const handleSacredRecordAcknowledged = () => {
    setShowSacredRecord(false);
    setVerificationIndices(pick3RandomIndices());
    setSeedVerificationError(null);
    setShowSeedVerification(true);
  };

  /** When seed verification step is shown, sync persistent face hash (from Scanner) into session so "Complete Face Pulse first" is hidden when hash exists. */
  useEffect(() => {
    if (showSeedVerification && identityAnchor?.phone) syncPersistentFaceHashToSession(identityAnchor.phone);
  }, [showSeedVerification, identityAnchor?.phone]);

  /** Seed verification passed — wait for face_hash to be ready, then save face_hash + recovery_seed_hash + is_minted + 5 VIDA. */
  const handleSeedVerificationPassed = async (answers: string[]) => {
    if (!identityAnchor || !generatedSeed || verificationIndices.length !== 3 || !sacredRecordDeviceContext) return;
    if (!verify3Words(generatedSeed, verificationIndices, answers)) {
      setSeedVerificationError('Words do not match. Check your Master Key and try again.');
      return;
    }
    setSeedVerificationError(null);
    setSeedVerificationLoading(true);
    try {
      syncPersistentFaceHashToSession(identityAnchor.phone);
      const anchors = await getStoredBiometricAnchors(identityAnchor.phone);
      let faceHash = getFaceHashFromSession(identityAnchor.phone)
        ?? (anchors.ok && anchors.anchors.face_hash?.trim() ? anchors.anchors.face_hash.trim() : null);
      if (!faceHash) {
        const isArchitect = /isreal|mrfundzman/i.test(identityAnchor.name?.trim() ?? '');
        if (isArchitect) {
          await new Promise((r) => setTimeout(r, 500));
          const anchorsRetry = await getStoredBiometricAnchors(identityAnchor.phone);
          faceHash = anchorsRetry.ok && anchorsRetry.anchors.face_hash?.trim() ? anchorsRetry.anchors.face_hash : null;
        }
      }
      if (!faceHash) {
        setSeedVerificationError('Complete Face Pulse first. Face hash is required before saving recovery seed.');
        return;
      }
      const storeResult = await storeRecoverySeedWithFaceAndMint(
        identityAnchor.phone,
        generatedSeed,
        identityAnchor.name,
        faceHash
      );
      if (!storeResult.ok) {
        setSeedVerificationError(storeResult.error ?? 'Failed to save recovery seed.');
        return;
      }
      const bothConfirmed = await confirmFaceAndSeedStored(identityAnchor.phone);
      if (!bothConfirmed) {
        setSeedVerificationError('Face hash and recovery seed must both be confirmed in Supabase before continuing. Try again or use Admin Schema Refresh.');
        return;
      }
      setShowSeedVerification(false);
      setShowSeedSuccessShield(true);
    } finally {
      setSeedVerificationLoading(false);
    }
  };

  /** After Success shield — only when face_hash and recovery_seed_hash both confirmed in Supabase, assign sentinel and trigger navigation.reset to Vault. */
  const handleSeedSuccessContinue = async () => {
    if (!identityAnchor || !sacredRecordDeviceContext) return;
    const bothConfirmed = await confirmFaceAndSeedStored(identityAnchor.phone);
    if (!bothConfirmed) {
      alert('Face hash and recovery seed must both be confirmed in Supabase before entering the Vault.');
      return;
    }
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
      compositeDeviceId,
      lastExternalScannerSerial,
      lastExternalFingerprintHash,
      isFirstRun
    );
    setLastExternalScannerSerial(null);
    setLastExternalFingerprintHash(null);
    const signed = await hasSignedConstitution(identityAnchor.phone);
    if (!signed) {
      setShowConstitutionGate(true);
      return;
    }
    const storedForMint = await getStoredBiometricAnchors(identityAnchor.phone);
    const faceHashForMint = getFaceHashFromSession(identityAnchor.phone) ?? (storedForMint.ok ? (storedForMint.anchors.face_hash?.trim() ?? null) : null);
    await mintFoundationSeigniorage(identityAnchor.phone, faceHashForMint && faceHashForMint.length === 64 ? { faceHash: faceHashForMint } : undefined);
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
    const storedG = await getStoredBiometricAnchors(identityAnchor.phone);
    const faceHashG = getFaceHashFromSession(identityAnchor.phone) ?? (storedG.ok ? (storedG.anchors.face_hash?.trim() ?? null) : null);
    await mintFoundationSeigniorage(identityAnchor.phone, faceHashG && faceHashG.length === 64 ? { faceHash: faceHashG } : undefined);
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
    const storedC = await getStoredBiometricAnchors(identityAnchor.phone);
    const faceHashC = getFaceHashFromSession(identityAnchor.phone) ?? (storedC.ok ? (storedC.anchors.face_hash?.trim() ?? null) : null);
    await mintFoundationSeigniorage(identityAnchor.phone, faceHashC && faceHashC.length === 64 ? { faceHash: faceHashC } : undefined);
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
            Your guardian&apos;s Sentinel is active. Device check bypassed. Proceeding with secure access.
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

  // GPS failed or skipped: dedicated page to set up location (only when other scans passed). Then proceed to dashboard or second-pillar flow.
  if (showManualLocationInput && identityAnchor) {
    return (
      <ManualLocationInputScreen
        onProceed={(_city: string, _country: string) => {
          setShowManualLocationInput(false);
          setPillarLocation(true);
          const p = architectSuccessRef.current;
          gpsFailureAuthRef.current = null;
          if (p) {
            architectSuccessRef.current = null;
            proceedAfterSecondPillar(p);
          } else {
            goToDashboard();
          }
        }}
        onCancel={() => {
          setShowManualLocationInput(false);
          gpsFailureAuthRef.current = null;
          architectSuccessRef.current = null;
          setAuthStatus(AuthStatus.IDLE);
        }}
      />
    );
  }

  // 9-Day Learning Mode: vibration mismatch — show soft message instead of blocking
  if (showLearningModeMessage) {
    const day = learningModeRef.current.day;
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4">
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(circle at center, rgba(212, 175, 55, 0.3) 0%, rgba(5, 5, 5, 0) 70%)' }}
          aria-hidden
        />
        <div
          className="relative z-10 rounded-2xl border-2 p-8 max-w-md w-full text-center"
          style={{
            background: 'linear-gradient(180deg, rgba(30, 28, 22, 0.98) 0%, rgba(15, 14, 10, 0.99) 100%)',
            borderColor: 'rgba(212, 175, 55, 0.6)',
          }}
        >
          <p className="text-2xl mb-4" style={{ color: '#D4AF37' }}>
            ✨ AI is Learning Mode
          </p>
          <p className="text-sm text-[#a0a0a5] mb-6">
            {getLearningModeMessage(day)}
          </p>
          <div className="flex flex-col gap-3">
            {faceFailCount >= 2 && isArchitect() && isDesktop() && (
              <button
                type="button"
                onClick={() => {
                  setShowLearningModeMessage(false);
                  goToDashboard();
                }}
                className="w-full py-3 rounded-xl border-2 border-[#D4AF37] text-[#D4AF37] font-bold uppercase tracking-wider hover:bg-[#D4AF37]/10"
              >
                Sovereign Manual Bypass
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setShowLearningModeMessage(false);
                resetVerification();
                handleStartAuthentication();
              }}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#C9A227] text-black font-bold uppercase tracking-wider"
              style={{ boxShadow: '0 0 30px rgba(212, 175, 55, 0.5)' }}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Kill the Mismatch Screen: Biological Signature Mismatch red screen and lockout are never shown at the Gate.
  // Only friendly retry button ("Light was too low. Tap to scan again.") is used for registration.
  // BiologicalMismatchScreen is reserved for SovereignVault / high-value flows only (not rendered here).
  // Context purge: "Security Alert Sent" and "Audit Log" are never shown during registration (no BiologicalMismatchScreen here).

  if (transitioningToDashboard) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505]" role="status" aria-live="polite">
        <div className="w-16 h-16 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-lg text-[#D4AF37] font-semibold">Loading Vault...</p>
      </div>
    );
  }

  /** Persistent Vitalization: instant login (face-only) when device has is_vitalized anchor; or "Vitalize Someone Else" for full 4-pillar. */
  if (showInstantLoginScreen && instantLoginAnchor?.citizenHash) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4">
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(circle at center, rgba(212, 175, 55, 0.2) 0%, rgba(5, 5, 5, 0) 70%)' }}
          aria-hidden
        />
        {showWelcomeHome ? (
          <div
            className="relative z-10 rounded-2xl border-2 p-8 max-w-md w-full text-center"
            style={{
              background: 'linear-gradient(180deg, rgba(30, 28, 22, 0.98) 0%, rgba(15, 14, 10, 0.99) 100%)',
              borderColor: 'rgba(34, 197, 94, 0.6)',
              boxShadow: '0 0 40px rgba(34, 197, 94, 0.3)',
            }}
          >
            <p className="text-2xl font-bold mb-2" style={{ color: '#22c55e' }}>
              Identity Verified. Welcome Home to Vitalie, Architect.
            </p>
            <p className="text-sm mt-4" style={{ color: '#a0a0a5' }}>
              {welcomeGreeting}
            </p>
            <p className="text-sm text-[#6b6b70] mt-6">Taking you to the Dashboard…</p>
          </div>
        ) : (
          <div
            className="relative z-10 rounded-2xl border-2 p-8 max-w-md w-full text-center"
            style={{
              background: 'linear-gradient(180deg, rgba(30, 28, 22, 0.98) 0%, rgba(15, 14, 10, 0.99) 100%)',
              borderColor: 'rgba(212, 175, 55, 0.5)',
            }}
          >
            <p className="text-lg font-bold mb-2" style={{ color: '#D4AF37' }}>
              Welcome back
            </p>
            <p className="text-sm text-[#a0a0a5] mb-2">
              Scan your face to enter. No registration needed.
            </p>
            <p className="text-xs text-[#6b6b70] mb-6">
              This device is linked to your phone and face. Confirmed by your phone — opens automatically when you verify.
            </p>
            {instantLoginError && (
              <p className="text-sm text-red-400 mb-4" role="alert">
                {instantLoginError}
              </p>
            )}
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handleInstantLoginFaceScan}
                disabled={instantLoginScanning}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#C9A227] text-black font-bold uppercase tracking-wider disabled:opacity-70 flex items-center justify-center gap-2"
                style={{ boxShadow: '0 0 20px rgba(212, 175, 55, 0.4)' }}
              >
                {instantLoginScanning ? (
                  <>
                    <span className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    Scanning…
                  </>
                ) : (
                  'Scan face to enter'
                )}
              </button>
            </div>
            <button
              type="button"
              onClick={handleVitalizeSomeoneElse}
              className="mt-6 w-full text-xs uppercase tracking-wider transition-colors hover:underline"
              style={{ color: '#6b6b70' }}
            >
              Vitalize New Soul
            </button>
          </div>
        )}
      </div>
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

  // Success shield — minting press: "10 VIDA CAP SUCCESSFULLY MINTED" in gold (protocol: 10 per Vitalization)
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
          {/* Minting press / digital forge: stamp drops onto 10 VIDA plate */}
          <div className="relative flex flex-col items-center mb-6 h-24" aria-hidden>
            <motion.div
              className="absolute left-1/2 -translate-x-1/2 w-24 h-4 rounded-b-lg bg-gradient-to-b from-[#4a4035] to-[#2a2520] border-x-2 border-b-2 border-[#D4AF37]/50 z-10"
              style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.7)' }}
              initial={{ y: -32 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            />
            <div className="absolute bottom-0 w-36 h-14 rounded-lg flex items-center justify-center border-2 border-[#D4AF37]/60 bg-gradient-to-b from-[#2a2520] to-[#1a1815]" style={{ boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.5), 0 4px 16px rgba(212,175,55,0.25)' }}>
              <span className="text-xl font-bold font-mono text-[#D4AF37] tracking-tight">10 VIDA</span>
            </div>
          </div>
          <h2 className={`text-2xl font-bold uppercase tracking-wider mb-4 ${jetbrains.className}`} style={{ color: '#D4AF37' }}>
            10 VIDA CAP SUCCESSFULLY MINTED
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
          onAddFromPhone={handleRequestAddFromPhone}
          onCancel={handleNewDeviceCancel}
          loading={newDeviceMigrationScanning}
          error={newDeviceMigrationError}
        />
      </div>
    );
  }

  // Sub device: must verify face before requesting access. Only same face gets request; different face = never access.
  if (showSubDeviceFaceVerify && identityAnchor) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4">
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(circle at center, rgba(212, 175, 55, 0.2) 0%, rgba(5, 5, 5, 0) 70%)' }}
          aria-hidden
        />
        <div
          className="relative z-10 rounded-2xl border-2 p-8 max-w-md w-full text-center"
          style={{
            background: 'linear-gradient(180deg, rgba(30, 28, 22, 0.98) 0%, rgba(15, 14, 10, 0.99) 100%)',
            borderColor: 'rgba(212, 175, 55, 0.5)',
          }}
        >
          <p className="text-lg font-bold mb-2" style={{ color: '#D4AF37' }}>
            This number is linked to your master device
          </p>
          <p className="text-sm text-[#a0a0a5] mb-4">
            The master device is the one that captured your face first (locked to this mobile number). Sign-in here requires verification: approve the request on your master device to continue. Only your face can send the request; a different face will never gain access.
          </p>
          {subDeviceFaceError && (
            <p className="text-sm text-red-400 mb-4" role="alert">
              {subDeviceFaceError}
            </p>
          )}
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={handleSubDeviceVerifyFace}
              disabled={subDeviceVerifyLoading}
              className="w-full py-4 rounded-xl font-bold uppercase tracking-wider disabled:opacity-70 flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #C9A227 100%)',
                color: '#0d0d0f',
                boxShadow: '0 0 20px rgba(212, 175, 55, 0.4)',
              }}
            >
              {subDeviceVerifyLoading ? (
                <>
                  <span className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Verifying…
                </>
              ) : (
                'Verify face — send request to master device'
              )}
            </button>
            <button
              type="button"
              onClick={() => { setShowSubDeviceFaceVerify(false); setSubDeviceFaceError(null); subDeviceDetectedRef.current = null; }}
              className="w-full py-3 rounded-xl border border-[#2a2a2e] text-[#a0a0a5] text-sm hover:bg-[#16161a]"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Login via phone: Desktop shows Session QR; phone scans via Link Device → Realtime → Triple Lock animation → Dashboard. Laptop stored as Trusted Device.
  if (showAwaitingLoginApproval && loginRequestId && identityAnchor && !effectiveMobile) {
    return (
      <LoginQRDisplay
        requestId={loginRequestId}
        onDenied={handleLoginRequestDenied}
        onError={(msg) => { setShowAwaitingLoginApproval(false); setLoginRequestId(null); alert(msg); }}
      />
    );
  }
  if (showAwaitingLoginApproval && loginRequestId && identityAnchor) {
    return (
      <AwaitingLoginApproval
        requestId={loginRequestId}
        onApproved={handleLoginRequestApproved}
        onDenied={handleLoginRequestDenied}
      />
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

  // Step 1 of 4: Language Selection — smooth fade (duration-500)
  if (!languageConfirmed) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="min-h-screen bg-[#050505] flex items-center justify-center p-4 step-transition-wrapper"
      >
        {screenBg}
        <div className="relative z-10 w-full max-w-lg mx-auto">
          <p className="text-center text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#D4AF37' }}>Step 1 of 4</p>
          <ConfirmLanguageScreen
            onConfirm={(code) => setLanguageConfirmed(code)}
          />
        </div>
      </motion.div>
    );
  }

  // Recover My Account — enter phone + 12 words to unbind from lost device (smooth fade)
  if (showRecoverFlow) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="min-h-screen bg-[#050505] flex items-center justify-center p-4 step-transition-wrapper">
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(circle at center, rgba(212, 175, 55, 0.2) 0%, rgba(5, 5, 5, 0) 70%)' }}
          aria-hidden
        />
        <RecoverMyAccountScreen
          onComplete={() => setShowRecoverFlow(false)}
          onCancel={() => setShowRecoverFlow(false)}
        />
      </motion.div>
    );
  }

  // Step 2 of 4: Phone Number & Device Anchor — mobile-first center Sovereign card
  if (!identityAnchor) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4 step-transition-wrapper"
      >
        {screenBg}
        <div className="relative z-10 w-full max-w-lg mx-auto flex flex-col justify-center">
          <p className="text-center text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#D4AF37' }}>Step 2 of 4</p>
          <IdentityAnchorInput
            onAnchorVerified={handleAnchorVerified}
            title="Phone Anchor Required"
            subtitle="Enter your phone number to proceed to hardware biometric scan. Verification occurs only after the scan."
          />
        </div>
        <div className="flex flex-col gap-4 py-4 mt-2">
          <button
            type="button"
            onClick={() => setShowRecoverFlow(true)}
            className="min-h-[48px] py-3 text-sm font-medium text-[#e8c547] hover:text-[#c9a227] transition-colors underline rounded-lg touch-manipulation"
          >
            Lost Device? Recover Account
          </button>
          {showDebugInfo && (
            <button
              type="button"
              onClick={handleDebugInfo}
              className="min-h-[48px] text-xs font-mono border rounded-lg px-3 py-3 transition-colors touch-manipulation"
              style={{ color: '#6b6b70', borderColor: 'rgba(212, 175, 55, 0.3)' }}
            >
              Debug Info
            </button>
          )}
        </div>
        {showDebugInfo && (
          <>
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
          </>
        )}
      </motion.div>
    );
  }

  // Step 4 & 5 of 5: Face (Architect Vision) then Device (Passkey) → Vitalization Complete / Dashboard — mobile-first: same center card on laptop
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4 relative step-transition-wrapper"
    >
      {/* 4/4 Layers Verified Status Bar — real-time sync with QuadPillarShield, forceShow so 0/4 visible during registration */}
      <LayerStatusBar
        faceVerified={pillarFace}
        palmVerified={pillarPalm}
        deviceVerified={pillarDevice}
        locationVerified={pillarLocation}
        forceShow
      />

      {/* Simple retry: friendly button instead of scary alert — no lockout for registration */}
      {scanToast && (
        <div
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] max-w-[90vw]"
          role="status"
        >
          <button
            type="button"
            onClick={() => {
              setScanToast(null);
              resetVerification();
              handleStartAuthentication();
            }}
            className="px-6 py-4 rounded-xl border-2 text-sm font-medium shadow-lg animate-in fade-in duration-300 min-h-[44px] touch-manipulation"
            style={{
              background: 'rgba(30, 28, 22, 0.98)',
              borderColor: 'rgba(212, 175, 55, 0.5)',
              color: '#e8c547',
            }}
          >
            Light was too low. Tap to scan again.
          </button>
        </div>
      )}
      {/* Ledger Sync Error: presence_handshakes write failed (e.g. add identity_mesh_hash column in Supabase) */}
      {ledgerSyncError && (
        <div
          className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] px-6 py-3 rounded-xl border text-sm font-medium shadow-lg animate-in fade-in duration-300"
          style={{
            background: 'rgba(30, 28, 22, 0.98)',
            borderColor: 'rgba(239, 68, 68, 0.6)',
            color: '#fca5a5',
          }}
          role="alert"
        >
          Ledger Sync Error
        </div>
      )}

      {/* Background Glow — pointer-events-none so it does not block clicks */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, rgba(212, 175, 55, 0.2) 0%, rgba(5, 5, 5, 0) 70%)',
        }}
        aria-hidden="true"
      />

      {/* Main Gate Container — mobile-first: center-aligned Sovereign card; laptop matches mobile (same width, vertical card). 4 pillars shown in header (LayerStatusBar) only; not repeated in body. */}
      <div className="relative z-10 w-full max-w-lg mx-auto step-transition-wrapper">
        {identityAnchor && authStatus === AuthStatus.SCANNING && (
          <div className="text-sm text-center mb-4 px-4 space-y-1" style={{ color: '#a0a0a5' }}>
            <p><strong className="text-[#D4AF37]">Step 1 — Face:</strong> Complete face verification first.</p>
            <p><strong className="text-[#D4AF37]">Step 2 — Device:</strong> Then bind this device with a Passkey (required; you must complete both).</p>
            <p className="text-xs mt-2">Face scan first, then device binding. Identity = Face + Device; we merge these with Phone Anchor and GPS to complete vitalization and mint VIDA CAP.</p>
          </div>
        )}
        {/* Phone Anchor Display */}
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
                {t('vitalization.phoneAnchorLocked', 'Phone Anchor Locked')}
              </p>
              <p className="text-sm font-bold" style={{ color: '#D4AF37' }}>
                {identityAnchor.name}
              </p>
              <p className="text-xs font-mono" style={{ color: '#a0a0a5' }} title="Phone masked for privacy">
                {maskPhoneForDisplay(identityAnchor.phone)}
              </p>
              {/* Phone ID Bridge: on PC, show linked mobile device ID from profiles */}
              {linkedDevice && (
                <p className="text-xs font-mono mt-2" style={{ color: '#6b6b70' }} title="Linked device (primary_sentinel_device_id)">
                  Phone ID: {linkedDevice.maskedId}
                  {linkedDevice.deviceName ? ` · ${linkedDevice.deviceName}` : ''}
                </p>
              )}
            </div>
            <div className="text-3xl">🔗</div>
          </div>
        </div>

        {/* Header — Step 3 of 4: Face + Device (no palm). Face scan then WebAuthn/Passkey binding. */}
        <div className="text-center mb-8">
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#D4AF37' }}>{t('vitalization.step3Of4', 'Step 3 of 4 — Face Scan, then Device Binding')}</p>
          <div className="text-6xl mb-4 animate-pulse">🔐</div>
          <h1
            className={`text-4xl font-bold text-[#D4AF37] uppercase tracking-wider mb-4 ${jetbrains.className}`}
            style={{ textShadow: '0 0 30px rgba(212, 175, 55, 0.6)' }}
          >
            {ENABLE_GPS_AS_FOURTH_PILLAR ? 'Quad-Pillar Shield' : 'Triple-Pillar Shield'}
          </h1>
          <p className="text-lg text-[#6b6b70]">
            {authStatus === AuthStatus.SCANNING
              ? ENABLE_GPS_AS_FOURTH_PILLAR
                ? 'Face → Device (Passkey) → Phone Anchor → GPS (work-site). Then Clock-In.'
                : 'Sovereign Face → Device Binding (Passkey) → Phone Anchor'
              : ENABLE_GPS_AS_FOURTH_PILLAR
              ? 'Sovereign Face · Device · Phone Anchor · GPS Presence'
              : 'Sovereign Face · Device · Phone Anchor'}
          </p>
        </div>

        {/* Quad-Pillar Shield: 2x2 grid (mobile: all 4 visible, no scroll). Next locked until all 4 verified. */}
        {authStatus === AuthStatus.SCANNING && (
          <div className="mb-6 w-full max-w-sm mx-auto transition-all duration-200">
            {ENABLE_GPS_AS_FOURTH_PILLAR ? (
              <QuadPillarGrid
                faceVerified={pillarFace}
                palmVerified={pillarPalm}
                phoneAnchorVerified={pillarDevice}
                locationVerified={pillarLocation}
                gpsPillarMessage={!pillarLocation ? 'Initializing Protocol…' : undefined}
                gpsTakingLong={gpsTakingLong}
                gpsSelfCertifyAvailable={false}
                onGrantLocation={identityAnchor?.phone ? () => startLocationRequestFromUserGesture(identityAnchor.phone) : undefined}
                onManualLocation={undefined}
                onAllVerified={handleAllPillarsVerified}
              />
            ) : (
              <PresenceProgressRing
                faceVerified={pillarFace}
                palmVerified={pillarPalm}
                phoneAnchorVerified={pillarDevice}
                locationVerified={pillarLocation}
              />
            )}
            {/* Device (Passkey): Face verified then WebAuthn/Passkey binding. Optional: Hub scanner for palm in other flows. */}
            {identityAnchor && !effectiveMobile && (
              <div className="mt-6">
                <BiometricPillar ref={biometricPillarRef} phoneNumber={identityAnchor.phone} />
              </div>
            )}
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
                        {layer === AuthLayer.BIOMETRIC_SIGNATURE && (status === 'complete' ? 'Face — Verified' : `Face — ${status === 'active' ? getLayerScanningLabel(layer) : 'Pending'}`)}
                        {layer === AuthLayer.SOVEREIGN_PALM && (status === 'complete' ? 'Device — Verified' : `Device — ${status === 'active' ? getLayerScanningLabel(layer) : 'Pending'}`)}
                        {(layer === AuthLayer.HARDWARE_TPM || layer === AuthLayer.GENESIS_HANDSHAKE) && (status === 'complete' ? 'Anchor — Confirmed' : `Anchor — ${status === 'active' ? getLayerScanningLabel(layer) : 'Pending'}`)}
                        {layer === AuthLayer.GPS_LOCATION && (status === 'complete' ? 'GPS — Confirmed' : `GPS — ${status === 'active' ? getLayerScanningLabel(layer) : 'Pending'}`)}
                        {![AuthLayer.BIOMETRIC_SIGNATURE, AuthLayer.SOVEREIGN_PALM, AuthLayer.HARDWARE_TPM, AuthLayer.GENESIS_HANDSHAKE, AuthLayer.GPS_LOCATION].includes(layer) && `Pillar ${index + 1}: ${getLayerName(layer)}`}
                      </h3>
                      <p className="text-xs text-[#6b6b70]">
                        {status === 'complete' && '✅ Saved to backend'}
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

        {/* Desktop: Log in via my phone — create login_request; phone approves → Realtime → Vault */}
        {identityAnchor && !effectiveMobile && (
          <button
            type="button"
            onClick={handleLoginViaPhone}
            disabled={authStatus === AuthStatus.SCANNING}
            className="relative z-50 w-full min-h-[48px] py-3 px-6 rounded-lg border-2 border-[#D4AF37] bg-[#D4AF37]/10 text-[#e8c547] font-bold text-sm uppercase tracking-wider transition-all duration-200 hover:bg-[#D4AF37]/20 disabled:opacity-50 flex items-center justify-center gap-2 mb-3 touch-manipulation cursor-pointer"
          >
            📱 Log in via my phone
          </button>
        )}

        {/* Authentication Button — z-50 above overlay; Sovereign Glow when 4/4 verified */}
        {(
          <motion.button
            type="button"
            onClick={handleStartAuthentication}
            disabled={authStatus === AuthStatus.SCANNING}
            className="relative z-50 w-full min-h-[48px] py-4 px-6 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#C9A227] hover:from-[#e8c547] hover:to-[#D4AF37] text-black font-bold text-xl uppercase tracking-wider transition-all duration-500 disabled:opacity-90 disabled:pointer-events-none flex items-center justify-center gap-3 touch-manipulation cursor-pointer"
            style={{
              boxShadow: ENABLE_GPS_AS_FOURTH_PILLAR && pillarFace && pillarPalm && pillarDevice && pillarLocation
                ? '0 0 15px rgba(255,215,0,0.5), 0 0 40px rgba(212,175,55,0.6)'
                : '0 0 40px rgba(212, 175, 55, 0.6)',
            }}
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
              <>{effectiveMobile ? 'Complete Initial Registration' : '⚒ Finalize Minting'}</>
            )}
          </motion.button>
        )}

        <div className="flex flex-col gap-4 py-4 mt-2">
          <button
            type="button"
            onClick={() => setShowRecoverFlow(true)}
            className="relative z-50 w-full min-h-[48px] py-3 text-sm font-medium text-[#e8c547] hover:text-[#c9a227] transition-colors underline rounded-lg touch-manipulation"
          >
            Lost Device? Recover Account
          </button>
          {showDebugInfo && (
            <button
              type="button"
              onClick={handleDebugInfo}
              className="min-h-[48px] text-xs font-mono border rounded-lg px-3 py-3 transition-colors touch-manipulation"
              style={{ color: '#6b6b70', borderColor: 'rgba(212, 175, 55, 0.3)' }}
            >
              Debug Info
            </button>
          )}
        </div>

        {showDebugInfo && (
          <>
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
          </>
        )}

        {showLocationPermissionPopup && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80" onClick={() => setShowLocationPermissionPopup(false)}>
            <div className="bg-[#0d0d0f] border-2 rounded-xl p-6 max-w-md w-full shadow-xl text-center" style={{ borderColor: '#D4AF37', boxShadow: '0 0 40px rgba(212, 175, 55, 0.3)' }} onClick={(e) => e.stopPropagation()}>
              <p className="text-lg font-bold mb-4" style={{ color: '#D4AF37' }}>Sovereign Hint: Location</p>
              <p className="text-sm text-[#a0a0a5] mb-6">
                The Ledger needs your location once to anchor your presence—not to track you. Tap the Lock icon in your address bar and choose &quot;Allow&quot; for this site. You can revoke it later in browser settings.
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
            <p className="text-[#e8c547] font-bold text-center mb-2">
              Still getting to know you...
            </p>
            <p className="text-sm text-[#a0a0a5] text-center mb-4">
              Try the Backup Anchor if needed.
            </p>
            {result.errorMessage && (
              <p className="text-xs text-[#6b6b70] text-center mb-4">{result.errorMessage}</p>
            )}
            {(result.timedOut || result.twoPillarsOnly) && (
              <p className="text-xs text-[#e8c547] text-center mb-4">
                Use Verification with Master Device or Elderly-First Manual Bypass.
              </p>
            )}
            <div className="flex flex-col gap-4 py-4">
              {faceFailCount >= 2 && isArchitect() && isDesktop() && (
                <button
                  type="button"
                  onClick={goToDashboard}
                  className="relative z-50 w-full min-h-[48px] py-3 rounded-lg font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer border-2 border-[#D4AF37] text-[#D4AF37] touch-manipulation hover:bg-[#D4AF37]/10"
                >
                  Sovereign Manual Bypass
                </button>
              )}
              {faceFailCount >= 2 && (
                <button
                  type="button"
                  onClick={handleBackupAnchor}
                  className="relative z-50 w-full min-h-[48px] py-3 rounded-lg font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer border-2 text-black touch-manipulation"
                  style={{ background: '#D4AF37', borderColor: '#D4AF37', boxShadow: '0 0 20px rgba(212, 175, 55, 0.5)' }}
                >
                  Use Backup Anchor
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setShowTimeoutBypass(false);
                  resetVerification();
                  handleStartAuthentication();
                }}
                className="relative z-50 w-full min-h-[48px] py-3 rounded-lg bg-red-500 hover:bg-red-600 text-white font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer touch-manipulation"
              >
                Retry
              </button>
              {(showVerifyFromAuthorizedDevice || result.timedOut || result.twoPillarsOnly) && (
                <button
                  type="button"
                  onClick={handleVerifyFromAuthorizedDevice}
                  className="relative z-50 w-full min-h-[48px] py-3 rounded-lg border-2 border-[#D4AF37] text-[#D4AF37] font-bold uppercase tracking-wider transition-all duration-200 hover:bg-[#D4AF37]/10 cursor-pointer touch-manipulation"
                >
                  Verify from an authorized device
                </button>
              )}
            </div>
          </div>
        )}

        {/* After 75% (Face + Device): congratulations + Proceed to Dashboard; VIDA CAP mint triggered. */}
        {authStatus === AuthStatus.SCANNING && pillarFace && pillarPalm && (
          <div
            className="mt-8 p-6 rounded-xl border-2 text-center transition-all duration-300"
            style={{
              background: 'rgba(34, 197, 94, 0.08)',
              borderColor: '#22c55e',
              boxShadow: '0 0 20px rgba(34, 197, 94, 0.25)',
            }}
          >
            <p className="text-lg font-bold text-[#22c55e] mb-2 uppercase tracking-wider">
              Congratulations, You&apos;ve been Vitalized
            </p>
            <p className="text-sm text-[#6b6b70] mb-4">
              Your identity has been verified and saved. You may proceed to your dashboard.
            </p>
            <button
              type="button"
              onClick={goToDashboard}
              className="w-full min-h-[48px] py-3 px-6 rounded-lg border-2 font-bold text-sm uppercase tracking-wider transition-all duration-200 cursor-pointer touch-manipulation"
              style={{
                background: '#22c55e',
                borderColor: '#22c55e',
                color: '#fff',
                boxShadow: '0 0 12px rgba(34, 197, 94, 0.5)',
              }}
            >
              Proceed to Dashboard
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

      {/* Vitalization: Face only (MediaPipe Face Mesh). Then device binding (WebAuthn); no palm scan. */}
      <ArchitectVisionCapture
        isOpen={showArchitectVision}
        onClose={() => {
          setShowArchitectVision(false);
          setArchitectVerificationSuccess(null);
          architectSuccessRef.current = null;
          setAuthStatus(AuthStatus.IDLE);
        }}
        verificationSuccess={architectVerificationSuccess}
        onComplete={handleArchitectVisionComplete}
        isMasterArchitectInit={isFirstRun || softStart}
        confidenceThreshold={learningModeRef.current.active ? 0.6 : visionConfidenceThreshold}
        enforceBrightnessCheck={visionEnforceBrightness}
        enableArchitectBypass={isArchitect() && isDesktop()}
        onForceCompleteRequest={() => setArchitectVerificationSuccess(true)}
        forceCompleteAfterLivenessMs={1500}
      />

      {/* Device (Passkey) binding prompt — shown after face verified; user must click to trigger (browser requires user gesture). */}
      {showDeviceBindingPrompt && deviceBindingParams && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80" aria-modal="true" role="dialog" aria-labelledby="device-binding-title">
          <div className="w-full max-w-md rounded-xl border-2 border-[#D4AF37]/60 bg-[#1a1a1e] p-6 shadow-xl">
            <h2 id="device-binding-title" className="text-lg font-bold text-[#D4AF37] mb-2">Face verified</h2>
            <p className="text-sm text-[#a0a0a5] mb-4">
              Bind this device with a Passkey so you can sign in with face + device. Click the button below — your browser will ask you to create or use a passkey (e.g. Touch ID, Windows Hello).
            </p>
            {palmPulseError && (
              <div className="mb-4 rounded-lg bg-red-500/20 border border-red-500/50 px-3 py-2 text-sm text-red-300">
                {palmPulseError}
              </div>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleDeviceBindingClick}
                className="flex-1 min-h-[48px] py-3 px-4 rounded-lg font-bold bg-[#D4AF37] text-black hover:bg-[#e8c547] transition-colors"
              >
                Bind this device (Passkey)
              </button>
              <button
                type="button"
                onClick={() => { setShowDeviceBindingPrompt(false); setDeviceBindingParams(null); deviceBindingOnSuccessRef.current = null; setPalmPulseError(null); }}
                className="px-4 py-3 rounded-lg border border-[#6b6b70] text-[#a0a0a5] hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Daily Unlock Celebration: full-screen overlay when $100 (0.1 VIDA) is added (Days 2–9) or Day 9 full unlock */}
      {showDailyUnlockCelebration && celebrationData && (
        <DailyUnlockCelebration
          streak={celebrationData.streak}
          newSpendableVida={celebrationData.newSpendableVida}
          isDay9={celebrationData.isDay9}
          onClose={() => {
            setShowDailyUnlockCelebration(false);
            setCelebrationData(null);
            goToDashboard();
          }}
          playSound
        />
      )}

      {/* Master device: listen for verification requests when this number is used on another device */}
      {identityAnchor?.phone && (
        <LoginRequestListener phoneNumber={identityAnchor.phone} />
      )}
    </motion.div>
  );
}


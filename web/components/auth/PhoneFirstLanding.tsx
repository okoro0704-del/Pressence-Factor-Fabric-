'use client';

import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { JetBrains_Mono } from 'next/font/google';
import {
  PHONE_COUNTRIES,
  filterPhoneCountries,
  getNationalPlaceholder,
  getCountryByCode,
  type PhoneCountry,
} from '@/lib/phoneCountries';
import { formatPhoneE164 } from '@/lib/supabaseClient';
import { getAssertion } from '@/lib/webauthn';
import { deriveFaceHashFromCredential } from '@/lib/biometricAnchorSync';
import { setIdentityAnchorForSession } from '@/lib/sentinelActivation';
import { setSessionIdentity } from '@/lib/sessionIsolation';
import { setVitalizationComplete } from '@/lib/vitalizationState';
import { useGlobalPresenceGateway } from '@/contexts/GlobalPresenceGateway';
import { getSupabase } from '@/lib/supabase';
import { setVitalizationPhone } from '@/lib/deviceId';
import { getPalmHash, verifyOrEnrollPalm } from '@/lib/palmHashProfile';
import { PalmPulseCapture } from '@/components/auth/PalmPulseCapture';
import { ROUTES } from '@/lib/constants';

/** Credential shape passed from getAssertion for face hash derivation */
interface AssertionCredential {
  id: string;
  rawId: ArrayBuffer;
  response: {
    clientDataJSON: ArrayBuffer;
    authenticatorData: ArrayBuffer;
    signature?: ArrayBuffer;
    userHandle?: ArrayBuffer | null;
  };
}

/** Camera modal: shows live camera, then Verify triggers getAssertion and onSuccess(credential). */
function FaceCameraModal({
  isOpen,
  onClose,
  onSuccess,
  onError,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (credential: AssertionCredential) => void;
  onError: (message: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      if (!isOpen && streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      return;
    }
    const video = videoRef.current;
    if (!video) return;

    setCameraError(null);
    setCameraReady(false);
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false })
      .then((stream) => {
        streamRef.current = stream;
        video.srcObject = stream;
        video.play().then(() => setCameraReady(true)).catch(() => setCameraReady(true));
      })
      .catch((err) => {
        setCameraError(err?.message ?? 'Camera access denied');
        onError(err?.message ?? 'Camera access denied');
      });

    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      video.srcObject = null;
    };
  }, [isOpen, onError]);

  const handleVerify = useCallback(async () => {
    if (verifying) return;
    setVerifying(true);
    try {
      const assertion = await getAssertion();
      if (!assertion?.credential) {
        onError('Biometric cancelled or unavailable. Use a device with Face ID / Windows Hello.');
        setVerifying(false);
        return;
      }
      const cred = assertion.credential;
      onSuccess({
        id: cred.id,
        rawId: cred.rawId,
        response: {
          clientDataJSON: cred.response.clientDataJSON,
          authenticatorData: cred.response.authenticatorData,
        },
      });
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Biometric check failed. Try again.');
    } finally {
      setVerifying(false);
    }
  }, [verifying, onSuccess, onError]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-black"
      role="dialog"
      aria-modal="true"
      aria-label="Biometric verification – camera on"
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
        style={{ transform: 'scaleX(-1)' }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />
      <div className="relative z-10 flex flex-col flex-1 min-h-0 justify-end p-6 pb-10">
        {cameraError ? (
          <p className="text-red-400 text-center text-sm mb-4">{cameraError}</p>
        ) : (
          <p className="text-center text-[#D4AF37] text-sm font-medium mb-4">
            {cameraReady ? 'Position your face, then tap Verify' : 'Starting camera…'}
          </p>
        )}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-4 rounded-xl font-semibold border border-[#D4AF37]/50 text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleVerify}
            disabled={!cameraReady || verifying}
            className="flex-1 py-4 rounded-xl font-bold bg-[#D4AF37] text-[#0d0d0f] hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {verifying ? 'Verifying…' : 'Verify with Face ID'}
          </button>
        </div>
      </div>
    </div>
  );
}

const jetbrains = JetBrains_Mono({ weight: ['400', '600', '700'], subsets: ['latin'] });

/** Initial country from browser locale only (no persistence). Universal: not stuck on one country. */
function getInitialCountry(): PhoneCountry {
  if (typeof navigator === 'undefined' || !navigator.language) return getCountryByCode('US') ?? PHONE_COUNTRIES[0];
  const locale = navigator.language.trim();
  const part = locale.split(/[-_]/)[1];
  const code = part && part.length === 2 ? part.toUpperCase() : null;
  const found = code ? getCountryByCode(code) : null;
  return found ?? getCountryByCode('US') ?? PHONE_COUNTRIES[0];
}

/** Fetch user_profiles face_hash and full_name by phone. Returns null if no row or no face_hash. */
async function fetchProfileFaceHash(phone: string): Promise<{ face_hash: string; full_name: string | null } | null> {
  const supabase = getSupabase();
  if (!supabase?.from) return null;
  try {
    const { data, error } = await (supabase as any)
      .from('user_profiles')
      .select('face_hash, full_name')
      .eq('phone_number', phone.trim())
      .maybeSingle();
    if (error || !data) return null;
    const hash = data.face_hash != null ? String(data.face_hash).trim() : '';
    if (!hash) return null;
    return { face_hash: hash, full_name: data.full_name ?? null };
  } catch {
    return null;
  }
}

/**
 * First page when user accesses the site: phone number, then "Continue to Biometric Scan".
 * Clicking it pops up the camera; user verifies with Face ID, then we proceed to vitalization or dashboard.
 */
export function PhoneFirstLanding() {
  const router = useRouter();
  const { setPresenceVerified } = useGlobalPresenceGateway();
  const [country, setCountry] = useState<PhoneCountry>(() => getInitialCountry());
  const [nationalNumber, setNationalNumber] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [dropdownRect, setDropdownRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const [showFaceCamera, setShowFaceCamera] = useState(false);
  const [pendingPhoneForBiometric, setPendingPhoneForBiometric] = useState<string | null>(null);
  const [showPalmCapture, setShowPalmCapture] = useState(false);
  const [pendingPhone, setPendingPhone] = useState<string | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const updateDropdownRect = () => {
    if (triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      setDropdownRect({ top: r.bottom, left: r.left, width: Math.max(r.width, 260) });
    } else {
      setDropdownRect(null);
    }
  };

  useEffect(() => {
    const close = (e: MouseEvent) => {
      const target = e.target as Node;
      const inPicker = pickerRef.current?.contains(target);
      const inDropdown = dropdownRef.current?.contains(target);
      if (!inPicker && !inDropdown) setPickerOpen(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  useLayoutEffect(() => {
    if (!pickerOpen) {
      setDropdownRect(null);
      return;
    }
    updateDropdownRect();
    const onScrollOrResize = () => updateDropdownRect();
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [pickerOpen]);

  const fullPhone = nationalNumber.trim() ? `${country.dialCode}${nationalNumber.trim().replace(/\D/g, '')}` : '';

  const handleContinueToBiometric = () => {
    setError('');
    const formatted = formatPhoneE164(fullPhone || `${country.dialCode}${nationalNumber}`, country.code);
    if (!formatted.ok) {
      setError(formatted.error || `Invalid number. Use national format (e.g. ${getNationalPlaceholder(country.code)}).`);
      return;
    }
    setPendingPhoneForBiometric(formatted.e164);
    setShowFaceCamera(true);
  };

  const processBiometricSuccess = useCallback(
    async (phone: string, credential: AssertionCredential) => {
      setShowFaceCamera(false);
      setPendingPhoneForBiometric(null);
      setIsVerifying(true);
      setError('');
      try {
        const liveHash = await deriveFaceHashFromCredential(credential);
        const profile = await fetchProfileFaceHash(phone);
        if (!profile) {
          setVitalizationPhone(phone);
          router.replace(`${ROUTES.VITALIZATION}?phone=${encodeURIComponent(phone)}`);
          return;
        }
        if (liveHash.trim() !== profile.face_hash) {
          setError('Face did not match an account. Complete vitalization to register.');
          setIsVerifying(false);
          return;
        }
        const hasPalm = await getPalmHash(phone);
        if (hasPalm) {
          setPendingPhone(phone);
          setShowPalmCapture(true);
          setIsVerifying(false);
          return;
        }
        setIdentityAnchorForSession(phone);
        setPresenceVerified(true);
        setSessionIdentity(phone);
        setVitalizationComplete();
        setTimeout(() => router.replace(ROUTES.DASHBOARD), 800);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Biometric check failed. Try again.');
        setIsVerifying(false);
      }
    },
    [router]
  );

  const handleFaceCameraSuccess = useCallback(
    (credential: AssertionCredential) => {
      const phone = pendingPhoneForBiometric;
      if (phone) processBiometricSuccess(phone, credential);
    },
    [pendingPhoneForBiometric, processBiometricSuccess]
  );

  const handleFaceCameraClose = useCallback(() => {
    setShowFaceCamera(false);
    setPendingPhoneForBiometric(null);
  }, []);

  const handlePalmSuccess = async (palmHash: string) => {
    const phone = pendingPhone;
    if (!phone) return;
    setShowPalmCapture(false);
    setPendingPhone(null);
    setError('');
    const result = await verifyOrEnrollPalm(phone, palmHash);
    if (!result.ok) {
      setError(result.error ?? 'Palm did not match. Try again.');
      return;
    }
    setIdentityAnchorForSession(phone);
    setPresenceVerified(true);
    setSessionIdentity(phone);
    setVitalizationComplete();
    setTimeout(() => router.replace(ROUTES.DASHBOARD), 800);
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{ background: '#050505' }}
    >
      <div
        className="rounded-2xl border p-8 w-full max-w-md"
        style={{
          background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.05) 0%, rgba(0, 0, 0, 0.8) 100%)',
          borderColor: 'rgba(212, 175, 55, 0.3)',
          boxShadow: '0 0 60px rgba(212, 175, 55, 0.1)',
        }}
      >
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black mb-2" style={{ color: '#D4AF37' }}>
            Enter your phone number
          </h1>
          <p className="text-sm" style={{ color: '#6b6b70' }}>
            Universal: choose any country. Then face + palm (under 3 seconds for returning users).
          </p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-bold mb-2" style={{ color: '#D4AF37' }}>
            Phone Number
          </label>
          <div className="flex rounded-lg border overflow-hidden" style={{ borderColor: 'rgba(212, 175, 55, 0.3)' }}>
            <div className="relative" ref={pickerRef}>
              <button
                ref={triggerRef}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const opening = !pickerOpen;
                  if (opening && triggerRef.current) {
                    const r = triggerRef.current.getBoundingClientRect();
                    setDropdownRect({ top: r.bottom, left: r.left, width: Math.max(r.width, 260) });
                  } else if (!opening) {
                    setDropdownRect(null);
                  }
                  setPickerOpen(opening);
                }}
                aria-label={`Country code ${country.dialCode}. Click to choose country.`}
                aria-expanded={pickerOpen}
                aria-haspopup="listbox"
                className="flex items-center gap-1 pl-1 pr-1 py-0 border-r min-w-[160px] min-h-[40px] cursor-pointer select-none hover:bg-[#D4AF37]/10 active:bg-[#D4AF37]/15 transition-colors touch-manipulation"
                style={{ borderColor: 'rgba(212, 175, 55, 0.3)', background: '#0d0d0f', color: '#D4AF37' }}
              >
                <span
                  className="flex items-center justify-center w-[40px] h-[40px] shrink-0 text-2xl leading-none rounded-lg"
                  aria-hidden
                >
                  {country.flag}
                </span>
                <span
                  className={`flex items-center justify-center min-w-[40px] h-[40px] shrink-0 font-mono text-lg ${jetbrains.className}`}
                  style={{ color: '#D4AF37' }}
                >
                  {country.dialCode}
                </span>
                <span
                  className="ml-auto flex items-center justify-center w-[40px] h-[40px] rounded-lg text-[#D4AF37] hover:bg-[#D4AF37]/20 active:bg-[#D4AF37]/30 text-2xl leading-none"
                  aria-hidden
                  title="Choose country — view all country codes"
                >
                  ▾
                </span>
              </button>
            </div>
            <input
              type="tel"
              value={nationalNumber}
              onChange={(e) => setNationalNumber(e.target.value)}
              placeholder={getNationalPlaceholder(country.code)}
              disabled={isVerifying}
              className={`flex-1 px-4 py-3 min-h-[40px] font-mono text-lg bg-[#0d0d0f] text-[#D4AF37] placeholder-neutral-500 outline-none ${jetbrains.className}`}
            />
          </div>
          {typeof document !== 'undefined' &&
            pickerOpen &&
            dropdownRect &&
            createPortal(
              <div
                ref={dropdownRef}
                role="listbox"
                aria-label="Select country"
                className="rounded-lg border shadow-xl flex flex-col max-h-[320px] bg-[#0d0d0f] border-[#D4AF37]/30 z-[9999]"
                style={{
                  position: 'fixed',
                  top: dropdownRect.top + 4,
                  left: dropdownRect.left,
                  width: Math.min(dropdownRect.width, typeof window !== 'undefined' ? window.innerWidth - dropdownRect.left - 16 : 320),
                  minWidth: 260,
                }}
              >
                <div className="p-2 border-b border-[#D4AF37]/20 sticky top-0 bg-[#0d0d0f] shrink-0">
                  <input
                    type="text"
                    value={countrySearch}
                    onChange={(e) => setCountrySearch(e.target.value)}
                    placeholder="Search country"
                    className="w-full px-3 py-2 rounded text-sm bg-[#16161a] border border-[#D4AF37]/30 text-[#f5f5f5] placeholder-[#6b6b70] outline-none"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div className="overflow-y-auto max-h-64 min-h-[120px]">
                  {filterPhoneCountries(countrySearch).map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      role="option"
                      aria-selected={c.code === country.code}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCountry(c);
                        setCountrySearch('');
                        setPickerOpen(false);
                      }}
                      className="flex items-center gap-2 w-full px-3 py-3 text-left cursor-pointer select-none hover:bg-[#D4AF37]/15 active:bg-[#D4AF37]/20 transition-colors touch-manipulation"
                      style={{ color: c.code === country.code ? '#D4AF37' : '#a0a0a5' }}
                    >
                      <span className="text-lg">{c.flag}</span>
                      <span className={`font-mono text-sm ${jetbrains.className}`}>{c.dialCode}</span>
                      <span className="text-sm truncate">{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>,
              document.body
            )}
          <p className="text-xs mt-2" style={{ color: '#6b6b70' }}>
            Any country — not saved. Select each visit.
          </p>
        </div>

        <FaceCameraModal
          isOpen={showFaceCamera}
          onClose={handleFaceCameraClose}
          onSuccess={handleFaceCameraSuccess}
          onError={(msg) => setError(msg)}
        />
        <PalmPulseCapture
          isOpen={showPalmCapture}
          onClose={() => {
            setShowPalmCapture(false);
            setPendingPhone(null);
          }}
          onSuccess={handlePalmSuccess}
          onError={(msg) => setError(msg)}
        />

        {error && (
          <div
            className="rounded-lg border p-3 mb-6"
            style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
          >
            <p className="text-sm font-bold" style={{ color: '#ef4444' }}>{error}</p>
          </div>
        )}

        <button
          type="button"
          onClick={handleContinueToBiometric}
          disabled={!nationalNumber.trim() || isVerifying || showFaceCamera}
          className="w-full py-4 rounded-xl font-bold text-base uppercase tracking-wider transition-all hover:opacity-95 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: nationalNumber.trim() && !isVerifying && !showFaceCamera
              ? 'linear-gradient(135deg, #D4AF37 0%, #c9a227 100%)'
              : 'linear-gradient(135deg, #6b6b70 0%, #4a4a4e 100%)',
            color: nationalNumber.trim() && !isVerifying && !showFaceCamera ? '#0d0d0f' : '#ffffff',
            boxShadow: nationalNumber.trim() && !isVerifying && !showFaceCamera ? '0 0 24px rgba(212, 175, 55, 0.3)' : 'none',
          }}
        >
          {isVerifying ? 'Verifying…' : 'Continue to Biometric Scan'}
        </button>
      </div>
    </div>
  );
}

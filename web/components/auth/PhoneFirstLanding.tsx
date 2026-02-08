'use client';

import { useState, useRef, useEffect } from 'react';
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
 * First page when user accesses the site: phone number (country code not persistent), then "Continue to Biometric Scan".
 * Biometric runs without opening camera (device Face ID / Windows Hello). If face matches an account → dashboard; else → vitalization.
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
  const [showPalmCapture, setShowPalmCapture] = useState(false);
  const [pendingPhone, setPendingPhone] = useState<string | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      const target = e.target as Node;
      if (pickerRef.current && !pickerRef.current.contains(target)) setPickerOpen(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  const fullPhone = nationalNumber.trim() ? `${country.dialCode}${nationalNumber.trim().replace(/\D/g, '')}` : '';

  const handleContinueToBiometric = async () => {
    setError('');
    const formatted = formatPhoneE164(fullPhone || `${country.dialCode}${nationalNumber}`, country.code);
    if (!formatted.ok) {
      setError(formatted.error || `Invalid number. Use national format (e.g. ${getNationalPlaceholder(country.code)}).`);
      return;
    }
    const phone = formatted.e164;
    setIsVerifying(true);
    try {
      const assertion = await getAssertion();
      if (!assertion?.credential) {
        setError('Biometric cancelled or unavailable. Use a device with Face ID / Windows Hello.');
        setIsVerifying(false);
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
  };

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
                type="button"
                onClick={() => setPickerOpen((o) => !o)}
                className="flex items-center gap-2 px-3 py-3 border-r min-w-[120px] hover:bg-neutral-800/50 transition-colors"
                style={{ borderColor: 'rgba(212, 175, 55, 0.3)', background: '#0d0d0f', color: '#D4AF37' }}
              >
                <span className="text-xl leading-none">{country.flag}</span>
                <span className={`text-sm font-mono ${jetbrains.className}`}>{country.dialCode}</span>
                <span className="ml-auto text-neutral-500">▾</span>
              </button>
              {pickerOpen && (
                <div
                  className="absolute left-0 top-full z-50 mt-1 rounded-lg border shadow-xl flex flex-col w-full min-w-[260px] max-w-[min(320px,100vw)] max-h-[320px] bg-[#0d0d0f] border-[#D4AF37]/30"
                >
                  <div className="p-2 border-b border-[#D4AF37]/20 sticky top-0 bg-[#0d0d0f]">
                    <input
                      type="text"
                      value={countrySearch}
                      onChange={(e) => setCountrySearch(e.target.value)}
                      placeholder="Search country"
                      className="w-full px-3 py-2 rounded text-sm bg-[#16161a] border border-[#D4AF37]/30 text-[#f5f5f5] placeholder-[#6b6b70] outline-none"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="overflow-y-auto max-h-64">
                    {filterPhoneCountries(countrySearch).map((c) => (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => {
                          setCountry(c);
                          setCountrySearch('');
                          setPickerOpen(false);
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-[#D4AF37]/10"
                        style={{ color: c.code === country.code ? '#D4AF37' : '#a0a0a5' }}
                      >
                        <span className="text-lg">{c.flag}</span>
                        <span className="font-mono text-sm">{c.dialCode}</span>
                        <span className="text-sm truncate">{c.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <input
              type="tel"
              value={nationalNumber}
              onChange={(e) => setNationalNumber(e.target.value)}
              placeholder={getNationalPlaceholder(country.code)}
              disabled={isVerifying}
              className={`flex-1 px-4 py-3 font-mono text-lg bg-[#0d0d0f] text-[#D4AF37] placeholder-neutral-500 outline-none ${jetbrains.className}`}
            />
          </div>
          <p className="text-xs mt-2" style={{ color: '#6b6b70' }}>
            Any country — not saved. Select each visit.
          </p>
        </div>

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
          disabled={!nationalNumber.trim() || isVerifying}
          className="w-full py-4 rounded-xl font-bold text-base uppercase tracking-wider transition-all hover:opacity-95 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: nationalNumber.trim() && !isVerifying
              ? 'linear-gradient(135deg, #D4AF37 0%, #c9a227 100%)'
              : 'linear-gradient(135deg, #6b6b70 0%, #4a4a4e 100%)',
            color: nationalNumber.trim() && !isVerifying ? '#0d0d0f' : '#ffffff',
            boxShadow: nationalNumber.trim() && !isVerifying ? '0 0 24px rgba(212, 175, 55, 0.3)' : 'none',
          }}
        >
          {isVerifying ? 'Verifying…' : 'Continue to Biometric Scan'}
        </button>
      </div>
    </div>
  );
}

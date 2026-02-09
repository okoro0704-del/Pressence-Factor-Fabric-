'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { JetBrains_Mono } from 'next/font/google';
import { fetchIdentityAnchor, type BiometricIdentityRecord } from '@/lib/universalIdentityComparison';
import { formatPhoneE164 } from '@/lib/supabaseClient';
import {
  PHONE_COUNTRIES,
  DEFAULT_PHONE_COUNTRY,
  filterPhoneCountries,
  getNationalPlaceholder,
  getCountryByCode,
  type PhoneCountry,
} from '@/lib/phoneCountries';
import { linkGuardianToIdentity } from '@/lib/sentinelActivation';
import { saveUserProfileCountryCode } from '@/lib/userProfileCountry';
import { getDetectedCountryCode } from '@/lib/detectedCountry';
import { ensureDeviceId, setVitalizationPhone } from '@/lib/deviceId';

const jetbrains = JetBrains_Mono({ weight: ['400', '600', '700'], subsets: ['latin'] });

/** KILL AUTO-VERIFY: Anchor verification only transitions to biometric scan step. Actual verification happens after real-time hardware scan. */
export interface AnchorVerifiedPayload {
  phoneNumber: string;
  fullName: string;
  /** Used for Elder & Minor Exemption: skip Vocal Resonance when age < 18 or > 65 */
  identity?: BiometricIdentityRecord;
  /** For Minor/Elder: Guardian phone (E.164). Enables Dependent flow and Sentinel proxy. */
  guardianPhone?: string;
  /** True when account is Minor/Elder with linked Guardian (skip full biometric; use Guardian Authorization). */
  isDependent?: boolean;
  /** ISO 3166-1 alpha-2 from country picker (e.g. NG, US, GB). Saved to user_profiles.country_code for global distribution. */
  countryCode?: string;
}

interface IdentityAnchorInputProps {
  /** Called when anchor is locked. Does NOT mean verified — verification occurs only after hardware scan. */
  onAnchorVerified: (payload: AnchorVerifiedPayload) => void;
  onCancel?: () => void;
  title?: string;
  subtitle?: string;
  /** Pre-detected ISO Alpha-2 from parent (e.g. GPS/LocationLayer). If set, used as initial country before async detection. */
  initialCountryCode?: string;
  /** When true (default), detect country from IP and sessionStorage cache and update the phone input. User can still override manually. */
  autoDetectCountry?: boolean;
}

export function IdentityAnchorInput({
  onAnchorVerified,
  onCancel,
  title = 'Identity Anchor Required',
  subtitle = 'Enter your phone number to proceed to hardware biometric scan. Verification occurs after the scan.',
  initialCountryCode,
  autoDetectCountry = true,
}: IdentityAnchorInputProps) {
  const initialCountry = initialCountryCode ? getCountryByCode(initialCountryCode) : undefined;
  const [country, setCountry] = useState<PhoneCountry>(initialCountry ?? DEFAULT_PHONE_COUNTRY);
  const [nationalNumber, setNationalNumber] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const pickerRef = useRef<HTMLDivElement>(null);
  const userHasChangedCountryRef = useRef(false);
  const detectionDoneRef = useRef(false);
  /** After anchor verified: when Minor/Elder, show Link Guardian step. */
  const [anchorResult, setAnchorResult] = useState<{
    phoneNumber: string;
    fullName: string;
    identity: BiometricIdentityRecord;
  } | null>(null);
  const [guardianCountry, setGuardianCountry] = useState<PhoneCountry>(initialCountry ?? DEFAULT_PHONE_COUNTRY);
  const [guardianNationalNumber, setGuardianNationalNumber] = useState('');
  const [guardianVerifying, setGuardianVerifying] = useState(false);
  const [guardianPickerOpen, setGuardianPickerOpen] = useState(false);
  const [guardianCountrySearch, setGuardianCountrySearch] = useState('');
  const guardianPickerRef = useRef<HTMLDivElement>(null);
  const [detectedCountryApplied, setDetectedCountryApplied] = useState(false);
  /** When Supabase returns no user (not yet vitalized), show high-status prompt instead of red error. */
  const [notYetVitalized, setNotYetVitalized] = useState<{ phone: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!autoDetectCountry || detectionDoneRef.current) return;
    detectionDoneRef.current = true;
    getDetectedCountryCode().then((code) => {
      if (code && !userHasChangedCountryRef.current) {
        const detected = getCountryByCode(code);
        if (detected) {
          setCountry(detected);
          setGuardianCountry(detected);
          setDetectedCountryApplied(true);
        }
      }
    });
  }, [autoDetectCountry]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      const target = e.target as Node;
      if (pickerRef.current && !pickerRef.current.contains(target)) setPickerOpen(false);
      if (guardianPickerRef.current && !guardianPickerRef.current.contains(target)) setGuardianPickerOpen(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  const fullPhone = nationalNumber.trim() ? `${country.dialCode}${nationalNumber.trim().replace(/\D/g, '')}` : '';

  const handleVerifyAnchor = async () => {
    setError('');

    const formatted = formatPhoneE164(fullPhone || `${country.dialCode}${nationalNumber}`, country.code);
    if (!formatted.ok) {
      setError(formatted.error || `Invalid number for ${country.name}. Use national format (e.g. ${getNationalPlaceholder(country.code)}).`);
      return;
    }

    setIsVerifying(true);

    try {
      const result = await fetchIdentityAnchor(formatted.e164);

      if (!result.success || !result.identity) {
        const isNotFound =
          result.error?.includes('No active identity') ||
          result.error?.toLowerCase().includes('not found') ||
          result.error?.includes('Please register first');
        if (isNotFound) {
          setError('');
          setNotYetVitalized({ phone: formatted.e164 });
          setIsVerifying(false);
          return;
        }
        setError(result.error || 'Identity not found. Please register first.');
        setIsVerifying(false);
        return;
      }

      const identity = result.identity;
      const needsGuardian = identity.is_minor === true || identity.is_elder === true;
      const hasGuardian = !!identity.guardian_phone?.trim();

      if (needsGuardian && !hasGuardian) {
        setAnchorResult({
          phoneNumber: formatted.e164,
          fullName: identity.full_name,
          identity,
        });
        setIsVerifying(false);
        return;
      }

      await saveUserProfileCountryCode(formatted.e164, country.code);
      onAnchorVerified({
        phoneNumber: formatted.e164,
        fullName: identity.full_name,
        identity,
        guardianPhone: hasGuardian ? identity.guardian_phone : undefined,
        isDependent: needsGuardian,
        countryCode: country.code,
      });
    } catch (err) {
      console.error('Identity anchor verification error:', err);
      setError('System error. Please try again.');
      setIsVerifying(false);
    }
  };

  const guardianPhoneFull = guardianNationalNumber.trim()
    ? `${guardianCountry.dialCode}${guardianNationalNumber.trim().replace(/\D/g, '')}`
    : '';

  const handleLinkGuardian = async () => {
    if (!anchorResult) return;
    setError('');
    const formatted = formatPhoneE164(guardianPhoneFull || `${guardianCountry.dialCode}${guardianNationalNumber}`, guardianCountry.code);
    if (!formatted.ok) {
      setError(formatted.error || 'Invalid guardian phone number. Use E.164.');
      return;
    }
    setGuardianVerifying(true);
    try {
      const linkResult = await linkGuardianToIdentity(anchorResult.phoneNumber, formatted.e164);
      if (!linkResult.ok) {
        setError(linkResult.error || 'Failed to link guardian.');
        setGuardianVerifying(false);
        return;
      }
      await saveUserProfileCountryCode(anchorResult.phoneNumber, guardianCountry.code);
      onAnchorVerified({
        phoneNumber: anchorResult.phoneNumber,
        fullName: anchorResult.fullName,
        identity: anchorResult.identity,
        guardianPhone: formatted.e164,
        isDependent: true,
        countryCode: guardianCountry.code,
      });
      setAnchorResult(null);
      setGuardianNationalNumber('');
    } catch (err) {
      console.error('Link guardian error:', err);
      setError('System error. Please try again.');
    }
    setGuardianVerifying(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && fullPhone && !isVerifying) handleVerifyAnchor();
  };

  useEffect(() => {
    if (notYetVitalized) ensureDeviceId();
  }, [notYetVitalized]);

  const handleBeginVitalization = () => {
    if (!notYetVitalized?.phone) return;
    ensureDeviceId();
    setVitalizationPhone(notYetVitalized.phone);
    router.push(`/vitalization?phone=${encodeURIComponent(notYetVitalized.phone)}`);
  };

  // Citizen Not Yet Vitalized — high-status prompt and Begin Vitalization (no red error)
  if (notYetVitalized) {
    return (
      <div
        className="rounded-2xl border p-8"
        style={{
          background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.08) 0%, rgba(0, 0, 0, 0.9) 100%)',
          borderColor: 'rgba(212, 175, 55, 0.4)',
          boxShadow: '0 0 60px rgba(212, 175, 55, 0.15)',
        }}
      >
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">✨</div>
          <h2 className="text-2xl font-black mb-3" style={{ color: '#D4AF37' }}>
            Citizen Not Yet Vitalized
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: '#a0a0a5' }}>
            Would you like to anchor your identity to this device?
          </p>
          <p className="text-xs font-mono mt-2" style={{ color: '#6b6b70' }}>
            {notYetVitalized.phone}
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={handleBeginVitalization}
            className="w-full py-4 rounded-xl font-bold text-base uppercase tracking-wider transition-all hover:opacity-95 active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #D4AF37 0%, #c9a227 100%)',
              color: '#0d0d0f',
              boxShadow: '0 0 24px rgba(212, 175, 55, 0.3)',
            }}
          >
            Begin Vitalization
          </button>
          <button
            type="button"
            onClick={() => { setNotYetVitalized(null); setError(''); }}
            className="w-full py-3 rounded-xl font-medium text-sm uppercase tracking-wider transition-all hover:opacity-90"
            style={{ background: 'rgba(42,42,46,0.8)', color: '#a0a0a5', border: '1px solid rgba(212, 175, 55, 0.2)' }}
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  // Link Guardian step (Minor/Elder — Account Type requires Guardian)
  if (anchorResult) {
    return (
      <div
        className="rounded-2xl border p-8"
        style={{
          background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.05) 0%, rgba(0, 0, 0, 0.8) 100%)',
          borderColor: 'rgba(212, 175, 55, 0.3)',
          boxShadow: '0 0 60px rgba(212, 175, 55, 0.2)',
        }}
      >
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">👤🔗</div>
          <h2 className="text-3xl font-black mb-2" style={{ color: '#D4AF37' }}>
            Link Guardian Required
          </h2>
          <p className="text-sm" style={{ color: '#6b6b70' }}>
            This account is a Minor or Elder. Enter your Guardian&apos;s phone number (E.164) to proceed. Sentinel access will inherit from your Guardian.
          </p>
        </div>
        <div className="rounded-lg border p-4 mb-6" style={{ background: 'rgba(212, 175, 55, 0.05)', borderColor: 'rgba(212, 175, 55, 0.2)' }}>
          <p className="text-xs font-bold mb-1" style={{ color: '#D4AF37' }}>Identity</p>
          <p className="text-sm font-mono text-[#a0a0a5]">{anchorResult.fullName} — {anchorResult.phoneNumber}</p>
        </div>
        <div className="mb-6">
          <label className="block text-sm font-bold mb-2" style={{ color: '#D4AF37' }}>Guardian Phone Number</label>
          <div className="flex rounded-lg border overflow-hidden" style={{ borderColor: 'rgba(212, 175, 55, 0.3)' }}>
            <div className="relative" ref={guardianPickerRef}>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setGuardianPickerOpen((o) => !o); }}
                aria-label="Choose country — view all country codes"
                aria-expanded={guardianPickerOpen}
                className="flex items-center gap-2 px-3 py-3 border-r min-w-[140px] hover:bg-neutral-800/50 transition-colors"
                style={{ borderColor: 'rgba(212, 175, 55, 0.3)', background: '#0d0d0f', color: '#D4AF37' }}
              >
                <span className="text-xl leading-none">{guardianCountry.flag}</span>
                <span className={`text-sm font-mono ${jetbrains.className}`}>{guardianCountry.dialCode}</span>
                <span
                  className="ml-auto flex items-center justify-center w-10 h-10 shrink-0 rounded-lg text-[#D4AF37] hover:bg-[#D4AF37]/20 active:bg-[#D4AF37]/30 text-2xl leading-none"
                  aria-hidden
                  title="View all country codes"
                >
                  ▾
                </span>
              </button>
              {guardianPickerOpen && (
                <div
                  className="absolute left-0 top-full z-[100] mt-1 rounded-lg border shadow-xl flex flex-col w-full min-w-[280px] max-w-[min(360px,100vw)] max-h-[400px] bg-[#0d0d0f] border-[#D4AF37]/30"
                  role="listbox"
                  aria-label="All country codes"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-2 border-b border-[#D4AF37]/20 sticky top-0 bg-[#0d0d0f]">
                    <input
                      type="text"
                      value={guardianCountrySearch}
                      onChange={(e) => setGuardianCountrySearch(e.target.value)}
                      placeholder="Search (e.g. Ghana, UK, USA) — all countries listed below"
                      className="w-full px-3 py-2 rounded text-sm bg-[#16161a] border border-[#D4AF37]/30 text-[#f5f5f5] placeholder-[#6b6b70] outline-none"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <p className="text-[10px] text-[#6b6b70] mt-1">All country codes — scroll or search to find yours.</p>
                  </div>
                  <div className="overflow-y-auto overflow-x-hidden min-h-[200px] max-h-[320px] flex flex-col">
                    {filterPhoneCountries(guardianCountrySearch).map((c) => (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => {
                          userHasChangedCountryRef.current = true;
                          setGuardianCountry(c);
                          setGuardianCountrySearch('');
                          setGuardianPickerOpen(false);
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-[#D4AF37]/10"
                        style={{ color: c.code === guardianCountry.code ? '#D4AF37' : '#a0a0a5' }}
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
              value={guardianNationalNumber}
              onChange={(e) => setGuardianNationalNumber(e.target.value)}
              placeholder={getNationalPlaceholder(guardianCountry.code)}
              disabled={guardianVerifying}
              className={`flex-1 px-4 py-3 font-mono text-lg bg-[#0d0d0f] text-[#D4AF37] placeholder-neutral-500 outline-none ${jetbrains.className}`}
            />
          </div>
        </div>
        {error && (
          <div className="rounded-lg border p-3 mb-6" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
            <p className="text-sm font-bold" style={{ color: '#ef4444' }}>{error}</p>
          </div>
        )}
        <div className="flex gap-3">
          <button
            onClick={() => { setAnchorResult(null); setError(''); }}
            disabled={guardianVerifying}
            className="flex-1 px-6 py-3 rounded-lg font-bold text-sm uppercase tracking-wider transition-all duration-300 hover:scale-105 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #6b6b70 0%, #4a4a4e 100%)', color: '#ffffff' }}
          >
            Back
          </button>
          <button
            onClick={handleLinkGuardian}
            disabled={!guardianNationalNumber.trim() || guardianVerifying}
            className="flex-1 px-6 py-3 rounded-lg font-bold text-sm uppercase tracking-wider transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: guardianNationalNumber.trim() && !guardianVerifying
                ? 'linear-gradient(135deg, #D4AF37 0%, #c9a227 100%)'
                : 'linear-gradient(135deg, #6b6b70 0%, #4a4a4e 100%)',
              color: guardianNationalNumber.trim() && !guardianVerifying ? '#0d0d0f' : '#ffffff',
              boxShadow: guardianNationalNumber.trim() && !guardianVerifying ? '0 0 30px rgba(212, 175, 55, 0.4)' : 'none',
            }}
          >
            {guardianVerifying ? 'Linking...' : 'Link Guardian & Continue'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl border p-8"
      style={{
        background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.05) 0%, rgba(0, 0, 0, 0.8) 100%)',
        borderColor: 'rgba(212, 175, 55, 0.3)',
        boxShadow: '0 0 60px rgba(212, 175, 55, 0.2)',
      }}
    >
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">🔗</div>
        <h2 className="text-3xl font-black mb-2" style={{ color: '#D4AF37' }}>
          {title}
        </h2>
        <p className="text-sm" style={{ color: '#6b6b70' }}>
          {subtitle}
        </p>
      </div>

      <div
        className="rounded-lg border p-4 mb-6"
        style={{
          background: 'rgba(212, 175, 55, 0.05)',
          borderColor: 'rgba(212, 175, 55, 0.2)',
        }}
      >
        <div className="flex items-start gap-3">
          <div className="text-2xl">ℹ️</div>
          <div>
            <p className="text-xs font-bold mb-2" style={{ color: '#D4AF37' }}>
              Universal Security Policy
            </p>
            <ul className="text-xs space-y-1" style={{ color: '#a0a0a5' }}>
              <li>• Identity anchor establishes 1-to-1 comparison</li>
              <li>• Biometric scan will ONLY match YOUR specific hash</li>
              <li>• 0.5% variance threshold (unique even in identical twins)</li>
              <li>• No generalized matching - must be YOU</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Country Code Picker + Phone Input */}
      <div className="mb-6">
        <label className="block text-sm font-bold mb-2" style={{ color: '#D4AF37' }}>
          Phone Number
        </label>
        <div className="flex rounded-lg border overflow-hidden" style={{ borderColor: 'rgba(212, 175, 55, 0.3)' }}>
          <div className="relative" ref={pickerRef}>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setPickerOpen((o) => !o); }}
              aria-label="Choose country — view all country codes"
              aria-expanded={pickerOpen}
              className="flex items-center gap-2 px-3 py-3 border-r min-w-[140px] hover:bg-neutral-800/50 transition-colors"
              style={{ borderColor: 'rgba(212, 175, 55, 0.3)', background: '#0d0d0f', color: '#D4AF37' }}
            >
              <span className="text-xl leading-none">{country.flag}</span>
              <span className={`text-sm font-mono ${jetbrains.className}`}>{country.dialCode}</span>
              <span
                className="ml-auto flex items-center justify-center w-10 h-10 shrink-0 rounded-lg text-[#D4AF37] hover:bg-[#D4AF37]/20 active:bg-[#D4AF37]/30 text-2xl leading-none"
                aria-hidden
                title="View all country codes"
              >
                ▾
              </span>
            </button>
            {pickerOpen && (
              <div
                className="absolute left-0 top-full z-[100] mt-1 rounded-lg border shadow-xl flex flex-col w-full min-w-[280px] max-w-[min(360px,100vw)] max-h-[400px] bg-[#0d0d0f] border-[#D4AF37]/30"
                role="listbox"
                aria-label="All country codes"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-2 border-b border-[#D4AF37]/20 sticky top-0 bg-[#0d0d0f]">
                  <input
                    type="text"
                    value={countrySearch}
                    onChange={(e) => setCountrySearch(e.target.value)}
                    placeholder="Search (e.g. Ghana, UK, USA) — all countries listed below"
                    className="w-full px-3 py-2 rounded text-sm bg-[#16161a] border border-[#D4AF37]/30 text-[#f5f5f5] placeholder-[#6b6b70] outline-none"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <p className="text-[10px] text-[#6b6b70] mt-1">All country codes — scroll or search to find yours.</p>
                </div>
                <div className="overflow-y-auto overflow-x-hidden min-h-[200px] max-h-[320px] flex flex-col">
                    {filterPhoneCountries(countrySearch).map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => {
                        userHasChangedCountryRef.current = true;
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
            onKeyPress={handleKeyPress}
            placeholder={getNationalPlaceholder(country.code)}
            disabled={isVerifying}
            className={`flex-1 px-4 py-3 font-mono text-lg bg-[#0d0d0f] text-[#D4AF37] placeholder-neutral-500 outline-none ${jetbrains.className}`}
          />
        </div>
        <p className="text-xs mt-2" style={{ color: '#6b6b70' }}>
          Select country (flag) then enter national number. Validation matches {country.name} format. E.164 applied automatically.
          {detectedCountryApplied && (
            <span className="block mt-1" style={{ color: '#6b6b70' }}>
              Country detected from your location. Change it above if you use a foreign SIM.
            </span>
          )}
        </p>
      </div>

      {error && (
        <div
          className="rounded-lg border p-3 mb-6"
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            borderColor: 'rgba(239, 68, 68, 0.3)',
          }}
        >
          <p className="text-sm font-bold" style={{ color: '#ef4444' }}>
            {error}
          </p>
        </div>
      )}

      <div className="flex gap-3">
        {onCancel && (
          <button
            onClick={onCancel}
            disabled={isVerifying}
            className="flex-1 px-6 py-3 rounded-lg font-bold text-sm uppercase tracking-wider transition-all duration-300 hover:scale-105 disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #6b6b70 0%, #4a4a4e 100%)',
              color: '#ffffff',
            }}
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleVerifyAnchor}
          disabled={!nationalNumber.trim() || isVerifying}
          className="flex-1 px-6 py-3 rounded-lg font-bold text-sm uppercase tracking-wider transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: nationalNumber.trim() && !isVerifying
              ? 'linear-gradient(135deg, #D4AF37 0%, #c9a227 100%)'
              : 'linear-gradient(135deg, #6b6b70 0%, #4a4a4e 100%)',
            color: nationalNumber.trim() && !isVerifying ? '#0d0d0f' : '#ffffff',
            boxShadow: nationalNumber.trim() && !isVerifying ? '0 0 30px rgba(212, 175, 55, 0.4)' : 'none',
          }}
        >
          {isVerifying ? 'Verifying Identity Anchor...' : 'Continue to Biometric Scan'}
        </button>
      </div>
    </div>
  );
}

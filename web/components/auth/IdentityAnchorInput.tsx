'use client';

import { useState, useRef, useEffect } from 'react';
import { JetBrains_Mono } from 'next/font/google';
import { fetchIdentityAnchor, type BiometricIdentityRecord } from '@/lib/universalIdentityComparison';
import { formatPhoneE164 } from '@/lib/supabaseClient';
import { PHONE_COUNTRIES, DEFAULT_PHONE_COUNTRY, type PhoneCountry } from '@/lib/phoneCountries';
import { linkGuardianToIdentity } from '@/lib/sentinelActivation';

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
}

interface IdentityAnchorInputProps {
  /** Called when anchor is locked. Does NOT mean verified — verification occurs only after hardware scan. */
  onAnchorVerified: (payload: AnchorVerifiedPayload) => void;
  onCancel?: () => void;
  title?: string;
  subtitle?: string;
}

export function IdentityAnchorInput({
  onAnchorVerified,
  onCancel,
  title = 'Identity Anchor Required',
  subtitle = 'Enter your phone number to proceed to hardware biometric scan. Verification occurs after the scan.',
}: IdentityAnchorInputProps) {
  const [country, setCountry] = useState<PhoneCountry>(DEFAULT_PHONE_COUNTRY);
  const [nationalNumber, setNationalNumber] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  /** After anchor verified: when Minor/Elder, show Link Guardian step. */
  const [anchorResult, setAnchorResult] = useState<{
    phoneNumber: string;
    fullName: string;
    identity: BiometricIdentityRecord;
  } | null>(null);
  const [guardianCountry, setGuardianCountry] = useState<PhoneCountry>(DEFAULT_PHONE_COUNTRY);
  const [guardianNationalNumber, setGuardianNationalNumber] = useState('');
  const [guardianVerifying, setGuardianVerifying] = useState(false);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setPickerOpen(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  const fullPhone = nationalNumber.trim() ? `${country.dialCode}${nationalNumber.trim().replace(/\D/g, '')}` : '';

  const handleVerifyAnchor = async () => {
    setError('');

    const formatted = formatPhoneE164(fullPhone || `${country.dialCode}${nationalNumber}`, country.code);
    if (!formatted.ok) {
      setError(formatted.error || 'Invalid phone number. Use E.164 (e.g. +234 801 234 5678).');
      return;
    }

    setIsVerifying(true);

    try {
      const result = await fetchIdentityAnchor(formatted.e164);

      if (!result.success || !result.identity) {
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

      onAnchorVerified({
        phoneNumber: formatted.e164,
        fullName: identity.full_name,
        identity,
        guardianPhone: hasGuardian ? identity.guardian_phone : undefined,
        isDependent: needsGuardian,
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
      onAnchorVerified({
        phoneNumber: anchorResult.phoneNumber,
        fullName: anchorResult.fullName,
        identity: anchorResult.identity,
        guardianPhone: formatted.e164,
        isDependent: true,
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
            <div className="relative" ref={pickerRef}>
              <button
                type="button"
                onClick={() => setPickerOpen((o) => !o)}
                className="flex items-center gap-2 px-3 py-3 border-r min-w-[120px] hover:bg-neutral-800/50 transition-colors"
                style={{ borderColor: 'rgba(212, 175, 55, 0.3)', background: '#0d0d0f', color: '#D4AF37' }}
              >
                <span className="text-xl leading-none">{guardianCountry.flag}</span>
                <span className={`text-sm font-mono ${jetbrains.className}`}>{guardianCountry.dialCode}</span>
                <span className="ml-auto text-neutral-500">▾</span>
              </button>
              {pickerOpen && (
                <div
                  className="absolute left-0 top-full z-50 mt-1 max-h-64 overflow-y-auto rounded-lg border shadow-xl"
                  style={{ background: '#0d0d0f', borderColor: 'rgba(212, 175, 55, 0.3)', minWidth: 200 }}
                >
                  {PHONE_COUNTRIES.map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => { setGuardianCountry(c); setPickerOpen(false); }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-[#D4AF37]/10"
                      style={{ color: c.code === guardianCountry.code ? '#D4AF37' : '#a0a0a5' }}
                    >
                      <span className="text-lg">{c.flag}</span>
                      <span className="font-mono text-sm">{c.dialCode}</span>
                      <span className="text-sm truncate">{c.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <input
              type="tel"
              value={guardianNationalNumber}
              onChange={(e) => setGuardianNationalNumber(e.target.value)}
              placeholder="801 234 5678"
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
                className="absolute left-0 top-full z-50 mt-1 max-h-64 overflow-y-auto rounded-lg border shadow-xl"
                style={{
                  background: '#0d0d0f',
                  borderColor: 'rgba(212, 175, 55, 0.3)',
                  minWidth: 200,
                }}
              >
                {PHONE_COUNTRIES.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => {
                      setCountry(c);
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
            )}
          </div>
          <input
            type="tel"
            value={nationalNumber}
            onChange={(e) => setNationalNumber(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="801 234 5678"
            disabled={isVerifying}
            className={`flex-1 px-4 py-3 font-mono text-lg bg-[#0d0d0f] text-[#D4AF37] placeholder-neutral-500 outline-none ${jetbrains.className}`}
          />
        </div>
        <p className="text-xs mt-2" style={{ color: '#6b6b70' }}>
          Select country (flag) then enter number without country code. E.164 applied automatically.
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

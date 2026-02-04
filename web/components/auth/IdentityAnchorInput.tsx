'use client';

import { useState, useRef, useEffect } from 'react';
import { JetBrains_Mono } from 'next/font/google';
import { fetchIdentityAnchor, type BiometricIdentityRecord } from '@/lib/universalIdentityComparison';
import { formatPhoneE164 } from '@/lib/supabaseClient';
import { PHONE_COUNTRIES, DEFAULT_PHONE_COUNTRY, type PhoneCountry } from '@/lib/phoneCountries';

const jetbrains = JetBrains_Mono({ weight: ['400', '600', '700'], subsets: ['latin'] });

/** KILL AUTO-VERIFY: Anchor verification only transitions to biometric scan step. Actual verification happens after real-time hardware scan. */
export interface AnchorVerifiedPayload {
  phoneNumber: string;
  fullName: string;
  /** Used for Elder & Minor Exemption: skip Vocal Resonance when age < 18 or > 65 */
  identity?: BiometricIdentityRecord;
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

      onAnchorVerified({
        phoneNumber: formatted.e164,
        fullName: result.identity.full_name,
        identity: result.identity,
      });
    } catch (err) {
      console.error('Identity anchor verification error:', err);
      setError('System error. Please try again.');
      setIsVerifying(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && fullPhone && !isVerifying) handleVerifyAnchor();
  };

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

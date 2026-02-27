'use client';

import { useState, useRef, useEffect } from 'react';
import { JetBrains_Mono } from 'next/font/google';
import { signInWithOtp, formatPhoneE164 } from '@/lib/supabaseClient';
import { getSupabase } from '@/lib/supabase';
import {
  PHONE_COUNTRIES,
  getInitialCountry,
  filterPhoneCountries,
  getNationalPlaceholder,
  getCountryByCode,
  type PhoneCountry,
} from '@/lib/phoneCountries';

const jetbrains = JetBrains_Mono({ weight: ['400', '600', '700'], subsets: ['latin'] });
const GOLD = '#D4AF37';

export interface PhoneOTPLoginProps {
  onSuccess: (phoneNumber: string) => void;
  onBack?: () => void;
}

/**
 * PHONE OTP LOGIN — Step 2 of Gateway Flow.
 * User enters phone number, receives 6-digit OTP via SMS, verifies, and proceeds to dashboard.
 */
export function PhoneOTPLogin({ onSuccess, onBack }: PhoneOTPLoginProps) {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [country, setCountry] = useState<PhoneCountry>(() => getInitialCountry());
  const [nationalNumber, setNationalNumber] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [phoneE164, setPhoneE164] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close country picker on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    };
    if (pickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [pickerOpen]);

  const handleSendOTP = async () => {
    if (!nationalNumber.trim()) {
      setError('Please enter your phone number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formatted = formatPhoneE164(nationalNumber.trim(), country.code);
      if (!formatted.e164) {
        setError('Invalid phone number format');
        setLoading(false);
        return;
      }

      const { error: otpError } = await signInWithOtp(formatted.e164, { channel: 'sms' });
      
      if (otpError) {
        setError(otpError.message || 'Failed to send OTP');
        setLoading(false);
        return;
      }

      setPhoneE164(formatted.e164);
      setStep('otp');
      setLoading(false);
      
      // Focus first OTP input
      setTimeout(() => otpInputsRef.current[0]?.focus(), 100);
    } catch (err) {
      console.error('OTP send error:', err);
      setError('System error. Please try again.');
      setLoading(false);
    }
  };

  const handleOTPChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only digits
    
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Only last digit
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }

    // Auto-verify when all 6 digits entered
    if (newOtp.every(d => d) && index === 5) {
      handleVerifyOTP(newOtp.join(''));
    }
  };

  const handleOTPKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async (otpCode: string) => {
    setLoading(true);
    setError('');

    try {
      const supabase = getSupabase();
      const { error: verifyError } = await supabase.auth.verifyOtp({
        phone: phoneE164,
        token: otpCode,
        type: 'sms',
      });

      if (verifyError) {
        setError('Invalid OTP code. Please try again.');
        setOtp(['', '', '', '', '', '']);
        otpInputsRef.current[0]?.focus();
        setLoading(false);
        return;
      }

      // Success! Proceed to dashboard
      onSuccess(phoneE164);
    } catch (err) {
      console.error('OTP verification error:', err);
      setError('Verification failed. Please try again.');
      setLoading(false);
    }
  };

  const filteredCountries = countrySearch.trim()
    ? filterPhoneCountries(countrySearch)
    : PHONE_COUNTRIES;

  if (step === 'otp') {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border-2 p-8" style={{ borderColor: 'rgba(212, 175, 55, 0.6)', background: 'linear-gradient(180deg, rgba(30, 28, 22, 0.98) 0%, rgba(15, 14, 10, 0.99) 100%)' }}>
            <h1 className={`text-2xl font-bold uppercase tracking-wider mb-2 ${jetbrains.className}`} style={{ color: GOLD }}>
              Enter Verification Code
            </h1>
            <p className="text-sm text-[#a0a0a5] mb-6">
              We sent a 6-digit code to {phoneE164}
            </p>

            {/* OTP Input Grid */}
            <div className="flex gap-2 mb-6">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (otpInputsRef.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOTPChange(index, e.target.value)}
                  onKeyDown={(e) => handleOTPKeyDown(index, e)}
                  disabled={loading}
                  className="w-full aspect-square text-center text-2xl font-bold rounded-lg bg-[#16161a] border-2 border-[#2a2a2e] text-[#f5f5f5] focus:border-[#D4AF37] focus:outline-none transition-colors"
                  style={{ fontFamily: jetbrains.style.fontFamily }}
                />
              ))}
            </div>

            {error && (
              <p className="text-sm text-red-400 mb-4">{error}</p>
            )}

            <button
              onClick={() => setStep('phone')}
              disabled={loading}
              className="w-full py-3 text-sm text-[#6b6b70] hover:text-[#a0a0a5] transition-colors"
            >
              ← Change Phone Number
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Phone input step
  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Gradient */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(circle at center, rgba(212, 175, 55, 0.2) 0%, rgba(5, 5, 5, 0) 70%)' }}
        aria-hidden
      />

      <div className="relative z-10 w-full max-w-md">
        <div className="rounded-2xl border-2 p-8" style={{ borderColor: 'rgba(212, 175, 55, 0.6)', background: 'linear-gradient(180deg, rgba(30, 28, 22, 0.98) 0%, rgba(15, 14, 10, 0.99) 100%)' }}>
          {/* Header */}
          <h1 className={`text-2xl font-bold uppercase tracking-wider mb-2 ${jetbrains.className}`} style={{ color: GOLD }}>
            Phone Number Login
          </h1>
          <p className="text-sm text-[#a0a0a5] mb-6">
            Enter your phone number to receive a verification code
          </p>

          {/* Country Selector */}
          <div className="mb-4 relative" ref={pickerRef}>
            <label className="block text-sm font-medium text-[#a0a0a5] mb-2">Country</label>
            <button
              type="button"
              onClick={() => setPickerOpen(!pickerOpen)}
              className="w-full px-4 py-3 rounded-lg bg-[#16161a] border border-[#2a2a2e] text-[#f5f5f5] text-left flex items-center justify-between hover:border-[#D4AF37]/40 transition-colors"
            >
              <span className="flex items-center gap-2">
                <span className="text-xl">{country.flag}</span>
                <span>{country.name}</span>
                <span className="text-[#6b6b70]">+{country.dialCode}</span>
              </span>
              <span className="text-[#6b6b70]">▼</span>
            </button>

            {/* Country Picker Dropdown */}
            {pickerOpen && (
              <div className="absolute z-50 mt-2 w-full max-h-64 overflow-y-auto rounded-lg bg-[#16161a] border border-[#2a2a2e] shadow-xl">
                <div className="sticky top-0 p-2 bg-[#16161a] border-b border-[#2a2a2e]">
                  <input
                    type="text"
                    value={countrySearch}
                    onChange={(e) => setCountrySearch(e.target.value)}
                    placeholder="Search countries..."
                    className="w-full px-3 py-2 rounded bg-[#0d0d0f] border border-[#2a2a2e] text-[#f5f5f5] text-sm focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>
                {filteredCountries.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => {
                      setCountry(c);
                      setPickerOpen(false);
                      setCountrySearch('');
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-[#2a2a2e] transition-colors flex items-center gap-2"
                  >
                    <span className="text-xl">{c.flag}</span>
                    <span className="text-[#f5f5f5]">{c.name}</span>
                    <span className="text-[#6b6b70] ml-auto">+{c.dialCode}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Phone Number Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-[#a0a0a5] mb-2">Phone Number</label>
            <div className="flex gap-2">
              <div className="px-4 py-3 rounded-lg bg-[#16161a] border border-[#2a2a2e] text-[#6b6b70] font-mono">
                +{country.dialCode}
              </div>
              <input
                type="tel"
                value={nationalNumber}
                onChange={(e) => setNationalNumber(e.target.value)}
                placeholder={getNationalPlaceholder(country)}
                disabled={loading}
                className="flex-1 px-4 py-3 rounded-lg bg-[#16161a] border border-[#2a2a2e] text-[#f5f5f5] font-mono focus:border-[#D4AF37] focus:outline-none transition-colors"
                onKeyDown={(e) => e.key === 'Enter' && handleSendOTP()}
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-400 mb-4">{error}</p>
          )}

          {/* Send OTP Button */}
          <button
            onClick={handleSendOTP}
            disabled={loading || !nationalNumber.trim()}
            className="w-full py-3 rounded-lg font-bold uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: loading || !nationalNumber.trim()
                ? '#2a2a2e'
                : 'linear-gradient(135deg, #D4AF37 0%, #F4D03F 100%)',
              color: loading || !nationalNumber.trim() ? '#6b6b70' : '#050505',
            }}
          >
            {loading ? 'Sending...' : 'Send Verification Code'}
          </button>

          {/* Back Button */}
          {onBack && (
            <button
              onClick={onBack}
              disabled={loading}
              className="w-full mt-4 py-3 text-sm text-[#6b6b70] hover:text-[#a0a0a5] transition-colors"
            >
              ← Back to Language Selection
            </button>
          )}

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-[#6b6b70] uppercase tracking-wider">
              Gateway Flow · Step 2 of 3
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


'use client';

import { useState, useRef, useEffect, useLayoutEffect } from 'react';
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
import { setVitalizationPhone } from '@/lib/deviceId';
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

/**
 * First page: phone number, then VITALIZE. Goes straight to vitalization — no passkey or password prompts.
 * Passkey is saved to the device after successful vitalization.
 */
export function PhoneFirstLanding() {
  const router = useRouter();
  const [country, setCountry] = useState<PhoneCountry>(() => getInitialCountry());
  const [nationalNumber, setNationalNumber] = useState('');
  const [error, setError] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [dropdownRect, setDropdownRect] = useState<{ top: number; left: number; width: number } | null>(null);
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

  /** VITALIZE: go straight to vitalization — no signing, password, or passkey prompts. Passkey is saved after successful vitalization. */
  const handleVitalize = () => {
    setError('');
    const formatted = formatPhoneE164(fullPhone || `${country.dialCode}${nationalNumber}`, country.code);
    if (!formatted.ok) {
      setError(formatted.error || `Invalid number. Use national format (e.g. ${getNationalPlaceholder(country.code)}).`);
      return;
    }
    setVitalizationPhone(formatted.e164);
    router.replace(`${ROUTES.VITALIZATION}?phone=${encodeURIComponent(formatted.e164)}`);
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
            Enter phone, then tap VITALIZE to go straight to vitalization. No passkey or password — passkey is saved after you complete vitalization.
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
              disabled={false}
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
          onClick={handleVitalize}
          disabled={!nationalNumber.trim()}
          className="w-full py-4 rounded-xl font-bold text-base uppercase tracking-wider transition-all hover:opacity-95 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: nationalNumber.trim()
              ? 'linear-gradient(135deg, #D4AF37 0%, #c9a227 100%)'
              : 'linear-gradient(135deg, #6b6b70 0%, #4a4a4e 100%)',
            color: nationalNumber.trim() ? '#0d0d0f' : '#ffffff',
            boxShadow: nationalNumber.trim() ? '0 0 24px rgba(212, 175, 55, 0.3)' : 'none',
          }}
        >
          VITALIZE
        </button>
      </div>
    </div>
  );
}

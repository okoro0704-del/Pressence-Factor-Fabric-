'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/TranslationContext';
import { SUPPORTED_LANGUAGES, type LanguageCode } from '@/lib/i18n/config';
import { setSessionLanguage } from '@/lib/sessionManagement';

const GOLD = '#D4AF37';

/**
 * Language page — choose language for the entire app.
 * Clicking a language applies it app-wide (storage + context + document) and redirects to Vitalization.
 */
export default function LanguagePage() {
  const router = useRouter();
  const { language: currentLanguage, setLanguage } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSelectLanguage = (code: LanguageCode) => {
    setLanguage(code);
    setSessionLanguage(code);
    router.replace('/vitalization');
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d0d0f]" style={{ color: '#6b6b70' }}>
        <p className="animate-pulse">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0f] p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2" aria-hidden>🌐</div>
          <h1 className="text-xl font-bold uppercase tracking-wider mb-2" style={{ color: GOLD }}>
            Choose your language
          </h1>
          <p className="text-sm" style={{ color: '#6b6b70' }}>
            The entire app will use this language. Tap one to continue to Vitalization.
          </p>
        </div>

        <div
          className="grid grid-cols-2 sm:grid-cols-3 gap-3"
          role="listbox"
          aria-label="Language options"
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              role="option"
              aria-selected={currentLanguage === lang.code}
              onClick={() => handleSelectLanguage(lang.code)}
              className="flex flex-col items-center gap-1.5 p-4 rounded-xl border text-center transition-all min-h-[88px] hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0d0d0f]"
              style={{
                background: currentLanguage === lang.code ? 'rgba(212, 175, 55, 0.15)' : 'rgba(26, 26, 30, 0.8)',
                borderColor: currentLanguage === lang.code ? 'rgba(212, 175, 55, 0.5)' : 'rgba(212, 175, 55, 0.25)',
                color: currentLanguage === lang.code ? GOLD : '#e5e5e5',
              }}
            >
              <span className="text-2xl leading-none" aria-hidden>
                {lang.flag}
              </span>
              <span className="font-semibold text-sm truncate w-full">{lang.nativeName}</span>
              <span className="text-xs opacity-80 uppercase tracking-wider">{lang.code}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

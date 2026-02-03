'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n/TranslationContext';
import { SUPPORTED_LANGUAGES, type LanguageCode } from '@/lib/i18n/config';

/**
 * LANGUAGE SWITCHER
 * Sleek, minimalist Globe Icon dropdown with Black & Gold Glassmorphism
 * Positioned in top-right corner of dashboard header
 */
export function LanguageSwitcher() {
  const { language, setLanguage, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLang = SUPPORTED_LANGUAGES.find(lang => lang.code === language);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleLanguageChange = (langCode: LanguageCode) => {
    setLanguage(langCode);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Globe Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-[#1a1a1e]/80 via-[#0d0d0f]/80 to-[#1a1a1e]/80 backdrop-blur-md border border-[#e8c547]/30 rounded-lg hover:border-[#e8c547]/60 transition-all duration-300 shadow-lg hover:shadow-[0_0_20px_rgba(232,197,71,0.3)]"
        aria-label="Change language"
      >
        {/* Globe Icon */}
        <span className="text-2xl group-hover:scale-110 transition-transform duration-300">
          🌐
        </span>

        {/* Current Language Code */}
        <span className="text-sm font-bold text-[#e8c547] uppercase tracking-wider">
          {currentLang?.code}
        </span>

        {/* Dropdown Arrow */}
        <svg
          className={`w-4 h-4 text-[#e8c547] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>

        {/* Gold Glow Effect */}
        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#e8c547]/0 via-[#e8c547]/10 to-[#e8c547]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-gradient-to-br from-[#1a1a1e] via-[#0d0d0f] to-[#1a1a1e] backdrop-blur-xl border-2 border-[#e8c547]/40 rounded-xl shadow-2xl shadow-[#e8c547]/20 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="px-4 py-3 border-b border-[#2a2a2e]">
            <p className="text-xs font-bold text-[#e8c547] uppercase tracking-wider">
              Select Language
            </p>
          </div>

          {/* Language Options */}
          <div className="max-h-96 overflow-y-auto">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`w-full flex items-center gap-3 px-4 py-3 transition-all duration-200 ${
                  language === lang.code
                    ? 'bg-gradient-to-r from-[#e8c547]/20 to-[#e8c547]/10 border-l-4 border-[#e8c547]'
                    : 'hover:bg-[#16161a] border-l-4 border-transparent'
                }`}
              >
                {/* Flag */}
                <span className="text-2xl">{lang.flag}</span>

                {/* Language Info */}
                <div className="flex-1 text-left">
                  <p className={`text-sm font-bold ${
                    language === lang.code ? 'text-[#e8c547]' : 'text-[#f5f5f5]'
                  }`}>
                    {lang.nativeName}
                  </p>
                  <p className="text-xs text-[#6b6b70]">{lang.name}</p>
                </div>

                {/* Active Indicator */}
                {language === lang.code && (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-[#00ff41] rounded-full animate-pulse" />
                    <span className="text-xs font-bold text-[#00ff41] uppercase">Active</span>
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-[#2a2a2e] bg-[#0d0d0f]/50">
            <p className="text-xs text-[#6b6b70] text-center">
              🌍 7 Languages Supported
            </p>
          </div>
        </div>
      )}
    </div>
  );
}


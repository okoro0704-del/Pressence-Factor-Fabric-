'use client';

import { useState } from 'react';
import { JetBrains_Mono } from 'next/font/google';
import { useTranslation } from '@/lib/i18n/TranslationContext';
import { storeLanguage, type LanguageCode } from '@/lib/i18n/config';

const jetbrains = JetBrains_Mono({ weight: ['400', '600', '700'], subsets: ['latin'] });
const GOLD = '#D4AF37';

interface LanguageOption {
  code: LanguageCode;
  name: string;
  nativeName: string;
  flag: string;
}

const GATEWAY_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'yo', name: 'Yoruba', nativeName: 'Yorùbá', flag: '🇳🇬' },
  { code: 'ha', name: 'Hausa', nativeName: 'Hausa', flag: '🇳🇬' },
  { code: 'ig', name: 'Igbo', nativeName: 'Igbo', flag: '🇳🇬' },
];

export interface LanguageGateProps {
  onLanguageSelected: (language: LanguageCode) => void;
}

/**
 * LANGUAGE GATE — First screen in Gateway Flow.
 * User selects language (English, Yoruba, Hausa, Igbo) before proceeding to SMS login.
 * Imperial minimalist design with gold accents.
 */
export function LanguageGate({ onLanguageSelected }: LanguageGateProps) {
  const { setLanguage } = useTranslation();
  const [selectedLang, setSelectedLang] = useState<LanguageCode | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleSelectLanguage = (code: LanguageCode) => {
    setSelectedLang(code);
    setIsAnimating(true);
    
    // Store language preference
    setLanguage(code);
    storeLanguage(code);
    
    // Animate then proceed
    setTimeout(() => {
      onLanguageSelected(code);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Gradient */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(circle at center, rgba(212, 175, 55, 0.2) 0%, rgba(5, 5, 5, 0) 70%)' }}
        aria-hidden
      />

      {/* Main Content */}
      <div className={`relative z-10 w-full max-w-2xl transition-all duration-600 ${isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className={`text-4xl md:text-5xl font-bold uppercase tracking-wider mb-4 ${jetbrains.className}`} style={{ color: GOLD }}>
            PFF Protocol
          </h1>
          <p className="text-lg text-[#a0a0a5]">
            Presence Factor Fabric
          </p>
          <div className="mt-6 h-1 w-24 mx-auto bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />
        </div>

        {/* Language Selection Title */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-[#f5f5f5] mb-2">
            Select Your Language
          </h2>
          <p className="text-sm text-[#6b6b70]">
            Choose your preferred language to continue
          </p>
        </div>

        {/* Language Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {GATEWAY_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleSelectLanguage(lang.code)}
              disabled={isAnimating}
              className={`group relative p-8 rounded-2xl border-2 transition-all duration-300 ${
                selectedLang === lang.code
                  ? 'border-[#D4AF37] bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 scale-105'
                  : 'border-[#2a2a2e] bg-[#16161a]/80 hover:border-[#D4AF37]/60 hover:bg-[#16161a]'
              } ${isAnimating && selectedLang !== lang.code ? 'opacity-50' : 'opacity-100'}`}
              style={{
                boxShadow: selectedLang === lang.code 
                  ? '0 0 30px rgba(212, 175, 55, 0.3)' 
                  : 'none',
              }}
            >
              {/* Flag */}
              <div className="text-6xl mb-4 transition-transform duration-300 group-hover:scale-110">
                {lang.flag}
              </div>

              {/* Language Name */}
              <h3 className={`text-2xl font-bold mb-1 ${selectedLang === lang.code ? 'text-[#D4AF37]' : 'text-[#f5f5f5]'}`}>
                {lang.nativeName}
              </h3>
              <p className="text-sm text-[#6b6b70]">
                {lang.name}
              </p>

              {/* Selection Indicator */}
              {selectedLang === lang.code && (
                <div className="absolute top-4 right-4">
                  <div className="w-8 h-8 rounded-full bg-[#D4AF37] flex items-center justify-center">
                    <span className="text-[#050505] text-lg">✓</span>
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Footer Note */}
        <div className="mt-12 text-center">
          <p className="text-xs text-[#6b6b70] uppercase tracking-wider">
            Gateway Flow · Step 1 of 3
          </p>
        </div>
      </div>
    </div>
  );
}


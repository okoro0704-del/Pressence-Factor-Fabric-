'use client';

import { useState } from 'react';
import { SUPPORTED_LANGUAGES, storeLanguage, type LanguageCode } from '@/lib/i18n/config';

/**
 * PRE-VITALIZATION HANDSHAKE: Language Confirmation
 * Displayed before vitalization or login begins.
 */
export interface ConfirmLanguageScreenProps {
  onConfirm: (languageCode: LanguageCode) => void;
  title?: string;
  subtitle?: string;
}

export function ConfirmLanguageScreen({
  onConfirm,
  title = 'Confirm Language',
  subtitle = 'Select your language for vocal verification. You will be asked to speak a phrase in this language.',
}: ConfirmLanguageScreenProps) {
  const [selected, setSelected] = useState<LanguageCode | null>(null);

  const handleConfirm = () => {
    if (!selected) return;
    storeLanguage(selected);
    onConfirm(selected);
  };

  return (
    <div
      className="rounded-2xl border p-8 max-w-lg mx-auto"
      style={{
        background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.05) 0%, rgba(0, 0, 0, 0.8) 100%)',
        borderColor: 'rgba(212, 175, 55, 0.3)',
        boxShadow: '0 0 60px rgba(212, 175, 55, 0.2)',
      }}
    >
      <div className="text-center mb-6">
        <div className="text-5xl mb-3">🌐</div>
        <h2 className="text-2xl font-black" style={{ color: '#D4AF37' }}>
          {title}
        </h2>
        <p className="text-sm mt-2" style={{ color: '#6b6b70' }}>
          {subtitle}
        </p>
      </div>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {SUPPORTED_LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            type="button"
            onClick={() => setSelected(lang.code)}
            className="w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all"
            style={{
              background: selected === lang.code ? 'rgba(212, 175, 55, 0.15)' : 'rgba(0,0,0,0.3)',
              borderColor: selected === lang.code ? 'rgba(212, 175, 55, 0.5)' : 'rgba(212, 175, 55, 0.2)',
              color: selected === lang.code ? '#D4AF37' : '#a0a0a5',
            }}
          >
            <span className="text-2xl">{lang.flag}</span>
            <div>
              <div className="font-semibold">{lang.nativeName}</div>
              <div className="text-xs opacity-80">{lang.name}</div>
            </div>
            {selected === lang.code && <span className="ml-auto text-lg">✓</span>}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={handleConfirm}
        disabled={!selected}
        className="w-full mt-6 py-3 rounded-lg font-bold uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: selected ? 'linear-gradient(135deg, #D4AF37 0%, #c9a227 100%)' : 'rgba(107, 107, 112, 0.5)',
          color: selected ? '#0d0d0f' : '#fff',
        }}
      >
        Confirm & Continue
      </button>
    </div>
  );
}

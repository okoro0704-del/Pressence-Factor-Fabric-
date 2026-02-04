'use client';

import { useState, useMemo } from 'react';
import { JetBrains_Mono } from 'next/font/google';
import { SUPPORTED_LANGUAGES, storeLanguage, type LanguageCode } from '@/lib/i18n/config';
import { setSessionLanguage } from '@/lib/sessionManagement';

const jetbrains = JetBrains_Mono({ weight: ['400', '600', '700'], subsets: ['latin'] });

/**
 * LANGUAGE SELECTION (Pre-Vitalization Handshake)
 * Grid layout, searchable, scrollable. Stores in i18n + sessionManagement before Identity Anchor.
 * Confirm button: 'use client', active onClick → storeLanguage + setSessionLanguage → onConfirm (next step in 3-of-4 biometric flow).
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
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return SUPPORTED_LANGUAGES;
    return SUPPORTED_LANGUAGES.filter(
      (lang) =>
        lang.code.toLowerCase().includes(q) ||
        lang.name.toLowerCase().includes(q) ||
        lang.nativeName.toLowerCase().includes(q)
    );
  }, [search]);

  const handleConfirm = () => {
    if (!selected) return;
    storeLanguage(selected);
    setSessionLanguage(selected);
    onConfirm(selected);
  };

  return (
    <div
      className="rounded-2xl border w-full max-w-2xl mx-auto overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.05) 0%, rgba(0, 0, 0, 0.9) 100%)',
        borderColor: 'rgba(212, 175, 55, 0.3)',
        boxShadow: '0 0 60px rgba(212, 175, 55, 0.2)',
      }}
    >
      <div className="p-6 border-b border-neutral-800">
        <div className="text-center mb-4">
          <div className="text-4xl mb-2">🌐</div>
          <h2
            className={`text-xl font-black ${jetbrains.className}`}
            style={{ color: '#D4AF37' }}
          >
            {title}
          </h2>
          <p className="text-sm mt-1 text-neutral-500" style={{ color: '#6b6b70' }}>
            {subtitle}
          </p>
        </div>
        <input
          type="search"
          placeholder="Search by name or code (e.g. EN, Español)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`w-full px-4 py-2.5 rounded-lg border bg-neutral-950 text-neutral-200 placeholder-neutral-500 ${jetbrains.className} text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50`}
          style={{ borderColor: 'rgba(212, 175, 55, 0.3)' }}
          aria-label="Search languages"
        />
      </div>

      <div
        className="overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[min(50vh,320px)]"
        role="listbox"
        aria-label="Language options"
      >
        {filtered.map((lang) => (
          <button
            key={lang.code}
            type="button"
            role="option"
            aria-selected={selected === lang.code}
            onClick={() => setSelected(lang.code)}
            className={`relative flex flex-col items-center gap-1.5 p-3 rounded-lg border text-center transition-all min-h-[72px] ${jetbrains.className} text-sm`}
            style={{
              background: selected === lang.code ? 'rgba(212, 175, 55, 0.15)' : 'rgba(0,0,0,0.4)',
              borderColor: selected === lang.code ? 'rgba(212, 175, 55, 0.5)' : 'rgba(212, 175, 55, 0.2)',
              color: selected === lang.code ? '#D4AF37' : '#a0a0a5',
            }}
          >
            <span className="text-2xl leading-none" aria-hidden>
              {lang.flag}
            </span>
            <span className="font-semibold truncate w-full">{lang.nativeName}</span>
            <span className="text-xs opacity-80 uppercase tracking-wider">{lang.code}</span>
            {selected === lang.code && (
              <span className="absolute top-1 right-1 text-[#D4AF37]" aria-hidden>✓</span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="px-4 pb-4 text-sm text-neutral-500 text-center">
          No languages match &quot;{search}&quot;
        </p>
      )}

      <div className="p-6 border-t border-neutral-800">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!selected}
          className={`w-full py-3 rounded-lg font-bold uppercase tracking-wider transition-all ${jetbrains.className} disabled:opacity-50 disabled:cursor-not-allowed`}
          style={{
            background: selected ? 'linear-gradient(135deg, #D4AF37 0%, #c9a227 100%)' : 'rgba(107, 107, 112, 0.5)',
            color: selected ? '#0d0d0f' : '#fff',
          }}
        >
          Confirm & Continue
        </button>
      </div>
    </div>
  );
}

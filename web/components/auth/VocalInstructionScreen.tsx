'use client';

import { useState } from 'react';
import { JetBrains_Mono } from 'next/font/google';
import { getInstructionStrings } from '@/lib/i18n/config';

const jetbrains = JetBrains_Mono({ weight: ['400', '600', '700'], subsets: ['latin'] });

/**
 * PRE-VITALIZATION HANDSHAKE: Vocal Instruction (3-of-4 Biometric Gate)
 * UI is fully translated per selectedLanguage. When isVocalExempt (Elder 65+ / Minor under 18), shows bypass message.
 */
export interface VocalInstructionScreenProps {
  languageCode: string;
  onContinue: () => void;
  title?: string;
  /** When true (Elder 65+ or Minor under 18), show voice bypass message and Next only. */
  isVocalExempt?: boolean;
}

export function VocalInstructionScreen({
  languageCode,
  onContinue,
  title,
  isVocalExempt = false,
}: VocalInstructionScreenProps) {
  const [mode, setMode] = useState<'choose' | 'read' | 'audio'>('choose');
  const t = getInstructionStrings(languageCode || 'en');
  const displayTitle = title ?? t.title;
  const phrase = t.vitalizationPhrase;

  const handleReadText = () => {
    setMode('read');
  };

  const handleRepeatAfterAudio = () => {
    setMode('audio');
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(phrase);
      const langMap: Record<string, string> = {
        zh: 'zh-CN', ja: 'ja-JP', ar: 'ar-SA', hi: 'hi-IN', ru: 'ru-RU',
        de: 'de-DE', fr: 'fr-FR', es: 'es-ES', pt: 'pt-BR', sw: 'sw-KE',
      };
      u.lang = langMap[languageCode] || `${languageCode}-US`;
      u.rate = 0.9;
      window.speechSynthesis.speak(u);
    }
  };

  // Elder (65+) / Minor (under 18): show bypass message and Next only
  if (isVocalExempt) {
    return (
      <div
        className={`rounded-2xl border p-8 max-w-lg mx-auto ${jetbrains.className}`}
        style={{
          background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.05) 0%, rgba(0, 0, 0, 0.8) 100%)',
          borderColor: 'rgba(212, 175, 55, 0.3)',
          boxShadow: '0 0 60px rgba(212, 175, 55, 0.2)',
        }}
      >
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🛡️</div>
          <h2 className="text-2xl font-black" style={{ color: '#D4AF37' }}>
            {displayTitle}
          </h2>
          <p className="text-sm mt-4" style={{ color: '#a0a0a5' }}>
            {t.voiceBypassMessage}
          </p>
        </div>
        <button
          type="button"
          onClick={onContinue}
          className="w-full py-3 rounded-lg font-bold uppercase tracking-wider"
          style={{
            background: 'linear-gradient(135deg, #D4AF37 0%, #c9a227 100%)',
            color: '#0d0d0f',
          }}
        >
          {t.continueToIdentityAnchor}
        </button>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border p-8 max-w-lg mx-auto ${jetbrains.className}`}
      style={{
        background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.05) 0%, rgba(0, 0, 0, 0.8) 100%)',
        borderColor: 'rgba(212, 175, 55, 0.3)',
        boxShadow: '0 0 60px rgba(212, 175, 55, 0.2)',
      }}
    >
      <div className="text-center mb-6">
        <div className="text-5xl mb-3">🎤</div>
        <h2 className="text-2xl font-black" style={{ color: '#D4AF37' }}>
          {displayTitle}
        </h2>
        <p className="text-sm mt-2" style={{ color: '#6b6b70' }}>
          {t.subtitle}
        </p>
      </div>

      {(mode === 'read' || mode === 'audio') ? (
        <>
          <p className="text-sm text-center mb-4" style={{ color: '#D4AF37', fontWeight: 600 }}>
            {t.readAfterBeep}
          </p>
          <div
            className="p-6 rounded-lg border text-center mb-6"
            style={{
              background: 'rgba(212, 175, 55, 0.08)',
              borderColor: 'rgba(212, 175, 55, 0.3)',
              color: '#D4AF37',
              fontSize: '1.25rem',
              fontWeight: 700,
            }}
          >
            &quot;{phrase}&quot;
          </div>
          <p className="text-xs text-center mb-6" style={{ color: '#6b6b70' }}>
            {t.phrasePrompt}
          </p>
          <button
            type="button"
            onClick={onContinue}
            className="w-full py-3 rounded-lg font-bold uppercase tracking-wider"
            style={{
              background: 'linear-gradient(135deg, #D4AF37 0%, #c9a227 100%)',
              color: '#0d0d0f',
            }}
          >
            {t.continueToIdentityAnchor}
          </button>
        </>
      ) : (
        <>
          <p className="text-sm mb-4" style={{ color: '#a0a0a5' }}>
            {t.chooseHowToLearn}
          </p>
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleReadText}
              className="w-full flex items-center gap-3 p-4 rounded-lg border text-left transition-all hover:opacity-90"
              style={{
                background: 'rgba(212, 175, 55, 0.1)',
                borderColor: 'rgba(212, 175, 55, 0.3)',
                color: '#D4AF37',
              }}
            >
              <span className="text-2xl">📖</span>
              <span className="font-semibold">{t.readText}</span>
            </button>
            <button
              type="button"
              onClick={handleRepeatAfterAudio}
              className="w-full flex items-center gap-3 p-4 rounded-lg border text-left transition-all hover:opacity-90"
              style={{
                background: 'rgba(212, 175, 55, 0.1)',
                borderColor: 'rgba(212, 175, 55, 0.3)',
                color: '#D4AF37',
              }}
            >
              <span className="text-2xl">🔊</span>
              <span className="font-semibold">{t.repeatAfterAudio}</span>
            </button>
            <button
              type="button"
              onClick={onContinue}
              className="w-full mt-4 py-2.5 rounded-lg font-semibold text-sm border border-neutral-600 text-neutral-400 hover:text-neutral-200 hover:border-neutral-500 transition-all"
            >
              {t.skipToIdentityAnchor}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

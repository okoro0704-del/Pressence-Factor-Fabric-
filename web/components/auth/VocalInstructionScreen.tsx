'use client';

import { useState } from 'react';
import { getLanguageConfig, type LanguageCode } from '@/lib/i18n/config';

/** Phrase user must say for vocal verification (localized per language). */
const VITALIZATION_PHRASE: Record<string, string> = {
  en: 'I am Vitalized',
  yo: 'Mo ti Vitalized',
  ha: 'Na Vitalized',
  ig: 'Abụ m Vitalized',
  fr: 'Je suis Vitalized',
  es: 'Estoy Vitalized',
  zh: '我已 Vitalized',
};

/**
 * PRE-VITALIZATION HANDSHAKE: Vocal Instruction
 * Shown after language is set. User can "Read text" or "Repeat after audio guide".
 * KILL AUTO-VERIFY: No verification until hardware actually captures data.
 */
export interface VocalInstructionScreenProps {
  languageCode: string;
  onContinue: () => void;
  title?: string;
}

export function VocalInstructionScreen({
  languageCode,
  onContinue,
  title = 'Vocal Verification',
}: VocalInstructionScreenProps) {
  const [mode, setMode] = useState<'choose' | 'read' | 'audio'>('choose');
  const phrase = VITALIZATION_PHRASE[languageCode] ?? VITALIZATION_PHRASE.en;
  const langConfig = getLanguageConfig((languageCode || 'en') as LanguageCode);

  const handleReadText = () => {
    setMode('read');
    // User has seen the text; they will say it during the actual scan. No verification here.
  };

  const handleRepeatAfterAudio = () => {
    setMode('audio');
    // In production: play TTS of phrase. For now just show phrase.
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(phrase);
      u.lang = languageCode === 'zh' ? 'zh-CN' : languageCode + '-US';
      u.rate = 0.9;
      window.speechSynthesis.speak(u);
    }
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
        <div className="text-5xl mb-3">🎤</div>
        <h2 className="text-2xl font-black" style={{ color: '#D4AF37' }}>
          {title}
        </h2>
        <p className="text-sm mt-2" style={{ color: '#6b6b70' }}>
          When prompted, you will say the phrase below. Verification happens only when the hardware captures your voice.
        </p>
      </div>

      {(mode === 'read' || mode === 'audio') ? (
        <>
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
            "{phrase}"
          </div>
          <p className="text-xs text-center mb-6" style={{ color: '#6b6b70' }}>
            You will be asked to say this phrase during the biometric scan. No verification until then.
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
            Continue to Identity Anchor
          </button>
        </>
      ) : (
        <>
          <p className="text-sm mb-4" style={{ color: '#a0a0a5' }}>
            Choose how you want to learn the phrase:
          </p>
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleReadText}
              className="w-full flex items-center gap-3 p-4 rounded-lg border transition-all hover:opacity-90"
              style={{
                background: 'rgba(212, 175, 55, 0.1)',
                borderColor: 'rgba(212, 175, 55, 0.3)',
                color: '#D4AF37',
              }}
            >
              <span className="text-2xl">📖</span>
              <span className="font-semibold">Read text</span>
            </button>
            <button
              type="button"
              onClick={handleRepeatAfterAudio}
              className="w-full flex items-center gap-3 p-4 rounded-lg border transition-all hover:opacity-90"
              style={{
                background: 'rgba(212, 175, 55, 0.1)',
                borderColor: 'rgba(212, 175, 55, 0.3)',
                color: '#D4AF37',
              }}
            >
              <span className="text-2xl">🔊</span>
              <span className="font-semibold">Repeat after audio guide</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

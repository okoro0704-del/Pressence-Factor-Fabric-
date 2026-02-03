'use client';

import { TranslationProvider, useTranslation } from '@/lib/i18n/TranslationContext';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { SUPPORTED_LANGUAGES } from '@/lib/i18n/config';

/**
 * LANGUAGE DEMO PAGE CONTENT
 * Demonstrates multi-language functionality
 */
function LanguageDemoContent() {
  const { t, language, direction } = useTranslation();

  return (
    <div className="min-h-screen bg-[#050505]" dir={direction}>
      {/* Header with Language Switcher */}
      <div className="bg-gradient-to-r from-[#0d0d0f] via-[#16161a] to-[#0d0d0f] border-b-2 border-[#2a2a2e] sticky top-0 z-50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#e8c547] via-[#ffd700] to-[#e8c547]">
                🌐 MULTI-LANGUAGE ENGINE
              </h1>
              <p className="text-sm text-[#6b6b70] mt-1">
                7 Languages • Auto-Detection • Dynamic Translation
              </p>
            </div>
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Current Language Info */}
        <div className="bg-gradient-to-br from-[#1a1a1e] via-[#0d0d0f] to-[#1a1a1e] rounded-2xl p-8 border-2 border-[#e8c547]/40">
          <div className="flex items-center gap-4 mb-6">
            <span className="text-5xl">
              {SUPPORTED_LANGUAGES.find(l => l.code === language)?.flag}
            </span>
            <div>
              <h2 className="text-2xl font-black text-[#e8c547]">
                {SUPPORTED_LANGUAGES.find(l => l.code === language)?.nativeName}
              </h2>
              <p className="text-sm text-[#6b6b70]">
                Code: <span className="text-[#e8c547] font-mono">{language}</span> • 
                Direction: <span className="text-[#e8c547] font-mono">{direction}</span>
              </p>
            </div>
          </div>

          {/* Translation Examples */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* PFF Terms */}
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-[#f5f5f5] border-b border-[#2a2a2e] pb-2">
                📊 PFF Terms
              </h3>
              <div className="space-y-2">
                <div className="bg-[#0d0d0f] rounded-lg p-3 border border-[#2a2a2e]">
                  <p className="text-xs text-[#6b6b70] mb-1">pff.totalPFFBalance</p>
                  <p className="text-lg font-bold text-[#e8c547]">{t('pff.totalPFFBalance')}</p>
                </div>
                <div className="bg-[#0d0d0f] rounded-lg p-3 border border-[#2a2a2e]">
                  <p className="text-xs text-[#6b6b70] mb-1">pff.nationalVault</p>
                  <p className="text-lg font-bold text-[#e8c547]">{t('pff.nationalVault')}</p>
                </div>
                <div className="bg-[#0d0d0f] rounded-lg p-3 border border-[#2a2a2e]">
                  <p className="text-xs text-[#6b6b70] mb-1">pff.spendableVIDA</p>
                  <p className="text-lg font-bold text-[#e8c547]">{t('pff.spendableVIDA')}</p>
                </div>
                <div className="bg-[#0d0d0f] rounded-lg p-3 border border-[#2a2a2e]">
                  <p className="text-xs text-[#6b6b70] mb-1">pff.sovereignShare</p>
                  <p className="text-lg font-bold text-[#e8c547]">{t('pff.sovereignShare')}</p>
                </div>
              </div>
            </div>

            {/* Banking Terms */}
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-[#f5f5f5] border-b border-[#2a2a2e] pb-2">
                🏦 Banking Terms
              </h3>
              <div className="space-y-2">
                <div className="bg-[#0d0d0f] rounded-lg p-3 border border-[#2a2a2e]">
                  <p className="text-xs text-[#6b6b70] mb-1">banking.fundzmanByUBA</p>
                  <p className="text-lg font-bold text-[#EE3124]">{t('banking.fundzmanByUBA')}</p>
                </div>
                <div className="bg-[#0d0d0f] rounded-lg p-3 border border-[#2a2a2e]">
                  <p className="text-xs text-[#6b6b70] mb-1">banking.preActivated</p>
                  <p className="text-lg font-bold text-[#00ff41]">{t('banking.preActivated')}</p>
                </div>
                <div className="bg-[#0d0d0f] rounded-lg p-3 border border-[#2a2a2e]">
                  <p className="text-xs text-[#6b6b70] mb-1">banking.nationalBlockAccount</p>
                  <p className="text-lg font-bold text-[#f5f5f5]">{t('banking.nationalBlockAccount')}</p>
                </div>
                <div className="bg-[#0d0d0f] rounded-lg p-3 border border-[#2a2a2e]">
                  <p className="text-xs text-[#6b6b70] mb-1">banking.linkExternalInstitution</p>
                  <p className="text-lg font-bold text-[#f5f5f5]">{t('banking.linkExternalInstitution')}</p>
                </div>
              </div>
            </div>

            {/* Companion Messages */}
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-[#f5f5f5] border-b border-[#2a2a2e] pb-2">
                🤖 Companion Messages
              </h3>
              <div className="space-y-2">
                <div className="bg-[#0d0d0f] rounded-lg p-3 border border-[#2a2a2e]">
                  <p className="text-xs text-[#6b6b70] mb-1">companion.greeting</p>
                  <p className="text-base text-[#f5f5f5]">{t('companion.greeting')}</p>
                </div>
                <div className="bg-[#0d0d0f] rounded-lg p-3 border border-[#2a2a2e]">
                  <p className="text-xs text-[#6b6b70] mb-1">companion.vitalized</p>
                  <p className="text-base text-[#00ff41] font-bold">{t('companion.vitalized')}</p>
                </div>
                <div className="bg-[#0d0d0f] rounded-lg p-3 border border-[#2a2a2e]">
                  <p className="text-xs text-[#6b6b70] mb-1">companion.howCanIHelp</p>
                  <p className="text-base text-[#f5f5f5]">{t('companion.howCanIHelp')}</p>
                </div>
              </div>
            </div>

            {/* Formula */}
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-[#f5f5f5] border-b border-[#2a2a2e] pb-2">
                🧮 Formula
              </h3>
              <div className="bg-[#0d0d0f] rounded-lg p-4 border border-[#e8c547]/30">
                <p className="text-base font-mono text-[#e8c547] text-center">
                  {t('formula.pffCalculation')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-[#1a1a1e] to-[#16161a] rounded-xl p-6 border border-[#2a2a2e]">
            <span className="text-4xl mb-3 block">🌍</span>
            <h3 className="text-lg font-bold text-[#e8c547] mb-2">7 Languages</h3>
            <p className="text-sm text-[#a0a0a5]">
              English, Yoruba, Hausa, Igbo, French, Spanish, Mandarin Chinese
            </p>
          </div>

          <div className="bg-gradient-to-br from-[#1a1a1e] to-[#16161a] rounded-xl p-6 border border-[#2a2a2e]">
            <span className="text-4xl mb-3 block">🔍</span>
            <h3 className="text-lg font-bold text-[#e8c547] mb-2">Auto-Detection</h3>
            <p className="text-sm text-[#a0a0a5]">
              Automatically detects browser language on first load with English fallback
            </p>
          </div>

          <div className="bg-gradient-to-br from-[#1a1a1e] to-[#16161a] rounded-xl p-6 border border-[#2a2a2e]">
            <span className="text-4xl mb-3 block">💾</span>
            <h3 className="text-lg font-bold text-[#e8c547] mb-2">Persistent Storage</h3>
            <p className="text-sm text-[#a0a0a5]">
              Language preference saved to localStorage for consistent experience
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * LANGUAGE DEMO PAGE
 * Wrapped with TranslationProvider
 */
export default function LanguageDemoPage() {
  return (
    <TranslationProvider>
      <LanguageDemoContent />
    </TranslationProvider>
  );
}


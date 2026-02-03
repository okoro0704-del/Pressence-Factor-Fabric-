'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { LanguageCode } from './config';
import { 
  DEFAULT_LANGUAGE, 
  detectBrowserLanguage, 
  getStoredLanguage, 
  storeLanguage,
  getLanguageConfig 
} from './config';

// Import all locale files
import enLocale from './locales/en.json';
import yoLocale from './locales/yo.json';
import haLocale from './locales/ha.json';
import igLocale from './locales/ig.json';
import frLocale from './locales/fr.json';
import esLocale from './locales/es.json';
import zhLocale from './locales/zh.json';

type TranslationData = typeof enLocale;

const locales: Record<LanguageCode, TranslationData> = {
  en: enLocale,
  yo: yoLocale,
  ha: haLocale,
  ig: igLocale,
  fr: frLocale,
  es: esLocale,
  zh: zhLocale,
};

interface TranslationContextValue {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string, fallback?: string) => string;
  direction: 'ltr' | 'rtl';
  isLoading: boolean;
}

const TranslationContext = createContext<TranslationContextValue | undefined>(undefined);

interface TranslationProviderProps {
  children: ReactNode;
}

/**
 * TRANSLATION PROVIDER
 * Manages language state and provides translation functions
 */
export function TranslationProvider({ children }: TranslationProviderProps) {
  const [language, setLanguageState] = useState<LanguageCode>(DEFAULT_LANGUAGE);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize language on mount
  useEffect(() => {
    const storedLang = getStoredLanguage();
    const detectedLang = detectBrowserLanguage();
    const initialLang = storedLang || detectedLang;

    setLanguageState(initialLang);
    setIsLoading(false);

    // Apply direction to document
    const config = getLanguageConfig(initialLang);
    document.documentElement.dir = config.direction;
    document.documentElement.lang = initialLang;
  }, []);

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    storeLanguage(lang);

    // Update document direction and lang attribute
    const config = getLanguageConfig(lang);
    document.documentElement.dir = config.direction;
    document.documentElement.lang = lang;
  };

  /**
   * Translation function
   * Supports nested keys with dot notation: "pff.totalPFFBalance"
   */
  const t = (key: string, fallback?: string): string => {
    const keys = key.split('.');
    let value: any = locales[language];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback to English if key not found
        value = locales.en;
        for (const k2 of keys) {
          if (value && typeof value === 'object' && k2 in value) {
            value = value[k2];
          } else {
            return fallback || key;
          }
        }
        break;
      }
    }

    return typeof value === 'string' ? value : fallback || key;
  };

  const config = getLanguageConfig(language);

  const value: TranslationContextValue = {
    language,
    setLanguage,
    t,
    direction: config.direction,
    isLoading,
  };

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
}

/**
 * TRANSLATION HOOK
 * Use this hook in components to access translation functions
 * 
 * Example:
 * const { t, language, setLanguage } = useTranslation();
 * return <h1>{t('pff.totalPFFBalance')}</h1>;
 */
export function useTranslation() {
  const context = useContext(TranslationContext);
  
  if (context === undefined) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  
  return context;
}


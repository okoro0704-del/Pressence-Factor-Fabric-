/**
 * I18N CONFIGURATION
 * Multi-language support for PFF platform
 * 
 * Supported Languages:
 * - English (EN) - Default
 * - Yoruba (YO)
 * - Hausa (HA)
 * - Igbo (IG)
 * - French (FR)
 * - Spanish (ES)
 * - Mandarin Chinese (ZH)
 */

export type LanguageCode = 'en' | 'yo' | 'ha' | 'ig' | 'fr' | 'es' | 'zh';

export interface LanguageConfig {
  code: LanguageCode;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    direction: 'ltr',
    flag: '🇬🇧',
  },
  {
    code: 'yo',
    name: 'Yoruba',
    nativeName: 'Yorùbá',
    direction: 'ltr',
    flag: '🇳🇬',
  },
  {
    code: 'ha',
    name: 'Hausa',
    nativeName: 'Hausa',
    direction: 'ltr',
    flag: '🇳🇬',
  },
  {
    code: 'ig',
    name: 'Igbo',
    nativeName: 'Igbo',
    direction: 'ltr',
    flag: '🇳🇬',
  },
  {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    direction: 'ltr',
    flag: '🇫🇷',
  },
  {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    direction: 'ltr',
    flag: '🇪🇸',
  },
  {
    code: 'zh',
    name: 'Chinese',
    nativeName: '中文',
    direction: 'ltr',
    flag: '🇨🇳',
  },
];

export const DEFAULT_LANGUAGE: LanguageCode = 'en';

export const LANGUAGE_STORAGE_KEY = 'pff_language_preference';

/**
 * Detect browser language and map to supported language
 * Falls back to English if not recognized
 */
export function detectBrowserLanguage(): LanguageCode {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;

  const browserLang = navigator.language || (navigator as any).userLanguage;
  const langCode = browserLang.split('-')[0].toLowerCase();

  // Map browser language codes to our supported languages
  const languageMap: Record<string, LanguageCode> = {
    en: 'en',
    yo: 'yo',
    ha: 'ha',
    ig: 'ig',
    fr: 'fr',
    es: 'es',
    zh: 'zh',
  };

  return languageMap[langCode] || DEFAULT_LANGUAGE;
}

/**
 * Get stored language preference from localStorage
 */
export function getStoredLanguage(): LanguageCode | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored && SUPPORTED_LANGUAGES.some(lang => lang.code === stored)) {
      return stored as LanguageCode;
    }
  } catch (error) {
    console.error('Error reading language preference:', error);
  }

  return null;
}

/**
 * Store language preference in localStorage
 */
export function storeLanguage(languageCode: LanguageCode): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, languageCode);
  } catch (error) {
    console.error('Error storing language preference:', error);
  }
}

/**
 * Get language configuration by code
 */
export function getLanguageConfig(code: LanguageCode): LanguageConfig {
  return SUPPORTED_LANGUAGES.find(lang => lang.code === code) || SUPPORTED_LANGUAGES[0];
}


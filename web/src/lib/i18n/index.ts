/**
 * I18N MODULE - MULTI-LANGUAGE ENGINE
 * 
 * Exports:
 * - TranslationProvider: Wrap your app with this
 * - useTranslation: Hook to access translation functions
 * - LanguageCode: TypeScript type for language codes
 * - SUPPORTED_LANGUAGES: Array of all supported languages
 */

export { TranslationProvider, useTranslation } from './TranslationContext';
export { 
  type LanguageCode, 
  type LanguageConfig,
  SUPPORTED_LANGUAGES, 
  DEFAULT_LANGUAGE,
  detectBrowserLanguage,
  getStoredLanguage,
  storeLanguage,
  getLanguageConfig
} from './config';


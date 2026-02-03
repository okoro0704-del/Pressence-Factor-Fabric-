/**
 * STRING NORMALIZATION UTILITY
 * Prevents ghost characters in vault labels and currency displays
 * Ensures clean UTF-8 encoding across the PFF platform
 */

/**
 * NAIRA SYMBOL CONSTANT
 * Standard Unicode: U+20A6
 */
export const NAIRA_SYMBOL = '₦';

/**
 * Normalize string to NFC (Canonical Decomposition followed by Canonical Composition)
 * Prevents ghost characters from broken UTF-8 encoding
 * 
 * @param str - String to normalize
 * @returns Normalized string in NFC form
 */
export function normalizeString(str: string): string {
  if (!str) return '';
  return str.normalize('NFC');
}

/**
 * Normalize vault label with sanitization
 * Removes leading/trailing whitespace and applies NFC normalization
 * 
 * @param label - Vault label to normalize
 * @returns Clean, normalized vault label
 */
export function normalizeVaultLabel(label: string): string {
  return normalizeString(label.trim());
}

/**
 * Format Nigerian Naira currency with proper symbol
 * Uses standard ₦ symbol (U+20A6) and locale-aware number formatting
 * 
 * @param amount - Amount in Naira
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted Naira string (e.g., "₦1,400,000.00")
 */
export function formatNaira(amount: number, decimals: number = 2): string {
  const formatted = amount.toLocaleString('en-NG', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return normalizeString(`${NAIRA_SYMBOL}${formatted}`);
}

/**
 * Format USD currency with proper symbol
 * 
 * @param amount - Amount in USD
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted USD string (e.g., "$1,000.00")
 */
export function formatUSD(amount: number, decimals: number = 2): string {
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return normalizeString(`$${formatted}`);
}

/**
 * Format VIDA CAP currency
 * 
 * @param amount - Amount in VIDA CAP
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted VIDA CAP string (e.g., "1.00 VIDA CAP")
 */
export function formatVIDA(amount: number, decimals: number = 2): string {
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return normalizeString(`${formatted} VIDA CAP`);
}

/**
 * Sanitize text to remove any broken UTF-8 sequences
 * Removes common broken UTF-8 patterns that appear as ghost characters
 * 
 * @param text - Text to sanitize
 * @returns Clean text with broken sequences removed
 */
export function sanitizeText(text: string): string {
  if (!text) return '';
  
  // Remove common broken UTF-8 patterns
  // These patterns appear when text is double or triple encoded
  const cleaned = text
    .replace(/Ã[ƒÆ'†â€™šÂ¢â‚¬Â¦¡Å¡ ¯¸]+/g, '') // Remove broken sequences
    .replace(/â€[™šž¢]/g, '') // Remove broken quotes/dashes
    .replace(/Â[¢£¤¥¦§¨©ª«¬®¯°±²³´µ¶·¸¹º»¼½¾¿]/g, '') // Remove broken symbols
    .normalize('NFC')
    .trim();
  
  return cleaned;
}

/**
 * Detect if text contains broken UTF-8 encoding
 * 
 * @param text - Text to check
 * @returns True if broken encoding detected
 */
export function hasBrokenEncoding(text: string): boolean {
  if (!text) return false;
  
  // Check for common broken UTF-8 patterns
  const brokenPatterns = [
    /Ã[ƒÆ'†â€™šÂ¢â‚¬Â¦¡Å¡ ¯¸]+/,
    /â€[™šž¢]/,
    /Â[¢£¤¥¦§¨©ª«¬®¯°±²³´µ¶·¸¹º»¼½¾¿]/,
  ];
  
  return brokenPatterns.some(pattern => pattern.test(text));
}

/**
 * Replace broken Naira symbols with clean Unicode
 * 
 * @param text - Text containing potential broken Naira symbols
 * @returns Text with clean ₦ symbol
 */
export function fixNairaSymbol(text: string): string {
  if (!text) return '';
  
  // Replace common broken Naira encodings
  return text
    .replace(/â‚¦/g, NAIRA_SYMBOL) // Common broken encoding
    .replace(/\u00E2\u0082\u00A6/g, NAIRA_SYMBOL) // UTF-8 byte sequence
    .replace(/NGN/g, NAIRA_SYMBOL) // Replace NGN code with symbol
    .normalize('NFC');
}

/**
 * Comprehensive text sanitization for UI display
 * Combines all sanitization methods for maximum safety
 * 
 * @param text - Text to sanitize
 * @returns Fully sanitized and normalized text
 */
export function sanitizeUIText(text: string): string {
  if (!text) return '';
  
  let cleaned = text;
  
  // Fix Naira symbols first
  cleaned = fixNairaSymbol(cleaned);
  
  // Remove broken UTF-8 sequences
  cleaned = sanitizeText(cleaned);
  
  // Final normalization
  cleaned = normalizeString(cleaned);
  
  return cleaned;
}


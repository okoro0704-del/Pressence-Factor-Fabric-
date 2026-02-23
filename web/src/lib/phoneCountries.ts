/**
 * Country list for phone input: ISO 3166-1 alpha-2, E.164 dial code, name, flag.
 * Built from libphonenumber-js for global coverage. Used by IdentityAnchorInput with search.
 */

import { getCountries, getCountryCallingCode } from 'libphonenumber-js';
import type { CountryCode } from 'libphonenumber-js';

export interface PhoneCountry {
  code: CountryCode;
  dialCode: string;
  name: string;
  flag: string;
}

/** Regional indicator: convert ISO 3166-1 alpha-2 (e.g. US) to flag emoji (🇺🇸). */
function countryCodeToFlag(code: string): string {
  if (code.length !== 2) return '🌐';
  const a = 0x1f1e6 - 65 + code.charCodeAt(0);
  const b = 0x1f1e6 - 65 + code.charCodeAt(1);
  return String.fromCodePoint(a, b);
}

/** Country display name in English (e.g. US → United States). */
const displayNames = typeof Intl !== 'undefined' && Intl.DisplayNames
  ? new Intl.DisplayNames(['en'], { type: 'region' })
  : null;

function getCountryName(code: string): string {
  try {
    if (displayNames) return displayNames.of(code) ?? code;
  } catch {
    // ignore
  }
  return code;
}

/** Fallback when libphonenumber-js fails (e.g. SSR or unsupported env). Alphabetical so no single country is default. */
const FALLBACK_COUNTRIES: PhoneCountry[] = [
  { code: 'AU', dialCode: '+61', name: 'Australia', flag: '🇦🇺' },
  { code: 'CA', dialCode: '+1', name: 'Canada', flag: '🇨🇦' },
  { code: 'FR', dialCode: '+33', name: 'France', flag: '🇫🇷' },
  { code: 'DE', dialCode: '+49', name: 'Germany', flag: '🇩🇪' },
  { code: 'GH', dialCode: '+233', name: 'Ghana', flag: '🇬🇭' },
  { code: 'IN', dialCode: '+91', name: 'India', flag: '🇮🇳' },
  { code: 'KE', dialCode: '+254', name: 'Kenya', flag: '🇰🇪' },
  { code: 'NG', dialCode: '+234', name: 'Nigeria', flag: '🇳🇬' },
  { code: 'ZA', dialCode: '+27', name: 'South Africa', flag: '🇿🇦' },
  { code: 'GB', dialCode: '+44', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'US', dialCode: '+1', name: 'United States', flag: '🇺🇸' },
];

/** Build full list from libphonenumber-js (all supported countries). */
function buildPhoneCountries(): PhoneCountry[] {
  try {
    const codes = getCountries();
    const list: PhoneCountry[] = [];
    for (const code of codes) {
      try {
        const dialCode = getCountryCallingCode(code);
        const name = getCountryName(code);
        const flag = countryCodeToFlag(code);
        list.push({
          code,
          dialCode: `+${dialCode}`,
          name,
          flag,
        });
      } catch {
        // skip unsupported
      }
    }
    if (list.length === 0) return FALLBACK_COUNTRIES;
    list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  } catch {
    return FALLBACK_COUNTRIES;
  }
}

export const PHONE_COUNTRIES: PhoneCountry[] = buildPhoneCountries();

/** Universal default: first in alphabetical list (no single country persisted). Use getInitialCountry() when you want browser/locale detection. */
export const DEFAULT_PHONE_COUNTRY: PhoneCountry = PHONE_COUNTRIES[0];

/** Initial country from browser locale (no persistence). Use for universal mobile country code. */
export function getInitialCountry(): PhoneCountry {
  if (typeof navigator === 'undefined' || !navigator.language) return DEFAULT_PHONE_COUNTRY;
  const locale = (navigator.language || (navigator as { userLanguage?: string }).userLanguage || '').trim();
  const part = locale.split(/[-_]/)[1];
  const code = part && part.length === 2 ? part.toUpperCase() : null;
  const found = code ? getCountryByCode(code) : null;
  return found ?? DEFAULT_PHONE_COUNTRY;
}

/** Look up PhoneCountry by ISO 3166-1 alpha-2 (e.g. from GPS/IP detection). */
export function getCountryByCode(code: string): PhoneCountry | undefined {
  const upper = code?.trim().toUpperCase();
  if (!upper || upper.length !== 2) return undefined;
  return PHONE_COUNTRIES.find((c) => c.code === upper);
}

/** Filter countries by search (name, code, or dial code). */
export function filterPhoneCountries(search: string): PhoneCountry[] {
  const q = search.trim().toLowerCase();
  if (!q) return PHONE_COUNTRIES;
  return PHONE_COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      c.dialCode.includes(q.replace(/\s/g, ''))
  );
}

/** Example national number placeholder (no country code) for input. */
const NATIONAL_PLACEHOLDER: Partial<Record<CountryCode, string>> = {
  NG: '801 234 5678',
  US: '202 555 0123',
  GB: '7700 900123',
  GH: '23 456 7890',
  KE: '712 345678',
  ZA: '82 123 4567',
  IN: '98765 43210',
  CA: '204 555 0123',
  AU: '412 345 678',
  DE: '151 23456789',
  FR: '6 12 34 56 78',
};

export function getNationalPlaceholder(code: CountryCode): string {
  return NATIONAL_PLACEHOLDER[code] ?? 'Phone number';
}

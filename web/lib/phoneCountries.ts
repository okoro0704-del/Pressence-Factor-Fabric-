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

/** Build full list from libphonenumber-js (all supported countries). */
function buildPhoneCountries(): PhoneCountry[] {
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
  // Sort by name for easier search
  list.sort((a, b) => a.name.localeCompare(b.name));
  // Put Nigeria, Ghana, UK, US, Kenya near top for quick access
  const priority: CountryCode[] = ['NG', 'GH', 'GB', 'US', 'KE', 'ZA', 'IN', 'CA', 'AU'];
  const prioritySet = new Set(priority);
  const ordered = [
    ...list.filter((c) => prioritySet.has(c.code)),
    ...list.filter((c) => !prioritySet.has(c.code)),
  ];
  return ordered.length > 0 ? ordered : list;
}

export const PHONE_COUNTRIES: PhoneCountry[] = buildPhoneCountries();

/** Default selection: Nigeria (first in priority). */
export const DEFAULT_PHONE_COUNTRY: PhoneCountry =
  PHONE_COUNTRIES.find((c) => c.code === 'NG') ?? PHONE_COUNTRIES[0];

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

/**
 * Map ISO 3166-1 alpha-2 country code to display name for National Treasury title.
 * Used when showing "Nigeria's National Treasury" or "Ghana's National Treasury".
 */

const COUNTRY_NAMES: Record<string, string> = {
  NG: 'Nigeria',
  GH: 'Ghana',
  US: 'United States',
  GB: 'United Kingdom',
  KE: 'Kenya',
  ZA: 'South Africa',
  EG: 'Egypt',
  TZ: 'Tanzania',
  UG: 'Uganda',
  ET: 'Ethiopia',
  FR: 'France',
  DE: 'Germany',
  IN: 'India',
  CA: 'Canada',
  AU: 'Australia',
};

/** Get display name for country code (e.g. NG → Nigeria). Defaults to Nigeria when unknown. */
export function getCountryDisplayName(code: string | null | undefined): string {
  if (!code || typeof code !== 'string') return 'Nigeria';
  const name = COUNTRY_NAMES[code.trim().toUpperCase()];
  return name || 'Nigeria';
}

/**
 * Top Vitalized Nations — count of vitalized citizens per country from user_profiles.
 * Used on Dashboard to show Top 10 Vitalized Nations (highest to lowest).
 */

import { supabase, hasSupabase } from './supabase';
import { getCountryDisplayNameOrCode } from './countryDisplayName';

export interface NationVitalizedRow {
  country_code: string;
  count: number;
}

export interface TopNationDisplay {
  rank: number;
  countryCode: string;
  countryName: string;
  count: number;
}

/** Fetch top 10 nations by vitalized citizen count (user_profiles where vitalization_status in ('VITALIZED','Master_Vitalization') and country_code is not null). */
export async function fetchTopVitalizedNations(): Promise<TopNationDisplay[]> {
  if (!hasSupabase()) return [];
  try {
    const { data, error } = await (supabase as any)
      .from('user_profiles')
      .select('country_code')
      .in('vitalization_status', ['VITALIZED', 'Master_Vitalization'])
      .not('country_code', 'is', null);

    if (error || !data || !Array.isArray(data)) return [];

    const byCode: Record<string, number> = {};
    for (const row of data as { country_code: string }[]) {
      const code = String(row.country_code || '').trim().toUpperCase();
      if (!code) continue;
      byCode[code] = (byCode[code] || 0) + 1;
    }

    const sorted = Object.entries(byCode)
      .map(([country_code, count]) => ({ country_code, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return sorted.map((r, i) => ({
      rank: i + 1,
      countryCode: r.country_code,
      countryName: getCountryDisplayNameOrCode(r.country_code),
      count: r.count,
    }));
  } catch {
    return [];
  }
}

/**
 * National Pulse — nation metrics, leaderboard, fraud blocked.
 * Keyed by country name for map tooltips; by id for world-atlas 110m where needed.
 */

export interface NationMetrics {
  name: string;
  vitalized: number;
  population: number;
  wealthSecured: number;
  fraudBlocked: number;
}

/** Vitalization Density = Vitalized Citizens / Total Population */
export function vitalizationDensity(m: NationMetrics): number {
  return m.population > 0 ? m.vitalized / m.population : 0;
}

/** Vitalization Score 0–100 for leaderboard */
export function vitalizationScore(m: NationMetrics): number {
  return Math.min(100, Math.round(vitalizationDensity(m) * 100));
}

/** Format "Estimated Fraud Blocked: $X,XXX,XXX" (mrfundzman Metric) */
export function formatFraudBlocked(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

/** Mock metrics for demo. Replace with API or Supabase. */
export const MOCK_NATION_METRICS: Record<string, NationMetrics> = {
  Nigeria: {
    name: 'Nigeria',
    vitalized: 2_400_000,
    population: 223_000_000,
    wealthSecured: 4_200_000_000,
    fraudBlocked: 890_000_000,
  },
  'United States of America': {
    name: 'United States of America',
    vitalized: 18_000_000,
    population: 335_000_000,
    wealthSecured: 42_000_000_000,
    fraudBlocked: 12_400_000_000,
  },
  'United Kingdom': {
    name: 'United Kingdom',
    vitalized: 5_200_000,
    population: 67_000_000,
    wealthSecured: 11_000_000_000,
    fraudBlocked: 3_100_000_000,
  },
  Germany: {
    name: 'Germany',
    vitalized: 6_100_000,
    population: 84_000_000,
    wealthSecured: 14_000_000_000,
    fraudBlocked: 4_200_000_000,
  },
  Kenya: {
    name: 'Kenya',
    vitalized: 1_100_000,
    population: 55_000_000,
    wealthSecured: 1_800_000_000,
    fraudBlocked: 420_000_000,
  },
  Ghana: {
    name: 'Ghana',
    vitalized: 680_000,
    population: 33_000_000,
    wealthSecured: 1_100_000_000,
    fraudBlocked: 280_000_000,
  },
  South Africa: {
    name: 'South Africa',
    vitalized: 2_900_000,
    population: 60_000_000,
    wealthSecured: 5_600_000_000,
    fraudBlocked: 1_900_000_000,
  },
  India: {
    name: 'India',
    vitalized: 14_000_000,
    population: 1_428_000_000,
    wealthSecured: 22_000_000_000,
    fraudBlocked: 8_200_000_000,
  },
  Brazil: {
    name: 'Brazil',
    vitalized: 4_500_000,
    population: 215_000_000,
    wealthSecured: 9_200_000_000,
    fraudBlocked: 2_800_000_000,
  },
  France: {
    name: 'France',
    vitalized: 5_800_000,
    population: 68_000_000,
    wealthSecured: 13_000_000_000,
    fraudBlocked: 3_800_000_000,
  },
};

/** Normalize geography name to our key (e.g. "United States" → "United States of America"). */
export function metricsForCountry(name: string | undefined): NationMetrics | null {
  if (!name) return null;
  if (MOCK_NATION_METRICS[name]) return MOCK_NATION_METRICS[name];
  const k = Object.keys(MOCK_NATION_METRICS).find(
    (k) => k.toLowerCase() === name.toLowerCase() || k.startsWith(name) || name.startsWith(k)
  );
  return k ? MOCK_NATION_METRICS[k] ?? null : null;
}

/** Leaderboard rows sorted by Vitalization Score desc, then Wealth Secured desc. */
export function leaderboardRows(): Array<{
  rank: number;
  nation: string;
  vitalizationScore: number;
  wealthSecured: number;
}> {
  const rows = Object.values(MOCK_NATION_METRICS)
    .map((m) => ({
      nation: m.name,
      vitalizationScore: vitalizationScore(m),
      wealthSecured: m.wealthSecured,
    }))
    .sort((a, b) => b.vitalizationScore - a.vitalizationScore || b.wealthSecured - a.wealthSecured);
  return rows.map((r, i) => ({ rank: i + 1, ...r }));
}

/** Default metrics for countries without data. */
export const DEFAULT_METRICS: NationMetrics = {
  name: 'Unknown',
  vitalized: 0,
  population: 1,
  wealthSecured: 0,
  fraudBlocked: 0,
};

/** Approximate geographic centroids [lon, lat] for PulsePoint. */
export const NATION_CENTROIDS: Record<string, [number, number]> = {
  Nigeria: [8.67, 9.08],
  'United States of America': [-95.71, 37.09],
  'United Kingdom': [-2.59, 54.0],
  Germany: [10.45, 51.16],
  Kenya: [37.91, -0.02],
  Ghana: [-1.62, 7.95],
  'South Africa': [22.94, -30.56],
  India: [78.96, 20.59],
  Brazil: [-55.79, -14.24],
  France: [2.21, 46.23],
};

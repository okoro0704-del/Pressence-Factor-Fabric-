'use client';

import { useState, useEffect, useCallback } from 'react';

const EXCHANGE_RATE_API_URL = 'https://open.er-api.com/v6/latest/USD';
/** Fallback when API is unavailable (e.g. SSR, network error). */
const FALLBACK_USD_NGN = 1400;
/** Refetch interval (API updates once per day; we refresh hourly to stay within rate limits). */
const REFETCH_MS = 60 * 60 * 1000;

export interface UsdToNgnRateResult {
  /** USD to NGN rate (1 USD = rate NGN). */
  rate: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Real-time USD/NGN rate via ExchangeRate-API (open access, no key).
 * Used for Naira-First Treasury: multiply USD balance by rate for ₦ display.
 */
export function useUsdToNgnRate(): UsdToNgnRateResult {
  const [rate, setRate] = useState(FALLBACK_USD_NGN);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRate = useCallback(async () => {
    if (typeof window === 'undefined') {
      setRate(FALLBACK_USD_NGN);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(EXCHANGE_RATE_API_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data?.result !== 'success' || typeof data?.rates?.NGN !== 'number') {
        setRate(FALLBACK_USD_NGN);
        return;
      }
      setRate(data.rates.NGN);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch rate');
      setRate(FALLBACK_USD_NGN);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRate();
    const interval = setInterval(fetchRate, REFETCH_MS);
    return () => clearInterval(interval);
  }, [fetchRate]);

  return { rate, loading, error, refetch: fetchRate };
}

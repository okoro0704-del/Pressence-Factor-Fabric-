/**
 * PFF × Sovryn — Native balance sync from Rootstock (RSK).
 * Polls DLLR, USDT, and RBTC every 10 seconds for the derived wallet address.
 */

import { useState, useEffect, useCallback } from 'react';
import { deriveRSKWalletFromSeed } from './derivedWallet';
import { getDLLRBalance } from './dllr';
import { getUSDTBalance } from './usdtBalance';
import { getRbtcBalance } from './wallet';

const POLL_INTERVAL_MS = 10_000;

export interface NativeBalances {
  dllr: string;
  usdt: string;
  rbtc: string;
  address: string | null;
  loading: boolean;
  error: string | null;
}

export function useNativeBalances(phoneNumber: string | null): NativeBalances {
  const [address, setAddress] = useState<string | null>(null);
  const [dllr, setDllr] = useState<string>('0');
  const [usdt, setUsdt] = useState<string>('0');
  const [rbtc, setRbtc] = useState<string>('0');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBalances = useCallback(async (addr: string) => {
    try {
      const [dllrRes, usdtRes, rbtcRes] = await Promise.all([
        getDLLRBalance(addr),
        getUSDTBalance(addr),
        getRbtcBalance(addr),
      ]);
      setDllr(dllrRes.formatted);
      setUsdt(usdtRes.formatted);
      setRbtc(rbtcRes.rbtc);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch balances');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!phoneNumber?.trim()) {
      setAddress(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      const result = await deriveRSKWalletFromSeed(phoneNumber.trim());
      if (cancelled) return;
      if (!result.ok) {
        setError(result.error ?? 'Could not derive wallet');
        setAddress(null);
        setLoading(false);
        return;
      }
      setAddress(result.address);
      await fetchBalances(result.address);
    })();

    return () => {
      cancelled = true;
    };
  }, [phoneNumber, fetchBalances]);

  useEffect(() => {
    if (!address) return;
    const interval = setInterval(() => fetchBalances(address), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [address, fetchBalances]);

  return { dllr, usdt, rbtc, address, loading, error };
}

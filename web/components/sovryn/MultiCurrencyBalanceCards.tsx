'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  getConnectedAddress,
  ensureRSK,
  getDLLRBalance,
  getUSDTBalance,
} from '@/lib/sovryn';
import { deriveRSKWalletFromSeed } from '@/lib/sovryn/derivedWallet';
import { getIdentityAnchorPhone } from '@/lib/sentinelActivation';

/** DLLR: Gold/Silver. USDT: Green. Official-style balance cards for Protocol Vault. */
export function MultiCurrencyBalanceCards() {
  const [address, setAddress] = useState<string | null>(null);
  const [dllrBalance, setDllrBalance] = useState<string | null>(null);
  const [usdtBalance, setUsdtBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useDerived, setUseDerived] = useState(false);

  const fetchBalances = useCallback(async (addr: string) => {
    if (!addr) return;
    setLoading(true);
    setError(null);
    try {
      const ok = await ensureRSK();
      if (!ok) {
        setError('Switch to Rootstock (RSK) in your wallet.');
        setLoading(false);
        return;
      }
      const [dllr, usdt] = await Promise.all([
        getDLLRBalance(addr),
        getUSDTBalance(addr),
      ]);
      setDllrBalance(dllr.formatted);
      setUsdtBalance(usdt.formatted);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch balances.');
      setDllrBalance(null);
      setUsdtBalance(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      const phone = getIdentityAnchorPhone();
      const connected = await getConnectedAddress();
      if (connected && !phone) {
        setAddress(connected);
        setUseDerived(false);
        if (!cancelled) await fetchBalances(connected);
        return;
      }
      if (phone) {
        const derived = await deriveRSKWalletFromSeed(phone);
        if (derived.ok && derived.address) {
          setAddress(derived.address);
          setUseDerived(true);
          if (!cancelled) await fetchBalances(derived.address);
          return;
        }
      }
      if (connected) {
        setAddress(connected);
        setUseDerived(false);
        if (!cancelled) await fetchBalances(connected);
      } else {
        setAddress(null);
        setDllrBalance(null);
        setUsdtBalance(null);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [fetchBalances]);

  // After successful VIDA → DLLR conversion, refresh to show Active Spending Power
  useEffect(() => {
    const onSwapSuccess = () => {
      if (address) fetchBalances(address);
    };
    window.addEventListener('protocol-vault-swap-success', onSwapSuccess);
    return () => window.removeEventListener('protocol-vault-swap-success', onSwapSuccess);
  }, [address, fetchBalances]);

  const activeSpendingUsd = dllrBalance != null ? parseFloat(dllrBalance) : null;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-[#6b6b70] uppercase tracking-wider">
        Multi-Currency Liquidity Bridge
      </h3>
      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* DLLR — Gold/Silver */}
        <div
          className="rounded-xl border-2 p-5 flex flex-col"
          style={{
            background: 'linear-gradient(135deg, rgba(212,175,55,0.12) 0%, rgba(192,192,192,0.08) 100%)',
            borderColor: 'rgba(255, 215, 0, 0.45)',
            boxShadow: '0 0 24px rgba(255, 215, 0, 0.12)',
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg text-[#0d0d0f]" style={{ background: 'linear-gradient(135deg, #FFD700 0%, #C0C0C0 100%)' }}>
              D
            </div>
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(255,215,0,0.95)' }}>
              Sovryn Dollar (DLLR)
            </span>
          </div>
          <p className="text-2xl font-bold font-mono" style={{ color: '#FFD700' }}>
            {loading ? '…' : dllrBalance != null ? `${dllrBalance} DLLR` : '—'}
          </p>
          <p className="text-[10px] text-[#6b6b70] mt-1">Pegged $1.00 · RSK</p>
        </div>

        {/* USDT — Green */}
        <div
          className="rounded-xl border-2 p-5 flex flex-col"
          style={{
            background: 'linear-gradient(135deg, rgba(0,163,104,0.15) 0%, rgba(0,163,104,0.06) 100%)',
            borderColor: 'rgba(0, 163, 104, 0.5)',
            boxShadow: '0 0 24px rgba(0, 163, 104, 0.12)',
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg text-white" style={{ background: '#00A368' }}>
              U
            </div>
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#00A368' }}>
              Tether (USDT)
            </span>
          </div>
          <p className="text-2xl font-bold font-mono" style={{ color: '#00A368' }}>
            {loading ? '…' : usdtBalance != null ? `${usdtBalance} USDT` : '—'}
          </p>
          <p className="text-[10px] text-[#6b6b70] mt-1">Pegged $1.00 · RSK</p>
        </div>
      </div>

      {/* Active Spending Power — show when user has DLLR (after conversion) */}
      {activeSpendingUsd != null && activeSpendingUsd > 0 && (
        <div className="rounded-xl border-2 border-emerald-500/50 bg-emerald-500/10 p-4">
          <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
            Active Spending Power
          </p>
          <p className="text-2xl font-bold font-mono text-emerald-300">
            ${activeSpendingUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
          </p>
          <p className="text-[10px] text-[#6b6b70] mt-1">From DLLR balance · Ready to spend</p>
        </div>
      )}

      <button
        type="button"
        onClick={() => address && fetchBalances(address)}
        disabled={loading || !address}
        className="text-sm px-4 py-2 rounded-lg font-semibold bg-[#2a2a2e] text-[#e8c547] hover:bg-[#3a3a3e] disabled:opacity-50"
      >
        {loading ? 'Refreshing…' : 'Refresh balances'}
      </button>
    </div>
  );
}

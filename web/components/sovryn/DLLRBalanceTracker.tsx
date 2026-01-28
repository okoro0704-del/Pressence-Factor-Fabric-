'use client';

import { useState, useCallback } from 'react';
import { JetBrains_Mono } from 'next/font/google';
import {
  getConnectedAddress,
  ensureRSK,
  getDLLRBalance,
  isMasterHandshakeComplete,
} from '@/lib/sovryn';

const jetbrains = JetBrains_Mono({ weight: '600', subsets: ['latin'] });

export function DLLRBalanceTracker() {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connectAndFetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const addr = await getConnectedAddress();
      if (!addr) {
        setError('No wallet connected.');
        setLoading(false);
        return;
      }
      const ok = await ensureRSK();
      if (!ok) {
        setError('Could not switch to Rootstock (RSK). Add the network in your wallet.');
        setLoading(false);
        return;
      }
      setAddress(addr);
      if (!isMasterHandshakeComplete(addr)) {
        setBalance(null);
        setLoading(false);
        return;
      }
      const { formatted } = await getDLLRBalance(addr);
      setBalance(formatted);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch DLLR balance.');
      setBalance(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const handshakeComplete = address !== null && isMasterHandshakeComplete(address);
  const gated = address !== null && !handshakeComplete;

  return (
    <div
      className={`flex flex-col rounded-xl border px-6 py-4 ${jetbrains.className}`}
      style={{
        background: '#0B0B0B',
        borderColor: 'rgba(255, 215, 0, 0.2)',
        boxShadow: '0 0 20px rgba(255, 215, 0, 0.06)',
      }}
    >
      <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'rgba(255, 215, 0, 0.6)' }}>
        Sovereign Unit (DLLR)
      </p>
      {balance !== null && handshakeComplete ? (
        <>
          <p className="mt-1 text-xl font-bold" style={{ color: '#FFD700', textShadow: '0 0 12px rgba(255, 215, 0, 0.3)' }}>
            {balance} DLLR
          </p>
          <p className="mt-2 text-xs" style={{ color: '#6b6b70' }}>
            My wealth is secured by my presence.
          </p>
          <p className="mt-0.5 text-[10px] truncate max-w-[200px]" style={{ color: '#4a4a4e' }} title={address ?? ''}>
            {address ? `${address.slice(0, 6)}…${address.slice(-4)}` : ''}
          </p>
        </>
      ) : gated ? (
        <>
          <p className="mt-1 text-sm" style={{ color: '#6b6b70' }}>
            Complete Master Handshake to view balance
          </p>
          <p className="mt-2 text-xs" style={{ color: '#6b6b70' }}>
            Sovereign Unit balance is visible only after Launch Sovereign Vault.
          </p>
          <p className="mt-0.5 text-[10px] truncate max-w-[200px]" style={{ color: '#4a4a4e' }} title={address ?? ''}>
            {address ? `${address.slice(0, 6)}…${address.slice(-4)}` : ''}
          </p>
        </>
      ) : (
        <>
          <p className="mt-1 text-sm" style={{ color: '#6b6b70' }}>
            Connect wallet to view balance
          </p>
          <p className="mt-2 text-xs" style={{ color: '#6b6b70' }}>
            My wealth is secured by my presence.
          </p>
        </>
      )}
      {error && (
        <p className="mt-2 text-xs text-red-400">{error}</p>
      )}
      <button
        type="button"
        onClick={connectAndFetch}
        disabled={loading}
        className="mt-3 w-fit px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 transition-opacity"
        style={{ background: '#c9a227', color: '#0d0d0f' }}
      >
        {loading ? 'Connecting…' : balance !== null ? 'Refresh' : 'Connect wallet'}
      </button>
    </div>
  );
}

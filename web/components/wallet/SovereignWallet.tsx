'use client';

import { useState, useEffect } from 'react';
import { JetBrains_Mono } from 'next/font/google';
import {
  getOrCreateSovereignWallet,
  getStaticUSDTAddresses,
  updateSovereignWalletConvertVidaToDllr,
  type SovereignInternalWalletRow,
} from '@/lib/sovereignInternalWallet';
import {
  verifyUniversalIdentity,
  type IdentityAnchor,
} from '@/lib/universalIdentityComparison';

const jetbrains = JetBrains_Mono({ weight: ['400', '600', '700'], subsets: ['latin'] });

const GOLD = '#D4AF37';
const GOLD_DIM = 'rgba(212, 175, 55, 0.7)';
const GOLD_BG = 'rgba(212, 175, 55, 0.08)';
const BLACK = '#0d0d0f';
const BORDER = 'rgba(212, 175, 55, 0.3)';

export interface SovereignWalletProps {
  /** User phone number (E.164). Used for wallet fetch and biometric verification before conversion. */
  phoneNumber: string;
}

export function SovereignWallet({ phoneNumber }: SovereignWalletProps) {
  const [wallet, setWallet] = useState<SovereignInternalWalletRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [convertAmount, setConvertAmount] = useState('');
  const [convertStatus, setConvertStatus] = useState<'idle' | 'verify' | 'converting' | 'done' | 'error'>('idle');
  const [convertError, setConvertError] = useState<string | null>(null);
  const [showUSDTBridge, setShowUSDTBridge] = useState(false);
  const [biometricError, setBiometricError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const w = await getOrCreateSovereignWallet(phoneNumber);
      if (!cancelled) {
        setWallet(w ?? {
          id: '',
          phone_number: phoneNumber,
          dllr_balance: 0,
          usdt_balance: 0,
          vida_cap_balance: 0,
          usdt_deposit_address_erc20: null,
          usdt_deposit_address_trc20: null,
          created_at: '',
          updated_at: '',
        });
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [phoneNumber]);

  const handleConvertVidaToDllr = async () => {
    const amount = parseFloat(convertAmount);
    if (!wallet || isNaN(amount) || amount <= 0 || amount > wallet.vida_cap_balance) {
      setConvertError('Enter a valid amount not exceeding your VIDA CAP.');
      return;
    }
    setConvertError(null);
    setConvertStatus('verify');

    const anchor: IdentityAnchor = {
      phone_number: phoneNumber,
      anchor_type: 'PHONE_INPUT',
      timestamp: new Date().toISOString(),
    };
    const mockBiometricData = { id: 'convert-verify-' + Date.now() };
    const result = await verifyUniversalIdentity(anchor, mockBiometricData);

    if (!result.success) {
      setBiometricError(result.error ?? 'Identity verification failed.');
      setConvertStatus('error');
      return;
    }
    setBiometricError(null);
    setConvertStatus('converting');

    try {
      const ok = await updateSovereignWalletConvertVidaToDllr(phoneNumber, amount, amount);
      if (ok) {
        setWallet((prev) =>
          prev
            ? {
                ...prev,
                vida_cap_balance: prev.vida_cap_balance - amount,
                dllr_balance: prev.dllr_balance + amount,
              }
            : null
        );
        setConvertAmount('');
        setConvertStatus('done');
      } else {
        setConvertError('Could not update wallet. Ensure sovereign_internal_wallets table exists in Supabase.');
        setConvertStatus('error');
      }
    } catch (e) {
      setConvertError(e instanceof Error ? e.message : 'Conversion failed.');
      setConvertStatus('error');
    }
  };

  const addresses = phoneNumber ? getStaticUSDTAddresses(phoneNumber) : { erc20: '', trc20: '' };

  if (loading) {
    return (
      <div
        className={`rounded-2xl border p-8 ${jetbrains.className}`}
        style={{ background: BLACK, borderColor: BORDER }}
      >
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-[#2a2a2e] rounded w-1/3" />
          <div className="h-4 bg-[#2a2a2e] rounded w-1/2" />
          <div className="h-20 bg-[#2a2a2e] rounded" />
          <div className="h-20 bg-[#2a2a2e] rounded" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border p-8 ${jetbrains.className}`}
      style={{
        background: BLACK,
        borderColor: BORDER,
        boxShadow: `0 0 60px ${GOLD_BG}`,
      }}
    >
      <h2
        className="text-2xl font-bold uppercase tracking-wider mb-6"
        style={{ color: GOLD, textShadow: `0 0 24px ${GOLD_DIM}` }}
      >
        Sovereign Wallet
      </h2>

      {/* Balance cards */}
      <div className="grid gap-4 mb-8 sm:grid-cols-3">
        <BalanceCard
          label="Sovereign DLLR"
          value={wallet?.dllr_balance ?? 0}
          suffix="DLLR"
        />
        <BalanceCard label="USDT" value={wallet?.usdt_balance ?? 0} suffix="USDT" />
        <BalanceCard
          label="Available VIDA CAP"
          value={wallet?.vida_cap_balance ?? 0}
          suffix="VIDA"
        />
      </div>

      {/* Convert VIDA to DLLR — MUST verify identity first */}
      <section
        className="rounded-xl border p-6 mb-6"
        style={{ background: GOLD_BG, borderColor: BORDER }}
      >
        <h3 className="text-lg font-semibold mb-4" style={{ color: GOLD }}>
          Convert VIDA to DLLR
        </h3>
        <p className="text-xs mb-4" style={{ color: '#6b6b70' }}>
          Identity verification is required before any conversion.
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[120px]">
            <label className="block text-xs font-medium mb-1" style={{ color: GOLD_DIM }}>
              Amount (VIDA CAP)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={convertAmount}
              onChange={(e) => setConvertAmount(e.target.value)}
              placeholder="0.00"
              disabled={convertStatus === 'verify' || convertStatus === 'converting'}
              className="w-full px-4 py-2 rounded-lg border font-mono text-lg"
              style={{
                background: BLACK,
                borderColor: BORDER,
                color: GOLD,
              }}
            />
          </div>
          <button
            type="button"
            onClick={handleConvertVidaToDllr}
            disabled={
              !convertAmount ||
              convertStatus === 'verify' ||
              convertStatus === 'converting' ||
              (wallet?.vida_cap_balance ?? 0) <= 0
            }
            className="px-6 py-2.5 rounded-lg font-bold uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            style={{
              background: GOLD,
              color: BLACK,
              boxShadow: `0 0 20px ${GOLD_DIM}`,
            }}
          >
            {convertStatus === 'verify'
              ? 'Verifying…'
              : convertStatus === 'converting'
              ? 'Converting…'
              : convertStatus === 'done'
              ? 'Done'
              : 'Verify & Convert'}
          </button>
        </div>
        {(convertError || biometricError) && (
          <p className="mt-3 text-sm" style={{ color: '#ef4444' }}>
            {biometricError ?? convertError}
          </p>
        )}
      </section>

      {/* USDT Bridge — static deposit address */}
      <section>
        <button
          type="button"
          onClick={() => setShowUSDTBridge((v) => !v)}
          className="w-full flex items-center justify-between rounded-xl border p-4 text-left transition-all hover:opacity-90"
          style={{
            background: GOLD_BG,
            borderColor: BORDER,
            color: GOLD,
          }}
        >
          <span className="font-semibold">Deposit / Withdraw USDT</span>
          <span className="text-2xl">{showUSDTBridge ? '−' : '+'}</span>
        </button>
        {showUSDTBridge && (
          <div
            className="mt-3 rounded-xl border p-4 space-y-4"
            style={{ background: 'rgba(0,0,0,0.3)', borderColor: BORDER }}
          >
            <p className="text-xs" style={{ color: '#6b6b70' }}>
              Send USDT to your internal wallet address below. Same address every time (ERC-20 or TRC-20).
            </p>
            <div>
              <p className="text-xs font-medium mb-1" style={{ color: GOLD_DIM }}>
                ERC-20 (Ethereum)
              </p>
              <code
                className="block p-3 rounded-lg text-sm break-all"
                style={{ background: BLACK, color: GOLD, borderColor: BORDER, border: '1px solid' }}
              >
                {addresses.erc20 || '—'}
              </code>
            </div>
            <div>
              <p className="text-xs font-medium mb-1" style={{ color: GOLD_DIM }}>
                TRC-20 (TRON)
              </p>
              <code
                className="block p-3 rounded-lg text-sm break-all"
                style={{ background: BLACK, color: GOLD, borderColor: BORDER, border: '1px solid' }}
              >
                {addresses.trc20 || '—'}
              </code>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function BalanceCard({
  label,
  value,
  suffix,
}: {
  label: string;
  value: number;
  suffix: string;
}) {
  return (
    <div
      className="rounded-xl border p-4"
      style={{
        background: GOLD_BG,
        borderColor: BORDER,
      }}
    >
      <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: GOLD_DIM }}>
        {label}
      </p>
      <p
        className="text-xl font-bold"
        style={{ color: GOLD, textShadow: `0 0 16px ${GOLD_DIM}` }}
      >
        {value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })} {suffix}
      </p>
    </div>
  );
}

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
  type BiometricLayerResults,
} from '@/lib/universalIdentityComparison';
import { VIDA_TO_DLLR_RATE } from '@/lib/sovereignInternalWallet';
import {
  getTotalFoundationReserve,
  USER_VIDA_ON_VERIFY,
  FOUNDATION_VIDA_ON_VERIFY,
} from '@/lib/foundationSeigniorage';
import { hasActiveSentinelLicense } from '@/lib/sentinelLicensing';
import { getSentinelTokenVerified } from '@/lib/sentinelSecurityToken';
import { getMintStatus, getSpendingUnlocked, getBiometricSpendingActive, MINT_STATUS_MINTED } from '@/lib/mintStatus';
import { SpendingLockModal } from '@/components/dashboard/SpendingLockModal';
import { SpendQRModal } from '@/components/dashboard/SpendQRModal';
import { BETA_LIQUIDITY_TEST, SOVRYN_AMM_SWAP_URL } from '@/lib/betaLiquidityTest';
import { useNativeBalances } from '@/lib/sovryn/useNativeBalances';
import { MIN_RBTC_FOR_GAS } from '@/lib/sovryn/internalSigner';

const jetbrains = JetBrains_Mono({ weight: ['400', '600', '700'], subsets: ['latin'] });

const GOLD = '#D4AF37';
const GOLD_DIM = 'rgba(212, 175, 55, 0.7)';
const GOLD_BG = 'rgba(212, 175, 55, 0.08)';
const BLACK = '#0d0d0f';
const BORDER = 'rgba(212, 175, 55, 0.3)';

export interface SovereignWalletProps {
  /** User phone number (E.164). Used for wallet fetch and biometric verification before conversion. */
  phoneNumber: string;
  /** 3-of-4 biometric layer results. Conversion is blocked until quorum is satisfied. */
  layerResults?: BiometricLayerResults | null;
}

export function SovereignWallet({ phoneNumber, layerResults }: SovereignWalletProps) {
  const [wallet, setWallet] = useState<SovereignInternalWalletRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [convertAmount, setConvertAmount] = useState('');
  const [convertStatus, setConvertStatus] = useState<'idle' | 'verify' | 'converting' | 'done' | 'error'>('idle');
  const [convertError, setConvertError] = useState<string | null>(null);
  const [showUSDTBridge, setShowUSDTBridge] = useState(false);
  const [biometricError, setBiometricError] = useState<string | null>(null);
  const [foundationReserve, setFoundationReserve] = useState<number>(0);
  const [hasLicense, setHasLicense] = useState<boolean>(false);
  const [tokenVerified, setTokenVerified] = useState<boolean>(false);
  const [fingerprintVerified, setFingerprintVerified] = useState<boolean>(false);
  const [spendingUnlocked, setSpendingUnlocked] = useState<boolean>(false);
  const [biometricSpendingActive, setBiometricSpendingActive] = useState<boolean>(false);
  const [showLockModal, setShowLockModal] = useState<boolean>(false);
  const [showSpendQR, setShowSpendQR] = useState(false);
  const sentinelVerified = BETA_LIQUIDITY_TEST || (hasLicense && tokenVerified);
  /** Protocol Release: unlock when is_fully_verified or face_hash present. */
  const canSpend = biometricSpendingActive || fingerprintVerified || spendingUnlocked;
  /** Native DLLR/USDT/RBTC from RSK every 10s (no Connect Wallet). */
  const nativeBalances = useNativeBalances(phoneNumber);
  const dllrDisplay = nativeBalances.address ? nativeBalances.dllr : (wallet?.dllr_balance ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 });
  const usdtDisplay = nativeBalances.address ? nativeBalances.usdt : (wallet?.usdt_balance ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 });
  const hasEnoughGas = nativeBalances.address && parseFloat(nativeBalances.rbtc) >= MIN_RBTC_FOR_GAS;

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

  useEffect(() => {
    getTotalFoundationReserve().then(setFoundationReserve);
  }, [wallet?.updated_at]);

  useEffect(() => {
    setTokenVerified(getSentinelTokenVerified());
    if (!phoneNumber) return;
    hasActiveSentinelLicense(phoneNumber).then(setHasLicense);
    getMintStatus(phoneNumber).then((res) => {
      setFingerprintVerified(res.ok && res.mint_status === MINT_STATUS_MINTED);
    });
    getSpendingUnlocked(phoneNumber).then((res) => {
      if (res.ok) setSpendingUnlocked(res.spending_unlocked);
    });
    getBiometricSpendingActive(phoneNumber).then((res) => {
      if (res.ok) setBiometricSpendingActive(res.active);
    });
  }, [phoneNumber, wallet?.updated_at]);

  const quorumSatisfied =
    layerResults &&
    (layerResults.handshake ? 1 : 0) +
      (layerResults.face ? 1 : 0) +
      (layerResults.voice ? 1 : 0) +
      (layerResults.fingerprint ? 1 : 0) >= 3;

  const handleConvertVidaToDllr = async () => {
    if (!canSpend) {
      setShowLockModal(true);
      return;
    }
    const amount = parseFloat(convertAmount);
    if (!wallet || isNaN(amount) || amount <= 0 || amount > wallet.vida_cap_balance) {
      setConvertError('Enter a valid amount not exceeding your VIDA CAP.');
      return;
    }
    if (!quorumSatisfied || !layerResults) {
      setBiometricError('Complete biometric scan (Sovereign Face + Sovereign Palm + Device) before converting.');
      setConvertStatus('error');
      return;
    }
    setConvertError(null);
    setBiometricError(null);
    setConvertStatus('verify');

    const anchor: IdentityAnchor = {
      phone_number: phoneNumber,
      anchor_type: 'PHONE_INPUT',
      timestamp: new Date().toISOString(),
    };
    const result = await verifyUniversalIdentity(anchor, layerResults);

    if (!result.success) {
      setBiometricError(result.error ?? 'Identity verification failed.');
      setConvertStatus('error');
      return;
    }
    setConvertStatus('converting');

    try {
      const ok = await updateSovereignWalletConvertVidaToDllr(phoneNumber, amount);
      if (ok) {
        const dllrCredited = amount * VIDA_TO_DLLR_RATE;
        setWallet((prev) =>
          prev
            ? {
                ...prev,
                vida_cap_balance: prev.vida_cap_balance - amount,
                dllr_balance: prev.dllr_balance + dllrCredited,
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
      {BETA_LIQUIDITY_TEST && (
        <div
          className="rounded-lg border-2 border-amber-500/60 bg-amber-500/15 px-4 py-3 text-center mb-6"
          style={{ borderColor: 'rgba(245,158,11,0.6)' }}
        >
          <p className="text-sm font-bold uppercase tracking-wider" style={{ color: '#f59e0b' }}>
            BETA TEST MODE: 100% Liquidity Unlocked (No Fees)
          </p>
          <p className="text-xs mt-1" style={{ color: 'rgba(245,158,11,0.9)' }}>Swap to DLLR / USDT active. Direct route to Sovryn AMM below.</p>
        </div>
      )}
      <h2
        className="text-2xl font-bold uppercase tracking-wider mb-6"
        style={{ color: GOLD, textShadow: `0 0 24px ${GOLD_DIM}` }}
      >
        Sovereign Wallet
      </h2>

      {/* Vault Status badge */}
      <div
        className="rounded-lg border px-4 py-2 mb-6 text-center text-xs font-semibold uppercase tracking-wider"
        style={{ borderColor: BORDER, color: GOLD_DIM, background: GOLD_BG }}
      >
        Funds locked for Infrastructure &amp; Future Protocol Projects.
      </div>

      {/* Balance cards — DLLR/USDT from RSK every 10s; VIDA from internal */}
      <div className="grid gap-4 mb-4 sm:grid-cols-3">
        <BalanceCard
          label="Sovereign DLLR"
          value={typeof dllrDisplay === 'string' ? parseFloat(dllrDisplay) || 0 : dllrDisplay}
          suffix="DLLR"
          subLabel={nativeBalances.address ? 'From chain (10s)' : undefined}
        />
        <BalanceCard
          label="USDT"
          value={typeof usdtDisplay === 'string' ? parseFloat(usdtDisplay) || 0 : usdtDisplay}
          suffix="USDT"
          subLabel={nativeBalances.address ? 'From chain (10s)' : undefined}
        />
        <BalanceCard
          label={`Your VIDA (${USER_VIDA_ON_VERIFY} on verify)`}
          value={wallet?.vida_cap_balance ?? 0}
          suffix="VIDA"
        />
      </div>
      {nativeBalances.address && (
        <p className="text-[10px] text-[#6b6b70] mb-4">
          Gas (RBTC): {nativeBalances.rbtc} {!hasEnoughGas && '— Relayer can cover fees if needed.'}
        </p>
      )}

      {/* Spend — QR for receive/pay address (no leaving app) */}
      <div className="mb-6">
        <button
          type="button"
          onClick={() => setShowSpendQR(true)}
          className="w-full py-3 rounded-xl border font-bold uppercase tracking-wider transition-all hover:opacity-90"
          style={{ background: GOLD_BG, borderColor: BORDER, color: GOLD }}
        >
          Spend — Show QR to receive USDT/DLLR
        </button>
        <SpendQRModal isOpen={showSpendQR} onClose={() => setShowSpendQR(false)} phoneNumber={phoneNumber} />
      </div>

      {/* Foundation contribution notice */}
      <p className="text-xs mb-6" style={{ color: '#6b6b70' }}>
        {FOUNDATION_VIDA_ON_VERIFY} VIDA has been contributed to the Foundation Vault to secure the Protocol&apos;s future.
      </p>

      {/* Foundation Impact stat */}
      <div
        className="rounded-xl border p-4 mb-8"
        style={{ background: GOLD_BG, borderColor: BORDER }}
      >
        <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: GOLD_DIM }}>
          Foundation Impact
        </p>
        <p className="text-xl font-bold" style={{ color: GOLD, textShadow: `0 0 16px ${GOLD_DIM}` }}>
          Total Foundation Reserve: {foundationReserve.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} VIDA
        </p>
      </div>

      {/* Convert VIDA to DLLR */}
      <section
        className="rounded-xl border p-6 mb-6 relative"
        style={{ background: GOLD_BG, borderColor: BORDER }}
      >
        <h3 className="text-lg font-semibold mb-4" style={{ color: GOLD }}>
          Convert VIDA to DLLR
        </h3>
        {BETA_LIQUIDITY_TEST && (
          <a
            href={SOVRYN_AMM_SWAP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full mb-4 py-2.5 rounded-lg font-bold text-sm uppercase tracking-wider text-center transition-all hover:opacity-90"
            style={{ background: '#059669', color: '#fff' }}
          >
            Swap to DLLR on Sovryn AMM (Direct) →
          </a>
        )}
        <p className="text-xs mb-4" style={{ color: '#6b6b70' }}>
          {quorumSatisfied
            ? '3-of-4 biometric quorum satisfied. 1 VIDA = 1,000 DLLR.'
            : 'Complete biometric scan (Sovereign Face + Sovereign Palm + Device) before converting.'}
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[120px]">
            <label className="block text-xs font-medium mb-1" style={{ color: GOLD_DIM }}>
              Amount (VIDA) → {convertAmount ? (parseFloat(convertAmount) * VIDA_TO_DLLR_RATE).toLocaleString() : '0'} DLLR
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
              !quorumSatisfied ||
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
      <section className="relative">
        <button
          type="button"
          onClick={() => {
            if (!canSpend) {
              setShowLockModal(true);
              return;
            }
            setShowUSDTBridge((v) => !v);
          }}
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

      <SpendingLockModal isOpen={showLockModal} onClose={() => setShowLockModal(false)} />
    </div>
  );
}

function BalanceCard({
  label,
  value,
  suffix,
  subLabel,
}: {
  label: string;
  value: number;
  suffix: string;
  subLabel?: string;
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
      {subLabel && <p className="text-[10px] text-[#6b6b70] mt-1">{subLabel}</p>}
    </div>
  );
}

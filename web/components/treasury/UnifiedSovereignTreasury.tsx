'use client';

import { useState, useEffect, useCallback } from 'react';
import { useNativeBalances } from '@/lib/sovryn/useNativeBalances';
import { getVidaBalanceOnChain } from '@/lib/sovryn/vidaBalance';
import { getIdentityAnchorPhone } from '@/lib/sentinelActivation';
import { NGN_PER_USD } from '@/lib/sovryn/vngn';
import { fetchNationalBlockReserves, type NationalBlockReserves } from '@/lib/supabaseTelemetry';
import { getSovereigntyFallbackBlockReserves } from '@/lib/sovereigntyFallbacks';
import { getCitizenVaultData } from '@/lib/mockDataService';
import { VIDA_USD_DISPLAY } from '@/lib/economic';
import { getOrCreateSovereignWallet } from '@/lib/sovereignInternalWallet';
import { getSpendableVidaFromProfile } from '@/lib/treasuryProfile';
import { executeIndependentLiquidityBridge, executeVidaToDllrOnly } from '@/lib/sovryn/independentLiquidityBridge';
import { TreasurySwapModal } from './TreasurySwapModal';
import { ReceiveModal } from './ReceiveModal';
import { SendModal } from './SendModal';
import { RecentActivityList } from './RecentActivityList';
import { UBABrandingCard } from '@/components/dashboard/UBABrandingCard';
import { useSovereignSeed } from '@/contexts/SovereignSeedContext';
import { useBiometricSession } from '@/contexts/BiometricSessionContext';
import { areAllAnchorsVerified } from '@/lib/tripleAnchor';
import { IS_PUBLIC_REVEAL, isVettedUser } from '@/lib/publicRevealAccess';

const TOKENS = ['VIDA', 'DLLR', 'USDT', 'vNGN'] as const;
type Token = (typeof TOKENS)[number];

// ——— Personal Treasury: Gold / Wealth theme ———
const GOLD = '#D4AF37';
const GOLD_BG = 'rgba(212, 175, 55, 0.08)';
const GOLD_BORDER = 'rgba(212, 175, 55, 0.3)';

// ——— National Treasury: Deep Blue / Security theme ———
const BLUE = '#1e3a8a';
const BLUE_ACCENT = '#3b82f6';
const BLUE_BG = 'rgba(30, 58, 138, 0.15)';
const BLUE_BORDER = 'rgba(59, 130, 246, 0.4)';

function BalanceRow({
  label,
  value,
  suffix,
  sub,
}: {
  label: string;
  value: string;
  suffix: string;
  sub?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[#2a2a2e] last:border-0">
      <div>
        <p className="text-xs font-medium text-[#a0a0a5] uppercase tracking-wider">{label}</p>
        {sub && <p className="text-[10px] text-[#6b6b70] mt-0.5">{sub}</p>}
      </div>
      <p className="text-lg font-bold font-mono" style={{ color: GOLD }}>
        {value} {suffix}
      </p>
    </div>
  );
}

export function UnifiedSovereignTreasury() {
  const phoneNumber = getIdentityAnchorPhone();
  const sovereignSeed = useSovereignSeed();
  const { isAuthActive, requestQuickAuth } = useBiometricSession();
  const native = useNativeBalances(phoneNumber);
  const [spendableVidaFromProfile, setSpendableVidaFromProfile] = useState<number | null>(null);
  const [vidaBalance, setVidaBalance] = useState<string>('—');
  const [internalVida, setInternalVida] = useState<number | null>(null);
  const [internalDllr, setInternalDllr] = useState<number | null>(null);
  const [internalUsdt, setInternalUsdt] = useState<number | null>(null);
  const [showSend, setShowSend] = useState(false);
  const [showSwap, setShowSwap] = useState(false);
  const [showReceive, setShowReceive] = useState(false);
  const [nationalReserves, setNationalReserves] = useState<NationalBlockReserves | null>(null);
  const [linkedAccounts, setLinkedAccounts] = useState<string[]>([]);
  const [quickAuthMessage, setQuickAuthMessage] = useState<string | null>(null);
  const [tripleAnchorUnlocked, setTripleAnchorUnlocked] = useState(false);
  useEffect(() => {
    setTripleAnchorUnlocked(areAllAnchorsVerified());
    const t = setInterval(() => setTripleAnchorUnlocked(areAllAnchorsVerified()), 1000);
    return () => clearInterval(t);
  }, []);

  const refreshInternalWallet = useCallback(async () => {
    if (!phoneNumber?.trim()) return;
    const w = await getOrCreateSovereignWallet(phoneNumber.trim());
    if (w) {
      setInternalVida(w.vida_cap_balance ?? 0);
      setInternalDllr(w.dllr_balance ?? 0);
      setInternalUsdt(w.usdt_balance ?? 0);
    }
  }, [phoneNumber]);

  useEffect(() => {
    refreshInternalWallet();
  }, [refreshInternalWallet]);

  useEffect(() => {
    if (!phoneNumber?.trim()) return;
    getSpendableVidaFromProfile(phoneNumber.trim()).then((v) => setSpendableVidaFromProfile(v));
  }, [phoneNumber]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onBridgeComplete = () => refreshInternalWallet();
    window.addEventListener('world-vault-conversion-complete', onBridgeComplete);
    return () => window.removeEventListener('world-vault-conversion-complete', onBridgeComplete);
  }, [refreshInternalWallet]);

  useEffect(() => {
    if (!native.address) return;
    getVidaBalanceOnChain(native.address)
      .then((r) => {
        if (r.ok) setVidaBalance(r.balanceFormatted);
        else setVidaBalance('—');
      })
      .catch(() => setVidaBalance('—'));
  }, [native.address]);

  useEffect(() => {
    fetchNationalBlockReserves()
      .then((r) => setNationalReserves(r ?? getSovereigntyFallbackBlockReserves() as NationalBlockReserves))
      .catch(() => setNationalReserves(getSovereigntyFallbackBlockReserves() as NationalBlockReserves));
  }, []);

  useEffect(() => {
    try {
      const vault = getCitizenVaultData();
      setLinkedAccounts(vault?.linked_bank_accounts ?? []);
    } catch {
      setLinkedAccounts([]);
    }
  }, []);

  const vngnPlaceholder = '0';
  const ngnRateLabel = `1 USD = ₦${NGN_PER_USD.toLocaleString()} (vNGN)`;

  // Independent Liquidity Bridge: VIDA → DLLR and VIDA → USDT (personal treasury only)
  const handleSwap = useCallback(
    async (from: Token, to: Token, amount: number): Promise<boolean> => {
      if (!phoneNumber?.trim() || amount <= 0) return false;
      if (from === 'VIDA' && to === 'DLLR') {
        const result = await executeVidaToDllrOnly(phoneNumber.trim(), amount);
        if (result.success) await refreshInternalWallet();
        return result.success;
      }
      if (from === 'VIDA' && to === 'USDT') {
        const result = await executeIndependentLiquidityBridge(phoneNumber.trim(), amount);
        if (result.success) await refreshInternalWallet();
        return result.success;
      }
      return false;
    },
    [phoneNumber, refreshInternalWallet]
  );

  // VIDA: from Supabase profiles.spendable_vida (default $1,000 = 1 VIDA if empty)
  const displayVida =
    spendableVidaFromProfile != null
      ? String(Number(spendableVidaFromProfile).toFixed(4))
      : internalVida != null
        ? String(internalVida.toFixed(4))
        : native.loading && !native.address
          ? '…'
          : vidaBalance;
  const displayDllr = internalDllr != null ? String(internalDllr.toFixed(2)) : (native.address ? native.dllr : '—');
  const displayUsdt = internalUsdt != null ? String(internalUsdt.toFixed(2)) : (native.address ? native.usdt : '—');

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-8">
      {/* ——— Citizen's Heritage (Citizen_Vault) ——— */}
      <section
        className="rounded-2xl border-2 overflow-hidden"
        style={{ background: GOLD_BG, borderColor: GOLD_BORDER }}
      >
        <div
          className="px-5 py-4 border-b"
          style={{ borderColor: GOLD_BORDER, background: 'rgba(212, 175, 55, 0.12)' }}
        >
          <h2 className="text-xl font-bold uppercase tracking-wider" style={{ color: GOLD }}>
            Citizen&apos;s Heritage
          </h2>
          <p className="text-xs text-[#a0a0a5] mt-0.5">
            Citizen_Vault · Your 50% · 4/1 lock: 4 VIDA locked, 1 VIDA released over 10 daily Palm Scans ($100/day until $1,000 spendable)
          </p>
          <p className="text-xs text-[#a0a0a5] mt-0.5">
            1 VIDA = {VIDA_USD_DISPLAY} anchor
          </p>
          {!tripleAnchorUnlocked && (
            <p className="text-xs mt-2 px-3 py-2 rounded-lg border" style={{ color: '#e8c547', borderColor: 'rgba(212,175,55,0.5)', background: 'rgba(212,175,55,0.08)' }}>
              Complete Face, Palm Scan, and Device (Security bar) to unlock 1 VIDA.
            </p>
          )}
        </div>
        <div className="p-5 space-y-4">
          <BalanceRow label="VIDA" value={displayVida} suffix="VIDA" sub={VIDA_USD_DISPLAY} />
          <BalanceRow label="DLLR" value={displayDllr} suffix="DLLR" sub="Personal treasury / On-chain" />
          <BalanceRow label="USDT" value={displayUsdt} suffix="USDT" sub="Personal treasury / On-chain · Ready for linked bank" />
          <BalanceRow label="vNGN" value={vngnPlaceholder} suffix="vNGN" sub={ngnRateLabel} />
        </div>
        <div className="px-5 pb-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={async () => {
              if (!tripleAnchorUnlocked) return;
              setQuickAuthMessage(null);
              if (isAuthActive) {
                setShowSend(true);
                return;
              }
              const ok = await requestQuickAuth();
              if (ok) setShowSend(true);
              else setQuickAuthMessage('Verification cancelled. Try again or use Face Pulse for high-value moves.');
            }}
            disabled={!tripleAnchorUnlocked}
            className="px-6 py-3 rounded-xl font-bold uppercase tracking-wider border transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'rgba(42,42,46,0.6)', color: GOLD, borderColor: GOLD_BORDER }}
          >
            Send
          </button>
          <button
            type="button"
            onClick={() => setShowReceive(true)}
            className="px-6 py-3 rounded-xl font-bold uppercase tracking-wider border transition-all hover:opacity-90"
            style={{ background: 'rgba(42,42,46,0.6)', color: GOLD, borderColor: GOLD_BORDER }}
          >
            Receive
          </button>
          <button
            type="button"
            onClick={async () => {
              if (!tripleAnchorUnlocked) return;
              setQuickAuthMessage(null);
              if (isAuthActive) {
                setShowSwap(true);
                return;
              }
              const ok = await requestQuickAuth();
              if (ok) setShowSwap(true);
              else setQuickAuthMessage('Verification cancelled. Try again or use Face Pulse for high-value moves.');
            }}
            disabled={!tripleAnchorUnlocked}
            className="px-6 py-3 rounded-xl font-bold uppercase tracking-wider border transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: GOLD, color: '#0d0d0f', borderColor: GOLD_BORDER }}
          >
            Swap
          </button>
        </div>
        {quickAuthMessage && (
          <p className="px-5 pb-2 text-xs text-[#a0a0a5] text-center" role="alert">
            {quickAuthMessage}
          </p>
        )}

        {/* Linked Account — Nigerian Bank exit ramp (hidden for non-vetted when IS_PUBLIC_REVEAL) */}
        {(!IS_PUBLIC_REVEAL || isVettedUser()) && (
          <div className="px-5 pb-5">
            <h3 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: GOLD }}>
              Linked Account
            </h3>
            <UBABrandingCard linkedAccounts={linkedAccounts} />
            <div className="mt-4 rounded-xl border p-4" style={{ background: 'rgba(42,42,46,0.5)', borderColor: GOLD_BORDER }}>
              <h4 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: GOLD }}>
                vNGN → Bank
              </h4>
              <button
                type="button"
                disabled
                className="w-full py-3 rounded-lg font-bold uppercase tracking-wider border opacity-80 cursor-not-allowed text-sm"
                style={{ background: 'rgba(42,42,46,0.5)', color: '#8b8b95', borderColor: GOLD_BORDER }}
              >
                Withdraw to Nigerian Bank
              </button>
              <p className="text-xs text-[#6b6b70] mt-2 text-center">
                Nigerian Bank exit ramp — awaiting final integration.
              </p>
            </div>
          </div>
        )}
      </section>

      <hr className="border-[#2a2a2e]" aria-hidden />

      {/* ——— National Future (National_Vault) ——— */}
      <section
        className="rounded-2xl border-2 overflow-hidden"
        style={{ background: BLUE_BG, borderColor: BLUE_BORDER }}
      >
        <div
          className="px-5 py-4 border-b"
          style={{ borderColor: BLUE_BORDER, background: 'rgba(30, 58, 138, 0.25)' }}
        >
          <h2 className="text-xl font-bold uppercase tracking-wider text-[#93c5fd]">
            National Future
          </h2>
          <p className="text-xs text-[#a0a0a5] mt-0.5">
            National_Vault · State&apos;s 50% · 70/30 lock · Diplomatic Lock: 70% untouchable until Sovereign Clauses are signed
          </p>
        </div>
        <div className="p-5">
          {nationalReserves ? (
            <div className="space-y-4">
              <div
                className="rounded-xl p-5 border-2 text-center"
                style={{ borderColor: BLUE_ACCENT, background: 'rgba(30, 58, 138, 0.2)' }}
              >
                <p className="text-xs font-medium text-[#93c5fd] uppercase tracking-wider mb-2">
                  Total National Reserves
                </p>
                <p className="text-3xl md:text-4xl font-bold font-mono text-[#3b82f6]">
                  {(nationalReserves.national_vault_vida_cap + nationalReserves.vida_cap_liquidity + nationalReserves.national_vida_pool_vida_cap).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} VIDA CAP
                </p>
                <p className="text-xs text-[#6b6b70] mt-2">
                  National Stability Reserve (70%) · VIDA CAP Liquidity · National VIDA Pool
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <div className="rounded-lg p-3 border" style={{ borderColor: BLUE_BORDER, background: 'rgba(30, 58, 138, 0.15)' }}>
                  <p className="text-[10px] text-[#93c5fd] uppercase tracking-wider">Stability (70%) · Diplomatic Lock</p>
                  <p className="font-mono font-bold text-[#3b82f6]">{nationalReserves.national_vault_vida_cap.toLocaleString('en-US', { minimumFractionDigits: 2 })} VIDA</p>
                </div>
                <div className="rounded-lg p-3 border" style={{ borderColor: BLUE_BORDER, background: 'rgba(30, 58, 138, 0.15)' }}>
                  <p className="text-[10px] text-[#93c5fd] uppercase tracking-wider">Liquidity (15%)</p>
                  <p className="font-mono font-bold text-[#3b82f6]">{nationalReserves.vida_cap_liquidity.toLocaleString('en-US', { minimumFractionDigits: 2 })} VIDA</p>
                </div>
                <div className="rounded-lg p-3 border" style={{ borderColor: BLUE_BORDER, background: 'rgba(30, 58, 138, 0.15)' }}>
                  <p className="text-[10px] text-[#93c5fd] uppercase tracking-wider">Pool (15%)</p>
                  <p className="font-mono font-bold text-[#3b82f6]">{nationalReserves.national_vida_pool_vida_cap.toLocaleString('en-US', { minimumFractionDigits: 2 })} VIDA</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl p-6 border border-[#2a2a2e] animate-pulse">
              <div className="h-6 bg-[#2a2a2e] rounded w-2/3 mb-3" />
              <div className="h-10 bg-[#2a2a2e] rounded w-1/2 mx-auto" />
            </div>
          )}
        </div>
      </section>

      {/* ——— Recent Activity (sovereign_ledger) ——— */}
      <RecentActivityList phoneNumber={phoneNumber ?? null} />

      <SendModal
        isOpen={showSend}
        onClose={() => setShowSend(false)}
        phoneNumber={phoneNumber ?? null}
        onSuccess={refreshInternalWallet}
        encryptedSeed={sovereignSeed?.encryptedSeed ?? null}
      />
      <TreasurySwapModal
        isOpen={showSwap}
        onClose={() => setShowSwap(false)}
        onSwap={handleSwap}
      />
      {phoneNumber && (
        <ReceiveModal
          isOpen={showReceive}
          onClose={() => setShowReceive(false)}
          phoneNumber={phoneNumber}
          walletAddress={native.address}
        />
      )}
    </div>
  );
}

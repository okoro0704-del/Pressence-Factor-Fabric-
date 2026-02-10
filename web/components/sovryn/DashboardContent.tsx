'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTripleTapReset } from '@/lib/useTripleTapReset';
import { MultiCurrencyBalanceCards } from './MultiCurrencyBalanceCards';
import { NationalReserveCharts } from '../dashboard/NationalReserveCharts';
import { NationalBlockCommand } from '../dashboard/NationalBlockCommand';
import { UserProfileBalance } from '../dashboard/UserProfileBalance';
import { SovereignIdCard } from '../dashboard/SovereignIdCard';
import { PresenceOverrideModal } from '../dashboard/PresenceOverrideModal';
import { FamilyVault } from '../dashboard/FamilyVault';
import { MerchantModeSection } from '../dashboard/MerchantModeSection';
import { MerchantSalesTab } from '../dashboard/MerchantSalesTab';
import { SovereignPulseBar } from '../dashboard/SovereignPulseBar';
import type { GlobalIdentity } from '@/lib/phoneIdentity';
import { getIdentityAnchorPhone } from '@/lib/sentinelActivation';
import { getCurrentUserRole, canAccessStaffPortal } from '@/lib/roleAuth';
import { resetBiometrics } from '@/lib/resetBiometrics';
import { isMerchantMode, getMerchantWalletAddress } from '@/lib/merchantMode';
import { fetchLedgerStats } from '@/lib/ledgerStats';
import { fetchUserBalances } from '@/lib/userBalances';
import { TreasuryFacePulseModal } from '../dashboard/TreasuryFacePulseModal';

const GOLD = '#D4AF37';

export function DashboardContent({
  vaultStable = false,
  mintTxHash = null,
  openSwapFromUrl = false,
}: {
  vaultStable?: boolean;
  /** When set, show "11 VIDA CAP MINTED ON BITCOIN LAYER 2" with golden checkmark (tx mined). */
  mintTxHash?: string | null;
  /** After Identity Re-Link: open swap modal and auto-resume with pending amount. */
  openSwapFromUrl?: boolean;
}) {
  const [showPresenceModal, setShowPresenceModal] = useState(false);
  const [resettingBiometrics, setResettingBiometrics] = useState(false);
  const [resetBiometricsMessage, setResetBiometricsMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'sales'>('overview');
  const [treasuryTab, setTreasuryTab] = useState<'personal' | 'national'>('personal');
  const [merchantWallet, setMerchantWallet] = useState<string | null>(null);
  const [merchantModeOn, setMerchantModeOn] = useState(false);
  const [showStaffPortal, setShowStaffPortal] = useState(false);
  /** National Treasury (public): from global ledger_stats. */
  const [ledgerStats, setLedgerStats] = useState<{
    totalReserveVida: number;
    totalVitalizedCount: number;
    totalMintedVida: number;
  } | null>(null);
  /** Personal Vault: no liveness gate — balances and Merchant QR visible without face scan. Only sign-in and device-approval require vitalization. */
  const [personalVaultRevealed, setPersonalVaultRevealed] = useState(true);
  const [showFacePulseModal, setShowFacePulseModal] = useState(false);
  /** Personal Treasury: from user_balances table when available. */
  const [userBalances, setUserBalances] = useState<{
    vida_balance: number;
    dllr_balance: number;
    usdt_balance: number;
    vngn_balance: number;
  } | null>(null);
  const handleHeaderTitleClick = useTripleTapReset();

  useEffect(() => {
    fetchLedgerStats().then((s) => {
      setLedgerStats({
        totalReserveVida: s.totalReserveVida,
        totalVitalizedCount: s.totalVitalizedCount,
        totalMintedVida: s.totalMintedVida,
      });
    });
  }, []);

  useEffect(() => {
    fetchUserBalances(getIdentityAnchorPhone()).then((row) => {
      if (row) {
        setUserBalances({
          vida_balance: row.vida_balance,
          dllr_balance: row.dllr_balance,
          usdt_balance: row.usdt_balance,
          vngn_balance: row.vngn_balance,
        });
      }
    });
  }, []);

  // No face scan required for vault: personalVaultRevealed stays true (set in initial state).

  useEffect(() => {
    setMerchantModeOn(isMerchantMode());
    setMerchantWallet(getMerchantWalletAddress() ?? getIdentityAnchorPhone());
  }, []);
  useEffect(() => {
    const phone = getIdentityAnchorPhone();
    if (!phone) return;
    getCurrentUserRole(phone).then((role) => setShowStaffPortal(canAccessStaffPortal(role)));
  }, []);
  const handleMerchantModeChange = (enabled: boolean, wallet: string | null) => {
    setMerchantModeOn(enabled);
    setMerchantWallet(wallet);
  };

  const handlePresenceVerified = (identity: GlobalIdentity) => {
    // Show success notification
    alert(`✓ SOVEREIGN IDENTITY VERIFIED: ${identity.full_name}\nAccess Authorized`);
    setShowPresenceModal(false);

    // In production, this would switch the dashboard to show the sovereign's data
    // For now, we'll just show the notification
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="shrink-0 border-b border-[#2a2a2e] bg-[#16161a]/90 backdrop-blur px-4 py-3 safe-area-top">
        <div className="flex items-center justify-between">
          <div>
            <button
              type="button"
              onClick={handleHeaderTitleClick}
              className="text-left bg-transparent border-0 p-0 cursor-default focus:outline-none focus:ring-0"
              aria-label="PFF Sovereign Protocol"
            >
              <h1 className="text-lg font-bold bg-gradient-to-r from-[#e8c547] to-[#c9a227] bg-clip-text text-transparent tracking-tight">
                PFF Dashboard
              </h1>
            </button>
            <p className="text-xs text-[#6b6b70] mt-0.5">
              National Reserve · Citizen Vault · Presence-Gated DeFi
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setShowPresenceModal(true)}
              className="relative z-50 px-4 py-2 bg-gradient-to-r from-[#c9a227] to-[#e8c547] hover:from-[#e8c547] hover:to-[#c9a227] text-black font-bold text-sm rounded-lg transition-all duration-300 shadow-lg cursor-pointer"
            >
              🔐 Authenticate Dependent
            </button>
            {showStaffPortal && (
            <Link
              href="/staff-portal"
              className="relative z-50 text-sm font-medium text-[#c9a227] hover:text-[#e8c547] transition-colors cursor-pointer"
            >
              Staff Portal
            </Link>
            )}
            <Link
              href="/treasury"
              className="relative z-50 text-sm font-medium text-[#c9a227] hover:text-[#e8c547] transition-colors cursor-pointer"
            >
              Treasury
            </Link>
            <Link
              href="/manifesto"
              className="relative z-50 text-sm font-medium text-[#c9a227] hover:text-[#e8c547] transition-colors cursor-pointer"
            >
              ← Manifesto
            </Link>
          </div>
        </div>
      </header>

      <div className="flex-1 p-4 md:p-6 max-w-6xl mx-auto w-full">
        {/* Sovereign Pulse — 4 metrics */}
        <SovereignPulseBar className="mb-6" />

        {/* Sync to Mobile — compact */}
        <section className="hidden lg:flex lg:items-center lg:gap-4 lg:mb-6 rounded-xl border p-4 max-w-2xl" style={{ borderColor: `rgba(212,175,55,0.4)`, background: 'rgba(15,14,10,0.6)' }}>
          <span className="text-sm font-bold uppercase tracking-wider" style={{ color: GOLD }}>Sync to Mobile</span>
          <Link href="/link-device" className="text-sm font-semibold" style={{ color: GOLD }}>Link Device / QR →</Link>
        </section>
        {/* Tabs: Overview | Sales (for merchants) */}
        {merchantModeOn && (
          <div className="flex gap-2 mb-4 border-b border-[#2a2a2e] pb-2">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'bg-[#e8c547]/20 text-[#e8c547] border border-[#e8c547]/50'
                  : 'text-[#6b6b70] hover:text-[#a0a0a5] border border-transparent'
              }`}
            >
              Overview
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('sales')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'sales'
                  ? 'bg-[#e8c547]/20 text-[#e8c547] border border-[#e8c547]/50'
                  : 'text-[#6b6b70] hover:text-[#a0a0a5] border border-transparent'
              }`}
            >
              Sales
            </button>
          </div>
        )}
        {activeTab === 'sales' && merchantWallet ? (
          <div className="mb-6">
            <MerchantSalesTab walletAddress={merchantWallet} />
          </div>
        ) : (
          <>
        {/* ——— Treasury: [PERSONAL] | [NATIONAL] ——— */}
        <section className="rounded-2xl border-2 p-6 mb-8" style={{ borderColor: 'rgba(212,175,55,0.35)', background: 'rgba(22,22,26,0.9)' }}>
          <div className="flex gap-2 border-b mb-6 pb-3" style={{ borderColor: 'rgba(212,175,55,0.25)' }}>
            <button
              type="button"
              onClick={() => setTreasuryTab('personal')}
              className={`px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors ${
                treasuryTab === 'personal'
                  ? 'bg-[#D4AF37]/20 border border-[#D4AF37]/60'
                  : 'border border-transparent text-[#6b6b70] hover:text-[#a0a0a5]'
              }`}
              style={treasuryTab === 'personal' ? { color: GOLD } : {}}
            >
              Personal
            </button>
            <button
              type="button"
              onClick={() => setTreasuryTab('national')}
              className={`px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors ${
                treasuryTab === 'national'
                  ? 'bg-[#D4AF37]/20 border border-[#D4AF37]/60'
                  : 'border border-transparent text-[#6b6b70] hover:text-[#a0a0a5]'
              }`}
              style={treasuryTab === 'national' ? { color: GOLD } : {}}
            >
              National
            </button>
          </div>

          {treasuryTab === 'personal' && (
            <div className="space-y-6">
              {!personalVaultRevealed && (
                <div className="rounded-xl border-2 border-amber-500/40 bg-amber-500/10 p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <span className="text-2xl" aria-hidden>🔒</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-amber-200/95">Personal Vault is private</p>
                    <p className="text-xs text-amber-200/80 mt-0.5">Balances and Merchant QR are hidden until you verify with a face scan (85%+ match).</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowFacePulseModal(true)}
                    className="px-4 py-2 rounded-lg bg-amber-500/30 border border-amber-500/50 text-amber-200 font-semibold text-sm hover:bg-amber-500/40 transition-colors cursor-pointer"
                  >
                    Reveal with Face Scan
                  </button>
                </div>
              )}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-xs font-bold text-[#6b6b70] uppercase tracking-wider mb-2">Sovereign ID</h3>
                  <SovereignIdCard />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#6b6b70] uppercase tracking-wider mb-2">VIDA</h3>
                  <UserProfileBalance
                    vaultStable={vaultStable}
                    mintTxHash={mintTxHash}
                    openSwapFromUrl={openSwapFromUrl}
                    obfuscate={!personalVaultRevealed}
                  />
                </div>
              </div>
              <div>
                <h3 className="text-xs font-bold text-[#6b6b70] uppercase tracking-wider mb-3">Wallets · VIDA · DLLR · USDT · vNGN</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="rounded-xl border-2 p-4" style={{ borderColor: 'rgba(212,175,55,0.4)', background: 'rgba(212,175,55,0.08)' }}>
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: GOLD }}>VIDA</span>
                    <p className="text-lg font-bold font-mono mt-1" style={{ color: GOLD }}>
                      {!personalVaultRevealed ? '****' : userBalances != null ? `${userBalances.vida_balance.toFixed(2)} VIDA` : 'See above'}
                    </p>
                  </div>
                  <MultiCurrencyBalanceCards variant="cardsOnly" obfuscate={!personalVaultRevealed} />
                  <div className="rounded-xl border-2 p-4" style={{ borderColor: 'rgba(180,180,180,0.4)', background: 'rgba(180,180,180,0.06)' }}>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#a0a0a5]">vNGN</span>
                    <p className="text-lg font-bold font-mono mt-1 text-[#a0a0a5]">
                      {!personalVaultRevealed ? '****' : userBalances != null ? `${userBalances.vngn_balance.toFixed(2)} vNGN` : '— vNGN'}
                    </p>
                    <p className="text-[10px] text-[#6b6b70] mt-1">Naira stable · RSK</p>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-xs font-bold text-[#6b6b70] uppercase tracking-wider mb-2">Swap / Convert</h3>
                <p className="text-xs text-[#6b6b70] mb-2">Convert VIDA → DLLR or USDT in User balance card above.</p>
              </div>
              <div>
                <MerchantModeSection
                  onMerchantModeChange={handleMerchantModeChange}
                  obfuscate={!personalVaultRevealed}
                  onRequestFaceScan={() => setShowFacePulseModal(true)}
                />
              </div>
              <div className="lg:col-span-2">
                <FamilyVault />
              </div>
            </div>
          )}

          {treasuryTab === 'national' && (
            <div className="space-y-6">
              <p className="text-xs text-[#6b6b70]">
                Public view — any Vitalized citizen can see this collective wealth. Data from global ledger_stats table.
              </p>
              <div className="flex flex-wrap items-baseline gap-6">
                <div>
                  <span className="text-xs font-bold text-[#6b6b70] uppercase tracking-wider">Total Reserve</span>
                  <p className="text-2xl font-bold font-mono" style={{ color: GOLD }}>
                    {ledgerStats != null
                      ? `${ledgerStats.totalReserveVida.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} VIDA`
                      : '—'}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-bold text-[#6b6b70] uppercase tracking-wider">Total Vitalized</span>
                  <p className="text-2xl font-bold font-mono" style={{ color: GOLD }}>
                    {ledgerStats != null ? ledgerStats.totalVitalizedCount.toLocaleString() : '—'}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-bold text-[#6b6b70] uppercase tracking-wider">Minted VIDA</span>
                  <p className="text-2xl font-bold font-mono" style={{ color: GOLD }}>
                    {ledgerStats != null
                      ? `${ledgerStats.totalMintedVida.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} VIDA`
                      : '—'}
                  </p>
                </div>
                <Link href="/government/elections" className="text-sm font-bold uppercase tracking-wider ml-auto" style={{ color: GOLD }}>Elections / Voting →</Link>
              </div>
              <NationalReserveCharts />
              <div>
                <h3 className="text-xs font-bold text-[#6b6b70] uppercase tracking-wider mb-3">National Block Command</h3>
                <NationalBlockCommand />
              </div>
            </div>
          )}
        </section>

        <div className="max-w-2xl">
          <section className="rounded-xl border p-4 mt-4" style={{ borderColor: 'rgba(212,175,55,0.25)', background: 'rgba(22,22,26,0.8)' }}>
            <h2 className="text-sm font-semibold text-[#c9a227] mb-2">Settings</h2>
            <p className="text-xs text-[#6b6b70] mb-3">
              Clear primary sentinel device and stored face hashes so you can re-enroll (e.g. new device or re-scan).
            </p>
            {resetBiometricsMessage && (
              <p className={`text-sm mb-3 ${resetBiometricsMessage.startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>
                {resetBiometricsMessage}
              </p>
            )}
            <button
              type="button"
              disabled={resettingBiometrics}
              onClick={async () => {
                const phone = getIdentityAnchorPhone();
                if (!phone) {
                  setResetBiometricsMessage('No identity anchor in session. Complete the gate first.');
                  return;
                }
                if (!confirm('Reset My Biometrics will clear your primary device and face hashes. You will need to complete verification again. Continue?')) return;
                setResettingBiometrics(true);
                setResetBiometricsMessage(null);
                const result = await resetBiometrics(phone);
                setResettingBiometrics(false);
                if (result.ok) {
                  localStorage.clear();
                  sessionStorage.clear();
                  window.location.href = '/vitalization?reset=1';
                  return;
                }
                setResetBiometricsMessage(result.error ?? 'Reset failed.');
              }}
              className="px-4 py-2 rounded-lg border border-amber-500/50 text-amber-400 hover:bg-amber-500/10 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {resettingBiometrics ? 'Resetting…' : 'Reset My Biometrics'}
            </button>
          </section>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/humanity"
              className="text-sm font-medium text-[#c9a227] hover:text-[#e8c547] transition-colors"
            >
              Humanity Ledger →
            </Link>
            <Link
              href="/pulse"
              className="text-sm font-medium text-[#c9a227] hover:text-[#e8c547] transition-colors"
            >
              National Pulse →
            </Link>
            <Link
              href="/registration"
              className="text-sm font-medium text-[#c9a227] hover:text-[#e8c547] transition-colors"
            >
              Registration Hub →
            </Link>
            <Link
              href="/vitalization"
              className="text-sm font-medium text-[#c9a227] hover:text-[#e8c547] transition-colors"
            >
              Vitalization Screen →
            </Link>
            <Link
              href="/companion"
              className="text-sm font-medium text-[#c9a227] hover:text-[#e8c547] transition-colors"
            >
              SOVRYN Companion →
            </Link>
          </div>
        </div>
          </>
        )}
      </div>

      <footer className="shrink-0 border-t border-[#2a2a2e] px-4 py-2 text-center text-xs text-[#6b6b70]">
        PFF × Sovryn · Born in Lagos. Built for the World. · mrfundzman
      </footer>

      {/* Presence Override Modal */}
      <PresenceOverrideModal
        isOpen={showPresenceModal}
        onClose={() => setShowPresenceModal(false)}
        onPresenceVerified={handlePresenceVerified}
      />

      {/* Personal Treasury: Face Scan to reveal balances and Merchant QR */}
      <TreasuryFacePulseModal
        isOpen={showFacePulseModal}
        onClose={() => setShowFacePulseModal(false)}
        onVerified={() => {
          setPersonalVaultRevealed(true);
          setShowFacePulseModal(false);
        }}
      />

      {/* AI Companion moved to last page: /companion (Companion nav item) — activated there. */}
    </div>
  );
}

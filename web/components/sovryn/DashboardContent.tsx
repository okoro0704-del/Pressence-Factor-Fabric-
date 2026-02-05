'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MultiCurrencyBalanceCards } from './MultiCurrencyBalanceCards';
import { NationalReserveCharts } from '../dashboard/NationalReserveCharts';
import { NationalBlockCommand } from '../dashboard/NationalBlockCommand';
import { UserProfileBalance } from '../dashboard/UserProfileBalance';
import { SovereignIdCard } from '../dashboard/SovereignIdCard';
import { PresenceOverrideModal } from '../dashboard/PresenceOverrideModal';
import { FamilyVault } from '../dashboard/FamilyVault';
import { MerchantModeSection } from '../dashboard/MerchantModeSection';
import { MerchantSalesTab } from '../dashboard/MerchantSalesTab';
import type { GlobalIdentity } from '@/lib/phoneIdentity';
import { getIdentityAnchorPhone } from '@/lib/sentinelActivation';
import { getCurrentUserRole, canAccessStaffPortal } from '@/lib/roleAuth';
import { resetBiometrics } from '@/lib/resetBiometrics';
import { isMerchantMode, getMerchantWalletAddress } from '@/lib/merchantMode';
import { fetchNationalBlockReserves } from '@/lib/supabaseTelemetry';

export function DashboardContent({
  vaultStable = false,
  mintTxHash = null,
  openSwapFromUrl = false,
}: {
  vaultStable?: boolean;
  /** When set, show "5 VIDA MINTED ON BITCOIN LAYER 2" with golden checkmark (tx mined). */
  mintTxHash?: string | null;
  /** After Identity Re-Link: open swap modal and auto-resume with pending amount. */
  openSwapFromUrl?: boolean;
}) {
  const [showPresenceModal, setShowPresenceModal] = useState(false);
  const [resettingBiometrics, setResettingBiometrics] = useState(false);
  const [resetBiometricsMessage, setResetBiometricsMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'sales'>('overview');
  const [merchantWallet, setMerchantWallet] = useState<string | null>(null);
  const [merchantModeOn, setMerchantModeOn] = useState(false);
  const [showStaffPortal, setShowStaffPortal] = useState(false);
  const [totalNationalVida, setTotalNationalVida] = useState<number | null>(null);

  useEffect(() => {
    fetchNationalBlockReserves().then((reserves) => {
      if (reserves) {
        const total =
          reserves.national_vault_vida_cap +
          reserves.vida_cap_liquidity +
          reserves.national_vida_pool_vida_cap;
        setTotalNationalVida(total);
      } else {
        setTotalNationalVida(null);
      }
    });
  }, []);

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
      <header className="shrink-0 border-b border-[#2a2a2e] bg-[#16161a]/90 backdrop-blur px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-[#e8c547] to-[#c9a227] bg-clip-text text-transparent tracking-tight">
              PFF Dashboard
            </h1>
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
        {/* ——— Personal Treasury (top section): utility ——— */}
        <section className="rounded-2xl border-2 border-[#2a2a2e] bg-[#16161a]/80 p-6 mb-8 shadow-inner">
          <h2 className="text-xl font-bold text-[#e8c547] uppercase tracking-wider mb-1">
            Personal Treasury
          </h2>
          <p className="text-xs text-[#6b6b70] mb-6">
            Quick access to your $1,000 liquid VIDA — Swap, Send, and Receive.
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-[#6b6b70] uppercase tracking-wider mb-3">
                Sovereign ID
              </h3>
              <SovereignIdCard />
            </div>
            <div>
              <UserProfileBalance
                vaultStable={vaultStable}
                mintTxHash={mintTxHash}
                openSwapFromUrl={openSwapFromUrl}
              />
            </div>
            <div className="lg:col-span-2">
              <FamilyVault />
            </div>
          </div>
        </section>

        {/* Visual divider: Personal (utility) vs National (transparency) */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#3b82f6]/50 to-transparent" />
          <span className="text-[10px] font-semibold text-[#6b6b70] uppercase tracking-widest">
            National transparency
          </span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#3b82f6]/50 to-transparent" />
        </div>

        {/* ——— National Treasury (bottom section): transparency ——— */}
        <section className="rounded-2xl border-2 border-[#3b82f6]/30 bg-[#0d0d0f]/90 p-6 mb-8">
          <h2 className="text-xl font-bold text-[#3b82f6] uppercase tracking-wider mb-1">
            National Treasury
          </h2>
          <p className="text-sm text-[#a0a0a5] mb-6">
            Total Sovereign Assets in Reserve:{' '}
            <span className="font-mono font-semibold text-[#3b82f6]">
              {totalNationalVida != null
                ? `${totalNationalVida.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} VIDA`
                : '—'}
            </span>
          </p>
          <div className="space-y-6">
            <NationalReserveCharts />
            <div>
              <h3 className="text-sm font-semibold text-[#6b6b70] uppercase tracking-wider mb-4">
                National Block Command
              </h3>
              <NationalBlockCommand />
            </div>
          </div>
        </section>

        <div className="max-w-2xl">
          <section className="mb-6">
            <h2 className="text-sm font-semibold text-[#6b6b70] uppercase tracking-wider mb-3">
              Protocol Vault — DLLR & USDT
            </h2>
            <p className="text-xs text-[#6b6b70] mb-3">
              Multi-currency balances on Rootstock (RSK). Active Spending Power appears after you convert VIDA to DLLR.
            </p>
            <MultiCurrencyBalanceCards />
          </section>

          <section className="rounded-xl border border-[#2a2a2e] bg-[#16161a] p-4">
            <h2 className="text-sm font-semibold text-[#c9a227] mb-2">The Gated Handshake</h2>
            <p className="text-sm text-[#a0a0a5] leading-relaxed">
              All Sovryn actions — Zero (0% interest loans), Spot Exchange, lending, borrowing — are
              gated by <strong className="text-[#e8c547]">withPresence(transaction)</strong>. Your
              wallet signs RSK transactions only after the PFF Fabric verifies your physical presence
              via biometric handshake. No trade or loan can be initiated without it.
            </p>
          </section>

          <MerchantModeSection onMerchantModeChange={handleMerchantModeChange} />

          <section className="rounded-xl border border-[#2a2a2e] bg-[#16161a] p-4 mt-6">
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
                setResetBiometricsMessage(result.ok ? '✓ Biometrics reset. Re-verify at the gate to re-enroll.' : (result.error ?? 'Reset failed.'));
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
    </div>
  );
}

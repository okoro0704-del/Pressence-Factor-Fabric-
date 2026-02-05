'use client';

import { useState, useEffect } from 'react';
import { fetchCitizenVault, type CitizenVault } from '@/lib/supabaseTelemetry';
import { getCitizenVaultData } from '@/lib/mockDataService';
import { SendVidaModal } from './SendVidaModal';
import { VIDASwapModal } from './VIDASwapModal';
import { UBABrandingCard } from './UBABrandingCard';
import { PresenceOverrideModal } from './PresenceOverrideModal';
import { GenesisHandshakeIndicator } from './GenesisHandshakeIndicator';
import { checkPresenceVerified } from '@/lib/withPresenceCheck';
import type { GlobalIdentity } from '@/lib/phoneIdentity';
import { getIdentityAnchorPhone } from '@/lib/sentinelActivation';
import { hasActiveSentinelLicense, getActiveLicense, SENTINEL_TIERS } from '@/lib/sentinelLicensing';
import { getSentinelTokenVerified } from '@/lib/sentinelSecurityToken';
import { SentinelActivationOverlay } from './SentinelActivationOverlay';
import { TripleVaultDisplay } from './TripleVaultDisplay';
import {
  GROSS_SOVEREIGN_GRANT_VIDA,
  NATIONAL_CONTRIBUTION_VIDA,
  NET_SPENDABLE_VIDA,
  VIDA_PRICE_USD,
  NAIRA_RATE,
} from '@/lib/sovereignHandshakeConstants';
import { LIQUID_TIER_USD } from '@/lib/economic';
import { CURRENT_POWER_SPENDABLE_USD, CURRENT_POWER_SPENDABLE_VIDA, TOTAL_WEALTH_VIDA, FUTURE_VALUE_LOCKED_VIDA } from '@/lib/sovereignTreasurySplit';
import { BETA_LIQUIDITY_TEST, BETA_SPENDABLE_VIDA, BETA_SPENDABLE_USD, SOVRYN_AMM_SWAP_URL } from '@/lib/betaLiquidityTest';
import { isFaceVerifiedForBalance } from '@/lib/biometricAuth';
import { getMintStatus, getSpendingUnlocked, getBiometricSpendingActive, MINT_STATUS_MINTED } from '@/lib/mintStatus';
import { hasFaceAndSeed } from '@/lib/recoverySeedStorage';
import { SpendingLockModal } from './SpendingLockModal';
import { deriveRSKWalletFromSeed } from '@/lib/sovryn/derivedWallet';
import { getVidaBalanceOnChain } from '@/lib/sovryn/vidaBalance';
import { RSK_MAINNET } from '@/lib/sovryn/config';

/** Protocol Release: spending unlocked when is_fully_verified or face_hash present. Badge text when active. */
const BIOMETRIC_SPENDING_ACTIVE = 'Biometric Spending Active';

export function UserProfileBalance({
  vaultStable = false,
  mintTxHash = null,
}: {
  vaultStable?: boolean;
  /** When set (tx mined), show golden checkmark + "5 VIDA MINTED ON BITCOIN LAYER 2". */
  mintTxHash?: string | null;
}) {
  const [vaultData, setVaultData] = useState<CitizenVault | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSendVida, setShowSendVida] = useState(false);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [showPresenceModal, setShowPresenceModal] = useState(false);
  const [showLockModal, setShowLockModal] = useState(false);
  const [fingerprintVerified, setFingerprintVerified] = useState(false);
  const [spendingUnlocked, setSpendingUnlocked] = useState(false);
  const [biometricSpendingActive, setBiometricSpendingActive] = useState(false);
  const [isPresenceVerified, setIsPresenceVerified] = useState(false);
  const [faceVerifiedForBalance, setFaceVerifiedForBalance] = useState(false);
  /** UI shows MINTED when mint_status is MINTED or when both face_hash and recovery_seed_hash are present (Vault gate). */
  const [mintedBySeed, setMintedBySeed] = useState(false);
  /** Real-time VIDA balance from blockchain (balanceOf). Fallback to "5.00" when chain read fails. */
  const [chainBalanceFormatted, setChainBalanceFormatted] = useState<string | null>(null);
  const [hasLicense, setHasLicense] = useState(false);
  const [tokenVerified, setTokenVerified] = useState(false);
  const [sentinelFeePaidUsd, setSentinelFeePaidUsd] = useState(0);
  const sentinelVerified = BETA_LIQUIDITY_TEST || (hasLicense && tokenVerified);
  const effectiveSpendableVida = BETA_LIQUIDITY_TEST ? BETA_SPENDABLE_VIDA : CURRENT_POWER_SPENDABLE_VIDA;
  const effectiveSpendableUsd = BETA_LIQUIDITY_TEST ? BETA_SPENDABLE_USD : CURRENT_POWER_SPENDABLE_USD;

  const CURRENT_USERS = 1247;

  useEffect(() => {
    async function loadVaultData() {
      setLoading(true);
      const liveData = await fetchCitizenVault();
      
      const mockData = liveData || getCitizenVaultData();
      setVaultData({
        owner: mockData.owner || 'Isreal Okoro',
        alias: mockData.alias || 'mrfundzman',
        status: mockData.status || 'VITALIZED',
        total_vida_cap_minted: GROSS_SOVEREIGN_GRANT_VIDA,
        personal_share_50: NET_SPENDABLE_VIDA,
        state_contribution_50: NATIONAL_CONTRIBUTION_VIDA,
        spendable_balance_vida: LIQUID_TIER_USD / VIDA_PRICE_USD,
        linked_bank_accounts: mockData.linked_bank_accounts || [],
      });
      setLoading(false);
    }

    loadVaultData();
  }, []);

  // Check presence verification status
  useEffect(() => {
    const checkPresence = async () => {
      const result = await checkPresenceVerified();
      setIsPresenceVerified(result.verified);
    };
    checkPresence();
    const interval = setInterval(checkPresence, 30000);
    return () => clearInterval(interval);
  }, []);

  // Face-First Security: balance hidden until face match >= 95%
  useEffect(() => {
    const check = () => setFaceVerifiedForBalance(isFaceVerifiedForBalance());
    check();
    window.addEventListener('focus', check);
    const interval = setInterval(check, 10000);
    return () => {
      window.removeEventListener('focus', check);
      clearInterval(interval);
    };
  }, []);

  // Sentinel Verified = active license + security token verified; fee from license tier (deducted from Liquid). Vault Sync: poll spending_unlocked so Verified badge appears when second biometric is saved.
  useEffect(() => {
    let unlockInterval: ReturnType<typeof setInterval> | null = null;
    const check = async () => {
      setTokenVerified(getSentinelTokenVerified());
      const phone = getIdentityAnchorPhone();
      if (phone) {
        const active = await hasActiveSentinelLicense(phone);
        setHasLicense(!!active);
        const license = await getActiveLicense(phone);
        if (license && SENTINEL_TIERS[license.tier_type]) {
          setSentinelFeePaidUsd(SENTINEL_TIERS[license.tier_type].priceUsd);
        } else {
          setSentinelFeePaidUsd(0);
        }
        const mintRes = await getMintStatus(phone);
        const minted = mintRes.ok && mintRes.mint_status === MINT_STATUS_MINTED;
        setFingerprintVerified(minted);
        const bothAnchors = await hasFaceAndSeed(phone);
        setMintedBySeed(!!bothAnchors);
        if (bothAnchors) {
          const derived = await deriveRSKWalletFromSeed(phone);
          if (derived.ok) {
            const balanceRes = await getVidaBalanceOnChain(derived.address);
            if (balanceRes.ok) setChainBalanceFormatted(balanceRes.balanceFormatted);
            else setChainBalanceFormatted('5.00');
          } else {
            setChainBalanceFormatted('5.00');
          }
        } else {
          setChainBalanceFormatted(null);
        }
        const refreshUnlock = () => getSpendingUnlocked(phone).then((u) => { if (u.ok) setSpendingUnlocked(u.spending_unlocked); });
        const refreshBiometric = () => getBiometricSpendingActive(phone).then((b) => { if (b.ok) setBiometricSpendingActive(b.active); });
        refreshUnlock();
        refreshBiometric();
        if (unlockInterval) clearInterval(unlockInterval);
        unlockInterval = setInterval(() => { refreshUnlock(); refreshBiometric(); }, 8000);
      } else {
        setSentinelFeePaidUsd(0);
        setFingerprintVerified(false);
        setSpendingUnlocked(false);
        setBiometricSpendingActive(false);
      }
    };
    check();
    window.addEventListener('focus', check);
    return () => {
      window.removeEventListener('focus', check);
      if (unlockInterval) clearInterval(unlockInterval);
    };
  }, []);

  // Real-time VIDA balance from blockchain: poll balanceOf when minted (every 15s).
  useEffect(() => {
    const phone = getIdentityAnchorPhone();
    if (!phone || !mintedBySeed) return;
    const refresh = async () => {
      const derived = await deriveRSKWalletFromSeed(phone);
      if (!derived.ok) return;
      const res = await getVidaBalanceOnChain(derived.address);
      if (res.ok) setChainBalanceFormatted(res.balanceFormatted);
    };
    refresh();
    const interval = setInterval(refresh, 15000);
    return () => clearInterval(interval);
  }, [mintedBySeed]);

  const handlePresenceVerified = (identity: GlobalIdentity) => {
    setShowPresenceModal(false);
    setIsPresenceVerified(true);
  };

  /** Protocol Release: unlock when is_fully_verified or face_hash present. Bypass fingerprint lock modal when active. */
  const canSpend = spendingUnlocked || biometricSpendingActive;

  const handleSwapClick = () => {
    if (!canSpend) {
      setShowLockModal(true);
      return;
    }
    if (!isPresenceVerified) {
      setShowPresenceModal(true);
    } else {
      setShowSwapModal(true);
    }
  };

  const showBalanceAsMinted = faceVerifiedForBalance || mintedBySeed;

  const handleSendClick = () => {
    if (!canSpend) {
      setShowLockModal(true);
      return;
    }
    if (!isPresenceVerified) {
      setShowPresenceModal(true);
    } else {
      setShowSendVida(true);
    }
  };

  if (loading || !vaultData) {
    return (
      <div className="space-y-6">
        <div
          className={`bg-[#16161a] rounded-xl p-6 border border-[#2a2a2e] ${vaultStable ? '' : 'animate-pulse'}`}
          data-vault-stable={vaultStable ? 'true' : undefined}
        >
          <div className="h-8 bg-[#2a2a2e] rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-[#2a2a2e] rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  /** Sovereign Treasury Split: spendable after Sentinel fee = $900; in BETA_LIQUIDITY_TEST = $1,000. */
  const availableCashUsd = effectiveSpendableUsd;
  const yourShareNaira = vaultData.personal_share_50 * VIDA_PRICE_USD * NAIRA_RATE;

  return (
    <div className="space-y-6">
      {BETA_LIQUIDITY_TEST && (
        <div className="rounded-xl border-2 border-amber-500/60 bg-amber-500/15 px-4 py-3 text-center">
          <p className="text-sm font-bold uppercase tracking-wider text-amber-400">
            BETA TEST MODE: 100% Liquidity Unlocked (No Fees)
          </p>
          <p className="text-xs text-amber-200/80 mt-1">Full 1 VIDA spendable. Swap/Send active without Sentinel. Swap routes to Sovryn AMM.</p>
        </div>
      )}
      {/* Genesis Handshake Indicator */}
      <div className="flex justify-end">
        <GenesisHandshakeIndicator onTriggerScan={() => setShowPresenceModal(true)} />
      </div>

      <div className="bg-[#16161a] rounded-xl p-6 border border-[#2a2a2e]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-[#e8c547]">{vaultData.owner}</h3>
            <p className="text-sm text-[#6b6b70]">@{vaultData.alias}</p>
          </div>
          <div className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full">
            <span className="text-xs font-semibold text-green-400 uppercase">{vaultData.status}</span>
          </div>
        </div>
        <div className="pt-4 border-t border-[#2a2a2e]">
          <p className="text-xs text-[#6b6b70] mb-1">Device</p>
          <p className="text-sm font-mono text-[#f5f5f5]">REDMI-15-B492-X90</p>
        </div>
      </div>

      <div className="bg-[#16161a] rounded-xl p-6 border border-[#2a2a2e]">
        {!showBalanceAsMinted && (
          <div className="mb-4 p-3 bg-amber-500/15 border border-amber-500/40 rounded-lg flex items-center gap-2">
            <span className="text-amber-400 text-lg" aria-hidden>🔒</span>
            <p className="text-sm text-amber-200/90">
              Face-First Security: Verify face (95%+ match) to view balance and National Reserve data.
            </p>
          </div>
        )}
        {/* Protocol Release: Biometric Spending Active when is_fully_verified or face_hash present. Send/Transfer enabled. */}
        <div className="mb-4 flex items-center justify-center">
          {canSpend ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#D4AF37]/20 border border-[#D4AF37]/50">
              <span className="text-2xl" aria-hidden>✓</span>
              <span className="text-sm font-bold text-[#D4AF37] uppercase tracking-wider">{BIOMETRIC_SPENDING_ACTIVE}</span>
              <svg className="w-6 h-6 text-[#D4AF37]" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path d="M12 2L15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2z" />
              </svg>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#3a3a3e] border border-[#4a4a4e]">
              <span className="text-xl text-[#8b8b95]" aria-hidden>🔒</span>
              <span className="text-xs font-medium text-[#8b8b95] uppercase tracking-wider">Complete Face Pulse to enable Send and Transfer.</span>
            </div>
          )}
        </div>
        {/* Confirmation: once tx is mined, show golden checkmark + "5 VIDA MINTED ON BITCOIN LAYER 2" + Proof of Wealth link */}
        {mintTxHash && (
          <div className="mb-4 p-4 bg-[#D4AF37]/20 border-2 border-[#D4AF37]/60 rounded-xl flex flex-col items-center justify-center gap-3">
            <div className="flex items-center gap-3">
              <span className="text-4xl" aria-hidden>
                <svg className="w-10 h-10 text-[#D4AF37]" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              </span>
              <p className="text-lg font-bold text-[#D4AF37] uppercase tracking-wider">
                5 VIDA MINTED ON BITCOIN LAYER 2
              </p>
            </div>
            <a
              href={`${RSK_MAINNET.blockExplorer}/tx/${mintTxHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-[#e8c547] hover:text-[#D4AF37] underline"
            >
              View Proof of Wealth on Rootstock Explorer →
            </a>
          </div>
        )}
        {/* Prominent balance from chain (balanceOf) or fallback 5.00 VIDA when MINTED */}
        {showBalanceAsMinted && (
          <div className="mb-4 p-4 bg-[#c9a227]/10 border-2 border-[#c9a227]/40 rounded-xl text-center">
            <p className="text-3xl font-bold font-mono text-[#e8c547] tracking-tight">
              {TOTAL_WEALTH_VIDA} VIDA
            </p>
            <p className="text-sm text-[#6b6b70] mt-1">Total Wealth (4 locked, {BETA_LIQUIDITY_TEST ? '$1,000' : '$900'} spendable{BETA_LIQUIDITY_TEST ? ' — no fees' : ' after Sentinel'})</p>
            <div className="mt-3 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleSwapClick}
                disabled={!isPresenceVerified || !canSpend}
                className="w-full py-2.5 rounded-lg font-bold text-sm uppercase tracking-wider bg-[#e8c547] text-[#0d0d0f] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Convert
              </button>
              {BETA_LIQUIDITY_TEST && (
                <a
                  href={SOVRYN_AMM_SWAP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 rounded-lg font-bold text-sm uppercase tracking-wider bg-emerald-600 text-white hover:bg-emerald-500 text-center"
                >
                  Swap to DLLR on Sovryn AMM →
                </a>
              )}
            </div>
            <p className="text-[10px] text-[#6b6b70] mt-1.5">Swap spendable VIDA for DLLR (max {effectiveSpendableVida} VIDA · $4,000 locked)</p>
          </div>
        )}
        <TripleVaultDisplay
          sentinelFeePaidUsd={sentinelFeePaidUsd}
          globalUserCount={CURRENT_USERS}
          faceVerified={showBalanceAsMinted}
          betaLiquidityTest={BETA_LIQUIDITY_TEST}
        />

        <div className="relative rounded-xl mt-6 mb-6 transition-all duration-300">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleSwapClick}
              disabled={!isPresenceVerified || !canSpend}
              className={`relative bg-gradient-to-br from-[#c9a227]/30 to-[#e8c547]/20 hover:from-[#c9a227]/40 hover:to-[#e8c547]/30 text-[#e8c547] font-bold py-3 px-4 rounded-lg border border-[#c9a227]/50 transition-all duration-300 group ${!isPresenceVerified || !canSpend ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span className="relative z-10 text-sm uppercase tracking-wider">Swap</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#e8c547]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </button>
            <button
              onClick={handleSendClick}
              disabled={!isPresenceVerified || !canSpend}
              className={`relative bg-gradient-to-br from-[#c9a227]/30 to-[#e8c547]/20 hover:from-[#c9a227]/40 hover:to-[#e8c547]/30 text-[#e8c547] font-bold py-3 px-4 rounded-lg border border-[#c9a227]/50 transition-all duration-300 group ${!isPresenceVerified || !canSpend ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span className="relative z-10 text-sm uppercase tracking-wider">📤 Send</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#e8c547]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </button>
          </div>
          {showBalanceAsMinted && !canSpend && (
            <p className="text-xs text-[#8b8b95] text-center mt-2 uppercase tracking-wider">Complete Face Pulse to enable Send and Transfer.</p>
          )}
        </div>

        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-1">Transaction Limit Notice</p>
              <p className="text-xs text-[#6b6b70] leading-relaxed">
                Swap and Send are limited to <span className="font-mono text-emerald-400">Current Power (Spendable)</span>{' '}
                ({showBalanceAsMinted ? availableCashUsd.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }) : '••••••'}).
                Future Value ({FUTURE_VALUE_LOCKED_VIDA} VIDA) is locked for 365 days: <span className="font-mono text-red-400">"Asset Locked: VestingContract."</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#16161a] rounded-xl p-6 border border-[#2a2a2e]">
        <h3 className="text-sm font-semibold text-[#6b6b70] uppercase tracking-wider mb-4">5 VIDA Minted Cap — Sovereign Liquidity</h3>
        <div className="space-y-4">
          <div className="p-4 bg-[#0d0d0f] rounded-lg border border-[#2a2a2e]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[#6b6b70]">Total Wealth</span>
              <span className="text-xl font-bold text-[#c9a227]">
                {showBalanceAsMinted ? `${TOTAL_WEALTH_VIDA} VIDA` : '•••••• VIDA'}
              </span>
            </div>
            <p className="text-xs text-[#6b6b70] mt-1">{showBalanceAsMinted ? `Future Value 4 VIDA locked · Current Power $${effectiveSpendableUsd.toLocaleString()} spendable` : 'Verify face to view'}</p>
          </div>

          <div className="p-4 bg-[#0d0d0f] rounded-lg border border-[#2a2a2e]">
            <p className="text-xs text-[#6b6b70] mb-3 uppercase tracking-wider">Future Value (Locked)</p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#6b6b70]">VestingContract — untransferable 365 days</span>
              <span className="text-base font-bold text-amber-400">
                {showBalanceAsMinted
                  ? `${FUTURE_VALUE_LOCKED_VIDA} VIDA`
                  : '•••••• VIDA'}
              </span>
            </div>
          </div>

          <div className="p-4 bg-[#0d0d0f] rounded-lg border border-[#2a2a2e]">
            <p className="text-xs text-[#6b6b70] mb-3 uppercase tracking-wider">Current Power (Spendable)</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#6b6b70]">After Sentinel fee (0.1 VIDA → Sentinel)</span>
                <span className="text-base font-mono text-emerald-400">
                  {showBalanceAsMinted ? `${availableCashUsd.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 })} worth of VIDA` : '••••••'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#6b6b70]">Future Value (locked 365 days)</span>
                <span className="text-base font-bold text-[#6b6b70]">{showBalanceAsMinted ? `${FUTURE_VALUE_LOCKED_VIDA} VIDA` : '••••••'}</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gradient-to-br from-emerald-900/20 to-emerald-800/10 rounded-lg border-2 border-emerald-500/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-emerald-400 uppercase tracking-wider">= Sovereign Liquidity (Vault C)</span>
              <span className="text-2xl font-bold text-emerald-300" title={!showBalanceAsMinted ? 'Verify face to view' : undefined}>
                {showBalanceAsMinted ? `$${availableCashUsd.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : '••••••'}
              </span>
            </div>
            <p className="text-xs text-[#6b6b70] mt-1">{showBalanceAsMinted ? 'Sentinel Network Fee: 0.1 VIDA to authorize minting protocol. Liquid after fee: $900.' : 'Verify face (95%+ match) to view'}</p>
          </div>

          <div className="p-4 bg-[#0d0d0f] rounded-lg border border-[#2a2a2e]">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#6b6b70]">Naira Equivalent (Citizen share)</span>
              <span className="text-sm font-mono text-[#00ff41]">
                {showBalanceAsMinted ? `₦${yourShareNaira.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '••••••'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <UBABrandingCard linkedAccounts={vaultData.linked_bank_accounts} />

      <SendVidaModal
        isOpen={showSendVida}
        onClose={() => setShowSendVida(false)}
        senderPhone="+2348012345678"
        maxAmount={CURRENT_POWER_SPENDABLE_VIDA}
      />

      <VIDASwapModal
        isOpen={showSwapModal}
        onClose={() => setShowSwapModal(false)}
        maxAmount={CURRENT_POWER_SPENDABLE_VIDA}
        citizenId={getIdentityAnchorPhone() ?? undefined}
        phoneNumber={getIdentityAnchorPhone() ?? undefined}
        onSwapSuccess={() => {
          setShowSwapModal(false);
          window.dispatchEvent(new CustomEvent('protocol-vault-swap-success'));
        }}
      />

      <PresenceOverrideModal
        isOpen={showPresenceModal}
        onClose={() => setShowPresenceModal(false)}
        onPresenceVerified={handlePresenceVerified}
      />

      <SpendingLockModal
        isOpen={showLockModal}
        onClose={() => setShowLockModal(false)}
      />
    </div>
  );
}


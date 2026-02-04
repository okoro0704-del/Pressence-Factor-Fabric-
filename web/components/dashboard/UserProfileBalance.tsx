'use client';

import { useState, useEffect } from 'react';
import { fetchCitizenVault, type CitizenVault } from '@/lib/supabaseTelemetry';
import { getCitizenVaultData } from '@/lib/mockDataService';
import { SendVidaModal } from './SendVidaModal';
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
import { isFaceVerifiedForBalance } from '@/lib/biometricAuth';

export function UserProfileBalance() {
  const [vaultData, setVaultData] = useState<CitizenVault | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSendVida, setShowSendVida] = useState(false);
  const [showPresenceModal, setShowPresenceModal] = useState(false);
  const [isPresenceVerified, setIsPresenceVerified] = useState(false);
  const [faceVerifiedForBalance, setFaceVerifiedForBalance] = useState(false);
  const [hasLicense, setHasLicense] = useState(false);
  const [tokenVerified, setTokenVerified] = useState(false);
  const [sentinelFeePaidUsd, setSentinelFeePaidUsd] = useState(0);
  const sentinelVerified = hasLicense && tokenVerified;

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

  // Sentinel Verified = active license + security token verified; fee from license tier (deducted from Liquid)
  useEffect(() => {
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
      } else {
        setSentinelFeePaidUsd(0);
      }
    };
    check();
    window.addEventListener('focus', check);
    return () => window.removeEventListener('focus', check);
  }, []);

  const handlePresenceVerified = (identity: GlobalIdentity) => {
    setShowPresenceModal(false);
    setIsPresenceVerified(true);
  };

  const handleSwapClick = () => {
    if (!sentinelVerified) return;
    if (!isPresenceVerified) {
      setShowPresenceModal(true);
    } else {
      console.log('Swap clicked');
    }
  };

  const handleSendClick = () => {
    if (!sentinelVerified) return;
    if (!isPresenceVerified) {
      setShowPresenceModal(true);
    } else {
      setShowSendVida(true);
    }
  };

  if (loading || !vaultData) {
    return (
      <div className="space-y-6">
        <div className="bg-[#16161a] rounded-xl p-6 border border-[#2a2a2e] animate-pulse">
          <div className="h-8 bg-[#2a2a2e] rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-[#2a2a2e] rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  const availableCashUsd = Math.max(0, LIQUID_TIER_USD - sentinelFeePaidUsd);
  const yourShareNaira = vaultData.personal_share_50 * VIDA_PRICE_USD * NAIRA_RATE;

  return (
    <div className="space-y-6">
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
        {!faceVerifiedForBalance && (
          <div className="mb-4 p-3 bg-amber-500/15 border border-amber-500/40 rounded-lg flex items-center gap-2">
            <span className="text-amber-400 text-lg" aria-hidden>🔒</span>
            <p className="text-sm text-amber-200/90">
              Face-First Security: Verify face (95%+ match) to view balance and National Reserve data.
            </p>
          </div>
        )}
        <TripleVaultDisplay
          sentinelFeePaidUsd={sentinelFeePaidUsd}
          globalUserCount={CURRENT_USERS}
          faceVerified={faceVerifiedForBalance}
        />

        <div className={`relative rounded-xl mt-6 mb-6 transition-all duration-300 ${!sentinelVerified ? 'select-none' : ''}`}>
          <SentinelActivationOverlay
            show={!sentinelVerified}
            subtitle="Activate your Sentinel at the Sentinel Vault to enable Swap and Send."
            onVerified={() => setTokenVerified(true)}
          />
          <div className={`grid grid-cols-2 gap-3 ${!sentinelVerified ? 'pointer-events-none blur-[2px]' : ''}`}>
            <button
              onClick={handleSwapClick}
              disabled={!isPresenceVerified || !sentinelVerified}
              className={`relative bg-gradient-to-br from-[#c9a227]/30 to-[#e8c547]/20 hover:from-[#c9a227]/40 hover:to-[#e8c547]/30 text-[#e8c547] font-bold py-3 px-4 rounded-lg border border-[#c9a227]/50 transition-all duration-300 group ${!isPresenceVerified || !sentinelVerified ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span className="relative z-10 text-sm uppercase tracking-wider">Swap</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#e8c547]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </button>
            <button
              onClick={handleSendClick}
              disabled={!isPresenceVerified || !sentinelVerified}
              className={`relative bg-gradient-to-br from-[#c9a227]/30 to-[#e8c547]/20 hover:from-[#c9a227]/40 hover:to-[#e8c547]/30 text-[#e8c547] font-bold py-3 px-4 rounded-lg border border-[#c9a227]/50 transition-all duration-300 group ${!isPresenceVerified || !sentinelVerified ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span className="relative z-10 text-sm uppercase tracking-wider">📤 Send</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#e8c547]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </button>
          </div>
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
                Swap and Send are limited to <span className="font-mono text-emerald-400">Vault C — Sovereign Liquidity</span>{' '}
                ({faceVerifiedForBalance ? availableCashUsd.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }) : '••••••'}).
                Vault B (Future Wealth) unlocks at 1B users: <span className="font-mono text-red-400">"Asset Locked: Requires 1B User Milestone for Release."</span>
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
              <span className="text-sm text-[#6b6b70]">Active Minting Cap (5 VIDA · $5,000)</span>
              <span className="text-xl font-bold text-[#c9a227]">
                {faceVerifiedForBalance
                  ? `${GROSS_SOVEREIGN_GRANT_VIDA.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} VIDA · $5,000`
                  : '•••••• VIDA · ••••••'}
              </span>
            </div>
            <p className="text-xs text-[#6b6b70] mt-1">{faceVerifiedForBalance ? '5 VIDA cap minted upon vitalization' : 'Verify face to view'}</p>
          </div>

          <div className="p-4 bg-[#0d0d0f] rounded-lg border border-[#2a2a2e]">
            <p className="text-xs text-[#6b6b70] mb-3 uppercase tracking-wider">National Reserve</p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#6b6b70]">Contribution to the Nation (not spendable)</span>
              <span className="text-base font-bold text-amber-400">
                {faceVerifiedForBalance
                  ? `${NATIONAL_CONTRIBUTION_VIDA.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} VIDA · $0`
                  : '•••••• VIDA · ••••••'}
              </span>
            </div>
          </div>

          <div className="p-4 bg-[#0d0d0f] rounded-lg border border-[#2a2a2e]">
            <p className="text-xs text-[#6b6b70] mb-3 uppercase tracking-wider">5 VIDA split — Sovereign Liquidity & Secured</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#6b6b70]">Liquid (after Sentinel Network Fee 0.1 VIDA)</span>
                <span className="text-base font-mono text-emerald-400">
                  {faceVerifiedForBalance ? `$1,000 − $${sentinelFeePaidUsd} = $${availableCashUsd.toLocaleString('en-US', { minimumFractionDigits: 0 })}` : '••••••'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#6b6b70]">Secured/National (until 1B users)</span>
                <span className="text-base font-bold text-[#6b6b70]">{faceVerifiedForBalance ? '$4,100' : '••••••'}</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gradient-to-br from-emerald-900/20 to-emerald-800/10 rounded-lg border-2 border-emerald-500/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-emerald-400 uppercase tracking-wider">= Sovereign Liquidity (Vault C)</span>
              <span className="text-2xl font-bold text-emerald-300" title={!faceVerifiedForBalance ? 'Verify face to view' : undefined}>
                {faceVerifiedForBalance ? `$${availableCashUsd.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : '••••••'}
              </span>
            </div>
            <p className="text-xs text-[#6b6b70] mt-1">{faceVerifiedForBalance ? 'Sentinel Network Fee: 0.1 VIDA to authorize minting protocol. Liquid after fee: $900.' : 'Verify face (95%+ match) to view'}</p>
          </div>

          <div className="p-4 bg-[#0d0d0f] rounded-lg border border-[#2a2a2e]">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#6b6b70]">Naira Equivalent (Citizen share)</span>
              <span className="text-sm font-mono text-[#00ff41]">
                {faceVerifiedForBalance ? `₦${yourShareNaira.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '••••••'}
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
        maxAmount={1.0}
      />

      <PresenceOverrideModal
        isOpen={showPresenceModal}
        onClose={() => setShowPresenceModal(false)}
        onPresenceVerified={handlePresenceVerified}
      />
    </div>
  );
}


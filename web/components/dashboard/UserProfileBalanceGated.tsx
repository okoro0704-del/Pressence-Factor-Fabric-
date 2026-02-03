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

export function UserProfileBalance() {
  const [vaultData, setVaultData] = useState<CitizenVault | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSendVida, setShowSendVida] = useState(false);
  const [showPresenceModal, setShowPresenceModal] = useState(false);
  const [isPresenceVerified, setIsPresenceVerified] = useState(false);

  const TOTAL_MINTED_CAP = 10;
  const ARCHITECT_SHARE = 5;
  const STATE_SHARE = 5;
  const VIDA_PRICE_USD = 1000;
  const NAIRA_RATE = 1400;
  const SPENDABLE_PERCENT = 0.20;
  const LOCKED_PERCENT = 0.80;
  const MILESTONE_TARGET = 1000000000;
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
        total_vida_cap_minted: TOTAL_MINTED_CAP,
        personal_share_50: ARCHITECT_SHARE,
        state_contribution_50: STATE_SHARE,
        spendable_balance_vida: ARCHITECT_SHARE * SPENDABLE_PERCENT,
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
    
    // Recheck every 30 seconds
    const interval = setInterval(checkPresence, 30000);
    return () => clearInterval(interval);
  }, []);

  const handlePresenceVerified = (identity: GlobalIdentity) => {
    setShowPresenceModal(false);
    setIsPresenceVerified(true);
  };

  const handleSwapClick = () => {
    if (!isPresenceVerified) {
      setShowPresenceModal(true);
    } else {
      // TODO: Implement swap functionality
      console.log('Swap clicked');
    }
  };

  const handleSendClick = () => {
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

  const liquidVida = ARCHITECT_SHARE * SPENDABLE_PERCENT;
  const lockedVida = ARCHITECT_SHARE * LOCKED_PERCENT;
  const liquidUSD = liquidVida * VIDA_PRICE_USD;
  const liquidNaira = liquidVida * VIDA_PRICE_USD * NAIRA_RATE;
  const lockedUSD = lockedVida * VIDA_PRICE_USD;
  const lockedNaira = lockedVida * VIDA_PRICE_USD * NAIRA_RATE;
  const yourShareNaira = vaultData.personal_share_50 * VIDA_PRICE_USD * NAIRA_RATE;
  const progressPercent = (CURRENT_USERS / MILESTONE_TARGET) * 100;

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

      {/* Rest of component continues in next file... */}
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


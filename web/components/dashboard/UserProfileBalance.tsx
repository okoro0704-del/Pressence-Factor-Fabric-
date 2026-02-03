'use client';

import { useState, useEffect } from 'react';
import { fetchCitizenVault, type CitizenVault } from '@/lib/supabaseTelemetry';
import { getCitizenVaultData } from '@/lib/mockDataService';
import { SendVidaModal } from './SendVidaModal';
import { UBABrandingCard } from './UBABrandingCard';

export function UserProfileBalance() {
  const [vaultData, setVaultData] = useState<CitizenVault | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSendVida, setShowSendVida] = useState(false);

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
        <h3 className="text-sm font-semibold text-[#e8c547] uppercase tracking-wider mb-6 text-center">
          ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â THE ARCHITECT'S TRIAD VAULT SYSTEM ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="relative bg-gradient-to-br from-[#c9a227]/20 to-[#e8c547]/10 rounded-xl p-5 border-2 border-[#c9a227]/50 overflow-hidden group">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#e8c547]/20 rounded-full blur-3xl animate-pulse" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-[#e8c547] uppercase tracking-wider">Vault 1: Liquid</h4>
                <span className="text-xs font-mono text-green-400 bg-green-500/20 px-2 py-1 rounded">AVAILABLE NOW</span>
              </div>
              <div className="space-y-2">
                <p className="text-4xl font-bold font-mono text-[#e8c547] tracking-tight">
                  {liquidVida.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-sm font-semibold text-[#e8c547]">VIDA CAP</p>
                <div className="pt-3 border-t border-[#c9a227]/30 space-y-1">
                  <p className="text-xs text-[#6b6b70]">
                    USD: <span className="font-mono text-[#f5f5f5]">${liquidUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </p>
                  <p className="text-xs text-[#6b6b70]">
                    Naira: <span className="font-mono text-[#00ff41]">ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦{liquidNaira.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </p>
                </div>
                <p className="text-[10px] text-[#6b6b70] mt-3 uppercase tracking-wide">ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â½ 20% Spendable Reserve</p>
              </div>
            </div>
          </div>

          <div className="relative bg-gradient-to-br from-red-500/10 to-red-600/5 rounded-xl p-5 border-2 border-red-500/30 overflow-hidden group">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-500/10 rounded-full blur-3xl" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider">Vault 2: Sovereign Lock</h4>
                <span className="text-xs font-mono text-red-400 bg-red-500/20 px-2 py-1 rounded animate-pulse">ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ LOCKED</span>
              </div>
              <div className="space-y-2">
                <p className="text-4xl font-bold font-mono text-red-400 tracking-tight">
                  {lockedVida.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-sm font-semibold text-red-400">VIDA CAP</p>
                <div className="pt-3 border-t border-red-500/30 space-y-1">
                  <p className="text-xs text-[#6b6b70]">
                    USD: <span className="font-mono text-[#f5f5f5]">${lockedUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </p>
                  <p className="text-xs text-[#6b6b70]">
                    Naira: <span className="font-mono text-[#00ff41]">ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦{lockedNaira.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </p>
                </div>
                <p className="text-[10px] text-[#6b6b70] mt-3 uppercase tracking-wide">ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂºÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â 80% Sovereign Guarantee</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#0d0d0f] rounded-xl p-5 border border-[#2a2a2e] mb-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-[#e8c547] uppercase tracking-wider">Progress to Global Release</h4>
            <span className="text-xs font-mono text-[#6b6b70]">{CURRENT_USERS.toLocaleString()} / 1B Users</span>
          </div>
          <div className="relative w-full h-6 bg-[#16161a] rounded-full overflow-hidden border border-[#2a2a2e]">
            <div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#c9a227] to-[#e8c547] rounded-full transition-all duration-1000"
              style={{ width: `${Math.max(progressPercent, 0.5)}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[10px] font-bold text-[#f5f5f5] drop-shadow-lg">
                {progressPercent.toFixed(6)}%
              </span>
            </div>
          </div>
          <p className="text-[10px] text-[#6b6b70] mt-2 text-center uppercase tracking-wide">
            ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Locked Vault Releases at 1 Billion PFF Users
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <button className="relative bg-gradient-to-br from-[#c9a227]/30 to-[#e8c547]/20 hover:from-[#c9a227]/40 hover:to-[#e8c547]/30 text-[#e8c547] font-bold py-3 px-4 rounded-lg border border-[#c9a227]/50 transition-all duration-300 group">
            <span className="relative z-10 text-sm uppercase tracking-wider">ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â± Swap</span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#e8c547]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </button>
          <button onClick={() => setShowSendVida(true)} className="relative bg-gradient-to-br from-[#c9a227]/30 to-[#e8c547]/20 hover:from-[#c9a227]/40 hover:to-[#e8c547]/30 text-[#e8c547] font-bold py-3 px-4 rounded-lg border border-[#c9a227]/50 transition-all duration-300 group">
            <span className="relative z-10 text-sm uppercase tracking-wider">📤 Send</span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#e8c547]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </button>
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
                Swap and Send operations are limited to <span className="font-mono text-[#e8c547]">1.00 VIDA CAP</span> (Vault 1: Liquid). 
                Attempting to move more will trigger: <span className="font-mono text-red-400">"Asset Locked: Requires 1B User Milestone for Release."</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#16161a] rounded-xl p-6 border border-[#2a2a2e]">
        <h3 className="text-sm font-semibold text-[#6b6b70] uppercase tracking-wider mb-4">Vault Summary</h3>
        <div className="space-y-4">
          <div className="p-4 bg-[#0d0d0f] rounded-lg border border-[#2a2a2e]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[#6b6b70]">Total VIDA CAP Minted</span>
            </div>
            <p className="text-2xl font-bold text-[#c9a227]">
              {TOTAL_MINTED_CAP.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-[#6b6b70] mt-1">10 VIDA CAP Total Supply</p>
          </div>

          <div className="p-4 bg-[#0d0d0f] rounded-lg border border-[#2a2a2e]">
            <p className="text-xs text-[#6b6b70] mb-3 uppercase tracking-wider">50/50 Split</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#6b6b70]">Your Share (50%)</span>
                <span className="text-base font-bold text-[#e8c547]">
                  {vaultData.personal_share_50.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} VIDA CAP
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#6b6b70]">Naira Equivalent</span>
                <span className="text-sm font-mono text-[#00ff41]">
                  ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦{yourShareNaira.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-[#2a2a2e]">
                <span className="text-sm text-[#6b6b70]">State Contribution (50%)</span>
                <span className="text-base font-bold text-[#6b6b70]">
                  {vaultData.state_contribution_50.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} VIDA CAP
                </span>
              </div>
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
    </div>
  );
}


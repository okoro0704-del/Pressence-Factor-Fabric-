'use client';

import { useState, useEffect } from 'react';
import { fetchCitizenVault, type CitizenVault } from '@/lib/supabaseTelemetry';
import { getCitizenVaultData } from '@/lib/mockDataService';

export function UserProfileBalance() {
  const [vaultData, setVaultData] = useState<CitizenVault | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadVaultData() {
      setLoading(true);
      const liveData = await fetchCitizenVault();
      
      if (liveData) {
        setVaultData(liveData);
      } else {
        const mockData = getCitizenVaultData();
        setVaultData({
          owner: mockData.owner,
          alias: mockData.alias,
          status: mockData.status,
          total_vida_cap_minted: mockData.total_vida_cap_minted,
          personal_share_50: mockData.split_records.personal_share_50,
          state_contribution_50: mockData.split_records.state_contribution_50,
          spendable_balance_vida: mockData.spendable_balance_vida,
          linked_bank_accounts: mockData.linked_bank_accounts,
        });
      }
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
        <h3 className="text-sm font-semibold text-[#6b6b70] uppercase tracking-wider mb-4">Your Balance</h3>
        <div className="mb-6 p-4 bg-gradient-to-br from-[#c9a227]/20 to-[#e8c547]/10 rounded-lg border border-[#c9a227]/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[#6b6b70]">Spendable Balance</span>
            <span className="text-xs text-[#6b6b70]">$VIDA</span>
          </div>
          <p className="text-4xl font-bold text-[#e8c547] mb-1">
            {vaultData.spendable_balance_vida.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-[#6b6b70]">Available for transactions</p>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-[#0d0d0f] rounded-lg border border-[#2a2a2e]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[#6b6b70]">Total VIDA CAP Minted</span>
            </div>
            <p className="text-2xl font-bold text-[#c9a227]">
              {vaultData.total_vida_cap_minted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
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

      {vaultData.linked_bank_accounts.length > 0 && (
        <div className="bg-[#16161a] rounded-xl p-6 border border-[#2a2a2e]">
          <h3 className="text-sm font-semibold text-[#6b6b70] uppercase tracking-wider mb-4">Linked Accounts</h3>
          <div className="space-y-2">
            {vaultData.linked_bank_accounts.map((account, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-[#0d0d0f] rounded-lg border border-[#2a2a2e]">
                <span className="text-sm text-[#f5f5f5]">{account}</span>
                <span className="text-xs text-green-400">✓ Verified</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

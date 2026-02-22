'use client';

import { useState } from 'react';
import type { BankAccount } from '@/lib/pffAggregation';
import { NIGERIAN_LEGACY_BANKS } from '@/lib/pffAggregation';
import { LinkExternalBankModal } from './LinkExternalBankModal';

interface LegacyAccountsListProps {
  accounts: BankAccount[];
  phoneNumber: string;
  onAccountsUpdated?: () => void;
}

/**
 * LEGACY ACCOUNTS LIST - TERTIARY DISPLAY
 * Shows linked external bank accounts (GTB, Zenith, Access, etc.)
 */
export function LegacyAccountsList({ accounts, phoneNumber, onAccountsUpdated }: LegacyAccountsListProps) {
  const [showLinkModal, setShowLinkModal] = useState(false);

  const getBankColor = (bankCode: string) => {
    const bank = NIGERIAN_LEGACY_BANKS.find(b => b.code === bankCode);
    return bank?.color || '#6b6b70';
  };

  return (
    <div className="space-y-4">
      {/* Header with Link Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-black text-[#a0a0a5] uppercase tracking-wider">Legacy Bank Accounts</h3>
          <p className="text-xs text-[#6b6b70] mt-1">External institutions bridged to your PFF profile</p>
        </div>
        <button
          onClick={() => setShowLinkModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-[#c9a227] to-[#e8c547] hover:from-[#e8c547] hover:to-[#c9a227] text-black font-bold text-sm rounded-lg transition-all duration-300 shadow-lg"
        >
          + Link External Institution
        </button>
      </div>

      {/* Accounts Grid */}
      {accounts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="relative bg-[#16161a] rounded-xl p-6 border-2 border-[#2a2a2e] hover:border-[#3a3a3e] transition-all duration-300 group"
            >
              {/* Bank Color Accent */}
              <div
                className="absolute top-0 left-0 w-1 h-full rounded-l-xl"
                style={{ backgroundColor: getBankColor(account.bank_code) }}
              />

              <div className="space-y-4">
                {/* Bank Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                      style={{ backgroundColor: getBankColor(account.bank_code) }}
                    >
                      {account.bank_code}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#f5f5f5]">{account.bank_name}</p>
                      <p className="text-xs text-[#6b6b70]">{account.account_name}</p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className={`px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                    account.status === 'ACTIVE'
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : account.status === 'PENDING'
                      ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {account.status}
                  </div>
                </div>

                {/* Account Number */}
                <div className="bg-[#0d0d0f] rounded-lg p-3 border border-[#2a2a2e]">
                  <p className="text-xs text-[#6b6b70] mb-1">Account Number</p>
                  <p className="text-lg font-mono font-bold text-[#f5f5f5]">{account.account_number}</p>
                </div>

                {/* Balance */}
                <div>
                  <p className="text-xs text-[#6b6b70] mb-1">Available Balance</p>
                  <p className="text-2xl font-bold font-mono text-[#f5f5f5]">
                    ₦{account.balance_naira.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t border-[#2a2a2e]">
                  <button className="flex-1 px-3 py-2 bg-[#2a2a2e] hover:bg-[#3a3a3e] text-[#f5f5f5] text-xs font-semibold rounded-lg transition-colors">
                    View Details
                  </button>
                  <button className="flex-1 px-3 py-2 bg-[#2a2a2e] hover:bg-[#3a3a3e] text-[#f5f5f5] text-xs font-semibold rounded-lg transition-colors">
                    Transfer
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-[#16161a] rounded-xl p-12 border-2 border-dashed border-[#2a2a2e] text-center">
          <span className="text-6xl mb-4 block">🏦</span>
          <h4 className="text-lg font-bold text-[#6b6b70] mb-2">No Legacy Accounts Linked</h4>
          <p className="text-sm text-[#6b6b70] mb-6 max-w-md mx-auto">
            Link your existing bank accounts from GTB, Zenith, Access, and other Nigerian banks to see your complete financial picture.
          </p>
          <button
            onClick={() => setShowLinkModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-[#c9a227] to-[#e8c547] hover:from-[#e8c547] hover:to-[#c9a227] text-black font-bold rounded-lg transition-all duration-300 shadow-lg"
          >
            + Link Your First Account
          </button>
        </div>
      )}

      {/* Link Modal */}
      <LinkExternalBankModal
        isOpen={showLinkModal}
        onClose={() => setShowLinkModal(false)}
        phoneNumber={phoneNumber}
        onAccountLinked={onAccountsUpdated}
      />
    </div>
  );
}


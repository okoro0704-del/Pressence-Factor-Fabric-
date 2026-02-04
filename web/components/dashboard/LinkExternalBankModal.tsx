'use client';

import { useState } from 'react';
import { NIGERIAN_LEGACY_BANKS, linkLegacyBankAccount } from '@/lib/pffAggregation';

interface LinkExternalBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  phoneNumber: string;
  onAccountLinked?: () => void;
}

/**
 * LINK EXTERNAL INSTITUTION MODAL
 * Allows users to bridge legacy bank accounts to their PFF profile
 */
export function LinkExternalBankModal({ isOpen, onClose, phoneNumber, onAccountLinked }: LinkExternalBankModalProps) {
  const [selectedBank, setSelectedBank] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleLink = async () => {
    if (!selectedBank || !accountNumber || !accountName) {
      setError('Please fill in all fields');
      return;
    }

    setIsLinking(true);
    setError('');

    try {
      const result = await linkLegacyBankAccount(phoneNumber, selectedBank, accountNumber, accountName);
      
      if (result) {
        onAccountLinked?.();
        onClose();
        // Reset form
        setSelectedBank('');
        setAccountNumber('');
        setAccountName('');
      } else {
        setError('Failed to link account. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-gradient-to-br from-[#1a1a1e] via-[#16161a] to-[#1a1a1e] rounded-2xl border-2 border-[#2a2a2e] shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-[#16161a] to-[#1a1a1e] p-6 border-b border-[#2a2a2e] backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#e8c547] to-[#c9a227]">
                Link External Institution
              </h2>
              <p className="text-sm text-[#6b6b70] mt-1">Bridge your legacy bank account to PFF</p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-[#2a2a2e] hover:bg-[#3a3a3e] text-[#f5f5f5] flex items-center justify-center transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Bank Selection */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-[#e8c547] uppercase tracking-wider">Select Legacy Bank</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-64 overflow-y-auto p-2">
              {NIGERIAN_LEGACY_BANKS.map((bank) => (
                <button
                  key={bank.code}
                  onClick={() => setSelectedBank(bank.code)}
                  className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                    selectedBank === bank.code
                      ? 'border-[#e8c547] bg-[#e8c547]/10 shadow-lg shadow-[#e8c547]/20'
                      : 'border-[#2a2a2e] bg-[#0d0d0f] hover:border-[#3a3a3e]'
                  }`}
                >
                  <div className="text-center space-y-1">
                    <div
                      className="w-8 h-8 rounded-full mx-auto"
                      style={{ backgroundColor: bank.color }}
                    />
                    <p className="text-xs font-bold text-[#f5f5f5]">{bank.code}</p>
                    <p className="text-[9px] text-[#6b6b70]">{bank.name}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Account Number */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-[#e8c547] uppercase tracking-wider">Account Number</label>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="0123456789"
              className="w-full px-4 py-3 bg-[#0d0d0f] border-2 border-[#2a2a2e] rounded-lg text-[#f5f5f5] font-mono text-lg focus:border-[#e8c547] focus:outline-none transition-colors"
              maxLength={10}
            />
            <p className="text-xs text-[#6b6b70]">Enter your 10-digit account number</p>
          </div>

          {/* Account Name */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-[#e8c547] uppercase tracking-wider">Account Name</label>
            <input
              type="text"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="John Doe"
              className="w-full px-4 py-3 bg-[#0d0d0f] border-2 border-[#2a2a2e] rounded-lg text-[#f5f5f5] focus:border-[#e8c547] focus:outline-none transition-colors"
            />
            <p className="text-xs text-[#6b6b70]">Name as it appears on your bank account</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-[#e8c547]/10 border border-[#e8c547]/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">ℹ️</span>
              <div>
                <p className="text-xs font-bold text-[#e8c547] uppercase tracking-wider mb-1">Verification Required</p>
                <p className="text-xs text-[#a0a0a5] leading-relaxed">
                  Your account will be verified via secure banking API. This may take 1-2 minutes. 
                  Once verified, your balance will be included in your Total PFF Balance.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gradient-to-r from-[#16161a] to-[#1a1a1e] p-6 border-t border-[#2a2a2e] backdrop-blur-sm">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-[#2a2a2e] hover:bg-[#3a3a3e] text-[#f5f5f5] font-bold rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleLink}
              disabled={isLinking || !selectedBank || !accountNumber || !accountName}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-[#c9a227] to-[#e8c547] hover:from-[#e8c547] hover:to-[#c9a227] text-black font-bold rounded-lg transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLinking ? 'Linking...' : '🔗 Link Account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


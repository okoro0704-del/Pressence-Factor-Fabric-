'use client';

import { useState, useEffect } from 'react';
import type { BankAccount } from '@/lib/pffAggregation';
import { PresenceOverrideModal } from './PresenceOverrideModal';
import { checkPresenceVerified } from '@/lib/withPresenceCheck';
import type { GlobalIdentity } from '@/lib/phoneIdentity';

interface PFFSovereignAccountProps {
  account: BankAccount;
}

const GOLD = '#D4AF37';
const BORDER = 'rgba(212, 175, 55, 0.3)';

/**
 * PFF SOVEREIGN ACCOUNT — Presence Factor Fabric default account
 * Sovereign default account pre-activated for every user
 */
export function PFFSovereignAccount({ account }: PFFSovereignAccountProps) {
  const [showPresenceModal, setShowPresenceModal] = useState(false);
  const [isPresenceVerified, setIsPresenceVerified] = useState(false);

  useEffect(() => {
    const checkPresence = async () => {
      const result = await checkPresenceVerified();
      setIsPresenceVerified(result.verified);
    };
    checkPresence();
    const interval = setInterval(checkPresence, 30000);
    return () => clearInterval(interval);
  }, []);

  const handlePresenceVerified = (identity: GlobalIdentity) => {
    setShowPresenceModal(false);
    setIsPresenceVerified(true);
  };

  const handleFundClick = () => {
    if (!isPresenceVerified) setShowPresenceModal(true);
    else console.log('Fund Account clicked');
  };

  const handleSendMoneyClick = () => {
    if (!isPresenceVerified) setShowPresenceModal(true);
    else console.log('Send Money clicked');
  };

  return (
    <div
      className="relative rounded-2xl p-8 overflow-hidden border-2"
      style={{
        background: 'linear-gradient(135deg, #1a1a1e 0%, #0f172a 100%)',
        borderColor: BORDER,
        boxShadow: '0 0 40px rgba(212, 175, 55, 0.12)',
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/5 via-transparent to-[#D4AF37]/5" />
      <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl animate-pulse" style={{ background: 'rgba(212, 175, 55, 0.15)' }} />
      <div className="absolute inset-0 backdrop-blur-sm bg-white/[0.02] pointer-events-none" aria-hidden />

      <div className="relative z-10 space-y-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div
                className="w-16 h-16 rounded-xl flex items-center justify-center border-2"
                style={{ background: 'rgba(212, 175, 55, 0.15)', borderColor: BORDER }}
              >
                <span className="text-2xl font-black" style={{ color: GOLD }}>PFF</span>
              </div>
              <div>
                <h2 className="text-2xl font-black" style={{ color: GOLD }}>
                  PRESENCE FACTOR FABRIC
                </h2>
                <p className="text-sm text-[#a0a0a5] font-semibold">Sovereign Default Account</p>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 rounded-lg blur-md" style={{ background: 'rgba(34, 197, 94, 0.2)' }} />
            <div className="relative px-4 py-2 rounded-lg border-2 flex flex-col gap-0.5" style={{ background: 'rgba(34, 197, 94, 0.1)', borderColor: 'rgba(34, 197, 94, 0.5)' }}>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#22c55e] rounded-full animate-pulse" />
                <span className="text-xs font-bold text-[#22c55e] uppercase tracking-wider">Pre-Activated</span>
              </div>
              <p className="text-[9px] text-[#22c55e]/70 uppercase tracking-wide">National Block Account</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl p-5 border bg-[#0d0d0f]/80 backdrop-blur-sm" style={{ borderColor: BORDER }}>
          <p className="text-xs text-[#6b6b70] uppercase tracking-wider mb-2">Account Number</p>
          <p className="text-3xl font-bold font-mono text-[#f5f5f5] tracking-wider">{account.account_number}</p>
          <p className="text-xs text-[#a0a0a5] mt-2">{account.account_name}</p>
        </div>

        <div className="rounded-xl p-6 border" style={{ background: 'rgba(212, 175, 55, 0.06)', borderColor: BORDER }}>
          <p className="text-xs uppercase tracking-wider mb-3 font-bold" style={{ color: GOLD }}>Available Balance</p>
          <span className="text-5xl font-black font-mono text-[#f5f5f5]">
            ₦{account.balance_naira.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <p className="text-xs text-[#6b6b70] mt-2 uppercase tracking-wide">Nigerian Naira</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: '⚡', label: 'Instant Transfers', value: 'Zero Fees' },
            { icon: '🔒', label: 'Biometric Lock', value: '4-Layer Auth' },
            { icon: '🌍', label: 'Global Access', value: '220M Nodes' },
            { icon: '💎', label: 'VIDA Bridge', value: 'Auto-Convert' },
          ].map(({ icon, label, value }) => (
            <div key={label} className="rounded-lg p-4 border border-[#2a2a2e] bg-[#0d0d0f]/60">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{icon}</span>
                <p className="text-[10px] text-[#6b6b70] uppercase tracking-wide">{label}</p>
              </div>
              <p className="text-xs text-[#f5f5f5] font-semibold">{value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-lg p-4 border" style={{ background: 'rgba(212, 175, 55, 0.06)', borderColor: BORDER }}>
          <div className="flex items-start gap-3">
            <span className="text-2xl">🏛️</span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: GOLD }}>Sovereign Liquidity Bridge</p>
              <p className="text-xs text-[#a0a0a5] leading-relaxed">
                Your PFF account is backed by the <span className="font-semibold text-[#f5f5f5]">Presence Factor Fabric Reserve</span> and
                connected to <span className="font-semibold text-[#e8c547]">220 million active sovereign nodes</span>.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleFundClick}
            disabled={!isPresenceVerified}
            className={`py-4 px-6 rounded-lg font-bold text-sm uppercase tracking-wider transition-all duration-300 ${!isPresenceVerified ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={{ background: GOLD, color: '#0d0d0f' }}
          >
            💸 Fund Account
          </button>
          <button
            onClick={handleSendMoneyClick}
            disabled={!isPresenceVerified}
            className={`py-4 px-6 rounded-lg font-bold text-sm uppercase tracking-wider transition-all duration-300 border-2 ${!isPresenceVerified ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={{ borderColor: GOLD, color: GOLD }}
          >
            📤 Send Money
          </button>
        </div>
      </div>

      <PresenceOverrideModal
        isOpen={showPresenceModal}
        onClose={() => setShowPresenceModal(false)}
        onPresenceVerified={handlePresenceVerified}
      />
    </div>
  );
}

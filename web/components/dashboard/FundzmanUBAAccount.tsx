'use client';

import type { BankAccount } from '@/lib/pffAggregation';

interface FundzmanUBAAccountProps {
  account: BankAccount;
}

/**
 * FUNDZMAN BY UBA - SOVEREIGN DEFAULT ACCOUNT
 * Primary master account pre-activated for every user
 * National Block Account with UBA Liquidity Bridge
 */
export function FundzmanUBAAccount({ account }: FundzmanUBAAccountProps) {
  return (
    <div className="relative bg-gradient-to-br from-[#1a1a1e] via-[#16161a] to-[#1a1a1e] rounded-2xl p-8 border-3 border-[#EE3124] shadow-2xl shadow-[#EE3124]/40 overflow-hidden">
      {/* UBA Red Glow Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#EE3124]/10 via-transparent to-[#EE3124]/5" />
      <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#EE3124]/20 rounded-full blur-3xl animate-pulse" />
      
      {/* Glassmorphism Overlay */}
      <div className="absolute inset-0 backdrop-blur-sm bg-white/[0.02]" />

      <div className="relative z-10 space-y-6">
        {/* Header with Badge */}
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              {/* UBA Logo Placeholder - Glassmorphism */}
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#EE3124]/30 to-[#EE3124]/10 backdrop-blur-md border-2 border-[#EE3124]/50 flex items-center justify-center shadow-lg">
                <span className="text-2xl font-black text-[#EE3124]">UBA</span>
              </div>
              
              <div>
                <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#EE3124] via-[#ff4444] to-[#EE3124]">
                  FUNDZMAN BY UBA
                </h2>
                <p className="text-sm text-[#a0a0a5] font-semibold">Sovereign Default Account</p>
              </div>
            </div>
          </div>

          {/* Pre-Activated Badge */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[#00ff41]/20 to-[#00ff41]/10 rounded-lg blur-md" />
            <div className="relative px-4 py-2 bg-gradient-to-r from-[#00ff41]/20 to-[#00ff41]/10 border-2 border-[#00ff41]/50 rounded-lg backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#00ff41] rounded-full animate-pulse shadow-lg shadow-[#00ff41]/50" />
                <span className="text-xs font-bold text-[#00ff41] uppercase tracking-wider">Pre-Activated</span>
              </div>
              <p className="text-[9px] text-[#00ff41]/70 uppercase tracking-wide mt-0.5">National Block Account</p>
            </div>
          </div>
        </div>

        {/* Account Number */}
        <div className="bg-[#0d0d0f]/80 backdrop-blur-sm rounded-xl p-5 border border-[#EE3124]/30">
          <p className="text-xs text-[#6b6b70] uppercase tracking-wider mb-2">Account Number</p>
          <p className="text-3xl font-bold font-mono text-[#f5f5f5] tracking-wider">
            {account.account_number}
          </p>
          <p className="text-xs text-[#a0a0a5] mt-2">{account.account_name}</p>
        </div>

        {/* Balance Display */}
        <div className="bg-gradient-to-br from-[#EE3124]/10 to-[#EE3124]/5 rounded-xl p-6 border border-[#EE3124]/30">
          <p className="text-xs text-[#EE3124] uppercase tracking-wider mb-3 font-bold">Available Balance</p>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-[#f5f5f5] to-[#a0a0a5]">
              ₦{account.balance_naira.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-xs text-[#6b6b70] mt-2 uppercase tracking-wide">Nigerian Naira</p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#0d0d0f]/60 backdrop-blur-sm rounded-lg p-4 border border-[#2a2a2e]">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">⚡</span>
              <p className="text-[10px] text-[#6b6b70] uppercase tracking-wide">Instant Transfers</p>
            </div>
            <p className="text-xs text-[#f5f5f5] font-semibold">Zero Fees</p>
          </div>

          <div className="bg-[#0d0d0f]/60 backdrop-blur-sm rounded-lg p-4 border border-[#2a2a2e]">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🔒</span>
              <p className="text-[10px] text-[#6b6b70] uppercase tracking-wide">Biometric Lock</p>
            </div>
            <p className="text-xs text-[#f5f5f5] font-semibold">4-Layer Auth</p>
          </div>

          <div className="bg-[#0d0d0f]/60 backdrop-blur-sm rounded-lg p-4 border border-[#2a2a2e]">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🌍</span>
              <p className="text-[10px] text-[#6b6b70] uppercase tracking-wide">Global Access</p>
            </div>
            <p className="text-xs text-[#f5f5f5] font-semibold">220M Nodes</p>
          </div>

          <div className="bg-[#0d0d0f]/60 backdrop-blur-sm rounded-lg p-4 border border-[#2a2a2e]">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">💎</span>
              <p className="text-[10px] text-[#6b6b70] uppercase tracking-wide">VIDA Bridge</p>
            </div>
            <p className="text-xs text-[#f5f5f5] font-semibold">Auto-Convert</p>
          </div>
        </div>

        {/* Sovereign Liquidity Bridge Message */}
        <div className="bg-[#EE3124]/10 border border-[#EE3124]/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🏛️</span>
            <div>
              <p className="text-xs font-bold text-[#EE3124] uppercase tracking-wider mb-1">Sovereign Liquidity Bridge</p>
              <p className="text-xs text-[#a0a0a5] leading-relaxed">
                Your Fundzman account is backed by the <span className="font-semibold text-[#f5f5f5]">UBA National Reserve</span> and 
                connected to <span className="font-semibold text-[#e8c547]">220 million active sovereign nodes</span> across Nigeria.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button className="relative bg-gradient-to-r from-[#EE3124] to-[#ff4444] hover:from-[#ff4444] hover:to-[#EE3124] text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 shadow-lg shadow-[#EE3124]/30 group">
            <span className="relative z-10 text-sm uppercase tracking-wider">💸 Fund Account</span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </button>

          <button className="relative bg-gradient-to-r from-[#c9a227] to-[#e8c547] hover:from-[#e8c547] hover:to-[#c9a227] text-black font-bold py-4 px-6 rounded-lg transition-all duration-300 shadow-lg shadow-[#e8c547]/30 group">
            <span className="relative z-10 text-sm uppercase tracking-wider">📤 Send Money</span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </button>
        </div>
      </div>
    </div>
  );
}


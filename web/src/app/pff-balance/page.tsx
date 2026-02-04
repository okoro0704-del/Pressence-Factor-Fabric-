'use client';

import { PFFBalanceDashboard } from '@/components/dashboard/PFFBalanceDashboard';

/**
 * PFF BALANCE DEMONSTRATION PAGE
 * Shows the complete 220M Auto-Account Logic & Total PFF Aggregation System
 * 
 * Features:
 * - Total PFF Balance (Grand Total with Heavy Gold Glow)
 * - PFF Sovereign Default Account (Pre-Activated National Block)
 * - Legacy Bank Account Linking (GTB, Zenith, Access, etc.)
 * - National Scale Ticker (220M Active Sovereign Nodes)
 * - UI Hierarchy: Primary → Secondary → Tertiary
 */
export default function PFFBalancePage() {
  // Mock data for demonstration
  const mockPhoneNumber = '+2348012345678';
  const mockSpendableVida = 1.0; // 20% of 5 VIDA CAP

  return (
    <div className="min-h-screen bg-[#050505]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0d0d0f] via-[#16161a] to-[#0d0d0f] border-b-2 border-[#2a2a2e] sticky top-0 z-50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#e8c547] via-[#ffd700] to-[#e8c547]">
                PFF BALANCE SYSTEM
              </h1>
              <p className="text-sm text-[#6b6b70] mt-1">
                220M Auto-Account Logic & Total Aggregation
              </p>
            </div>
            <a
              href="/dashboard"
              className="px-4 py-2 bg-gradient-to-r from-[#c9a227] to-[#e8c547] hover:from-[#e8c547] hover:to-[#c9a227] text-black font-bold text-sm rounded-lg transition-all duration-300 shadow-lg"
            >
              ← Back to Dashboard
            </a>
          </div>
        </div>
      </div>

      {/* Main Dashboard */}
      <PFFBalanceDashboard
        phoneNumber={mockPhoneNumber}
        spendableVida={mockSpendableVida}
      />

      {/* Features Documentation */}
      <div className="max-w-7xl mx-auto px-4 pb-32">
        <div className="bg-gradient-to-br from-[#1a1a1e] via-[#16161a] to-[#1a1a1e] rounded-2xl p-8 border-2 border-[#2a2a2e]">
          <h2 className="text-2xl font-black text-[#e8c547] mb-6">✨ System Features</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Feature 1 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">⚡</span>
                <h3 className="text-lg font-bold text-[#f5f5f5]">Total PFF Balance</h3>
              </div>
              <p className="text-sm text-[#a0a0a5] leading-relaxed">
                The <span className="font-bold text-[#e8c547]">Ultimate Truth</span> of your wealth. 
                Aggregates PFF Sovereign + Legacy Accounts + 20% Spendable VIDA Value with heavy gold glow styling.
              </p>
              <div className="bg-[#0d0d0f] rounded-lg p-3 border border-[#2a2a2e]">
                <code className="text-xs text-[#00ff41] font-mono">
                  PFF = PFF Sovereign + Legacy + VIDA
                </code>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🏦</span>
                <h3 className="text-lg font-bold text-[#f5f5f5]">PFF Sovereign Default</h3>
              </div>
              <p className="text-sm text-[#a0a0a5] leading-relaxed">
                Every user gets a <span className="font-bold text-[#D4AF37]">Pre-Activated National Block Account</span> automatically. 
                Zero setup, instant access, backed by Presence Factor Fabric.
              </p>
              <div className="flex gap-2">
                <span className="px-2 py-1 bg-[#00ff41]/20 text-[#00ff41] text-xs font-bold rounded border border-[#00ff41]/30">
                  PRE-ACTIVATED
                </span>
                <span className="px-2 py-1 bg-[#D4AF37]/20 text-[#D4AF37] text-xs font-bold rounded border border-[#D4AF37]/30">
                  SOVEREIGN
                </span>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🔗</span>
                <h3 className="text-lg font-bold text-[#f5f5f5]">Legacy Bank Linking</h3>
              </div>
              <p className="text-sm text-[#a0a0a5] leading-relaxed">
                Link external accounts from <span className="font-bold text-[#f5f5f5]">GTB, Zenith, Access, First Bank</span>, and 
                11 other Nigerian banks. See your complete financial picture in one place.
              </p>
              <div className="bg-[#0d0d0f] rounded-lg p-3 border border-[#2a2a2e]">
                <p className="text-xs text-[#6b6b70]">15 Legacy Banks Supported</p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🌍</span>
                <h3 className="text-lg font-bold text-[#f5f5f5]">National Scale Ticker</h3>
              </div>
              <p className="text-sm text-[#a0a0a5] leading-relaxed">
                Live display of <span className="font-bold text-[#e8c547]">220,000,000 Active Sovereign Nodes</span> powered 
                by Presence Factor Fabric. Real-time network stats and uptime monitoring.
              </p>
              <div className="flex gap-2">
                <span className="px-2 py-1 bg-[#00ff41]/20 text-[#00ff41] text-xs font-bold rounded border border-[#00ff41]/30">
                  99.99% UPTIME
                </span>
              </div>
            </div>

            {/* Feature 5 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📊</span>
                <h3 className="text-lg font-bold text-[#f5f5f5]">UI Hierarchy</h3>
              </div>
              <p className="text-sm text-[#a0a0a5] leading-relaxed">
                Clear visual hierarchy: <span className="font-bold text-[#e8c547]">Primary</span> (Total PFF), 
                <span className="font-bold text-[#D4AF37]"> Secondary</span> (PFF Sovereign), 
                <span className="font-bold text-[#6b6b70]"> Tertiary</span> (Legacy Accounts).
              </p>
            </div>

            {/* Feature 6 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">💎</span>
                <h3 className="text-lg font-bold text-[#f5f5f5]">VIDA Integration</h3>
              </div>
              <p className="text-sm text-[#a0a0a5] leading-relaxed">
                20% Spendable VIDA automatically converted to Naira equivalent and included in Total PFF Balance. 
                Seamless bridge between crypto and fiat.
              </p>
              <div className="bg-[#0d0d0f] rounded-lg p-3 border border-[#2a2a2e]">
                <code className="text-xs text-[#00ff41] font-mono">
                  1 VIDA CAP = ₦1,400,000
                </code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


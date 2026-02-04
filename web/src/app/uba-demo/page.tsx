'use client';

import { UBABrandingCard } from '@/components/dashboard/UBABrandingCard';

/**
 * PFF CO-BRANDING DEMONSTRATION PAGE
 * Shows the premium Presence Factor Fabric (PFF) linked accounts card
 */
export default function UBADemoPage() {
  const mockLinkedAccounts = ['2012345678', '2087654321'];

  return (
    <div className="min-h-screen bg-[#050505] p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#e8c547] to-[#D4AF37]">
            PRESENCE FACTOR FABRIC
          </h1>
          <p className="text-lg text-[#a0a0a5]">
            PFF Co-Branding Demonstration
          </p>
          <p className="text-sm text-[#6b6b70] max-w-2xl mx-auto">
            Premium PFF-branded linked accounts card with glassmorphism design,
            gold/slate accent, and PFF Partner status messaging.
          </p>
        </div>

        {/* PFF Branding Card */}
        <UBABrandingCard linkedAccounts={mockLinkedAccounts} />

        {/* Features List */}
        <div className="bg-[#16161a] rounded-xl p-8 border border-[#2a2a2e]">
          <h2 className="text-2xl font-bold text-[#e8c547] mb-6">✨ Co-Branding Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-[#D4AF37] uppercase tracking-wider">Visual Design</h3>
              <ul className="text-sm text-[#a0a0a5] space-y-1">
                <li>• PFF Gold (#D4AF37) border & glow</li>
                <li>• Glassmorphism logo placeholder</li>
                <li>• Premium gradient backgrounds</li>
                <li>• Animated hover effects</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-[#D4AF37] uppercase tracking-wider">Branding Elements</h3>
              <ul className="text-sm text-[#a0a0a5] space-y-1">
                <li>• "PRESENCE FACTOR FABRIC" title</li>
                <li>• "PFF Partner" badge</li>
                <li>• Consortium handshake messaging</li>
                <li>• Q2 2026 timeline indicator</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-[#D4AF37] uppercase tracking-wider">Account Display</h3>
              <ul className="text-sm text-[#a0a0a5] space-y-1">
                <li>• Bank icon with PFF gold accent</li>
                <li>• Account number in monospace font</li>
                <li>• "Presence Factor Fabric" subtitle</li>
                <li>• Animated verification badge</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-[#D4AF37] uppercase tracking-wider">Status Indicators</h3>
              <ul className="text-sm text-[#a0a0a5] space-y-1">
                <li>• Pulsing yellow status dot</li>
                <li>• "PENDING HANDSHAKE" label</li>
                <li>• Estimated completion date</li>
                <li>• Partnership tier badge</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Integration Instructions */}
        <div className="bg-[#16161a] rounded-xl p-8 border border-[#2a2a2e]">
          <h2 className="text-2xl font-bold text-[#e8c547] mb-6">🔧 Integration</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-[#6b6b70] uppercase tracking-wider mb-2">Component Usage</h3>
              <div className="bg-[#0d0d0f] rounded-lg p-4 border border-[#2a2a2e]">
                <code className="text-sm text-[#00ff41] font-mono">
                  {'<UBABrandingCard linkedAccounts={vaultData.linked_bank_accounts} />'}
                </code>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#6b6b70] uppercase tracking-wider mb-2">Import Statement</h3>
              <div className="bg-[#0d0d0f] rounded-lg p-4 border border-[#2a2a2e]">
                <code className="text-sm text-[#00ff41] font-mono">
                  {"import { UBABrandingCard } from './UBABrandingCard';"}
                </code>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#6b6b70] uppercase tracking-wider mb-2">Props</h3>
              <div className="bg-[#0d0d0f] rounded-lg p-4 border border-[#2a2a2e]">
                <code className="text-sm text-[#00ff41] font-mono">
                  linkedAccounts: string[] // Array of bank account numbers
                </code>
              </div>
            </div>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center">
          <a
            href="/dashboard"
            className="inline-block px-6 py-3 bg-gradient-to-r from-[#c9a227] to-[#e8c547] hover:from-[#e8c547] hover:to-[#c9a227] text-black font-bold rounded-lg transition-all duration-300 shadow-lg"
          >
            ← Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}


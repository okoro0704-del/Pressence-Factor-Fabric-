'use client';

import { useState, useEffect } from 'react';
import { AccountType, type GlobalIdentity, getGuardianDependents } from '@/lib/phoneIdentity';
import { RegisterDependentModal } from './RegisterDependentModal';
import { SendVidaModal } from './SendVidaModal';

export function MyProtocol() {
  const [dependents, setDependents] = useState<GlobalIdentity[]>([]);
  const [showRegisterDependent, setShowRegisterDependent] = useState(false);
  const [showOnboardPartner, setShowOnboardPartner] = useState(false);
  const [showSendVida, setShowSendVida] = useState(false);
  const [loading, setLoading] = useState(true);

  // Mock guardian phone - in production, get from auth context
  const guardianPhone = '+2348012345678';

  useEffect(() => {
    async function loadDependents() {
      setLoading(true);
      const deps = await getGuardianDependents(guardianPhone);
      setDependents(deps);
      setLoading(false);
    }
    loadDependents();
  }, []);

  return (
    <div className="space-y-6">
      {/* Modals */}
      <RegisterDependentModal
        isOpen={showRegisterDependent}
        onClose={() => setShowRegisterDependent(false)}
        guardianPhone={guardianPhone}
      />
      <SendVidaModal
        isOpen={showSendVida}
        onClose={() => setShowSendVida(false)}
        senderPhone={guardianPhone}
        maxAmount={1.0}
      />

      {/* Header */}
      <div className="bg-[#16161a] rounded-xl p-6 border border-[#2a2a2e]">
        <h2 className="text-2xl font-bold text-[#e8c547] mb-2">🌐 My Protocol</h2>
        <p className="text-sm text-[#6b6b70]">
          Manage your network of dependents and business partners
        </p>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Register Dependent Button */}
        <button
          onClick={() => setShowRegisterDependent(true)}
          className="relative bg-gradient-to-br from-[#3b82f6]/30 to-[#2563eb]/20 hover:from-[#3b82f6]/40 hover:to-[#2563eb]/30 rounded-xl p-6 border-2 border-[#3b82f6]/50 transition-all duration-300 group overflow-hidden"
        >
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#3b82f6]/20 rounded-full blur-3xl" />
          <div className="relative z-10 text-left">
            <div className="text-4xl mb-3">👨‍👩‍👧‍👦</div>
            <h3 className="text-xl font-bold text-[#3b82f6] mb-2">Register Dependent</h3>
            <p className="text-sm text-[#6b6b70]">
              Add family members or elderly relatives to your protocol. Simplified interface for easy management.
            </p>
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#3b82f6]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </button>

        {/* Onboard Partner Button */}
        <button
          onClick={() => setShowOnboardPartner(true)}
          className="relative bg-gradient-to-br from-[#c9a227]/30 to-[#e8c547]/20 hover:from-[#c9a227]/40 hover:to-[#e8c547]/30 rounded-xl p-6 border-2 border-[#c9a227]/50 transition-all duration-300 group overflow-hidden"
        >
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#e8c547]/20 rounded-full blur-3xl" />
          <div className="relative z-10 text-left">
            <div className="text-4xl mb-3">🤝</div>
            <h3 className="text-xl font-bold text-[#e8c547] mb-2">Onboard Partner</h3>
            <p className="text-sm text-[#6b6b70]">
              Invite business partners or operators. Full access to Swap/Send suite and analytics.
            </p>
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#e8c547]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </button>
      </div>

      {/* Dependents List */}
      {dependents.length > 0 && (
        <div className="bg-[#16161a] rounded-xl p-6 border border-[#2a2a2e]">
          <h3 className="text-lg font-bold text-[#e8c547] mb-4">Your Dependents</h3>
          <div className="space-y-3">
            {dependents.map((dependent) => (
              <div
                key={dependent.id}
                className="flex items-center justify-between p-4 bg-[#0d0d0f] rounded-lg border border-[#2a2a2e] hover:border-[#3b82f6]/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#3b82f6]/20 flex items-center justify-center">
                    <span className="text-2xl">👤</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#f5f5f5]">{dependent.full_name}</p>
                    <p className="text-xs text-[#6b6b70] font-mono">{dependent.phone_number}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-[#e8c547]">
                    {dependent.spendable_vida.toFixed(2)} VIDA
                  </p>
                  <p className="text-xs text-[#6b6b70]">
                    {dependent.status === 'ACTIVE' ? '✓ Active' : '⏳ Pending'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {dependents.length === 0 && !loading && (
        <div className="bg-[#16161a] rounded-xl p-12 border border-[#2a2a2e] text-center">
          <div className="text-6xl mb-4">🌐</div>
          <h3 className="text-xl font-bold text-[#6b6b70] mb-2">No Protocol Members Yet</h3>
          <p className="text-sm text-[#6b6b70]">
            Start building your network by registering dependents or onboarding partners
          </p>
        </div>
      )}

      {/* Phone Identity Info */}
      <div className="bg-gradient-to-br from-[#c9a227]/10 to-[#e8c547]/5 rounded-xl p-6 border border-[#c9a227]/30">
        <div className="flex items-start gap-3">
          <span className="text-3xl">📱</span>
          <div>
            <h4 className="text-sm font-bold text-[#e8c547] uppercase tracking-wider mb-2">
              Phone Number = Global Identity
            </h4>
            <p className="text-xs text-[#6b6b70] leading-relaxed mb-2">
              Your phone number is your <span className="font-mono text-[#e8c547]">Primary Key</span> in the PFF system.
              It maps to a unique <span className="font-mono text-[#e8c547]">Global Identity Hash</span> and acts as a
              <span className="font-mono text-[#e8c547]"> Virtual Bridge</span> to traditional banking.
            </p>
            <p className="text-xs text-[#6b6b70] leading-relaxed">
              Send VIDA to anyone by simply typing their phone number. The system instantly resolves it to their identity.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

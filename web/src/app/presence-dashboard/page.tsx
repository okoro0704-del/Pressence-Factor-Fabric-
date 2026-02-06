'use client';

import React, { useState, useEffect } from 'react';
import { PresenceOverrideWrapper } from '@/components/dashboard/PresenceOverrideWrapper';
import { DependentDashboard } from '@/components/dashboard/DependentDashboard';
import { UserProfileBalance } from '@/components/dashboard/UserProfileBalance';
import type { GlobalIdentity, AccountType } from '@/lib/phoneIdentity';

/**
 * PRESENCE-ENABLED DASHBOARD
 * Supports temporary presence override for dependent authentication
 * Elderly parent can authenticate on child's phone
 */
export default function PresenceDashboardPage() {
  const [deviceOwner, setDeviceOwner] = useState<GlobalIdentity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load device owner identity from localStorage or session
    // In production, this would come from authentication
    const mockDeviceOwner: GlobalIdentity = {
      id: crypto.randomUUID(),
      phone_number: '+2348012345678',
      global_identity_hash: 'mock-hash-child',
      account_type: 'SOVEREIGN_OPERATOR' as AccountType,
      full_name: 'Child Account (Device Owner)',
      linked_bank_accounts: ['0123456789'],
      vida_balance: 5.0,
      spendable_vida: 1.0,
      locked_vida: 4.0,
      created_at: new Date().toISOString(),
      last_active: new Date().toISOString(),
      status: 'ACTIVE',
    };

    setDeviceOwner(mockDeviceOwner);
    setLoading(false);
  }, []);

  if (loading || !deviceOwner) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <p className="text-4xl text-[#e8c547]">Loading...</p>
      </div>
    );
  }

  const renderContent = ({ identity, isPresenceOverride }: { identity: GlobalIdentity; isPresenceOverride: boolean }): React.ReactNode => (
    <div className="min-h-screen bg-[#050505]">
          {/* Header */}
          <header className="bg-[#16161a] border-b border-[#2a2a2e] px-6 py-4">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-[#e8c547]">
                  {isPresenceOverride ? '🟡 SOVEREIGN MODE' : 'PFF Dashboard'}
                </h1>
                <p className="text-sm text-[#6b6b70] mt-1">
                  {isPresenceOverride
                    ? `Temporary access for ${identity.full_name}`
                    : `Logged in as ${identity.full_name}`}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-[#6b6b70]">Phone</p>
                <p className="text-lg font-mono text-[#f5f5f5]">{identity.phone_number}</p>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="max-w-7xl mx-auto p-6">
            {identity.account_type === 'DEPENDENT' ? (
              <DependentDashboard identity={identity} />
            ) : (
              <div className="space-y-6">
                {/* Sovereign Operator Dashboard */}
                <UserProfileBalance />

                {/* Additional Dashboard Components */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Balance Card */}
                  <div className="bg-[#16161a] rounded-2xl p-6 border border-[#2a2a2e]">
                    <h2 className="text-2xl font-bold text-[#e8c547] mb-4">Current Balance</h2>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-[#6b6b70]">Spendable VIDA</p>
                        <p className="text-4xl font-bold text-[#e8c547] font-mono">
                          {identity.spendable_vida.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-[#6b6b70]">Locked VIDA</p>
                        <p className="text-2xl font-bold text-red-400 font-mono">
                          🔒 {identity.locked_vida.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Account Info */}
                  <div className="bg-[#16161a] rounded-2xl p-6 border border-[#2a2a2e]">
                    <h2 className="text-2xl font-bold text-[#e8c547] mb-4">Account Info</h2>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-[#6b6b70]">Account Type</p>
                        <p className="text-lg font-semibold text-[#3b82f6]">
                          {identity.account_type === 'SOVEREIGN_OPERATOR'
                            ? 'Sovereign Operator'
                            : 'Dependent'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-[#6b6b70]">Status</p>
                        <p className="text-lg font-semibold text-green-400">{identity.status}</p>
                      </div>
                      {identity.guardian_phone && (
                        <div>
                          <p className="text-sm text-[#6b6b70]">Guardian</p>
                          <p className="text-lg font-mono text-[#f5f5f5]">{identity.guardian_phone}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Privacy Notice for Presence Override */}
                {isPresenceOverride && (
                  <div className="bg-gradient-to-r from-[#c9a227]/20 to-[#e8c547]/10 border-2 border-[#e8c547] rounded-2xl p-6">
                    <h3 className="text-2xl font-bold text-[#e8c547] mb-3">
                      🔒 PRIVACY ISOLATION ACTIVE
                    </h3>
                    <p className="text-lg text-[#f5f5f5]">
                      This is a temporary session. Your data is not stored on this device.
                      Session will automatically revert to device owner after you complete your transaction.
                    </p>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
  );

  return (
    <PresenceOverrideWrapper
      deviceOwnerIdentity={deviceOwner}
      children={renderContent}
    />
  );
}


'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/dashboard/ProtectedRoute';
import { StaffPortalGuard } from '@/components/staff/StaffPortalGuard';
import { getIdentityAnchorPhone } from '@/lib/sentinelActivation';
import {
  getStaffPortalStats,
  issueSentinelStaffCredential,
  type StaffPortalStats as Stats,
  type SovereignSentinelStaffCredential,
} from '@/lib/staffPortal';

/**
 * Staff Portal — SENTINEL_STAFF only.
 * Citizens Onboarded, Monthly Performance Bonus, Sovereign Sentinel Staff ID (Verifiable Credential).
 */
export default function StaffPortalPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [credential, setCredential] = useState<SovereignSentinelStaffCredential | null>(null);
  const [loading, setLoading] = useState(true);
  const [credentialLoading, setCredentialLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const identity = getIdentityAnchorPhone();
    if (!identity) {
      setError('Identity not found');
      setLoading(false);
      return;
    }
    (async () => {
      const res = await getStaffPortalStats(identity);
      if (res.ok) setStats(res);
      else setError(res.error ?? 'Failed to load stats');
      setLoading(false);
    })();
  }, []);

  const handleIssueCredential = async () => {
    const identity = getIdentityAnchorPhone();
    if (!identity) return;
    setCredentialLoading(true);
    setError(null);
    const res = await issueSentinelStaffCredential(identity);
    setCredentialLoading(false);
    if (res.ok && res.credential) setCredential(res.credential);
    else setError(res.error ?? 'Failed to issue credential');
  };

  return (
    <ProtectedRoute>
      <StaffPortalGuard>
        <main className="min-h-screen bg-[#0d0d0f] text-[#f5f5f5]">
          <header className="border-b border-[#2a2a2e] bg-[#0d0d0f]/95 backdrop-blur px-4 py-4">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-[#D4AF37] to-[#e8c547] bg-clip-text text-transparent tracking-tight">
                  Staff Portal
                </h1>
                <p className="text-xs text-[#6b6b70] mt-0.5">
                  Sovereign Sentinel Staff · Citizens Onboarded · Performance Bonus
                </p>
              </div>
              <Link
                href="/dashboard"
                className="text-sm font-medium text-[#D4AF37] hover:text-[#e8c547] transition-colors"
              >
                ← Dashboard
              </Link>
            </div>
          </header>

          <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-10 h-10 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {/* Citizens Onboarded & Monthly Bonus */}
                <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-[#1a1a1e] border border-[#2a2a2e] rounded-xl p-5">
                    <p className="text-xs text-[#6b6b70] uppercase tracking-wider mb-1">Citizens Onboarded</p>
                    <p className="text-3xl font-bold text-[#D4AF37]">
                      {stats?.ok ? stats.citizens_onboarded ?? 0 : '—'}
                    </p>
                    <p className="text-xs text-[#6b6b70] mt-1">Total registrations after your promotion</p>
                  </div>
                  <div className="bg-[#1a1a1e] border border-[#2a2a2e] rounded-xl p-5">
                    <p className="text-xs text-[#6b6b70] uppercase tracking-wider mb-1">Monthly Performance Bonus</p>
                    <p className="text-3xl font-bold text-[#D4AF37]">
                      ${stats?.ok ? (stats.monthly_bonus_usd ?? 0).toFixed(2) : '—'}
                    </p>
                    <p className="text-xs text-[#6b6b70] mt-1">$30 per citizen this month (VIDA paid to your wallet)</p>
                  </div>
                </section>

                {/* Sovereign Sentinel Staff ID — Verifiable Credential */}
                <section className="bg-[#1a1a1e] border border-[#2a2a2e] rounded-xl p-5">
                  <h2 className="text-lg font-semibold text-[#D4AF37] mb-2">Sovereign Sentinel Staff ID</h2>
                  <p className="text-sm text-[#9ca3af] mb-4">
                    Official Verifiable Credential to prove you are an employee of the network. Show to local authorities when required.
                  </p>
                  {!credential ? (
                    <button
                      type="button"
                      onClick={handleIssueCredential}
                      disabled={credentialLoading}
                      className="px-4 py-2 bg-[#D4AF37] text-[#0d0d0f] font-medium rounded-lg hover:bg-[#e8c547] transition-colors disabled:opacity-50"
                    >
                      {credentialLoading ? 'Issuing…' : 'Issue / Refresh Credential'}
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <div className="bg-[#0d0d0f] rounded-lg p-4 font-mono text-xs text-[#9ca3af] overflow-x-auto">
                        <pre className="whitespace-pre-wrap break-all">
                          {JSON.stringify(credential, null, 2)}
                        </pre>
                      </div>
                      <p className="text-xs text-[#6b6b70]">
                        Store this in your app or show the QR / payload to authorities. Issued: {credential.credentialSubject?.issued ?? credential.issued}
                      </p>
                      <button
                        type="button"
                        onClick={handleIssueCredential}
                        disabled={credentialLoading}
                        className="text-sm text-[#D4AF37] hover:text-[#e8c547]"
                      >
                        Refresh credential
                      </button>
                    </div>
                  )}
                </section>

                <p className="text-xs text-[#6b6b70]">
                  For every registration after promotion: $100 Sentinel Fee is minted to the Corporate Wallet and $30 Salary Payout is sent to your VIDA wallet.
                </p>
              </>
            )}
          </div>
        </main>
      </StaffPortalGuard>
    </ProtectedRoute>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { requestPayout, convertVidaToNaira, type BankingTransferResult } from '@/lib/bankingBridge';
import { calculateAge, type GlobalIdentity } from '@/lib/phoneIdentity';
import {
  checkSovereigntyEligibility,
  activateIndependentSentinel,
  SOVEREIGNTY_FEE_VIDA,
} from '@/lib/sovereignHandover';
import {
  getEmergencyGuardianStatus,
  setEmergencyGuardian,
  recordPrimaryActivity,
} from '@/lib/emergencyGuardian';
import { SpendableVidaCounter } from '@/components/dashboard/SpendableVidaCounter';

interface DependentDashboardProps {
  identity: GlobalIdentity;
}

/**
 * SIMPLIFIED DEPENDENT DASHBOARD
 * Extra-large buttons and high-contrast gold text for elderly/low literacy users
 * Features: "Request Payout", "Current Balance", Sovereign Handover (18+), Emergency Guardian (65+)
 */
export function DependentDashboard({ identity }: DependentDashboardProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BankingTransferResult | null>(null);
  const [sovereigntyEligible, setSovereigntyEligible] = useState<boolean | null>(null);
  const [handoverLoading, setHandoverLoading] = useState(false);
  const [handoverMessage, setHandoverMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [emergencyStatus, setEmergencyStatus] = useState<Awaited<ReturnType<typeof getEmergencyGuardianStatus>> | null>(null);
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [emergencySaving, setEmergencySaving] = useState(false);

  const nairaBalance = convertVidaToNaira(identity.spendable_vida);
  const ageYears = identity.date_of_birth ? calculateAge(identity.date_of_birth) : undefined;
  const isElder = ageYears !== undefined && ageYears >= 65;

  useEffect(() => {
    if (identity.guardian_phone && identity.phone_number) {
      checkSovereigntyEligibility(identity.phone_number).then((r) => setSovereigntyEligible(r.eligible));
    } else {
      setSovereigntyEligible(false);
    }
  }, [identity.phone_number, identity.guardian_phone]);

  useEffect(() => {
    if (isElder && identity.phone_number) {
      getEmergencyGuardianStatus(identity.phone_number).then(setEmergencyStatus);
    }
  }, [isElder, identity.phone_number]);

  useEffect(() => {
    if (identity.phone_number && isElder) recordPrimaryActivity(identity.phone_number);
  }, [identity.phone_number, isElder]);

  const handleActivateIndependentSentinel = async () => {
    if (!identity.phone_number) return;
    setHandoverLoading(true);
    setHandoverMessage(null);
    const out = await activateIndependentSentinel(identity.phone_number);
    setHandoverLoading(false);
    if (out.ok) {
      setHandoverMessage({ type: 'success', text: `Sovereign handover complete. Sentinel ID: ${out.sentinelId}. Sign in again to use your independent account.` });
    } else {
      setHandoverMessage({ type: 'error', text: out.error ?? 'Activation failed' });
    }
  };

  const handleSetEmergencyGuardian = async () => {
    if (!identity.phone_number || !emergencyPhone.trim()) return;
    setEmergencySaving(true);
    const out = await setEmergencyGuardian(identity.phone_number, emergencyPhone.trim());
    setEmergencySaving(false);
    if (out.ok) {
      getEmergencyGuardianStatus(identity.phone_number).then(setEmergencyStatus);
      setEmergencyPhone('');
    }
  };

  const handleRequestPayout = async () => {
    setLoading(true);
    setResult(null);

    const payoutResult = await requestPayout(identity);
    setResult(payoutResult);
    setLoading(false);

    // Auto-dismiss success message after 5 seconds
    if (payoutResult.success) {
      setTimeout(() => setResult(null), 5000);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-6xl md:text-8xl font-bold text-[#e8c547] uppercase tracking-wider">
            {identity.full_name}
          </h1>
          <p className="text-3xl md:text-4xl text-[#6b6b70] font-mono">{identity.phone_number}</p>
        </div>

        {/* Current Balance - Extra Large Display */}
        <div className="bg-gradient-to-br from-[#c9a227]/30 to-[#e8c547]/20 rounded-3xl p-12 border-4 border-[#e8c547] shadow-2xl shadow-[#e8c547]/20">
          <div className="text-center space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold text-[#e8c547] uppercase tracking-wider">
              💰 CURRENT BALANCE
            </h2>
            
            {/* VIDA Balance — count-up + shimmer when returning from daily unlock celebration */}
            <div className="space-y-2">
              <p className="text-8xl md:text-9xl font-bold text-[#e8c547] font-mono">
                <SpendableVidaCounter
                  value={identity.spendable_vida}
                  suffix=""
                  decimals={2}
                  className="text-[#e8c547]"
                />
              </p>
              <p className="text-4xl md:text-5xl text-[#f5f5f5] font-semibold">VIDA CAP</p>
            </div>

            {/* Naira Equivalent */}
            <div className="pt-6 border-t-4 border-[#e8c547]/30">
              <p className="text-3xl md:text-4xl text-[#6b6b70] mb-2">Naira Equivalent</p>
              <p className="text-6xl md:text-7xl font-bold text-[#00ff41] font-mono">
                ₦{nairaBalance.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Request Payout Button - Extra Large */}
        <button
          onClick={handleRequestPayout}
          disabled={loading || identity.spendable_vida === 0}
          className="w-full py-16 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-600 text-white font-bold text-5xl md:text-6xl rounded-3xl transition-all duration-300 shadow-2xl shadow-green-600/30 uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '⏳ PROCESSING...' : '💸 REQUEST PAYOUT'}
        </button>

        {/* Success Message */}
        {result?.success && (
          <div className="bg-gradient-to-br from-green-600/20 to-green-700/10 border-4 border-green-500 rounded-3xl p-12 text-center space-y-6 animate-pulse">
            <h2 className="text-5xl md:text-6xl font-bold text-green-400">✓ PAYOUT SUCCESSFUL</h2>
            <p className="text-3xl md:text-4xl text-[#f5f5f5]">
              ₦{result.toAmount.toLocaleString()} sent to your bank
            </p>
            <p className="text-2xl md:text-3xl text-[#6b6b70]">{result.bankAccount}</p>
          </div>
        )}

        {/* Error Message */}
        {result && !result.success && (
          <div className="bg-gradient-to-br from-red-600/20 to-red-700/10 border-4 border-red-500 rounded-3xl p-12 text-center space-y-6">
            <h2 className="text-5xl md:text-6xl font-bold text-red-400">❌ PAYOUT FAILED</h2>
            <p className="text-3xl md:text-4xl text-[#f5f5f5]">{result.message}</p>
            <button
              onClick={() => setResult(null)}
              className="px-12 py-6 bg-[#3b82f6] hover:bg-[#2563eb] text-white font-bold text-3xl rounded-xl transition-colors"
            >
              TRY AGAIN
            </button>
          </div>
        )}

        {/* Sovereign Handover (18+): Sovereignty Pending replaces Guardian Linked */}
        {identity.guardian_phone && sovereigntyEligible === true && (
          <div className="bg-gradient-to-br from-[#e8c547]/20 to-[#c9a227]/10 rounded-3xl p-8 border-2 border-[#e8c547]/50">
            <div className="text-center space-y-4">
              <h3 className="text-3xl md:text-4xl font-bold text-[#e8c547] uppercase">
                👑 Sovereignty Pending
              </h3>
              <p className="text-xl md:text-2xl text-[#f5f5f5]">
                You&apos;re 18+. Activate your independent Sentinel: download Sentinel on this device, pay the one-time Sovereignty Fee ({SOVEREIGNTY_FEE_VIDA} VIDA), and decouple from your Guardian.
              </p>
              {handoverMessage && (
                <p className={handoverMessage.type === 'success' ? 'text-green-400 text-lg' : 'text-red-400 text-lg'}>
                  {handoverMessage.text}
                </p>
              )}
              <button
                onClick={handleActivateIndependentSentinel}
                disabled={handoverLoading || (identity.spendable_vida ?? 0) < SOVEREIGNTY_FEE_VIDA}
                className="px-12 py-6 bg-gradient-to-r from-[#e8c547] to-[#c9a227] hover:from-[#c9a227] hover:to-[#e8c547] text-black font-bold text-2xl md:text-3xl rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {handoverLoading ? '⏳ Activating...' : '🛡️ Activate Independent Sentinel'}
              </button>
            </div>
          </div>
        )}

        {/* Guardian Linked (under 18) */}
        {identity.guardian_phone && sovereigntyEligible !== true && (
          <div className="bg-[#16161a] rounded-3xl p-8 border-2 border-[#2a2a2e]">
            <div className="text-center space-y-4">
              <h3 className="text-3xl md:text-4xl font-bold text-[#3b82f6] uppercase">
                👨‍👩‍👧‍👦 Guardian Linked
              </h3>
              <p className="text-2xl md:text-3xl text-[#f5f5f5] font-mono">{identity.guardian_phone}</p>
              <p className="text-xl md:text-2xl text-[#6b6b70]">
                Contact your Guardian if you need help
              </p>
            </div>
          </div>
        )}

        {/* Locked Balance Info */}
        {identity.locked_vida > 0 && (
          <div className="bg-gradient-to-br from-red-600/20 to-red-700/10 border-2 border-red-500/50 rounded-3xl p-8">
            <div className="text-center space-y-4">
              <h3 className="text-3xl md:text-4xl font-bold text-red-400 uppercase">
                🔒 LOCKED BALANCE
              </h3>
              <p className="text-5xl md:text-6xl font-bold text-red-400 font-mono">
                {identity.locked_vida.toFixed(2)} VIDA
              </p>
              <p className="text-xl md:text-2xl text-[#6b6b70]">
                Unlocks when PFF reaches 1 Billion users
              </p>
            </div>
          </div>
        )}

        {/* Emergency Guardian (65+): secondary Sentinel can authorize if primary unresponsive 72h */}
        {isElder && (
          <div className="bg-[#16161a] rounded-3xl p-8 border-2 border-[#2a2a2e]">
            <div className="text-center space-y-4">
              <h3 className="text-3xl md:text-4xl font-bold text-[#e8c547] uppercase">
                🚨 Emergency Guardian
              </h3>
              <p className="text-xl md:text-2xl text-[#f5f5f5]">
                Add a secondary Sentinel. If you&apos;re unresponsive for 72 hours, they can authorize transactions on your behalf.
              </p>
              {emergencyStatus?.hasEmergencyGuardian && (
                <p className="text-lg text-green-400 font-mono">
                  Emergency Guardian: {emergencyStatus.emergencyGuardianPhone}
                </p>
              )}
              <div className="flex flex-col md:flex-row gap-4 justify-center items-center pt-4">
                <input
                  type="tel"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  placeholder="+1 202 555 0123"
                  className="px-4 py-3 rounded-xl bg-[#0d0d0f] border border-[#2a2a2e] text-[#f5f5f5] font-mono text-lg max-w-xs"
                />
                <button
                  onClick={handleSetEmergencyGuardian}
                  disabled={emergencySaving || !emergencyPhone.trim()}
                  className="px-8 py-4 bg-[#e8c547] hover:bg-[#c9a227] text-black font-bold text-xl rounded-xl transition-colors disabled:opacity-50"
                >
                  {emergencySaving ? 'Saving...' : 'Set Emergency Guardian'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Emergency Contact */}
        <div className="bg-gradient-to-br from-[#3b82f6]/20 to-[#2563eb]/10 border-2 border-[#3b82f6]/50 rounded-3xl p-8">
          <div className="text-center space-y-4">
            <h3 className="text-3xl md:text-4xl font-bold text-[#3b82f6] uppercase">
              📞 NEED HELP?
            </h3>
            <p className="text-2xl md:text-3xl text-[#f5f5f5]">
              Call your Guardian or PFF Support
            </p>
            <div className="flex flex-col md:flex-row gap-4 justify-center pt-4">
              {identity.guardian_phone && (
                <a
                  href={`tel:${identity.guardian_phone}`}
                  className="px-12 py-6 bg-[#3b82f6] hover:bg-[#2563eb] text-white font-bold text-2xl md:text-3xl rounded-xl transition-colors"
                >
                  📞 CALL GUARDIAN
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


'use client';

import { useState } from 'react';
import { SENTINEL_HUB_PLANS, SPENDABLE_VAULT_USD, type SentinelHubPlanType } from '@/lib/sentinelHubPlans';
import { PlanUpgradeConfirmationModal } from './PlanUpgradeConfirmationModal';

const GOLD = '#D4AF37';
const BORDER = 'rgba(212, 175, 55, 0.25)';

export interface PlanSelectorProps {
  /** Identity Anchor (phone) for upgrade API */
  ownerId: string | null;
  /** Current device limit from profile (optional, for display) */
  currentDeviceLimit?: number;
  /** Current plan type from profile (optional) */
  currentPlanType?: string | null;
  /** Callback after successful upgrade (e.g. refetch profile) */
  onUpgraded?: () => void;
}

export function PlanSelector({
  ownerId,
  currentDeviceLimit,
  currentPlanType,
  onUpgraded,
}: PlanSelectorProps) {
  const [purchasing, setPurchasing] = useState<SentinelHubPlanType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{ amountUsd: number; deviceLimit: number } | null>(null);

  const handleSelectPlan = async (planType: SentinelHubPlanType) => {
    if (!ownerId) {
      setError('Set your Identity Anchor first (phone).');
      return;
    }
    const plan = SENTINEL_HUB_PLANS[planType];
    if (plan.priceUsd > SPENDABLE_VAULT_USD) {
      setError(`Spendable Vault is $${SPENDABLE_VAULT_USD}. This plan requires $${plan.priceUsd}.`);
      return;
    }
    setError(null);
    setPurchasing(planType);
    try {
      const res = await fetch('/api/sentinel/upgrade-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: ownerId, planType }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? 'Upgrade failed');
        setPurchasing(null);
        return;
      }
      setPurchasing(null);
      setConfirmation({ amountUsd: data.amountUsd ?? plan.priceUsd, deviceLimit: data.deviceLimit ?? plan.deviceLimit });
      onUpgraded?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error');
      setPurchasing(null);
    }
  };

  const planEntries = Object.entries(SENTINEL_HUB_PLANS) as [SentinelHubPlanType, (typeof SENTINEL_HUB_PLANS)[SentinelHubPlanType]][];

  return (
    <section className="mb-10">
      <h2 className="text-xl font-bold uppercase tracking-wider mb-6 text-center" style={{ color: GOLD }}>
        Plan Selector
      </h2>
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {planEntries.map(([type, plan]) => {
          const isCurrent = currentPlanType === type;
          const isDisabled = plan.priceUsd > SPENDABLE_VAULT_USD;
          return (
            <div
              key={type}
              className="rounded-xl border p-5 flex flex-col"
              style={{
                borderColor: isCurrent ? GOLD : BORDER,
                background: 'rgba(15,23,42,0.8)',
                boxShadow: isCurrent ? '0 0 20px rgba(212,175,55,0.2)' : 'none',
              }}
            >
              <h3 className="font-bold text-lg" style={{ color: GOLD }}>{plan.label}</h3>
              <p className="text-2xl font-bold mt-1 font-mono" style={{ color: GOLD }}>
                ${plan.priceUsd}
              </p>
              <p className="text-xs text-neutral-400 mt-1">up to {plan.deviceLimit} device(s)</p>
              {isCurrent && (
                <p className="text-xs text-emerald-400 mt-1">Current plan</p>
              )}
              <button
                onClick={() => handleSelectPlan(type)}
                disabled={!!purchasing || isDisabled || isCurrent}
                className="mt-4 w-full py-2.5 rounded-lg font-bold text-sm uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: isCurrent ? 'rgba(34,197,94,0.3)' : GOLD, color: isCurrent ? '#22c55e' : '#000' }}
              >
                {purchasing === type ? 'Processing...' : isCurrent ? 'Current' : isDisabled ? 'Insufficient balance' : `Select $${plan.priceUsd}`}
              </button>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-neutral-500 text-center mt-4">
        Amount is debited from your Spendable Vault (max ${SPENDABLE_VAULT_USD}). Device limit is updated immediately.
      </p>

      <PlanUpgradeConfirmationModal
        open={!!confirmation}
        onClose={() => setConfirmation(null)}
        amountUsd={confirmation?.amountUsd ?? 0}
        deviceLimit={confirmation?.deviceLimit ?? 0}
      />
    </section>
  );
}

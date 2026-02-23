/**
 * Sentinel Hub Plan Selector — Standard ($100), Family ($200), Small Business ($500), Enterprise ($1000).
 * Auto-debit from Spendable Vault ($900) to Sentinel wallet. device_limit enforced from selected plan.
 */

import { VIDA_PRICE_USD } from './economic';

export const SENTINEL_HUB_PLANS = {
  STANDARD: {
    label: 'Standard',
    priceUsd: 100,
    priceVida: 100 / VIDA_PRICE_USD, // 0.1 VIDA
    deviceLimit: 1,
  },
  FAMILY: {
    label: 'Family',
    priceUsd: 200,
    priceVida: 200 / VIDA_PRICE_USD, // 0.2 VIDA
    deviceLimit: 4,
  },
  SMALL_BUSINESS: {
    label: 'Small Business',
    priceUsd: 500,
    priceVida: 500 / VIDA_PRICE_USD, // 0.5 VIDA
    deviceLimit: 5,
  },
  ENTERPRISE: {
    label: 'Enterprise',
    priceUsd: 1000,
    priceVida: 1000 / VIDA_PRICE_USD, // 1 VIDA
    deviceLimit: 15,
  },
} as const;

export type SentinelHubPlanType = keyof typeof SENTINEL_HUB_PLANS;

/** Max spendable for plan debit (Current Power after Sentinel fee). */
export const SPENDABLE_VAULT_USD = 900;

export function getPlanByType(type: SentinelHubPlanType) {
  return SENTINEL_HUB_PLANS[type];
}

export function canAffordPlan(spendableUsd: number, planType: SentinelHubPlanType): boolean {
  const plan = SENTINEL_HUB_PLANS[planType];
  return plan && spendableUsd >= plan.priceUsd;
}

/**
 * Sovereign Handshake — $5,000 Security Milestone.
 * Aligns with lib/economic.ts: $5k grant → National $0, Citizen $5k (Liquid $1k → $900 after $100 Sentinel + Lock $4,100).
 * Sentinel Activation ($50/$100) deducted from Liquid; not a separate VIDA line.
 */

import {
  GRANT_USD,
  NATIONAL_RESERVE_VAULT_USD,
  VIDA_PRICE_USD,
  LIQUID_TIER_USD,
  SOVEREIGN_LOCK_USD,
  getSentinelFeeUsd,
  getAvailableCashUsd,
} from './economic';

export const GROSS_SOVEREIGN_GRANT_VIDA = GRANT_USD / VIDA_PRICE_USD;
export const NATIONAL_CONTRIBUTION_VIDA = NATIONAL_RESERVE_VAULT_USD / VIDA_PRICE_USD;
/** Legacy: "security activation" is now Sentinel fee deducted from Liquid; keep for backward compat. */
export const SECURITY_ACTIVATION_VIDA = 0;
/** Citizen total in VIDA (5 VIDA = $5,000). Liquid + Lock. */
export const NET_SPENDABLE_VIDA = (LIQUID_TIER_USD + SOVEREIGN_LOCK_USD) / VIDA_PRICE_USD;

export { VIDA_PRICE_USD };
export const NAIRA_RATE = 1400;

/** Net citizen share in USD ($5,000). */
export const NET_SPENDABLE_USD = LIQUID_TIER_USD + SOVEREIGN_LOCK_USD;

export { getSentinelFeeUsd, getAvailableCashUsd };

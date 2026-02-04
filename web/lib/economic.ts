/**
 * PFF Economic Engine — $5,000 Security Milestone.
 * $5,000 Sovereign Grant: Liquid $1,000 (→ $900 after $100 Sentinel Fee) + Secured/National $4,100.
 */

/** Gross grant per vitalized citizen (USD) — $5,000 Security Milestone. */
export const GRANT_USD = 5_000;

/** National reserve (optional; $0 when full grant is citizen's). */
export const NATIONAL_RESERVE_VAULT_USD = 0;

/** Citizen's total ($5,000 primary secured asset). */
export const CITIZEN_TOTAL_USD = GRANT_USD;

/** Tier 1: Liquid — $1,000 before Sentinel; $900 after $100 Sentinel Fee. */
export const LIQUID_TIER_USD = 1_000;

/** Tier 2: Secured/National — $4,100 locked until global unlock. */
export const SOVEREIGN_LOCK_USD = 4_100;

/** Sentinel Activation: Single device. Deducted from Liquid. */
export const SENTINEL_SINGLE_USD = 50;

/** Sentinel Activation: Multi device. Deducted from Liquid ($100 → $900 after fee). */
export const SENTINEL_MULTI_USD = 100;

/** Sovereign Hub Access Fee — 0.1 VIDA = $100 USD. Deducted from Liquid; transferred to the device owner's primary wallet. */
export const HUB_SERVICE_FEE_VIDA = 0.1;
export const HUB_SERVICE_FEE_USD = 100;
/** Minimum new-user balance (VIDA) before hub fee transfer (transaction only after grant is issued). */
export const MIN_BALANCE_FOR_HUB_FEE_VIDA = 1.0;
/** Transaction history label for the hub fee. */
export const SOVEREIGN_HUB_ACCESS_FEE_LABEL = 'Sovereign Hub Access Fee';

/** Global user count required to unlock Sovereign Lock vault. */
export const GLOBAL_UNLOCK_COUNT = 1_000_000_000;

/** VIDA = $1,000 USD for display/ledger. */
export const VIDA_PRICE_USD = 1_000;

/** VIDA equivalents for UI/backend alignment. */
export const NATIONAL_RESERVE_VIDA = NATIONAL_RESERVE_VAULT_USD / VIDA_PRICE_USD;
export const LIQUID_TIER_VIDA = LIQUID_TIER_USD / VIDA_PRICE_USD;
export const SOVEREIGN_LOCK_VIDA = SOVEREIGN_LOCK_USD / VIDA_PRICE_USD;

/**
 * Sentinel fee in USD by tier.
 * Single = $50, Multi = $100 (deducted from Liquid $1,000).
 */
export function getSentinelFeeUsd(isMulti: boolean): number {
  return isMulti ? SENTINEL_MULTI_USD : SENTINEL_SINGLE_USD;
}

/**
 * Available cash (USD) after deducting Sentinel Activation from Liquid tier.
 * Activation is deducted from the Liquid $1,000 balance.
 */
export function getAvailableCashUsd(sentinelFeePaidUsd: number): number {
  const after = LIQUID_TIER_USD - sentinelFeePaidUsd;
  return Math.max(0, after);
}

export interface TripleVaultSummary {
  /** Primary secured asset (total grant). */
  primarySecuredUsd: number;
  /** Vault A: National Reserve (optional; $0 for $5k milestone). */
  nationalReserveUsd: number;
  /** Vault B: Secured/National — $4,100 (locked until 1B users). */
  futureWealthUsd: number;
  /** Vault C: Liquid — $900 after $100 Sentinel fee. */
  availableCashUsd: number;
  /** Sentinel fee already applied (for display). */
  sentinelFeeUsd: number;
}

/**
 * Summary for Triple Vault display.
 * Pass sentinelFeePaidUsd = 0 before activation; 50 or 100 after.
 */
export function getTripleVaultSummary(sentinelFeePaidUsd: number): TripleVaultSummary {
  return {
    primarySecuredUsd: GRANT_USD,
    nationalReserveUsd: NATIONAL_RESERVE_VAULT_USD,
    futureWealthUsd: SOVEREIGN_LOCK_USD,
    availableCashUsd: getAvailableCashUsd(sentinelFeePaidUsd),
    sentinelFeeUsd: sentinelFeePaidUsd,
  };
}

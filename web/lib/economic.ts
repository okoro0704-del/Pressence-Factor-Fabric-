/**
 * PFF Economic Engine — 50/50 National Handshake model.
 * $10,000 grant: first $5,000 → National Reserve (Contribution to the Nation);
 * remaining $5,000 split into Liquid ($1,000) and Sovereign Lock ($4,000).
 * Sentinel Activation ($50 Single / $100 Multi) is deducted from the Liquid tier.
 */

/** Gross grant per vitalized citizen (USD). */
export const GRANT_USD = 10_000;

/** First $5,000 routed immediately to NATIONAL_RESERVE_VAULT. Not spendable; visible as "Contribution to the Nation". */
export const NATIONAL_RESERVE_VAULT_USD = 5_000;

/** Citizen's share after national cut ($5,000). */
export const CITIZEN_TOTAL_USD = GRANT_USD - NATIONAL_RESERVE_VAULT_USD;

/** Tier 1: Liquid — available for immediate use after Sentinel Activation is paid. */
export const LIQUID_TIER_USD = 1_000;

/** Tier 2: Sovereign Lock — hard-locked until global counter reaches GLOBAL_UNLOCK_COUNT. */
export const SOVEREIGN_LOCK_USD = 4_000;

/** Sentinel Activation: Single device. Deducted from Liquid $1,000. */
export const SENTINEL_SINGLE_USD = 50;

/** Sentinel Activation: Multi device. Deducted from Liquid $1,000. */
export const SENTINEL_MULTI_USD = 100;

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
  /** Vault A: National Reserve — $5,000 (Contribution to the Nation). */
  nationalReserveUsd: number;
  /** Vault B: Future Wealth — $4,000 (locked until 1B users). */
  futureWealthUsd: number;
  /** Vault C: Available Cash — $1,000 minus Sentinel fee. */
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
    nationalReserveUsd: NATIONAL_RESERVE_VAULT_USD,
    futureWealthUsd: SOVEREIGN_LOCK_USD,
    availableCashUsd: getAvailableCashUsd(sentinelFeePaidUsd),
    sentinelFeeUsd: sentinelFeePaidUsd,
  };
}

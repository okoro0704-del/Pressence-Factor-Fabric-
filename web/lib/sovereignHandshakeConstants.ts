/**
 * Sovereign Handshake — 10 VIDA grant three-way split.
 * Aligns with core/economic.ts and backend minting.
 * Gross 10 VIDA → National Contribution 5, Security Activation 0.02 → Net Spendable 4.98.
 */

export const GROSS_SOVEREIGN_GRANT_VIDA = 10;
export const NATIONAL_CONTRIBUTION_VIDA = 5.0;   // government_treasury_vault
export const SECURITY_ACTIVATION_VIDA = 0.02;    // sentinel_business_ledger
export const NET_SPENDABLE_VIDA = 4.98;          // user_wallet

export const VIDA_PRICE_USD = 1000;
export const NAIRA_RATE = 1400;

/** Net Spendable in USD (4.98 × $1,000 = $4,980). */
export const NET_SPENDABLE_USD = NET_SPENDABLE_VIDA * VIDA_PRICE_USD;

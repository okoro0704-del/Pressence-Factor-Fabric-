/**
 * Sovereign Treasury Split — 5 VIDA minting.
 * National: 5 VIDA to National_Vault_Address (70% locked, 30% liquid).
 * Citizen: 5 VIDA total; 4/1 vesting: 4 VIDA locked 365 days, 1 VIDA spendable.
 * Sentinel: $100 (0.1 VIDA) from citizen spendable → Sentinel_Wallet_Address.
 * UI: Total Wealth 5 VIDA, Future Value (Locked) 4 VIDA, Current Power (Spendable) $900.
 */

import { VIDA_PRICE_USD, VIDA_USD_VALUE } from './economic';

/** Total citizen allocation (display). */
export const TOTAL_WEALTH_VIDA = 5;

/** Vesting: 4 VIDA locked for 365 days (untransferable). */
export const FUTURE_VALUE_LOCKED_VIDA = 4;

/** Spendable portion of citizen allocation (1 VIDA before Sentinel fee). */
export const CITIZEN_SPENDABLE_VIDA = 1;

/** Sentinel fee: $100 USD = 0.1 VIDA (derived from VIDA_USD_VALUE). Transferred to Sentinel_Wallet_Address. */
export const SENTINEL_FEE_USD = 100;
export const SENTINEL_FEE_VIDA = SENTINEL_FEE_USD / VIDA_USD_VALUE;

/** Citizen receives this on-chain (5 − 0.1 = 4.9); 4 is "locked" in app, 0.9 is spendable. */
export const CITIZEN_ONCHAIN_VIDA = TOTAL_WEALTH_VIDA - SENTINEL_FEE_VIDA;

/** Current Power (Spendable) after Sentinel: 1 − 0.1 = 0.9 VIDA = $900. */
export const CURRENT_POWER_SPENDABLE_VIDA = CITIZEN_SPENDABLE_VIDA - SENTINEL_FEE_VIDA;
export const CURRENT_POWER_SPENDABLE_USD = CURRENT_POWER_SPENDABLE_VIDA * VIDA_PRICE_USD;

/** Vesting period in days (4 VIDA locked for 365 days). */
export const VESTING_DAYS = 365;

/** When BETA_LIQUIDITY_TEST: effective spendable is full 1 VIDA = $1,000 (VIDA_USD_VALUE). */
export const FULL_SPENDABLE_VIDA = 1;
export const FULL_SPENDABLE_USD = VIDA_PRICE_USD;

/** National allocation: 5 VIDA to National_Vault_Address. 70% locked, 30% liquid (ledger/display). */
export const NATIONAL_ALLOCATION_VIDA = 5;
export const NATIONAL_LOCKED_PERCENT = 70;
export const NATIONAL_LIQUID_PERCENT = 30;

/**
 * Sovereign Treasury Split — Instant 11-VIDA mint (5 nation + 1 foundation + 5 user).
 * Citizen: 5 VIDA total. 1.0 spendable → after 0.1 Sentinel debit: 0.9 spendable, 4.1 locked.
 * Locked Reserve: 4.1 VIDA (0.1 Sentinel + 4.0 hard_locked until global_citizens >= 1B).
 * UI: Total Wealth 5 VIDA, Spendable 0.9 VIDA ($900), Locked Reserve 4.1 VIDA.
 */

import { VIDA_PRICE_USD, VIDA_USD_VALUE } from './economic';

/** Total citizen allocation (display). */
export const TOTAL_WEALTH_VIDA = 5;

/** Locked reserve: 4.0 global goal + 0.1 Sentinel Activation. */
export const FUTURE_VALUE_LOCKED_VIDA = 4.1;

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

/** Locked reserve unlocks when global_citizens >= 1B (no time-based vesting). */
export const LOCKED_RELEASE_CONDITION = 'global_citizens >= 1,000,000,000';

/** When BETA_LIQUIDITY_TEST: effective spendable is full 1 VIDA = $1,000 (VIDA_USD_VALUE). */
export const FULL_SPENDABLE_VIDA = 1;
export const FULL_SPENDABLE_USD = VIDA_PRICE_USD;

/** National allocation: 5 VIDA to National_Vault_Address. 70% locked, 30% liquid (ledger/display). */
export const NATIONAL_ALLOCATION_VIDA = 5;
export const NATIONAL_LOCKED_PERCENT = 70;
export const NATIONAL_LIQUID_PERCENT = 30;

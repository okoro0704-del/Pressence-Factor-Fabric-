/**
 * BETA LIQUIDITY TEST MODE
 * When enabled: no Sentinel fee, full 1 VIDA spendable ($1,000), Swap/Send unlocked without Sentinel, direct link to Sovryn AMM.
 * Set NEXT_PUBLIC_BETA_LIQUIDITY_TEST=1 in env to enable.
 */

import { VIDA_USD_VALUE } from './economic';

export const BETA_LIQUIDITY_TEST =
  typeof process !== 'undefined' &&
  process.env.NEXT_PUBLIC_BETA_LIQUIDITY_TEST === '1';

/** Full 1 VIDA = $1,000 (VIDA_USD_VALUE) when in beta test; otherwise use sovereignTreasurySplit (0.9 VIDA = $900). */
export const BETA_SPENDABLE_VIDA = 1;
export const BETA_SPENDABLE_USD = VIDA_USD_VALUE;

/** Sovryn AMM Swap — direct route for VIDA → DLLR testing. */
export const SOVRYN_AMM_SWAP_URL = 'https://live.sovryn.app/swap';

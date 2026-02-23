/**
 * vNGN (VIDA Naira) — placeholder for Unified Sovereign Treasury.
 * Exchange rate: current market NGN/USD (placeholder; update or fetch from oracle later).
 */

import { VNGN_ADDRESS } from './config';

/** Current market NGN per 1 USD. Placeholder; replace with live rate or oracle. */
export const NGN_PER_USD = 1_650;

/** vNGN token contract address (placeholder until deployed). */
export { VNGN_ADDRESS };

/** 1 USDT (≈ $1) = NGN_PER_USD vNGN (or Naira equivalent). */
export function usdtToVngn(usdtAmount: number): number {
  return usdtAmount * NGN_PER_USD;
}

/** vNGN amount to USDT. */
export function vngnToUsdt(vngnAmount: number): number {
  return vngnAmount / NGN_PER_USD;
}

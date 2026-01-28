/**
 * Wealth Secured Ticker — live calculation from total_handshakes.
 */

/** $ per handshake: fraud prevented per Digital Handshake (PFF Fabric). */
export const FRAUD_PREVENTION_VALUE = 50;

export function wealthFromHandshakes(totalHandshakes: number): number {
  return Math.floor(totalHandshakes * FRAUD_PREVENTION_VALUE);
}

export function formatWealthTicker(n: number): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

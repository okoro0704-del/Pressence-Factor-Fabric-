/**
 * PFF — Presence Factor Fabric
 * Crypto-safe nonce generation for Presence Proof. Prevents replay attacks.
 */

const NONCE_BYTES = 32;

function getCrypto(): Crypto {
  const g = (typeof globalThis !== 'undefined' ? globalThis : {}) as Record<string, unknown>;
  const c = g.crypto as Crypto | undefined;
  if (c && typeof c.getRandomValues === 'function') return c;
  throw new Error('crypto.getRandomValues not available. Import react-native-get-random-values in app entry.');
}

/**
 * Generate a cryptographically secure nonce (hex).
 * Uses crypto.getRandomValues (polyfilled by react-native-get-random-values).
 */
export function generateNonce(): string {
  const bytes = new Uint8Array(NONCE_BYTES);
  getCrypto().getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * PFF — Unit tests for nonce generation.
 */
import { generateNonce } from '../nonce';

describe('generateNonce', () => {
  it('returns a 32-char hex string', () => {
    const n = generateNonce();
    expect(typeof n).toBe('string');
    expect(n).toMatch(/^[a-f0-9]{32}$/);
  });

  it('produces different values on each call', () => {
    const a = generateNonce();
    const b = generateNonce();
    expect(a).not.toBe(b);
  });
});

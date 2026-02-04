/**
 * Sovereign Recovery Key (Master Seed) — BIP-39 12-word phrase.
 * Seed generation, verification, hash for storage, and AES-256 encryption.
 * Decryption key is only available after Authenticated Face Pulse (session-gated).
 */

import * as bip39 from 'bip39';

const WORD_COUNT = 12;
const ENTROPY_BITS = 128; // 12 words

/** Generate a unique 12-word recovery phrase (BIP-39). */
export function generateMnemonic12(): string {
  return bip39.generateMnemonic(ENTROPY_BITS);
}

/** Validate a 12-word phrase (BIP-39). Returns true if valid. */
export function validateMnemonic(phrase: string): boolean {
  const normalized = phrase.trim().toLowerCase().replace(/\s+/g, ' ');
  return bip39.validateMnemonic(normalized);
}

/** Normalize user-entered phrase (lowercase, single spaces). */
export function normalizeMnemonic(phrase: string): string {
  return phrase.trim().toLowerCase().replace(/\s+/g, ' ').trim();
}

/** Words as array (1-based indices for UI). */
export function mnemonicToWords(phrase: string): string[] {
  return normalizeMnemonic(phrase).split(' ');
}

/** Pick 3 random indices (1-based) for verification test. */
export function pick3RandomIndices(): number[] {
  const indices: number[] = [];
  while (indices.length < 3) {
    const n = 1 + Math.floor(Math.random() * WORD_COUNT);
    if (!indices.includes(n)) indices.push(n);
  }
  return indices.sort((a, b) => a - b);
}

/** Verify that the user's answers match the phrase at the given 1-based indices. */
export function verify3Words(phrase: string, indices: number[], answers: string[]): boolean {
  const words = mnemonicToWords(phrase);
  if (words.length !== WORD_COUNT || indices.length !== 3 || answers.length !== 3) return false;
  return indices.every((oneBased, i) => {
    const w = words[oneBased - 1];
    const a = (answers[i] ?? '').trim().toLowerCase();
    return w === a;
  });
}

/** SHA-256 hash of seed for storage (recovery verification). */
export async function hashSeedForStorage(phrase: string): Promise<string> {
  const normalized = normalizeMnemonic(phrase);
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Derive AES key from identity + salt (PBKDF2). Key only used after Face Pulse in session. */
async function deriveKey(identityAnchor: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(identityAnchor),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/** Encrypt seed with AES-256-GCM. Key derived from identity + salt. */
export async function encryptSeed(
  phrase: string,
  identityAnchor: string
): Promise<{ encryptedHex: string; ivHex: string; saltHex: string }> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(identityAnchor, salt);
  const encoder = new TextEncoder();
  const plaintext = encoder.encode(normalizeMnemonic(phrase));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    plaintext
  );
  const toHex = (buf: ArrayBuffer | Uint8Array) =>
    Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  return {
    encryptedHex: toHex(ciphertext),
    ivHex: toHex(iv),
    saltHex: toHex(salt),
  };
}

/** Decrypt seed (only call after Authenticated Face Pulse — identity in session). */
export async function decryptSeed(
  encryptedHex: string,
  ivHex: string,
  saltHex: string,
  identityAnchor: string
): Promise<string> {
  const fromHex = (hex: string) =>
    new Uint8Array(hex.match(/.{1,2}/g)!.map((b) => parseInt(b, 16)));
  const salt = fromHex(saltHex);
  const iv = fromHex(ivHex);
  const encrypted = fromHex(encryptedHex);
  const key = await deriveKey(identityAnchor, salt);
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encrypted
  );
  return new TextDecoder().decode(decrypted);
}

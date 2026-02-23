/**
 * PFF × Sovryn — Internal signer from recovery seed (no MetaMask/Connect Wallet).
 * Swap and Send use this so the user never sees a wallet connection popup.
 * SECURITY: Private key is never stored; only exists in app memory during the transaction.
 */

import { ethers } from 'ethers';
import { getSupabase } from '../supabase';
import { decryptSeed } from '../recoverySeed';
import { RSK_DERIVATION_PATH } from './derivedWallet';
import { getRSKProvider } from './wallet';

/** Minimum RBTC balance (in RBTC) to consider "has gas". Below this, trigger relayer for first swap. */
export const MIN_RBTC_FOR_GAS = 0.0001;

/**
 * Create an ethers Wallet connected to Rootstock (RSK) from a decrypted mnemonic.
 * Use for signing swap/send; mnemonic must only be passed in memory — never store in plain text.
 * Caller is responsible for clearing any mnemonic reference after use.
 */
export async function getSovereignSigner(decryptedMnemonic: string): Promise<ethers.Wallet | null> {
  const normalized = decryptedMnemonic?.trim().toLowerCase().replace(/\s+/g, ' ');
  if (!normalized || normalized.split(' ').length < 12) return null;
  try {
    const rskWallet = ethers.Wallet.fromMnemonic(normalized, RSK_DERIVATION_PATH);
    const provider = await getRSKProvider();
    return rskWallet.connect(provider);
  } catch {
    return null;
  }
}

/** Encrypted seed payload (e.g. from SovereignSeedContext). Decryption uses identity anchor (phone) or PIN when supported. */
export interface EncryptedSeedPayload {
  recovery_seed_encrypted: string;
  recovery_seed_iv: string;
  recovery_seed_salt: string;
}

/** Get decrypted mnemonic from DB (for internal signer). Mnemonic only in memory. */
async function getDecryptedMnemonicFromDB(phoneNumber: string): Promise<string | null> {
  const trimmed = phoneNumber?.trim();
  if (!trimmed) return null;

  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await (supabase as any)
    .from('user_profiles')
    .select('recovery_seed_encrypted, recovery_seed_iv, recovery_seed_salt')
    .eq('phone_number', trimmed)
    .maybeSingle();

  if (error || !data?.recovery_seed_encrypted || !data?.recovery_seed_iv || !data?.recovery_seed_salt) return null;

  return decryptSeed(
    data.recovery_seed_encrypted,
    data.recovery_seed_iv,
    data.recovery_seed_salt,
    trimmed
  );
}

/**
 * Decrypt seed using identity anchor (phone). PIN-based decryption can be added when seed is stored with PIN-derived key.
 * Returns raw 12 words for ethers.Wallet.fromPhrase / getSovereignSigner.
 */
export async function decryptSeedToMnemonic(
  payload: EncryptedSeedPayload,
  identityAnchor: string,
  _pin?: string
): Promise<string | null> {
  try {
    const mnemonic = await decryptSeed(
      payload.recovery_seed_encrypted,
      payload.recovery_seed_iv,
      payload.recovery_seed_salt,
      identityAnchor
    );
    return mnemonic?.trim() ? mnemonic : null;
  } catch {
    return null;
  }
}

/**
 * Return an ethers Wallet connected to RSK for the identity anchor (phone).
 * When encryptedSeed is provided (e.g. from SovereignSeedContext), uses it and decrypts with phone — no DB fetch.
 * Otherwise fetches from DB, decrypts in memory, derives signer. Key never persisted.
 */
export async function getInternalSigner(
  phoneNumber: string,
  options?: { encryptedSeed?: EncryptedSeedPayload }
): Promise<Wallet | null> {
  const trimmed = phoneNumber?.trim();
  if (!trimmed) return null;

  let mnemonic: string | null = null;

  if (options?.encryptedSeed) {
    mnemonic = await decryptSeedToMnemonic(options.encryptedSeed, trimmed);
  }
  if (!mnemonic) {
    mnemonic = await getDecryptedMnemonicFromDB(trimmed);
  }

  if (!mnemonic) return null;
  return getSovereignSigner(mnemonic);
}

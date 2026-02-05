/**
 * PFF × Sovryn — Internal signer from recovery seed (no MetaMask/Connect Wallet).
 * Swap and Send use this so the user never sees a wallet connection popup.
 * SECURITY: Private key is never stored; only exists in app memory during the transaction.
 */

import { HDNodeWallet, Wallet } from 'ethers';
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
export async function getSovereignSigner(decryptedMnemonic: string): Promise<Wallet | null> {
  const normalized = decryptedMnemonic?.trim().toLowerCase().replace(/\s+/g, ' ');
  if (!normalized || normalized.split(' ').length < 12) return null;
  try {
    const hd = HDNodeWallet.fromPhrase(normalized);
    const rskWallet = hd.derivePath(RSK_DERIVATION_PATH);
    const provider = await getRSKProvider();
    return new Wallet(rskWallet.privateKey, provider);
  } catch {
    return null;
  }
}

/** Get decrypted mnemonic from DB (for internal signer). Mnemonic only in memory. */
async function getDecryptedMnemonic(phoneNumber: string): Promise<string | null> {
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
 * Return an ethers Wallet connected to RSK for the identity anchor (phone).
 * Fetches encrypted seed from DB, decrypts in memory, derives signer — key never persisted.
 * Use for Swap/Send so no Connect Wallet popup is shown.
 */
export async function getInternalSigner(phoneNumber: string): Promise<Wallet | null> {
  const mnemonic = await getDecryptedMnemonic(phoneNumber);
  if (!mnemonic) return null;
  return getSovereignSigner(mnemonic);
}

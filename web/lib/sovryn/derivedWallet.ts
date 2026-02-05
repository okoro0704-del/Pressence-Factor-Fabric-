/**
 * PFF × Sovryn — Wallet derivation from recovery_seed_encrypted (decrypted locally).
 * Uses BIP44 path for Rootstock (RSK): m/44'/137'/0'/0/0.
 */

import { HDNodeWallet } from 'ethers';
import { getSupabase } from '../supabase';
import { decryptSeed } from '../recoverySeed';

/** BIP44 path for Rootstock MainNet (coin type 137). */
export const RSK_DERIVATION_PATH = "m/44'/137'/0'/0/0";

export interface DerivedWalletResult {
  address: string;
  /** Only set if caller needs signer; normally we only need address for mint recipient. */
  mnemonic?: string;
}

/**
 * Fetch recovery_seed_encrypted, iv, salt from user_profiles; decrypt locally with identity anchor; derive RSK wallet address.
 * Call only in secure context (e.g. after Face Pulse); mnemonic is not persisted in return unless explicitly requested.
 */
export async function deriveRSKWalletFromSeed(
  phoneNumber: string,
  options?: { returnMnemonic?: boolean }
): Promise<{ ok: true; address: string; mnemonic?: string } | { ok: false; error: string }> {
  const trimmed = phoneNumber?.trim();
  if (!trimmed) return { ok: false, error: 'Phone number required' };

  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: 'Supabase not available' };

  try {
    const { data, error } = await (supabase as any)
      .from('user_profiles')
      .select('recovery_seed_encrypted, recovery_seed_iv, recovery_seed_salt')
      .eq('phone_number', trimmed)
      .maybeSingle();

    if (error) return { ok: false, error: error.message ?? 'Failed to fetch seed' };
    if (!data?.recovery_seed_encrypted || !data?.recovery_seed_iv || !data?.recovery_seed_salt) {
      return { ok: false, error: 'Recovery seed not found or incomplete' };
    }

    const mnemonic = await decryptSeed(
      data.recovery_seed_encrypted,
      data.recovery_seed_iv,
      data.recovery_seed_salt,
      trimmed
    );

    const hd = HDNodeWallet.fromPhrase(mnemonic);
    const rskWallet = hd.derivePath(RSK_DERIVATION_PATH);
    const address = rskWallet.address;

    const result: { ok: true; address: string; mnemonic?: string } = { ok: true, address };
    if (options?.returnMnemonic) result.mnemonic = mnemonic;
    return result;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

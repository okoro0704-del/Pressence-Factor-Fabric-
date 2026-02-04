/**
 * Sovereign Recovery Key storage — Supabase user_profiles.
 * Stores recovery_seed_hash (for recovery verification) and AES-256 encrypted seed.
 * Decryption key is only available after Authenticated Face Pulse (session-gated).
 */

import { getSupabase } from './supabase';
import { hashSeedForStorage, encryptSeed, validateMnemonic, normalizeMnemonic } from './recoverySeed';

export interface StoredRecoverySeed {
  recoverySeedHash: string;
  recoverySeedEncrypted: string;
  recoverySeedIv: string;
  recoverySeedSalt: string;
}

/**
 * Store recovery seed: hash (for recovery flow) + encrypted seed (AES-256).
 * Call after user passes 3-word verification during enrollment.
 * If profile does not exist, inserts with fullName (e.g. from identity anchor).
 */
export async function storeRecoverySeed(
  phoneNumber: string,
  phrase: string,
  fullName?: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const normalized = normalizeMnemonic(phrase);
  if (!normalized || normalized.split(' ').length !== 12) {
    return { ok: false, error: 'Invalid 12-word phrase' };
  }

  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: 'Supabase not available' };

  try {
    const [recoverySeedHash, encrypted] = await Promise.all([
      hashSeedForStorage(normalized),
      encryptSeed(normalized, phoneNumber.trim()),
    ]);

    const { data: existing } = await (supabase as any)
      .from('user_profiles')
      .select('phone_number')
      .eq('phone_number', phoneNumber.trim())
      .maybeSingle();

    if (existing) {
      const { error } = await (supabase as any)
        .from('user_profiles')
        .update({
          recovery_seed_hash: recoverySeedHash,
          recovery_seed_encrypted: encrypted.encryptedHex,
          recovery_seed_iv: encrypted.ivHex,
          recovery_seed_salt: encrypted.saltHex,
          updated_at: new Date().toISOString(),
        })
        .eq('phone_number', phoneNumber.trim());

      if (error) return { ok: false, error: error.message ?? 'Failed to store recovery seed' };
    } else {
      const { error: insertError } = await (supabase as any)
        .from('user_profiles')
        .insert({
          phone_number: phoneNumber.trim(),
          full_name: fullName?.trim() || '—',
          recovery_seed_hash: recoverySeedHash,
          recovery_seed_encrypted: encrypted.encryptedHex,
          recovery_seed_iv: encrypted.ivHex,
          recovery_seed_salt: encrypted.saltHex,
          updated_at: new Date().toISOString(),
        });
      if (insertError) {
        return { ok: false, error: insertError.message ?? 'Failed to create profile with recovery seed' };
      }
    }

    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

/** Check if user has a recovery seed stored (hash present). */
export async function hasRecoverySeed(phoneNumber: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  const { data, error } = await (supabase as any)
    .from('user_profiles')
    .select('recovery_seed_hash')
    .eq('phone_number', phoneNumber.trim())
    .maybeSingle();
  if (error || !data) return false;
  return !!(data.recovery_seed_hash && String(data.recovery_seed_hash).length > 0);
}

/**
 * Verify recovery phrase (for Recover My Account flow).
 * Compares hash of entered phrase with stored recovery_seed_hash.
 */
export async function verifyRecoveryPhrase(
  phoneNumber: string,
  phrase: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const normalized = normalizeMnemonic(phrase);
  if (!validateMnemonic(normalized)) {
    return { ok: false, error: 'Invalid recovery phrase. Check the 12 words and try again.' };
  }

  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: 'Supabase not available' };

  const { data, error } = await (supabase as any)
    .from('user_profiles')
    .select('recovery_seed_hash')
    .eq('phone_number', phoneNumber.trim())
    .maybeSingle();

  if (error || !data) {
    return { ok: false, error: 'Account not found or no recovery seed on file.' };
  }

  const storedHash = data.recovery_seed_hash;
  if (!storedHash) {
    return { ok: false, error: 'No recovery seed on file for this account.' };
  }

  const enteredHash = await hashSeedForStorage(normalized);
  if (enteredHash !== storedHash) {
    return { ok: false, error: 'Recovery phrase does not match. Check your 12 words and try again.' };
  }

  return { ok: true };
}

/**
 * Unbind account from device (Recover My Account).
 * Clears primary_sentinel_device_id so the user can log in on a new device.
 * Call after verifying recovery phrase.
 */
export async function unbindAccountFromDevice(phoneNumber: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: 'Supabase not available' };
  try {
    const { error: profileError } = await (supabase as any)
      .from('user_profiles')
      .update({
        primary_sentinel_device_id: null,
        primary_sentinel_assigned_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('phone_number', phoneNumber.trim());

    if (profileError) {
      return { ok: false, error: profileError.message ?? 'Failed to unbind device' };
    }

    // Revoke all authorized_devices for this phone so lost device is no longer authorized
    const { error: devicesError } = await (supabase as any)
      .from('authorized_devices')
      .update({ status: 'REVOKED', updated_at: new Date().toISOString() })
      .eq('phone_number', phoneNumber.trim());

    if (devicesError) {
      console.warn('[recoverySeedStorage] authorized_devices revoke (may not exist):', devicesError.message);
      // Not fatal — table may not have this column or row
    }

    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

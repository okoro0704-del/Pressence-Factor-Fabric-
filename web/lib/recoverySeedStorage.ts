/**
 * Sovereign Recovery Key storage — Supabase user_profiles.
 * Stores recovery_seed_hash (for recovery verification) and AES-256 encrypted seed.
 * Decryption key is only available after Authenticated Face Pulse (session-gated).
 * BIOMETRIC DATA IS HASHED AND ENCRYPTED. RAW IMAGES ARE NEVER PERSISTED.
 */

import { getSupabase } from './supabase';
import { hashSeedForStorage, encryptSeed, validateMnemonic, normalizeMnemonic } from './recoverySeed';

/** Explicit column mapping for user_profiles recovery seed update (avoids Schema Cache issues). */
export interface UserProfileRecoverySeedUpdate {
  recovery_seed_hash: string;
  recovery_seed_encrypted: string;
  recovery_seed_iv: string;
  recovery_seed_salt: string;
  updated_at: string;
}

export interface StoredRecoverySeed {
  recoverySeedHash: string;
  recoverySeedEncrypted: string;
  recoverySeedIv: string;
  recoverySeedSalt: string;
}

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 800;

function isSchemaCacheError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('schema') ||
    lower.includes('reload') ||
    lower.includes('recovery_seed') ||
    lower.includes('column') && (lower.includes('does not exist') || lower.includes('unknown'))
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Store recovery seed via direct .update()/.insert(); on schema-cache-like failure, retry up to 3 times then fallback to RPC save_recovery_seed.
 * Only surfaces "Schema Cache" to user after all retries and RPC fallback fail.
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

  let lastError: string = '';

  try {
    const [recoverySeedHash, encrypted] = await Promise.all([
      hashSeedForStorage(normalized),
      encryptSeed(normalized, phoneNumber.trim()),
    ]);

    const payload = {
      recovery_seed_hash: recoverySeedHash,
      recovery_seed_encrypted: encrypted.encryptedHex,
      recovery_seed_iv: encrypted.ivHex,
      recovery_seed_salt: encrypted.saltHex,
      updated_at: new Date().toISOString(),
    };
    const fullNameVal = fullName?.trim() || '—';

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      lastError = '';
      try {
        const { data: existing } = await (supabase as any)
          .from('user_profiles')
          .select('id, phone_number')
          .eq('phone_number', phoneNumber.trim())
          .maybeSingle();

        if (existing?.id) {
          const { error } = await (supabase as any)
            .from('user_profiles')
            .update(payload)
            .eq('id', existing.id);
          if (error) {
            lastError = error.message ?? 'Update failed';
            if (isSchemaCacheError(lastError) && attempt < MAX_RETRIES) {
              await sleep(RETRY_DELAY_MS);
              continue;
            }
            break;
          }
          return { ok: true };
        }

        const { error: insertError } = await (supabase as any)
          .from('user_profiles')
          .insert({
            phone_number: phoneNumber.trim(),
            full_name: fullNameVal,
            ...payload,
          });
        if (insertError) {
          lastError = insertError.message ?? 'Insert failed';
          if (isSchemaCacheError(lastError) && attempt < MAX_RETRIES) {
            await sleep(RETRY_DELAY_MS);
            continue;
          }
          break;
        }
        return { ok: true };
      } catch (e) {
        lastError = e instanceof Error ? e.message : String(e);
        if (attempt < MAX_RETRIES) await sleep(RETRY_DELAY_MS);
      }
    }

    if (lastError && isSchemaCacheError(lastError)) {
      const { data: rpcData, error: rpcError } = await (supabase as any).rpc('save_recovery_seed', {
        p_phone_number: phoneNumber.trim(),
        p_recovery_seed_hash: payload.recovery_seed_hash,
        p_recovery_seed_encrypted: payload.recovery_seed_encrypted,
        p_recovery_seed_iv: payload.recovery_seed_iv,
        p_recovery_seed_salt: payload.recovery_seed_salt,
        p_full_name: fullNameVal,
      });
      const out = rpcData ?? (rpcError ? null : undefined);
      if (out && typeof out === 'object' && (out as any).ok === true) return { ok: true };
      if (rpcError?.message) lastError = rpcError.message;
      else if (out && typeof out === 'object' && (out as any).error) lastError = (out as any).error;
    }

    return { ok: false, error: lastError || 'Failed to store recovery seed' };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

/**
 * Confirm that recovery_seed_hash was persisted (database has the column set).
 * Call after storeRecoverySeed to ensure Success screen only shows once DB is updated.
 */
export async function confirmRecoverySeedStored(phoneNumber: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  const { data, error } = await (supabase as any)
    .from('user_profiles')
    .select('recovery_seed_hash')
    .eq('phone_number', phoneNumber.trim())
    .maybeSingle();
  if (error || !data) return false;
  const val = data.recovery_seed_hash;
  return typeof val === 'string' && val.length > 0;
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

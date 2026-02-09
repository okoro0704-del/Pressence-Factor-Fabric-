/**
 * Device Anchors — sovereign link: map WebAuthn credential_id (hashed) to citizen_hash
 * in Supabase device_anchors table. Used for native device auth login resolution.
 */

import { getSupabase } from './supabase';

export async function hashCredentialId(credentialId: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(String(credentialId).trim());
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function linkPasskeyToDeviceAnchors(
  credentialId: string,
  phoneNumber: string,
  citizenHash: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: 'Supabase not available.' };
  try {
    const credentialIdHash = await hashCredentialId(credentialId);
    const { error } = await (supabase as any)
      .from('device_anchors')
      .upsert(
        {
          phone_number: phoneNumber.trim(),
          citizen_hash: citizenHash.trim(),
          credential_id_hash: credentialIdHash,
          created_at: new Date().toISOString(),
        },
        { onConflict: 'credential_id_hash', ignoreDuplicates: false }
      );
    if (error) return { ok: false, error: error.message ?? 'Failed to link passkey.' };
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

export async function resolveIdentityFromCredentialId(credentialId: string): Promise<{
  phone: string;
  citizenHash: string;
} | null> {
  const credentialIdHash = await hashCredentialId(credentialId);
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await (supabase as any)
    .from('device_anchors')
    .select('phone_number, citizen_hash')
    .eq('credential_id_hash', credentialIdHash)
    .maybeSingle();
  if (error || !data?.phone_number || !data?.citizen_hash) return null;
  return { phone: data.phone_number.trim(), citizenHash: data.citizen_hash.trim() };
}

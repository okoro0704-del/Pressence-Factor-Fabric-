/**
 * Sovereign Device Handshake — share device_anchor_token and citizen_hash from phone to laptop
 * via temporary Supabase row. Laptop reads on APPROVED, applies anchor, then deletes.
 */

import { getSupabase } from './supabase';

export interface HandshakePayload {
  citizen_hash: string;
  device_anchor_token: string | null;
}

/**
 * Phone: after approving login, write anchor payload for the laptop to read.
 */
export async function sendHandshakePayload(
  requestId: string,
  citizenHash: string,
  deviceAnchorToken: string | null
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: 'Supabase not available' };
  try {
    const { error } = await (supabase as any)
      .from('sovereign_device_handshake')
      .insert({
        request_id: requestId,
        citizen_hash: citizenHash.trim(),
        device_anchor_token: deviceAnchorToken?.trim() ?? null,
      });
    if (error) return { ok: false, error: error.message ?? 'Failed to send handshake' };
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

/**
 * Laptop: fetch handshake payload for this request (call after login request is APPROVED).
 */
export async function getHandshakePayload(requestId: string): Promise<HandshakePayload | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  try {
    const { data, error } = await (supabase as any)
      .from('sovereign_device_handshake')
      .select('citizen_hash, device_anchor_token')
      .eq('request_id', requestId)
      .maybeSingle();
    if (error || !data) return null;
    return {
      citizen_hash: data.citizen_hash ?? '',
      device_anchor_token: data.device_anchor_token ?? null,
    };
  } catch {
    return null;
  }
}

/**
 * Laptop: delete handshake row after consuming (keeps table clean).
 */
export async function deleteHandshakePayload(requestId: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  try {
    await (supabase as any).from('sovereign_device_handshake').delete().eq('request_id', requestId);
  } catch {
    // ignore
  }
}

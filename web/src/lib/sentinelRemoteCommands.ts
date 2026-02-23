/**
 * Sentinel Remote Commands — Sentinel (laptop) can remotely wake the scanner on the user's phone.
 * Insert a row into sentinel_remote_commands; the phone subscribes via Supabase Realtime and calls triggerExternalCapture().
 */

import { getSupabase } from './supabase';

export type SentinelRemoteCommand = 'wake_scanner';

/**
 * Send a remote command to the user's phone (e.g. wake scanner).
 * Call this from the Sentinel laptop UI when the operator clicks "Wake scanner on phone".
 */
export async function sendSentinelRemoteCommand(
  phoneNumber: string,
  command: SentinelRemoteCommand = 'wake_scanner'
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: 'Supabase not configured' };
  const trimmed = phoneNumber.trim();
  if (!trimmed) return { ok: false, error: 'phoneNumber required' };

  const { error } = await (supabase as any)
    .from('sentinel_remote_commands')
    .insert({ phone_number: trimmed, command });

  if (error) return { ok: false, error: error.message ?? 'Failed to send command' };
  return { ok: true };
}

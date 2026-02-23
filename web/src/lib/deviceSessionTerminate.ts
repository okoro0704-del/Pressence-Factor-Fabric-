/**
 * Remote logout — Terminate Session for a linked device.
 * Inserts into device_session_terminate; the target device subscribes via Realtime and runs location.reload().
 */

import { getSupabase } from './supabase';

/** Request that a device terminate its session (will reload and hit auth, redirect to login). */
export async function requestDeviceTerminate(deviceId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: 'Supabase not available' };
  if (!deviceId?.trim()) return { ok: false, error: 'Device ID required' };
  try {
    const { error } = await (supabase as any)
      .from('device_session_terminate')
      .insert({ device_id: deviceId.trim() });
    if (error) return { ok: false, error: error.message ?? 'Failed to request terminate' };
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

/**
 * Subscribe to terminate requests for this device. When a row with our device_id appears, run location.reload().
 * Call once when app mounts (e.g. in a provider or layout). Returns unsubscribe.
 */
export function subscribeToTerminateRequest(myDeviceId: string, onTerminate: () => void): () => void {
  const supabase = getSupabase();
  if (!supabase?.channel) return () => {};

  const channel = (supabase as any)
    .channel(`device_terminate_${myDeviceId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'device_session_terminate',
        filter: `device_id=eq.${myDeviceId}`,
      },
      () => {
        onTerminate();
      }
    )
    .subscribe();

  return () => {
    (supabase as any).removeChannel(channel);
  };
}

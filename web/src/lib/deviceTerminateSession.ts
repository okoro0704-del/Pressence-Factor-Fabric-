/**
 * Remote Terminate Session — when "Terminate Session" is clicked for a device in Linked Devices,
 * the target device receives a signal (via Supabase Realtime or table) and runs location.reload()
 * so auth-check kicks it to the login screen.
 */

import { getSupabase } from './supabase';

/** Request that a device terminate its session (reload). Inserts into device_session_terminate so the device's Realtime subscription fires. */
export async function requestTerminateSession(deviceId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: 'Supabase not available' };
  if (!deviceId?.trim()) return { ok: false, error: 'Device ID required' };
  try {
    const { error } = await (supabase as any)
      .from('device_session_terminate')
      .insert({ device_id: deviceId.trim() });
    if (error) return { ok: false, error: error.message ?? 'Failed to send terminate signal' };
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

/**
 * Subscribe to terminate signals for this device. When an INSERT for this device_id is received, call onTerminate (e.g. location.reload).
 * Returns unsubscribe function.
 */
export function subscribeToTerminateSession(
  myDeviceId: string,
  onTerminate: () => void
): () => void {
  const supabase = getSupabase();
  if (!supabase || !myDeviceId?.trim()) return () => {};

  const channel = (supabase as any)
    .channel(`device_terminate_${myDeviceId.replace(/[^a-zA-Z0-9-]/g, '_')}`)
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
    try {
      supabase.removeChannel(channel);
    } catch {
      // ignore
    }
  };
}

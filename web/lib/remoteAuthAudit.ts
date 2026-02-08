/**
 * Remote Biometric Authorization — audit log for denied/failed attempts.
 * "Unauthorized Access Blocked" when laptop login is denied or DNA scan fails.
 */

import { getSupabase } from './supabase';

const EVENT_TYPE = 'UNAUTHORIZED_ACCESS_BLOCKED';
const MESSAGE = 'Unauthorized Access Blocked.';

export interface UnauthorizedAccessContext {
  phone_number: string;
  request_id?: string;
  requesting_device_name?: string;
  reason?: 'denied' | 'scan_failed' | 'ignored' | 'timeout';
}

/**
 * Log an "Unauthorized Access Blocked" entry to sovereign_audit_log.
 * Call when remote login is denied, DNA scan fails, or request is ignored/timed out.
 */
export async function logUnauthorizedAccessBlocked(ctx: UnauthorizedAccessContext): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  const detail =
    [ctx.requesting_device_name, ctx.reason].filter(Boolean).join(' — ') || undefined;
  try {
    await (supabase as any)
      .from('sovereign_audit_log')
      .insert({
        phone_number: ctx.phone_number.trim(),
        event_type: EVENT_TYPE,
        severity: 'HIGH',
        message: detail ? `${MESSAGE} (${detail})` : MESSAGE,
        reviewed: false,
      });
  } catch (e) {
    console.warn('[remoteAuthAudit] Failed to log:', e);
  }
}

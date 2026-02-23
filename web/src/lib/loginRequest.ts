/**
 * Login Request — Computer enters phone → create PENDING;
 * Phone approves → APPROVED; Computer fetches user data, sets session, redirects, deletes row.
 */

import { getSupabase } from './supabase';
import { setIdentityAnchorForSession } from './sentinelActivation';
import { setSessionIdentity } from './sessionIsolation';

export interface LoginRequestRow {
  id: string;
  phone_number: string;
  requested_display_name: string | null;
  status: 'PENDING' | 'APPROVED' | 'DENIED';
  device_info: Record<string, unknown> | null;
  created_at: string;
  responded_at: string | null;
  approver_device_id?: string | null;
  fingerprint_token?: string | null;
}

/**
 * Create a login request (computer). Returns request id.
 * Use this when no face verification is required (e.g. main device flow).
 */
export async function createLoginRequest(
  phoneNumber: string,
  displayName?: string,
  deviceInfo?: Record<string, unknown>
): Promise<{ ok: true; requestId: string } | { ok: false; error: string }> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: 'Supabase not available' };
  const trimmed = phoneNumber?.trim();
  if (!trimmed) return { ok: false, error: 'Phone number required.' };
  try {
    const { data, error } = await (supabase as any)
      .from('login_requests')
      .insert({
        phone_number: trimmed,
        requested_display_name: displayName?.trim() || null,
        status: 'PENDING',
        device_info: deviceInfo ?? null,
      })
      .select('id')
      .single();
    if (error) return { ok: false, error: error.message ?? 'Failed to create login request' };
    const id = data?.id;
    if (!id) return { ok: false, error: 'No id returned' };
    return { ok: true, requestId: id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

/**
 * Verify face against stored identity, then create login request (sub-device flow).
 * Backend enforces: only the same face as stored for this phone can create a request.
 * Number + different face → 403, never gains access.
 */
export async function verifyFaceAndCreateLoginRequest(
  phoneNumber: string,
  liveFaceHash: string,
  displayName?: string,
  deviceInfo?: Record<string, unknown>
): Promise<{ ok: true; requestId: string } | { ok: false; error: string; code?: string }> {
  const trimmed = phoneNumber?.trim();
  const faceHash = liveFaceHash?.trim();
  if (!trimmed || !faceHash) return { ok: false, error: 'Phone number and face hash required.' };
  try {
    const res = await fetch('/api/v1/verify-face-create-login-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone_number: trimmed,
        face_hash: faceHash,
        requested_display_name: displayName?.trim() || null,
        device_info: deviceInfo ?? null,
      }),
    });
    const json = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      error?: string;
      requestId?: string;
      code?: string;
    };
    if (res.ok && json.ok === true && json.requestId) {
      return { ok: true, requestId: json.requestId };
    }
    return {
      ok: false,
      error: json.error ?? (res.status === 403 ? 'Face does not match. Access denied.' : 'Request failed'),
      code: json.code,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

/**
 * Approve a login request (phone). Updates status to APPROVED.
 */
export async function approveLoginRequest(requestId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: 'Supabase not available' };
  try {
    const { error } = await (supabase as any)
      .from('login_requests')
      .update({ status: 'APPROVED', responded_at: new Date().toISOString() })
      .eq('id', requestId)
      .eq('status', 'PENDING');
    if (error) return { ok: false, error: error.message ?? 'Failed to approve' };
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

/**
 * Approve a login request from phone with Device ID + Fingerprint-Signed Token (Link Device / QR scan flow).
 * Laptop detects this via Realtime and unlocks. Stores approver_device_id and fingerprint_token on the row.
 */
export async function approveLoginRequestWithDeviceToken(
  requestId: string,
  approverDeviceId: string,
  fingerprintToken: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: 'Supabase not available' };
  try {
    const { error } = await (supabase as any)
      .from('login_requests')
      .update({
        status: 'APPROVED',
        responded_at: new Date().toISOString(),
        approver_device_id: approverDeviceId.trim(),
        fingerprint_token: fingerprintToken.trim(),
      })
      .eq('id', requestId)
      .eq('status', 'PENDING');
    if (error) return { ok: false, error: error.message ?? 'Failed to approve' };
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

/**
 * Deny a login request (phone). Updates status to DENIED.
 */
export async function denyLoginRequest(requestId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: 'Supabase not available' };
  try {
    const { error } = await (supabase as any)
      .from('login_requests')
      .update({ status: 'DENIED', responded_at: new Date().toISOString() })
      .eq('id', requestId)
      .eq('status', 'PENDING');
    if (error) return { ok: false, error: error.message ?? 'Failed to deny' };
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

/**
 * Fetch current status of a login request (for polling fallback).
 */
export async function getLoginRequestStatus(
  requestId: string
): Promise<{ status: LoginRequestRow['status'] } | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await (supabase as any)
    .from('login_requests')
    .select('status')
    .eq('id', requestId)
    .maybeSingle();
  if (error || !data) return null;
  return { status: data.status };
}

/**
 * Fetch full login request row (when status is APPROVED). Used by the login bridge to get phone_number.
 */
export async function getLoginRequestFull(requestId: string): Promise<LoginRequestRow | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await (supabase as any)
    .from('login_requests')
    .select('*')
    .eq('id', requestId)
    .eq('status', 'APPROVED')
    .maybeSingle();
  if (error || !data) return null;
  return data as LoginRequestRow;
}

/**
 * Delete a login request row after successful session injection and redirect (keeps DB clean).
 */
export async function deleteLoginRequest(requestId: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  const { error } = await (supabase as any)
    .from('login_requests')
    .delete()
    .eq('id', requestId);
  return !error;
}

/**
 * SessionStorage key for encrypted seed from phone-approved login.
 * Vault can read this and decrypt with user's PIN/password (e.g. decryptSeed from recoverySeed.ts).
 */
const PFF_REMOTE_LOGIN_SEED = 'pff_remote_login_seed';

/**
 * Real-time login bridge: when channel detects APPROVED, fetch request row → user_profiles (recovery_seed_encrypted, user_id)
 * → set session → optionally move encrypted seed to local vault state → delete request.
 * Caller must then force redirect (e.g. router.replace('/dashboard') or window.location.href = '/dashboard').
 */
export async function completeLoginBridge(requestId: string): Promise<
  { ok: true; phone: string; userId?: string } | { ok: false; error: string }
> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: 'Supabase not available' };

  const requestRow = await getLoginRequestFull(requestId);
  if (!requestRow?.phone_number) {
    return { ok: false, error: 'Login request not found or not approved' };
  }

  const phone = requestRow.phone_number.trim();

  const { data: profile, error: profileError } = await (supabase as any)
    .from('user_profiles')
    .select('id, recovery_seed_encrypted, recovery_seed_iv, recovery_seed_salt')
    .eq('phone_number', phone)
    .maybeSingle();

  if (profileError) {
    return { ok: false, error: profileError.message ?? 'Failed to fetch user profile' };
  }

  const userId = profile?.id ?? null;

  setIdentityAnchorForSession(phone);
  setSessionIdentity(phone, userId);

  // Sovereign Device Handshake: apply citizen_hash and device anchor from phone so laptop is anchored
  try {
    const { getHandshakePayload, deleteHandshakePayload } = await import('./sovereignDeviceHandshake');
    const { setVitalizationAnchor } = await import('./vitalizationAnchor');
    const { anchorIdentityToDevice } = await import('./sovereignSSO');
    const payload = await getHandshakePayload(requestId);
    if (payload?.citizen_hash) {
      await setVitalizationAnchor(payload.citizen_hash, phone);
      await anchorIdentityToDevice(payload.citizen_hash, phone);
    }
    await deleteHandshakePayload(requestId);
  } catch (e) {
    console.warn('[loginBridge] Handshake payload apply failed:', e);
  }

  // Security Persistence: store laptop as Trusted Device in authorized_devices for faster future logins
  const deviceInfo = requestRow.device_info as { laptop_device_id?: string; laptop_device_name?: string } | null;
  if (deviceInfo?.laptop_device_id && phone) {
    try {
      await (supabase as any).from('authorized_devices').insert({
        phone_number: phone,
        device_id: deviceInfo.laptop_device_id,
        device_name: deviceInfo.laptop_device_name ?? 'Trusted Laptop',
        device_type: 'DESKTOP',
        hardware_hash: '',
        is_primary: false,
        status: 'ACTIVE',
        authorized_at: new Date().toISOString(),
        authorized_by_device: requestRow.approver_device_id ?? 'LINK_DEVICE_QR',
        user_agent: (deviceInfo as any).userAgent ?? null,
        platform: (deviceInfo as any).platform ?? null,
      });
    } catch (e) {
      console.warn('[loginBridge] Could not add laptop as trusted device:', e);
    }
  }

  if (profile?.recovery_seed_encrypted && profile?.recovery_seed_iv && profile?.recovery_seed_salt) {
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(
          PFF_REMOTE_LOGIN_SEED,
          JSON.stringify({
            recovery_seed_encrypted: profile.recovery_seed_encrypted,
            recovery_seed_iv: profile.recovery_seed_iv,
            recovery_seed_salt: profile.recovery_seed_salt,
          })
        );
      }
    } catch (e) {
      console.warn('[loginBridge] Could not store encrypted seed for vault:', e);
    }
  }

  const deleted = await deleteLoginRequest(requestId);
  if (!deleted) {
    console.warn('[loginBridge] Could not delete login request row');
  }

  return { ok: true, phone, userId: userId ?? undefined };
}

/**
 * Subscribe to a login request (computer). Calls onStatusChange when status becomes APPROVED or DENIED.
 * Uses Realtime when available and adds a polling fallback so approval is detected even if Realtime is disabled.
 */
export function subscribeToLoginRequest(
  requestId: string,
  onStatusChange: (status: 'APPROVED' | 'DENIED') => void
): () => void {
  const supabase = getSupabase();
  let resolved = false;
  const fireOnce = (status: 'APPROVED' | 'DENIED') => {
    if (resolved) return;
    resolved = true;
    onStatusChange(status);
  };

  // Realtime subscription (optional; may not be enabled for login_requests)
  let realtimeChannel: { unsubscribe: () => void } | null = null;
  if (supabase?.channel) {
    realtimeChannel = (supabase as any)
      .channel(`login_request_${requestId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'login_requests',
          filter: `id=eq.${requestId}`,
        },
        (payload: { new: LoginRequestRow }) => {
          const status = payload?.new?.status;
          if (status === 'APPROVED' || status === 'DENIED') {
            fireOnce(status);
          }
        }
      )
      .subscribe();
  }

  // Polling fallback: Realtime is often not enabled for custom tables; polling ensures computer sees approval
  const POLL_MS = 2000;
  const pollInterval = setInterval(async () => {
    if (resolved) return;
    const row = await getLoginRequestStatus(requestId);
    if (row && (row.status === 'APPROVED' || row.status === 'DENIED')) {
      fireOnce(row.status);
    }
  }, POLL_MS);

  return () => {
    clearInterval(pollInterval);
    if (realtimeChannel?.unsubscribe) realtimeChannel.unsubscribe();
  };
}

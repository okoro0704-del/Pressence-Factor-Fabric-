/**
 * Admin Role & Authorization System.
 * Role hierarchy: CITIZEN (default), GOVERNMENT_ADMIN, SENTINEL_OFFICER, MASTER_ARCHITECT.
 * Integrates with user_profiles.role in Supabase and admin_action_logs for audit.
 */

import { getSupabase } from './supabase';

export { getIdentityAnchorPhone } from './sentinelActivation';

export const ROLES = ['CITIZEN', 'GOVERNMENT_ADMIN', 'SENTINEL_OFFICER', 'MASTER_ARCHITECT', 'SENTINEL_STAFF'] as const;
export type Role = (typeof ROLES)[number];

const ROLE_COOKIE_NAME = 'pff_role';
const ROLE_COOKIE_MAX_AGE_DAYS = 1;

/** Get current user's role from Supabase user_profiles by Identity Anchor (phone). */
export async function getCurrentUserRole(identityAnchor: string): Promise<Role> {
  if (!identityAnchor?.trim()) {
    console.error('[ROLE_AUTH] getCurrentUserRole: identityAnchor is null or empty (e.g. localStorage pff_identity_anchor_phone missing on Netlify)');
    return 'CITIZEN';
  }
  const supabase = getSupabase();
  try {
    const { data, error } = await (supabase as any)
      .from('user_profiles')
      .select('role')
      .eq('phone_number', identityAnchor.trim())
      .maybeSingle();
    if (error) {
      console.error('[ROLE_AUTH] getCurrentUserRole: Supabase error', { identityAnchor: identityAnchor.slice(0, 6) + '…', error: error?.message ?? error });
      return 'CITIZEN';
    }
    if (!data) {
      console.error('[ROLE_AUTH] getCurrentUserRole: no user_profiles row for identityAnchor (user may not exist)', { identityAnchor: identityAnchor.slice(0, 6) + '…' });
      return 'CITIZEN';
    }
    const role = (data.role || 'CITIZEN').toUpperCase();
    return ROLES.includes(role as Role) ? (role as Role) : 'CITIZEN';
  } catch (e) {
    console.error('[ROLE_AUTH] getCurrentUserRole: exception', e);
    return 'CITIZEN';
  }
}

/** Set another user's role (only MASTER_ARCHITECT can; uses RPC admin_set_user_role and logs to admin_action_logs). */
export async function setUserRole(
  actorIdentityAnchor: string,
  targetIdentityAnchor: string,
  newRole: Role
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = getSupabase();
  try {
    const { data, error } = await (supabase as any).rpc('admin_set_user_role', {
      actor_phone: actorIdentityAnchor.trim(),
      target_phone: targetIdentityAnchor.trim(),
      new_role: newRole,
    });
    if (error) return { ok: false, error: error.message ?? 'Failed to update role' };
    const result = data as { ok?: boolean; error?: string } | null;
    if (result?.ok) return { ok: true };
    return { ok: false, error: result?.error ?? 'Failed to update role' };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

/** Search user by Identity Anchor (phone). Returns profile with role. For master dashboard use findUserByIdentityAnchorForMaster. */
export async function findUserByIdentityAnchor(identityAnchor: string): Promise<{
  phone_number: string;
  full_name: string;
  role: Role;
} | null> {
  if (!identityAnchor?.trim()) return null;
  const supabase = getSupabase();
  try {
    const { data, error } = await (supabase as any)
      .from('user_profiles')
      .select('phone_number, full_name, role')
      .eq('phone_number', identityAnchor.trim())
      .maybeSingle();
    if (error || !data) return null;
    const role = (data.role || 'CITIZEN').toUpperCase();
    return {
      phone_number: data.phone_number,
      full_name: data.full_name || '—',
      role: ROLES.includes(role as Role) ? (role as Role) : 'CITIZEN',
    };
  } catch {
    return null;
  }
}

/** Profile including primary_sentinel_device_id — for first-time MASTER_ARCHITECT enrollment bypass. */
export async function getProfileWithPrimarySentinel(identityAnchor: string): Promise<{
  role: Role;
  primary_sentinel_device_id: string | null;
} | null> {
  if (!identityAnchor?.trim()) return null;
  const supabase = getSupabase();
  try {
    const { data, error } = await (supabase as any)
      .from('user_profiles')
      .select('role, primary_sentinel_device_id')
      .eq('phone_number', identityAnchor.trim())
      .maybeSingle();
    if (error || !data) return null;
    const role = (data.role || 'CITIZEN').toUpperCase();
    return {
      role: ROLES.includes(role as Role) ? (role as Role) : 'CITIZEN',
      primary_sentinel_device_id: data.primary_sentinel_device_id ?? null,
    };
  } catch {
    return null;
  }
}

/** Master dashboard: search user by phone via RPC (MASTER_ARCHITECT only). */
export async function findUserByIdentityAnchorForMaster(
  actorIdentityAnchor: string,
  searchIdentityAnchor: string
): Promise<{ phone_number: string; full_name: string; role: Role } | null> {
  if (!searchIdentityAnchor?.trim() || !actorIdentityAnchor?.trim()) return null;
  const supabase = getSupabase();
  try {
    const { data, error } = await (supabase as any).rpc('admin_get_user_by_phone', {
      actor_phone: actorIdentityAnchor.trim(),
      search_phone: searchIdentityAnchor.trim(),
    });
    if (error || !data?.ok || !data?.found) return null;
    const role = (data.role || 'CITIZEN').toUpperCase();
    return {
      phone_number: data.phone_number,
      full_name: data.full_name || '—',
      role: ROLES.includes(role as Role) ? (role as Role) : 'CITIZEN',
    };
  } catch {
    return null;
  }
}

/** Can access /government routes. */
export function canAccessGovernment(role: Role): boolean {
  return role === 'GOVERNMENT_ADMIN' || role === 'MASTER_ARCHITECT';
}

/** Can access /sentinel admin routes. */
export function canAccessSentinel(role: Role): boolean {
  return role === 'SENTINEL_OFFICER' || role === 'MASTER_ARCHITECT' || role === 'GOVERNMENT_ADMIN' || role === 'SENTINEL_STAFF';
}

/** Can access Staff Portal (citizens onboarded, monthly bonus, Sovereign Sentinel Staff ID). */
export function canAccessStaffPortal(role: Role): boolean {
  return role === 'SENTINEL_STAFF' || role === 'MASTER_ARCHITECT' || role === 'GOVERNMENT_ADMIN';
}

/** Can access /master dashboard (only MASTER_ARCHITECT can change roles). */
export function canAccessMaster(role: Role): boolean {
  return role === 'MASTER_ARCHITECT';
}

/** Set role in cookie for middleware (client-side). */
export function setRoleCookie(role: Role): void {
  if (typeof document === 'undefined') return;
  const maxAge = ROLE_COOKIE_MAX_AGE_DAYS * 24 * 60 * 60;
  document.cookie = `${ROLE_COOKIE_NAME}=${encodeURIComponent(role)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

/** Get role from cookie (for middleware or client). */
export function getRoleFromCookie(): Role | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${ROLE_COOKIE_NAME}=([^;]*)`));
  const value = match ? decodeURIComponent(match[1]) : null;
  if (!value) return null;
  const role = value.toUpperCase();
  return ROLES.includes(role as Role) ? (role as Role) : null;
}

/** Log admin action to admin_action_logs. */
export async function logAdminAction(entry: {
  actor_identity_anchor: string;
  action_type: 'ROLE_CHANGE' | 'TREASURY_VIEW' | 'SENTINEL_VIEW' | 'MASTER_VIEW';
  target_identity_anchor?: string;
  old_value?: string;
  new_value?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const supabase = getSupabase();
  try {
    await (supabase as any).from('admin_action_logs').insert({
      actor_identity_anchor: entry.actor_identity_anchor,
      action_type: entry.action_type,
      target_identity_anchor: entry.target_identity_anchor ?? null,
      old_value: entry.old_value ?? null,
      new_value: entry.new_value ?? null,
      metadata: entry.metadata ?? null,
    });
  } catch {
    // non-blocking
  }
}

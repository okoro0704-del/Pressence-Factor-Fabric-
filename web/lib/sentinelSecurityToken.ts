/**
 * Sentinel Security Token — Cross-App Handshake.
 * Generated on Sentinel Vault activation; user copies/scans into Main PFF App to unlock funds.
 * Supabase as shared source of truth.
 */

import { supabase } from './supabase';

const TOKEN_VERIFIED_KEY = 'pff_sentinel_token_verified';
const TOKEN_EXPIRY_DAYS = 30;

function generateSecurityToken(): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const arr = new Uint8Array(24);
    crypto.getRandomValues(arr);
    return 'SST_' + Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  }
  return 'SST_' + Date.now().toString(36).toUpperCase() + '_' + Math.random().toString(36).slice(2, 12).toUpperCase();
}

/** Create a Sentinel Security Token for owner (call after activation on Sentinel Vault). */
export async function createSecurityToken(ownerId: string): Promise<
  { ok: true; token: string } | { ok: false; error: string }
> {
  if (!ownerId || !supabase) return { ok: false, error: 'Owner or Supabase not available' };
  try {
    const token = generateSecurityToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + TOKEN_EXPIRY_DAYS);
    const { error } = await (supabase as any)
      .from('sentinel_security_tokens')
      .insert({
        owner_id: ownerId,
        token,
        expires_at: expiresAt.toISOString(),
      });
    if (error) return { ok: false, error: error.message ?? 'Failed to create token' };
    return { ok: true, token };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

/** Verify token in Main PFF App; returns owner_id if valid. */
export async function verifySecurityToken(token: string): Promise<
  { ok: true; ownerId: string } | { ok: false; error: string }
> {
  const t = (token || '').trim();
  if (!t || !supabase) return { ok: false, error: 'Token or Supabase not available' };
  try {
    const { data, error } = await (supabase as any)
      .from('sentinel_security_tokens')
      .select('owner_id, expires_at')
      .eq('token', t)
      .maybeSingle();
    if (error || !data) return { ok: false, error: 'Invalid or expired token' };
    const expiresAt = data.expires_at as string | null;
    if (expiresAt && new Date(expiresAt).getTime() < Date.now()) {
      return { ok: false, error: 'Token has expired' };
    }
    return { ok: true, ownerId: data.owner_id as string };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

/** Mark session as token-verified (after user enters valid token in Main PFF App). */
export function setSentinelTokenVerified(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(TOKEN_VERIFIED_KEY, 'true');
  } catch {
    // ignore
  }
}

/** Check if current session has verified the Sentinel Security Token. */
export function getSentinelTokenVerified(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(TOKEN_VERIFIED_KEY) === 'true';
  } catch {
    return false;
  }
}

/** Clear token-verified state (e.g. on logout). */
export function clearSentinelTokenVerified(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(TOKEN_VERIFIED_KEY);
  } catch {
    // ignore
  }
}

/** External Sentinel Vault URL (env or same-origin /sentinel-vault). */
export function getSentinelVaultUrl(): string {
  if (typeof window === 'undefined') {
    const base = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '';
    return (process.env.NEXT_PUBLIC_SENTINEL_VAULT_URL || `${base}/sentinel-vault`).trim();
  }
  const env = process.env.NEXT_PUBLIC_SENTINEL_VAULT_URL;
  if (env && env.trim()) return env.trim();
  return `${window.location.origin}/sentinel-vault`;
}

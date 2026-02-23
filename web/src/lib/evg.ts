/**
 * Enterprise Verification Gateway (EVG) — server-side only.
 * OAuth-style "Connect with Sovereign": partners get YES/NO (ZKP). No face/fingerprint shared.
 * Revenue Share: Data Integrity Fee split between Sentinel and User.
 */

import { getSupabaseServer } from './supabaseServer';

const CODE_EXPIRY_MINUTES = 10;
const TOKEN_EXPIRY_SECONDS = 3600;

function randomHex(bytes: number): string {
  const arr = new Uint8Array(bytes);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(arr);
  }
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Hash client_secret for storage (SHA-256 hex). */
export async function hashClientSecret(secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(secret);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Verify client_secret against stored hash. */
export async function verifyClientSecret(secret: string, storedHash: string): Promise<boolean> {
  const h = await hashClientSecret(secret);
  return h === storedHash;
}

export interface EvgPartner {
  id: string;
  client_id: string;
  name: string;
  redirect_uris: string[];
  data_integrity_fee_cents: number;
  revenue_share_user_pct: number;
  status: string;
}

/** Get authorized partner by client_id (active only). */
export async function getEvgPartner(
  clientId: string
): Promise<{ ok: true; partner: EvgPartner } | { ok: false; error: string }> {
  const supabase = getSupabaseServer();
  if (!supabase) return { ok: false, error: 'Supabase not configured' };
  const { data, error } = await (supabase as any)
    .from('evg_authorized_partners')
    .select('id, client_id, name, redirect_uris, data_integrity_fee_cents, revenue_share_user_pct, status')
    .eq('client_id', clientId)
    .eq('status', 'active')
    .maybeSingle();
  if (error) return { ok: false, error: error.message ?? 'Partner lookup failed' };
  if (!data) return { ok: false, error: 'Invalid or revoked client_id' };
  const uris = Array.isArray(data.redirect_uris) ? data.redirect_uris : [];
  return {
    ok: true,
    partner: {
      id: data.id,
      client_id: data.client_id,
      name: data.name,
      redirect_uris: uris,
      data_integrity_fee_cents: Number(data.data_integrity_fee_cents) || 0,
      revenue_share_user_pct: Number(data.revenue_share_user_pct) || 50,
      status: data.status,
    },
  };
}

/** Validate redirect_uri against partner's allowed list. */
export function validateRedirectUri(partner: EvgPartner, redirectUri: string): boolean {
  const normalized = redirectUri.trim();
  if (!normalized) return false;
  return partner.redirect_uris.some((u) => u.trim() === normalized);
}

/** Create authorization code and store it. Returns redirect URL. */
export async function createAuthorizationCode(
  clientId: string,
  redirectUri: string,
  state: string,
  identityAnchor: string
): Promise<{ ok: true; redirectUrl: string } | { ok: false; error: string }> {
  const partnerResult = await getEvgPartner(clientId);
  if (!partnerResult.ok) return partnerResult;
  if (!validateRedirectUri(partnerResult.partner, redirectUri)) {
    return { ok: false, error: 'redirect_uri not allowed for this client' };
  }
  const supabase = getSupabaseServer();
  if (!supabase) return { ok: false, error: 'Supabase not configured' };
  const code = randomHex(32);
  const expiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000).toISOString();
  const { error } = await (supabase as any).from('evg_grants').insert({
    grant_key: code,
    grant_type: 'authorization_code',
    partner_client_id: clientId,
    phone_number: identityAnchor.trim(),
    scope: 'humanity',
    expires_at: expiresAt,
  });
  if (error) return { ok: false, error: error.message ?? 'Failed to create code' };
  const sep = redirectUri.includes('?') ? '&' : '?';
  const redirectUrl = `${redirectUri}${sep}code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`;
  return { ok: true, redirectUrl };
}

/** Exchange code for access_token. ZKP: token only used to return verified YES/NO. */
export async function exchangeCodeForToken(
  clientId: string,
  clientSecret: string,
  code: string,
  redirectUri: string
): Promise<
  { ok: true; access_token: string; token_type: string; expires_in: number } | { ok: false; error: string }
> {
  const partnerResult = await getEvgPartner(clientId);
  if (!partnerResult.ok) return partnerResult;
  if (!validateRedirectUri(partnerResult.partner, redirectUri)) {
    return { ok: false, error: 'redirect_uri not allowed' };
  }
  const supabase = getSupabaseServer();
  if (!supabase) return { ok: false, error: 'Supabase not configured' };
  const { data: secretRow, error: secretErr } = await (supabase as any)
    .from('evg_authorized_partners')
    .select('client_secret_hash')
    .eq('client_id', clientId)
    .single();
  if (secretErr || !secretRow) return { ok: false, error: 'Invalid client' };
  const valid = await verifyClientSecret(clientSecret, secretRow.client_secret_hash);
  if (!valid) return { ok: false, error: 'Invalid client_secret' };

  const { data: grant, error: grantErr } = await (supabase as any)
    .from('evg_grants')
    .select('id, phone_number, expires_at, used_at')
    .eq('grant_key', code.trim())
    .eq('grant_type', 'authorization_code')
    .eq('partner_client_id', clientId)
    .maybeSingle();
  if (grantErr || !grant) return { ok: false, error: 'Invalid or expired code' };
  if (grant.used_at) return { ok: false, error: 'Code already used' };
  const expires = new Date(grant.expires_at).getTime();
  if (Date.now() > expires) return { ok: false, error: 'Code expired' };

  await (supabase as any).from('evg_grants').update({ used_at: new Date().toISOString() }).eq('id', grant.id);

  const accessToken = randomHex(32);
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_SECONDS * 1000).toISOString();
  await (supabase as any).from('evg_grants').insert({
    grant_key: accessToken,
    grant_type: 'access_token',
    partner_client_id: clientId,
    phone_number: grant.phone_number,
    scope: 'humanity',
    expires_at: expiresAt,
  });
  return {
    ok: true,
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: TOKEN_EXPIRY_SECONDS,
  };
}

/** ZKP: Look up token, return ONLY verified (true/false). No fingerprint, no face hash. */
export async function verifyAccessTokenAndHumanity(
  accessToken: string
): Promise<{ ok: true; verified: boolean; partnerId?: string; phoneNumber?: string } | { ok: false; error: string }> {
  const supabase = getSupabaseServer();
  if (!supabase) return { ok: false, error: 'Supabase not configured' };
  const { data: grant, error } = await (supabase as any)
    .from('evg_grants')
    .select('id, phone_number, partner_client_id, expires_at')
    .eq('grant_key', accessToken.trim())
    .eq('grant_type', 'access_token')
    .maybeSingle();
  if (error || !grant) return { ok: false, error: 'Invalid token' };
  const expires = new Date(grant.expires_at).getTime();
  if (Date.now() > expires) return { ok: false, error: 'Token expired' };

  const { data: profile } = await (supabase as any)
    .from('user_profiles')
    .select('humanity_score')
    .eq('phone_number', grant.phone_number)
    .maybeSingle();
  const verified = profile?.humanity_score === 1.0;
  return {
    ok: true,
    verified: !!verified,
    partnerId: grant.partner_client_id,
    phoneNumber: grant.phone_number,
  };
}

/** Hash phone for anonymous ledger (SHA-256 prefix). */
async function hashPhoneForLedger(phone: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(phone.trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 16);
}

/** Record Data Integrity Fee and revenue share (Sentinel + User). */
export async function recordEvgRevenueShare(
  partnerId: string,
  userPhone: string,
  feeCents: number,
  revenueShareUserPct: number
): Promise<void> {
  if (feeCents <= 0) return;
  const supabase = getSupabaseServer();
  if (!supabase) return;
  const userPct = Math.min(100, Math.max(0, revenueShareUserPct)) / 100;
  const userShareCents = Math.floor(feeCents * userPct);
  const sentinelShareCents = feeCents - userShareCents;
  const phoneHash = await hashPhoneForLedger(userPhone);
  const { data: partner } = await (supabase as any)
    .from('evg_authorized_partners')
    .select('id')
    .eq('client_id', partnerId)
    .single();
  if (!partner) return;
  await (supabase as any).from('evg_verification_ledger').insert({
    partner_id: partner.id,
    user_phone_hash: phoneHash,
    fee_cents: feeCents,
    sentinel_share_cents: sentinelShareCents,
    user_share_cents: userShareCents,
  });
}

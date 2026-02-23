/**
 * Staff Portal — SENTINEL_STAFF: citizens onboarded, monthly bonus, Sovereign Sentinel Staff ID.
 * Integrates with Supabase RPCs: get_staff_portal_stats, issue_sentinel_staff_credential,
 * record_referral, process_staff_bounty.
 */

import { getSupabase } from './supabase';

export interface StaffPortalStats {
  ok: boolean;
  citizens_onboarded?: number;
  monthly_bonus_usd?: number;
  error?: string;
}

export interface SovereignSentinelStaffCredential {
  type: string;
  credentialSubject: {
    id: string;
    phone: string;
    fullName: string;
    role: string;
    issuer: string;
    issued: string;
    proofOfEmployment: boolean;
  };
  issued: string;
}

/** Get Staff Portal stats (citizens onboarded, monthly performance bonus). Requires SENTINEL_STAFF. */
export async function getStaffPortalStats(identityAnchor: string): Promise<StaffPortalStats> {
  const supabase = getSupabase();
  try {
    const { data, error } = await (supabase as any).rpc('get_staff_portal_stats', {
      staff_phone: identityAnchor?.trim() ?? '',
    });
    if (error) return { ok: false, error: error.message ?? 'Failed to load stats' };
    const r = data as { ok?: boolean; citizens_onboarded?: number; monthly_bonus_usd?: number; error?: string };
    if (!r?.ok) return { ok: false, error: r?.error ?? 'Not SENTINEL_STAFF' };
    return {
      ok: true,
      citizens_onboarded: r.citizens_onboarded ?? 0,
      monthly_bonus_usd: Number(r.monthly_bonus_usd ?? 0),
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

/** Issue or refresh Sovereign Sentinel Staff ID (Verifiable Credential). */
export async function issueSentinelStaffCredential(
  identityAnchor: string,
  fullName?: string
): Promise<{ ok: boolean; credential?: SovereignSentinelStaffCredential; error?: string }> {
  const supabase = getSupabase();
  try {
    const { data, error } = await (supabase as any).rpc('issue_sentinel_staff_credential', {
      staff_phone: identityAnchor?.trim() ?? '',
      staff_full_name: fullName ?? '',
    });
    if (error) return { ok: false, error: error.message ?? 'Failed to issue credential' };
    const r = data as { ok?: boolean; credential?: SovereignSentinelStaffCredential; error?: string };
    if (!r?.ok) return { ok: false, error: r?.error ?? 'Not SENTINEL_STAFF' };
    return { ok: true, credential: r.credential };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

/** Record a referral (call when new user registers with referrer). Idempotent per referred user. */
export async function recordReferral(
  referrerPhone: string,
  referredPhone: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = getSupabase();
  try {
    const { data, error } = await (supabase as any).rpc('record_referral', {
      referrer_phone: referrerPhone?.trim() ?? '',
      referred_phone: referredPhone?.trim() ?? '',
    });
    if (error) return { ok: false, error: error.message ?? 'Failed to record referral' };
    const r = data as { ok?: boolean; error?: string };
    if (!r?.ok) return { ok: false, error: r?.error ?? 'Failed' };
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

/** Process staff bounty after a referred user completes registration (mint $100 to corporate, $30 to staff VIDA). Call from backend/API after vitalization when referrer is SENTINEL_STAFF. */
export async function processStaffBounty(
  staffPhone: string,
  referredPhone: string
): Promise<{ ok: boolean; sentinel_fee_minted_usd?: number; salary_payout_usd?: number; error?: string }> {
  const supabase = getSupabase();
  try {
    const { data, error } = await (supabase as any).rpc('process_staff_bounty', {
      staff_phone: staffPhone?.trim() ?? '',
      referred_phone: referredPhone?.trim() ?? '',
    });
    if (error) return { ok: false, error: error.message ?? 'Failed to process bounty' };
    const r = data as { ok?: boolean; sentinel_fee_minted_usd?: number; salary_payout_usd?: number; error?: string };
    if (!r?.ok) return { ok: false, error: r?.error ?? 'Not SENTINEL_STAFF' };
    return {
      ok: true,
      sentinel_fee_minted_usd: r.sentinel_fee_minted_usd ?? 100,
      salary_payout_usd: r.salary_payout_usd ?? 30,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

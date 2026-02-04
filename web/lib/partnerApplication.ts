/**
 * Partner Application Portal — submit, list, approve/reject.
 * Applications stored in pff_partner_applications. Approving generates PFF_API_KEY.
 */

import { supabase } from './supabase';

export type PartnerApplicationStatus = 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';

export interface PartnerApplicationRow {
  id: string;
  company_name: string;
  industry: string;
  integration_intent: string;
  consent_royalty: boolean;
  consent_privacy: boolean;
  status: PartnerApplicationStatus;
  pff_api_key: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubmitPartnerApplicationInput {
  company_name: string;
  industry: string;
  integration_intent: string;
  consent_royalty: boolean;
  consent_privacy: boolean;
}

/** Submit a partner application. Saves with status PENDING_REVIEW. */
export async function submitPartnerApplication(
  input: SubmitPartnerApplicationInput
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (!supabase) return { ok: false, error: 'Supabase not available' };
  if (!input.consent_royalty || !input.consent_privacy) {
    return { ok: false, error: 'Both 5% Corporate Royalty and Sovereign Privacy Agreement must be accepted' };
  }
  try {
    const { data, error } = await (supabase as any)
      .from('pff_partner_applications')
      .insert({
        company_name: (input.company_name || '').trim(),
        industry: (input.industry || '').trim(),
        integration_intent: (input.integration_intent || '').trim(),
        consent_royalty: true,
        consent_privacy: true,
        status: 'PENDING_REVIEW',
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single();
    if (error || !data) return { ok: false, error: error?.message ?? 'Insert failed' };
    return { ok: true, id: data.id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

/** List all partner applications (for Foundation view). */
export async function listPartnerApplications(): Promise<PartnerApplicationRow[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await (supabase as any)
      .from('pff_partner_applications')
      .select('*')
      .order('created_at', { ascending: false });
    if (error || !data || !Array.isArray(data)) return [];
    return data.map((row: Record<string, unknown>) => ({
      id: row.id as string,
      company_name: row.company_name as string,
      industry: row.industry as string,
      integration_intent: row.integration_intent as string,
      consent_royalty: Boolean(row.consent_royalty),
      consent_privacy: Boolean(row.consent_privacy),
      status: row.status as PartnerApplicationStatus,
      pff_api_key: (row.pff_api_key as string) ?? null,
      reviewed_at: (row.reviewed_at as string) ?? null,
      reviewed_by: (row.reviewed_by as string) ?? null,
      rejection_reason: (row.rejection_reason as string) ?? null,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
    }));
  } catch {
    return [];
  }
}

/** Generate a secure PFF API key (for approved partners). */
function generatePffApiKey(): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const arr = new Uint8Array(32);
    crypto.getRandomValues(arr);
    return 'pff_' + Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
  }
  return 'pff_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 18);
}

/** Approve a partner application and generate PFF_API_KEY. */
export async function approvePartnerApplication(
  applicationId: string,
  reviewedBy?: string
): Promise<{ ok: true; pff_api_key: string } | { ok: false; error: string }> {
  if (!supabase) return { ok: false, error: 'Supabase not available' };
  const pff_api_key = generatePffApiKey();
  try {
    const { error } = await (supabase as any)
      .from('pff_partner_applications')
      .update({
        status: 'APPROVED',
        pff_api_key,
        reviewed_at: new Date().toISOString(),
        reviewed_by: reviewedBy ?? null,
        rejection_reason: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', applicationId);
    if (error) return { ok: false, error: error.message ?? 'Update failed' };
    return { ok: true, pff_api_key };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

/** Reject a partner application. */
export async function rejectPartnerApplication(
  applicationId: string,
  reason?: string,
  reviewedBy?: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!supabase) return { ok: false, error: 'Supabase not available' };
  try {
    const { error } = await (supabase as any)
      .from('pff_partner_applications')
      .update({
        status: 'REJECTED',
        pff_api_key: null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: reviewedBy ?? null,
        rejection_reason: reason ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', applicationId);
    if (error) return { ok: false, error: error.message ?? 'Update failed' };
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

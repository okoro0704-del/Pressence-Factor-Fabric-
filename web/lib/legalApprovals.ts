/**
 * Sovereign Constitution — legal_approvals (constitution_version, signature_timestamp).
 * 10 VIDA minting only begins AFTER the Constitution is signed and recorded.
 * If the Constitution is updated, the user must re-sign on next login.
 */

import { supabase } from './supabase';
import { getSupabase } from './supabase';

/** Current constitution version; bump when Articles change to force re-sign. */
export const CURRENT_CONSTITUTION_VERSION = '1.0';

/** Check if user has signed the current constitution. */
export async function hasSignedConstitution(
  identityAnchor: string,
  version: string = CURRENT_CONSTITUTION_VERSION
): Promise<boolean> {
  const client = typeof window !== 'undefined' ? supabase : getSupabase();
  if (!client?.from) return false;
  try {
    const { data, error } = await (client as any)
      .from('legal_approvals')
      .select('id')
      .eq('identity_anchor', identityAnchor.trim())
      .eq('constitution_version', version)
      .maybeSingle();
    return !error && !!data?.id;
  } catch {
    return false;
  }
}

/** Record constitution acceptance (call only after 3-of-4 biometric pass). */
export async function recordConstitutionSignature(
  identityAnchor: string,
  version: string = CURRENT_CONSTITUTION_VERSION
): Promise<{ ok: true } | { ok: false; error: string }> {
  const client = typeof window !== 'undefined' ? supabase : getSupabase();
  if (!client) return { ok: false, error: 'Supabase not available' };
  try {
    const { error } = await (client as any)
      .from('legal_approvals')
      .upsert(
        {
          identity_anchor: identityAnchor.trim(),
          constitution_version: version,
          signature_timestamp: new Date().toISOString(),
          created_at: new Date().toISOString(),
        },
        { onConflict: ['identity_anchor', 'constitution_version'] }
      );
    if (error) return { ok: false, error: error.message ?? 'Failed to record signature' };
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

/** Get the latest signature timestamp for a user (any version). */
export async function getLatestSignatureTimestamp(
  identityAnchor: string
): Promise<string | null> {
  const client = typeof window !== 'undefined' ? supabase : getSupabase();
  if (!client?.from) return null;
  try {
    const { data, error } = await (client as any)
      .from('legal_approvals')
      .select('signature_timestamp, constitution_version')
      .eq('identity_anchor', identityAnchor.trim())
      .order('signature_timestamp', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error || !data) return null;
    return data.signature_timestamp ?? null;
  } catch {
    return null;
  }
}

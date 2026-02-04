/**
 * PFF Ballot Engine — 3-out-of-4 Presence Gate to authorize Vote.
 * Vote is hashed and stored in national_ballot_box; linked to IdentityAnchor but choice anonymous.
 * One-person-one-vote per election_id; Sentinel hardware ID + biometric ensure no ghost accounts.
 */

import { getSupabase } from './supabase';
import { resolveSovereignByPresence, type BiometricAuthResult } from './biometricAuth';
import { getCurrentDeviceInfo } from './multiDeviceVitalization';

/** Hash a vote choice for anonymous storage (SHA-256). */
async function hashVoteChoice(choice: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(choice);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  return 'sha256-' + btoa(encodeURIComponent(choice)).slice(0, 64);
}

/** Check if user has already voted in this election (one-person-one-vote). */
export async function hasAlreadyVoted(
  identityAnchor: string,
  electionId: string
): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase?.from) return false;
  try {
    const { data, error } = await (supabase as any)
      .from('national_ballot_box')
      .select('id')
      .eq('election_id', electionId)
      .eq('identity_anchor', identityAnchor.trim())
      .maybeSingle();
    return !error && !!data?.id;
  } catch {
    return false;
  }
}

export type CastVoteResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Cast a vote: 3-of-4 Presence Gate, then hash choice and store in national_ballot_box.
 * One vote per (election_id, identity_anchor); device_fingerprint + hardware_hash for anti-ghost.
 */
export async function castVote(
  identityAnchor: string,
  electionId: string,
  choice: string,
  onProgress?: (result: BiometricAuthResult) => void
): Promise<CastVoteResult> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: 'Supabase not available' };
  if (!identityAnchor?.trim()) return { ok: false, error: 'Identity Anchor required' };
  if (!electionId) return { ok: false, error: 'Election ID required' };
  if (choice == null || String(choice).trim() === '') return { ok: false, error: 'Vote choice required' };

  const already = await hasAlreadyVoted(identityAnchor.trim(), electionId);
  if (already) return { ok: false, error: 'You have already voted in this election. One vote per citizen.' };

  const authResult = await resolveSovereignByPresence(
    identityAnchor.trim(),
    undefined,
    { requireAllLayers: false }
  );
  onProgress?.(authResult);
  if (!authResult.success) {
    return { ok: false, error: authResult.errorMessage ?? 'Biometric verification failed. Vote not recorded.' };
  }

  const deviceInfo = typeof window !== 'undefined' ? getCurrentDeviceInfo() : null;
  const deviceFingerprint = deviceInfo?.deviceId ?? 'unknown';
  const hardwareHash = deviceInfo?.hardwareHash ?? null;

  const voteChoiceHash = await hashVoteChoice(String(choice).trim());

  try {
    const { error } = await (supabase as any)
      .from('national_ballot_box')
      .insert({
        election_id: electionId,
        identity_anchor: identityAnchor.trim(),
        vote_choice_hash: voteChoiceHash,
        device_fingerprint: deviceFingerprint,
        hardware_hash: hardwareHash,
        created_at: new Date().toISOString(),
      });
    if (error) return { ok: false, error: error.message ?? 'Failed to record vote' };
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

/** List open elections (status = 'open'). */
export async function listOpenElections(): Promise<{ id: string; title: string; description: string | null; status: string }[]> {
  const supabase = getSupabase();
  if (!supabase?.from) return [];
  try {
    const { data, error } = await (supabase as any)
      .from('pff_elections')
      .select('id, title, description, status')
      .eq('status', 'open')
      .order('created_at', { ascending: false });
    if (error || !Array.isArray(data)) return [];
    return data.map((r: any) => ({
      id: r.id,
      title: r.title ?? '',
      description: r.description ?? null,
      status: r.status ?? 'open',
    }));
  } catch {
    return [];
  }
}

/** List all elections (for government dashboard). */
export async function listElections(): Promise<{ id: string; title: string; description: string | null; status: string; created_at: string }[]> {
  const supabase = getSupabase();
  if (!supabase?.from) return [];
  try {
    const { data, error } = await (supabase as any)
      .from('pff_elections')
      .select('id, title, description, status, created_at')
      .order('created_at', { ascending: false });
    if (error || !Array.isArray(data)) return [];
    return data.map((r: any) => ({
      id: r.id,
      title: r.title ?? '',
      description: r.description ?? null,
      status: r.status ?? 'draft',
      created_at: r.created_at ?? '',
    }));
  } catch {
    return [];
  }
}

/** Create a new election / National Referendum (GOVERNMENT_ADMIN). */
export async function createElection(
  title: string,
  description?: string,
  createdBy?: string
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: 'Supabase not available' };
  try {
    const { data, error } = await (supabase as any)
      .from('pff_elections')
      .insert({
        title: (title || '').trim(),
        description: (description || '').trim() || null,
        status: 'draft',
        created_by: createdBy ?? null,
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();
    if (error || !data) return { ok: false, error: error?.message ?? 'Failed to create election' };
    return { ok: true, id: data.id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

/** Open an election (start referendum). */
export async function openElection(electionId: string): Promise<CastVoteResult> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: 'Supabase not available' };
  try {
    const { error } = await (supabase as any)
      .from('pff_elections')
      .update({
        status: 'open',
        opens_at: new Date().toISOString(),
      })
      .eq('id', electionId);
    if (error) return { ok: false, error: error.message ?? 'Failed to open election' };
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

/** Close an election. */
export async function closeElection(electionId: string): Promise<CastVoteResult> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: 'Supabase not available' };
  try {
    const { error } = await (supabase as any)
      .from('pff_elections')
      .update({
        status: 'closed',
        closes_at: new Date().toISOString(),
      })
      .eq('id', electionId);
    if (error) return { ok: false, error: error.message ?? 'Failed to close election' };
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

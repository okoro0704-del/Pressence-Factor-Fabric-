/**
 * Sovereign Memory Vault — relational context (family, health, goals) for SOVRYN.
 * Stored in Supabase when Citizen is authenticated; session fallback when not.
 * Privacy: you serve the individual Citizen, not a corporation. Private counsel only.
 */

import { getSupabase } from './supabase';

export type VaultScope = 'family' | 'health' | 'goals' | 'other' | 'vibration';

const VAULT_TABLE = 'sovereign_memory_vault';
const SESSION_KEY = 'pff_sovereign_vault_session';

/** localStorage key used by PublicSovereignCompanion for session / welcome-back. */
export const SOVEREIGN_COMPANION_SESSION_KEY = 'sovereign_companion_session';

export interface VaultEntry {
  scope: VaultScope;
  content: string;
  updated_at?: string;
}

/** Get all vault entries for the current user (or session fallback). */
export async function getMemoryVault(): Promise<VaultEntry[]> {
  if (typeof window === 'undefined') return [];
  const supabase = getSupabase();
  try {
    const { data: { user } } = await (supabase?.auth?.getUser?.() ?? Promise.resolve({ data: { user: null } }));
    if (user?.id) {
      const { data, error } = await (supabase as any)
        .from(VAULT_TABLE)
        .select('scope, content, updated_at')
        .eq('citizen_id', user.id)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r: { scope: string; content: string; updated_at: string }) => ({
        scope: r.scope as VaultScope,
        content: r.content || '',
        updated_at: r.updated_at,
      }));
    }
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) {
      try {
        const arr = JSON.parse(raw) as VaultEntry[];
        return Array.isArray(arr) ? arr : [];
      } catch {
        return [];
      }
    }
  } catch {
    // non-blocking
  }
  return [];
}

/** Upsert one vault entry. */
export async function setMemoryVaultEntry(scope: VaultScope, content: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  const supabase = getSupabase();
  const trimmed = (content || '').trim().slice(0, 2000);
  try {
    const { data: { user } } = await (supabase?.auth?.getUser?.() ?? Promise.resolve({ data: { user: null } }));
    if (user?.id) {
      const { error } = await (supabase as any)
        .from(VAULT_TABLE)
        .upsert(
          { citizen_id: user.id, scope, content: trimmed, updated_at: new Date().toISOString() },
          { onConflict: 'citizen_id,scope' }
        );
      return !error;
    }
    const existing = await getMemoryVault();
    const rest = existing.filter((e) => e.scope !== scope);
    const next = trimmed ? [...rest, { scope, content: trimmed, updated_at: new Date().toISOString() }] : rest;
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(next));
    return true;
  } catch {
    return false;
  }
}

/** Vibration (banter memory): register + lang e.g. "simple|yo". Do not suddenly switch unless the user does. */
export interface Vibration {
  register: 'simple' | 'intellectual';
  lang: string;
}

const VIBRATION_SCOPE: VaultScope = 'vibration';

export async function getVibration(): Promise<Vibration | null> {
  const entries = await getMemoryVault();
  const v = entries.find((e) => e.scope === VIBRATION_SCOPE && e.content);
  if (!v?.content) return null;
  const [register, lang] = v.content.split('|').map((s) => s?.trim());
  if (!register || !lang) return null;
  if (register !== 'simple' && register !== 'intellectual') return null;
  return { register, lang };
}

export async function setVibration(register: 'simple' | 'intellectual', lang: string): Promise<boolean> {
  const content = `${register}|${(lang || 'en').trim().slice(0, 10)}`;
  return setMemoryVaultEntry(VIBRATION_SCOPE, content);
}

/** Format vault entries for injection into prompt/context (natural reference in small talk). Excludes vibration from "shared" list; add vibration line separately. */
export function formatVaultForContext(entries: VaultEntry[], vibration?: Vibration | null): string {
  const nonVibration = entries.filter((e) => e.scope !== VIBRATION_SCOPE && e.content);
  const parts = nonVibration.map((e) => `${e.scope}: ${e.content}`);
  const lines: string[] = [];
  if (parts.length) lines.push(`[Citizen has shared: ${parts.join('; ')}. Reference naturally in small talk when relevant.]`);
  if (vibration) lines.push(`[Current vibration: ${vibration.register}|${vibration.lang}. Keep this register and language unless the user clearly switches. Banter memory.]`);
  return lines.join(' ');
}

/**
 * Erase every information or context in the SOVRYN Companion.
 * Clears: localStorage session (welcome-back), sessionStorage Memory Vault, and Supabase sovereign_memory_vault for current user.
 * Call this when the user requests "Clear context" or "Erase memory".
 */
export async function clearCompanionContext(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(SOVEREIGN_COMPANION_SESSION_KEY);
    }
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(SESSION_KEY);
    }
    const supabase = getSupabase();
    if (supabase) {
      const { data: { user } } = await (supabase.auth?.getUser?.() ?? Promise.resolve({ data: { user: null } }));
      if (user?.id) {
        await (supabase as any)
          .from(VAULT_TABLE)
          .delete()
          .eq('citizen_id', user.id);
      }
    }
    return true;
  } catch {
    return false;
  }
}

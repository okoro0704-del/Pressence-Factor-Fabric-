/**
 * Linguistic Vibration Engine — detects user register from input and integrates with Memory Vault (Supabase singleton).
 * Levels: Simple (Pidgin/slang), Casual (everyday), Strategic (academic). Fallback: Sovereign_Standard so UI never crashes.
 */

import {
  getVibration as getStoredVibrationFromVault,
  setVibration as setVibrationInVault,
  type Vibration,
} from './memoryVault';

/** User-facing vibration level for mirroring and UI. */
export type Level = 'Simple' | 'Casual' | 'Strategic' | 'Sovereign_Standard';

/** Fallback when detection fails or no stored vibration — prevents ReferenceError and keeps UI stable. */
export const SOVEREIGN_STANDARD: Level = 'Sovereign_Standard';

/** Default Vibration object when vault read fails (register + lang for prompt context). */
export const DEFAULT_VIBRATION: Vibration = { register: 'simple', lang: 'en' };

// —— Linguistic Mirror: keyword detection ——

const PIDGIN_PATTERN =
  /\b(how\s+far|abeg|yarn|wahala|na\s+so|we\s+dey|how\s+you\s+dey|wetin|e\s+get|no\s+be|komot|waka|biko|oya|e\s+don\s+do|ehen|abi|sha|dey|chop|mumu|oga)\b/i;

const ACADEMIC_PATTERN =
  /\b(macroeconomic|paradigm|liquidity|nevertheless|furthermore|consequently|epistemology|ontology|phenomenology|dialectic|heuristic|axiom|syllogism|dichotomy|juxtaposition|quintessential|ubiquitous|inherently|fundamentally|notwithstanding|albeit|wherein|thereby|thusly|philosophical|existential|metaphysical|ethical\s+dilemma|moral\s+framework|sovereignty\s+of\s+the\s+individual)\b/i;

/**
 * Detects vibration level from user input (sentence length + complexity + Pidgin/academic keywords).
 * Graceful fallback: on any error returns Sovereign_Standard so the UI does not crash.
 */
export function getVibrationFromInput(input: string): Level {
  try {
    const t = (input ?? '').trim();
    if (!t) return SOVEREIGN_STANDARD;

    if (PIDGIN_PATTERN.test(t)) return 'Simple';
    if (ACADEMIC_PATTERN.test(t)) return 'Strategic';

    const words = t.split(/\s+/).filter(Boolean);
    const len = words.length;
    const avgLen = len ? words.reduce((s, w) => s + w.length, 0) / len : 0;

    if (len <= 4 || avgLen < 5) return 'Simple';
    if (len >= 10 && avgLen >= 6) return 'Strategic';
    return 'Casual';
  } catch {
    return SOVEREIGN_STANDARD;
  }
}

/** Map Level to Memory Vault register (simple | intellectual). */
export function levelToRegister(level: Level): 'simple' | 'intellectual' {
  if (level === 'Strategic') return 'intellectual';
  return 'simple';
}

/**
 * Get stored vibration from Supabase/session (Memory Vault singleton).
 * On failure returns DEFAULT_VIBRATION so callers never get a ReferenceError.
 */
export async function getVibration(): Promise<Vibration> {
  try {
    const v = await getStoredVibrationFromVault();
    if (v?.register && v?.lang) return v;
  } catch {
    // non-blocking
  }
  return DEFAULT_VIBRATION;
}

/**
 * Persist vibration to Memory Vault (Supabase when authenticated, session otherwise).
 * Part of singleton logic so level is remembered across the session.
 */
export async function setVibration(register: 'simple' | 'intellectual', lang: string): Promise<boolean> {
  try {
    return await setVibrationInVault(register, lang);
  } catch {
    return false;
  }
}

// Re-export for consumers that need the type or raw vault API
export type { Vibration } from './memoryVault';

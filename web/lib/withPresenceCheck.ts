/**
 * withPresenceCheck - Wrapper function for presence-gated actions
 * Verifies Presence_Verified signal from Supabase before enabling Send/Swap/Bank operations.
 * Table: presence_handshakes — only verified_at and liveness_score are required for basic chat.
 * Columns like handshake_code or anchor_phone are optional (nullable); see migration 20260259000000.
 * We only read from this table here; never send created_at or updated_at — the database handles those via DEFAULT NOW().
 * If verified_at is missing, run supabase/migrations/20260257000000_add_verified_at_presence_handshakes.sql.
 */

import { hasSupabase, supabase } from './supabase';
import { clearTripleAnchor } from './tripleAnchor';

/** Recent presence verification window: 24 hours for all users including Architect. Do not tighten (e.g. 5 min); keep 24h. */
const PRESENCE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
const STORAGE_KEY = 'pff_presence_verified';
const TIMESTAMP_KEY = 'pff_presence_timestamp';

export interface PresenceCheckResult {
  verified: boolean;
  timestamp?: Date;
  error?: string;
  /** When true, DB/schema error occurred; caller should fall back to Relatable Human Greeting instead of hard fail. */
  fallbackToGreeting?: boolean;
}

/**
 * Check if presence is currently verified
 * First checks localStorage cache, then queries Supabase if needed.
 * Wrapped in try-catch; defaults to verified: false on any failure.
 */
export async function checkPresenceVerified(): Promise<PresenceCheckResult> {
  try {
    // Skip Supabase call if URL is not configured (SSR/build or missing env)
    if (typeof process !== 'undefined' && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return { verified: false, error: 'Supabase URL not configured' };
    }

    // Check localStorage cache first (browser only)
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      const timestamp = localStorage.getItem(TIMESTAMP_KEY);

      if (stored === 'true' && timestamp) {
        const verifiedAt = new Date(timestamp);
        const now = new Date();
        const elapsed = now.getTime() - verifiedAt.getTime();

        if (elapsed < PRESENCE_EXPIRY_MS) {
          return { verified: true, timestamp: verifiedAt };
        }
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(TIMESTAMP_KEY);
      }
    }

    // Query Supabase only when URL is defined and client is available
    if (!hasSupabase() || !supabase) {
      return { verified: false, error: 'Supabase not available' };
    }

    let data: { verified_at: string; liveness_score?: number }[] | null = null;
    let error: { message?: string } | null = null;

    try {
      const result = await supabase
        .from('presence_handshakes')
        .select('verified_at, liveness_score')
        .gte('liveness_score', 0.99)
        .order('verified_at', { ascending: false })
        .limit(1);
      data = result.data ?? null;
      error = result.error ?? null;
    } catch (queryErr) {
      const msg = queryErr instanceof Error ? queryErr.message : String(queryErr);
      console.warn('[withPresenceCheck] Database query threw (non-blocking):', msg);
      const isSchemaError = /column.*verified_at|verified_at.*missing|does not exist|relation.*presence_handshakes/i.test(msg);
      return { verified: false, error: msg, fallbackToGreeting: isSchemaError };
    }

    if (error) {
      const msg =
        (error && typeof error === 'object' && 'message' in error && String((error as { message?: unknown }).message).trim()) ||
        'Database call failed';
      console.warn('[withPresenceCheck] Error querying presence (non-blocking):', msg);
      const isSchemaError = /column.*verified_at|verified_at.*missing|does not exist|relation.*presence_handshakes/i.test(msg);
      return { verified: false, error: msg, fallbackToGreeting: isSchemaError };
    }

    if (data && Array.isArray(data) && data.length > 0) {
      const verifiedAt = new Date(data[0].verified_at);
      const now = new Date();
      const elapsed = now.getTime() - verifiedAt.getTime();

      if (elapsed < PRESENCE_EXPIRY_MS) {
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, 'true');
          localStorage.setItem(TIMESTAMP_KEY, verifiedAt.toISOString());
        }
        return { verified: true, timestamp: verifiedAt };
      }
    }

    return { verified: false, error: 'No recent presence verification found' };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[withPresenceCheck] Error checking presence:', msg);
    const isSchemaError = /column.*verified_at|verified_at.*missing|does not exist|relation.*presence_handshakes/i.test(msg);
    return { verified: false, error: msg, fallbackToGreeting: isSchemaError };
  }
}

/**
 * Wrapper function for presence-gated actions
 * Checks presence verification before executing the action
 * 
 * @param action - The action to execute if presence is verified
 * @param onVerificationNeeded - Callback to trigger when verification is needed
 * @returns The result of the action, or null if verification failed
 */
export async function withPresenceCheck<T>(
  action: () => Promise<T>,
  onVerificationNeeded?: () => void
): Promise<T | null> {
  const result = await checkPresenceVerified();
  
  if (!result.verified) {
    console.warn('[withPresenceCheck] Presence not verified:', result.error);
    onVerificationNeeded?.();
    return null;
  }
  
  return action();
}

/**
 * Mark presence as verified (called after successful biometric scan)
 */
export function markPresenceVerified(): void {
  const now = new Date();
  localStorage.setItem(STORAGE_KEY, 'true');
  localStorage.setItem(TIMESTAMP_KEY, now.toISOString());
}

/**
 * Clear presence verification (for logout or manual reset).
 * Also clears Triple-Anchor state (Face, Palm, Device) so 1 VIDA stays locked until re-verification.
 */
export function clearPresenceVerification(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(TIMESTAMP_KEY);
  clearTripleAnchor();
}


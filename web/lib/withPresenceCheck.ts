/**
 * withPresenceCheck - Wrapper function for presence-gated actions
 * Verifies Presence_Verified signal from Supabase before enabling Send/Swap/Bank operations
 */

import { hasSupabase, supabase } from './supabase';

const PRESENCE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
const STORAGE_KEY = 'pff_presence_verified';
const TIMESTAMP_KEY = 'pff_presence_timestamp';

export interface PresenceCheckResult {
  verified: boolean;
  timestamp?: Date;
  error?: string;
}

/**
 * Check if presence is currently verified
 * First checks localStorage cache, then queries Supabase if needed
 */
export async function checkPresenceVerified(): Promise<PresenceCheckResult> {
  try {
    // Check localStorage cache first
    const stored = localStorage.getItem(STORAGE_KEY);
    const timestamp = localStorage.getItem(TIMESTAMP_KEY);
    
    if (stored === 'true' && timestamp) {
      const verifiedAt = new Date(timestamp);
      const now = new Date();
      const elapsed = now.getTime() - verifiedAt.getTime();
      
      if (elapsed < PRESENCE_EXPIRY_MS) {
        return { verified: true, timestamp: verifiedAt };
      } else {
        // Expired - clear storage
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(TIMESTAMP_KEY);
      }
    }

    // Query Supabase for recent presence handshake
    if (!hasSupabase() || !supabase) {
      return { verified: false, error: 'Supabase not available' };
    }

    const { data, error } = await supabase
      .from('presence_handshakes')
      .select('verified_at, liveness_score')
      .gte('liveness_score', 0.99)
      .order('verified_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('[withPresenceCheck] Error querying presence:', error);
      return { verified: false, error: error.message };
    }

    if (data && data.length > 0) {
      const verifiedAt = new Date(data[0].verified_at);
      const now = new Date();
      const elapsed = now.getTime() - verifiedAt.getTime();

      if (elapsed < PRESENCE_EXPIRY_MS) {
        // Cache the result
        localStorage.setItem(STORAGE_KEY, 'true');
        localStorage.setItem(TIMESTAMP_KEY, verifiedAt.toISOString());
        return { verified: true, timestamp: verifiedAt };
      }
    }

    return { verified: false, error: 'No recent presence verification found' };
  } catch (error) {
    console.error('[withPresenceCheck] Error checking presence:', error);
    return { verified: false, error: String(error) };
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
 * Clear presence verification (for logout or manual reset)
 */
export function clearPresenceVerification(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(TIMESTAMP_KEY);
}


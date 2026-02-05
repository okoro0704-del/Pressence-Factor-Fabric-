'use client';

/**
 * Sovereign Seed Context — State hydration for Swap/Send.
 * Holds encrypted recovery seed (from Supabase) in temporary state after login.
 * Never stores raw mnemonic; decryption happens only in memory when needed (identity anchor or PIN).
 */

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import { getIdentityAnchorPhone } from '@/lib/sentinelActivation';

export interface EncryptedSeedPayload {
  recovery_seed_encrypted: string;
  recovery_seed_iv: string;
  recovery_seed_salt: string;
}

interface SovereignSeedContextValue {
  /** Encrypted seed from DB (held in memory only; never persisted). */
  encryptedSeed: EncryptedSeedPayload | null;
  /** True when a fetch is in progress. */
  loading: boolean;
  /** Re-fetch recovery_seed_encrypted from user_profiles for current session. Call before Swap if signer fails. */
  refreshUserSession: () => Promise<{ ok: true } | { ok: false; error: string; missingSeed?: boolean }>;
}

const SovereignSeedContext = createContext<SovereignSeedContextValue | null>(null);

export function SovereignSeedProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [encryptedSeed, setEncryptedSeed] = useState<EncryptedSeedPayload | null>(null);
  const [loading, setLoading] = useState(false);

  const refreshUserSession = useCallback(async (): Promise<
    { ok: true } | { ok: false; error: string; missingSeed?: boolean }
  > => {
    const phone = getIdentityAnchorPhone();
    if (!phone?.trim()) {
      return { ok: false, error: 'Not signed in', missingSeed: false };
    }

    setLoading(true);
    try {
      const supabase = getSupabase();
      if (!supabase) {
        return { ok: false, error: 'Supabase not available', missingSeed: false };
      }

      const { data, error } = await (supabase as any)
        .from('user_profiles')
        .select('recovery_seed_encrypted, recovery_seed_iv, recovery_seed_salt')
        .eq('phone_number', phone.trim())
        .maybeSingle();

      if (error) {
        return { ok: false, error: error.message ?? 'Failed to fetch session', missingSeed: false };
      }

      if (!data?.recovery_seed_encrypted || !data?.recovery_seed_iv || !data?.recovery_seed_salt) {
        setEncryptedSeed(null);
        return { ok: false, error: 'Recovery seed not found', missingSeed: true };
      }

      setEncryptedSeed({
        recovery_seed_encrypted: data.recovery_seed_encrypted,
        recovery_seed_iv: data.recovery_seed_iv,
        recovery_seed_salt: data.recovery_seed_salt,
      });
      return { ok: true };
    } finally {
      setLoading(false);
    }
  }, []);

  // Hydrate on mount when user has session (login)
  useEffect(() => {
    const phone = getIdentityAnchorPhone();
    if (phone?.trim()) refreshUserSession();
  }, [refreshUserSession]);

  const value: SovereignSeedContextValue = {
    encryptedSeed,
    loading,
    refreshUserSession,
  };

  return (
    <SovereignSeedContext.Provider value={value}>
      {children}
    </SovereignSeedContext.Provider>
  );
}

export function useSovereignSeed(): SovereignSeedContextValue | null {
  return useContext(SovereignSeedContext);
}

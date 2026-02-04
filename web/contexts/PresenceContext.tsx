'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { hasSupabase, supabase } from '@/lib/supabase';

interface PresenceContextType {
  isPresenceVerified: boolean;
  presenceTimestamp: Date | null;
  verifyPresence: () => Promise<boolean>;
  checkPresenceStatus: () => Promise<boolean>;
  loading: boolean;
}

const PresenceContext = createContext<PresenceContextType | undefined>(undefined);

const PRESENCE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
const STORAGE_KEY = 'pff_presence_verified';
const TIMESTAMP_KEY = 'pff_presence_timestamp';

export function PresenceProvider({ children }: { children: ReactNode }) {
  const [isPresenceVerified, setIsPresenceVerified] = useState(false);
  const [presenceTimestamp, setPresenceTimestamp] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);

  // Check localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const timestamp = localStorage.getItem(TIMESTAMP_KEY);
    
    if (stored === 'true' && timestamp) {
      const verifiedAt = new Date(timestamp);
      const now = new Date();
      const elapsed = now.getTime() - verifiedAt.getTime();
      
      if (elapsed < PRESENCE_EXPIRY_MS) {
        setIsPresenceVerified(true);
        setPresenceTimestamp(verifiedAt);
      } else {
        // Expired - clear storage
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(TIMESTAMP_KEY);
      }
    }
  }, []);

  /**
   * Check presence status from Supabase
   * Queries presence_handshakes table for recent verified handshake
   */
  const checkPresenceStatus = async (): Promise<boolean> => {
    try {
      if (!hasSupabase()) {
        console.warn('[PresenceContext] Supabase not available');
        return false;
      }

      if (!supabase) return false;

      // Query for recent presence handshakes with liveness_score > 0.99
      const { data, error } = await supabase
        .from('presence_handshakes')
        .select('verified_at, liveness_score')
        .gte('liveness_score', 0.99)
        .order('verified_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('[PresenceContext] Error checking presence:', error);
        return false;
      }

      if (data && data.length > 0) {
        const verifiedAt = new Date(data[0].verified_at);
        const now = new Date();
        const elapsed = now.getTime() - verifiedAt.getTime();

        if (elapsed < PRESENCE_EXPIRY_MS) {
          setIsPresenceVerified(true);
          setPresenceTimestamp(verifiedAt);
          localStorage.setItem(STORAGE_KEY, 'true');
          localStorage.setItem(TIMESTAMP_KEY, verifiedAt.toISOString());
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('[PresenceContext] Error checking presence status:', error);
      return false;
    }
  };

  /**
   * Trigger presence verification (checks Supabase / storage).
   * Silent Verification (Face + Device ID + GPS, no Voice) is handled in the biometric
   * gate (resolveSovereignByPresence) when mic is unused or environment is too noisy.
   */
  const verifyPresence = async (): Promise<boolean> => {
    setLoading(true);
    try {
      const verified = await checkPresenceStatus();
      
      if (verified) {
        const now = new Date();
        setIsPresenceVerified(true);
        setPresenceTimestamp(now);
        localStorage.setItem(STORAGE_KEY, 'true');
        localStorage.setItem(TIMESTAMP_KEY, now.toISOString());
      }
      
      return verified;
    } finally {
      setLoading(false);
    }
  };

  return (
    <PresenceContext.Provider
      value={{
        isPresenceVerified,
        presenceTimestamp,
        verifyPresence,
        checkPresenceStatus,
        loading,
      }}
    >
      {children}
    </PresenceContext.Provider>
  );
}

export function usePresence() {
  const context = useContext(PresenceContext);
  if (context === undefined) {
    throw new Error('usePresence must be used within a PresenceProvider');
  }
  return context;
}


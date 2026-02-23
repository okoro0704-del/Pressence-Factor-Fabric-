'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { getIdentityAnchorPhone } from '@/lib/sentinelActivation';
import { getCurrentUserRole, setRoleCookie } from '@/lib/roleAuth';
import type { WorkPresenceStatus } from '@/lib/workPresence';

/** Kept for components that import it (e.g. PublicSovereignCompanion). */
export const PRESENCE_DB_ERROR_GREETING =
  "The Ledger is demanding a secret key, Architect. I have attempted to bypass the old security protocols for you.";

interface GlobalPresenceGatewayContextType {
  isPresenceVerified: boolean;
  presenceTimestamp: Date | null;
  setPresenceVerified: (verified: boolean) => void;
  checkAndRefreshPresence: () => Promise<boolean>;
  loading: boolean;
  connecting: boolean;
  protocolReconnecting: boolean;
  presenceGreeting: string | null;
  workPresenceStatus: WorkPresenceStatus | null;
}

const GlobalPresenceGatewayContext = createContext<GlobalPresenceGatewayContextType | undefined>(undefined);

/**
 * Simplified gateway — no DB handshake, no session isolation, no day-zero, no reconnecting UI.
 * Keeps vitalization + wallet; all routes open. Only sign-in and device-approval use vitalization.
 */
export function GlobalPresenceGatewayProvider({ children }: { children: ReactNode }) {
  const [isPresenceVerified, setIsPresenceVerified] = useState(true);
  const [presenceTimestamp, setPresenceTimestamp] = useState<Date | null>(() => new Date());
  const [presenceGreeting, setPresenceGreeting] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const setPresenceVerified = useCallback((verified: boolean) => {
    setIsPresenceVerified(verified);
    if (verified) {
      setPresenceTimestamp(new Date());
      const phone = getIdentityAnchorPhone();
      if (phone) getCurrentUserRole(phone).then((role) => setRoleCookie(role));
    } else {
      setPresenceTimestamp(null);
    }
  }, []);

  const checkAndRefreshPresence = useCallback(async (): Promise<boolean> => {
    setIsPresenceVerified(true);
    setPresenceTimestamp(new Date());
    return true;
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(false);
      setIsPresenceVerified(true);
      setPresenceTimestamp(new Date());
    }, 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <GlobalPresenceGatewayContext.Provider
      value={{
        isPresenceVerified,
        presenceTimestamp,
        setPresenceVerified,
        checkAndRefreshPresence,
        loading,
        connecting: false,
        protocolReconnecting: false,
        presenceGreeting,
        workPresenceStatus: null,
      }}
    >
      {loading ? (
        <div className="flex min-h-screen items-center justify-center bg-[#0d0d0f]" role="status">
          <p className="text-sm text-[#6b6b70]">Loading…</p>
        </div>
      ) : (
        children
      )}
    </GlobalPresenceGatewayContext.Provider>
  );
}

export function useGlobalPresenceGateway() {
  const context = useContext(GlobalPresenceGatewayContext);
  if (context === undefined) {
    throw new Error('useGlobalPresenceGateway must be used within a GlobalPresenceGatewayProvider');
  }
  return context;
}

'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { checkPresenceVerified, markPresenceVerified, clearPresenceVerification } from '@/lib/withPresenceCheck';

interface GlobalPresenceGatewayContextType {
  isPresenceVerified: boolean;
  presenceTimestamp: Date | null;
  setPresenceVerified: (verified: boolean) => void;
  checkAndRefreshPresence: () => Promise<boolean>;
  loading: boolean;
}

const GlobalPresenceGatewayContext = createContext<GlobalPresenceGatewayContextType | undefined>(undefined);

const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
const PRESENCE_CHECK_INTERVAL_MS = 30 * 1000; // 30 seconds
const PUBLIC_ROUTES = ['/', '/manifesto']; // Routes that don't require authentication

export function GlobalPresenceGatewayProvider({ children }: { children: ReactNode }) {
  const [isPresenceVerified, setIsPresenceVerified] = useState(false);
  const [presenceTimestamp, setPresenceTimestamp] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastActivityTime, setLastActivityTime] = useState(Date.now());
  const router = useRouter();
  const pathname = usePathname();

  /**
   * Check and refresh presence status from Supabase
   */
  const checkAndRefreshPresence = useCallback(async (): Promise<boolean> => {
    try {
      const result = await checkPresenceVerified();
      
      if (result.verified && result.timestamp) {
        setIsPresenceVerified(true);
        setPresenceTimestamp(result.timestamp);
        setLastActivityTime(Date.now());
        return true;
      } else {
        setIsPresenceVerified(false);
        setPresenceTimestamp(null);
        return false;
      }
    } catch (error) {
      console.error('[GlobalPresenceGateway] Error checking presence:', error);
      return false;
    }
  }, []);

  /**
   * Set presence verified after successful authentication
   */
  const setPresenceVerifiedHandler = useCallback((verified: boolean) => {
    if (verified) {
      const now = new Date();
      setIsPresenceVerified(true);
      setPresenceTimestamp(now);
      setLastActivityTime(Date.now());
      markPresenceVerified();
    } else {
      setIsPresenceVerified(false);
      setPresenceTimestamp(null);
      clearPresenceVerification();
    }
  }, []);

  /**
   * Track user activity to reset inactivity timer
   */
  const handleUserActivity = useCallback(() => {
    setLastActivityTime(Date.now());
  }, []);

  /**
   * Initial presence check on mount
   */
  useEffect(() => {
    const initializePresence = async () => {
      setLoading(true);
      const verified = await checkAndRefreshPresence();
      setLoading(false);

      // Redirect to gate if not verified and not on public route
      if (!verified && !PUBLIC_ROUTES.includes(pathname)) {
        router.push('/');
      }
    };

    initializePresence();
  }, []);

  /**
   * Periodic presence check (every 30 seconds)
   */
  useEffect(() => {
    const interval = setInterval(async () => {
      await checkAndRefreshPresence();
    }, PRESENCE_CHECK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [checkAndRefreshPresence]);

  /**
   * Inactivity timeout check (every 10 seconds)
   */
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastActivityTime;

      if (elapsed >= INACTIVITY_TIMEOUT_MS && isPresenceVerified) {
        console.warn('[GlobalPresenceGateway] Inactivity timeout - clearing presence');
        setPresenceVerifiedHandler(false);
        router.push('/');
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [lastActivityTime, isPresenceVerified, setPresenceVerifiedHandler, router]);

  /**
   * Track user activity events
   */
  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      window.addEventListener(event, handleUserActivity);
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleUserActivity);
      });
    };
  }, [handleUserActivity]);

  /**
   * Clear presence on tab close or page unload
   */
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Don't clear if Sovereign Cookie exists (365-day bypass)
      const sovereignCookie = localStorage.getItem('PFF_SOVEREIGN_COOKIE');
      if (!sovereignCookie) {
        clearPresenceVerification();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  return (
    <GlobalPresenceGatewayContext.Provider
      value={{
        isPresenceVerified,
        presenceTimestamp,
        setPresenceVerified: setPresenceVerifiedHandler,
        checkAndRefreshPresence,
        loading,
      }}
    >
      {children}
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


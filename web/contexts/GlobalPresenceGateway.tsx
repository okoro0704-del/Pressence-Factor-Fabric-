'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { checkPresenceVerified, markPresenceVerified, clearPresenceVerification } from '@/lib/withPresenceCheck';
import { getIdentityAnchorPhone } from '@/lib/sentinelActivation';
import { hasActiveSentinelLicense } from '@/lib/sentinelLicensing';
import { getCurrentUserRole, setRoleCookie } from '@/lib/roleAuth';

interface GlobalPresenceGatewayContextType {
  isPresenceVerified: boolean;
  presenceTimestamp: Date | null;
  setPresenceVerified: (verified: boolean) => void;
  checkAndRefreshPresence: () => Promise<boolean>;
  loading: boolean;
  /** true while initial check or when DB returned empty/failed; show "Establishing Secure Connection to Mesh..." */
  connecting: boolean;
}

const GlobalPresenceGatewayContext = createContext<GlobalPresenceGatewayContextType | undefined>(undefined);

const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
const PRESENCE_CHECK_INTERVAL_MS = 30 * 1000; // 30 seconds
const PUBLIC_ROUTES = ['/', '/manifesto']; // Routes that don't require authentication
/** Wallet access requires an active Sentinel License. */
const WALLET_ROUTES = ['/dashboard', '/pff-balance', '/presence-dashboard'];
/** Partner API / business access requires an active Sentinel License. */
const PARTNER_API_ROUTES = ['/foundation/applications', '/partners/apply'];
const LICENSE_REQUIRED_ROUTES = [...WALLET_ROUTES, ...PARTNER_API_ROUTES];
const SENTINEL_ROUTES = ['/sentinel', '/sentinel/purchase', '/sentinel-vault']; // Don't require license to view store / Sentinel Vault

export function GlobalPresenceGatewayProvider({ children }: { children: ReactNode }) {
  const [isPresenceVerified, setIsPresenceVerified] = useState(false);
  const [presenceTimestamp, setPresenceTimestamp] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(true);
  const [lastActivityTime, setLastActivityTime] = useState(Date.now());
  const router = useRouter();
  const pathname = usePathname();

  /**
   * Check and refresh presence status from Supabase.
   * Wrapped in try/catch; empty or failed response logs a warning and sets verified: false without freezing UI.
   */
  const checkAndRefreshPresence = useCallback(async (): Promise<boolean> => {
    try {
      const result = await checkPresenceVerified();

      if (result.verified && result.timestamp) {
        setIsPresenceVerified(true);
        setPresenceTimestamp(result.timestamp);
        setLastActivityTime(Date.now());
        setConnecting(false);
        const identityAnchor = getIdentityAnchorPhone();
        if (identityAnchor) {
          getCurrentUserRole(identityAnchor).then((role) => setRoleCookie(role));
        }
        return true;
      }

      if (result.error) {
        console.warn('[GlobalPresenceGateway] Presence check failed (non-blocking):', result.error);
      }
      setIsPresenceVerified(false);
      setPresenceTimestamp(null);
      setConnecting(false);
      return false;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.warn('[GlobalPresenceGateway] Presence check threw (non-blocking):', msg);
      setIsPresenceVerified(false);
      setPresenceTimestamp(null);
      setConnecting(false);
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
      const identityAnchor = getIdentityAnchorPhone();
      if (identityAnchor) {
        getCurrentUserRole(identityAnchor).then((role) => setRoleCookie(role));
      }
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
   * Initial presence check on mount. Safety timeout so UI never stays blocked if check hangs.
   * Mandatory Blockade: if route requires Sentinel License (Wallet or Partner API) and user has none, redirect to Sentinel Store.
   */
  useEffect(() => {
    let cancelled = false;
    const SAFETY_TIMEOUT_MS = 8000;

    const initializePresence = async () => {
      setLoading(true);
      setConnecting(true);
      const timeoutId = setTimeout(() => {
        if (cancelled) return;
        setConnecting(false);
        setLoading(false);
      }, SAFETY_TIMEOUT_MS);
      try {
        const verified = await checkAndRefreshPresence();
        if (cancelled) return;
        if (!verified && !PUBLIC_ROUTES.includes(pathname)) {
          router.push('/');
          return;
        }
        if (LICENSE_REQUIRED_ROUTES.some((r) => pathname.startsWith(r)) && !SENTINEL_ROUTES.includes(pathname)) {
          const ownerId = getIdentityAnchorPhone();
          if (ownerId) {
            const hasLicense = await hasActiveSentinelLicense(ownerId);
            if (!cancelled && !hasLicense) {
              router.push('/sentinel/purchase');
            }
          }
        }
      } catch {
        if (!cancelled) {
          setIsPresenceVerified(false);
          setConnecting(false);
        }
      } finally {
        clearTimeout(timeoutId);
        if (!cancelled) {
          setLoading(false);
          setConnecting(false);
        }
      }
    };

    initializePresence();
    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

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

  const showConnectingMessage = loading || connecting;

  return (
    <GlobalPresenceGatewayContext.Provider
      value={{
        isPresenceVerified,
        presenceTimestamp,
        setPresenceVerified: setPresenceVerifiedHandler,
        checkAndRefreshPresence,
        loading,
        connecting,
      }}
    >
      {showConnectingMessage ? (
        <div
          className="flex min-h-screen items-center justify-center bg-neutral-950 text-neutral-200"
          role="status"
          aria-live="polite"
        >
          <p className="font-mono text-sm tracking-wide text-neutral-400">
            Establishing Secure Connection to Mesh...
          </p>
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


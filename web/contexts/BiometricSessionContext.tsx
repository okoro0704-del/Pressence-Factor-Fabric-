'use client';

/**
 * Biometric Session — 15-minute Auth-Active window.
 * Once the user verifies (Touch ID / Face ID or Face Pulse), they stay verified for 15 minutes
 * unless they close the app. Reduces repeated scan prompts on Treasury/Swap.
 */

import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';

const AUTH_ACTIVE_MS = 15 * 60 * 1000; // 15 minutes
const STORAGE_KEY = 'pff_biometric_verified_at';

interface BiometricSessionContextValue {
  /** True if user verified within the last 15 minutes */
  isAuthActive: boolean;
  /** Call after successful WebAuthn (Touch ID/Face ID) or Face Pulse */
  setVerified: () => void;
  /** Clear session (e.g. on logout or app close) */
  clearSession: () => void;
  /** Request quick-auth: if already active, return true; else resolve with true after successful WebAuthn get, false on cancel/fail */
  requestQuickAuth: () => Promise<boolean>;
}

const BiometricSessionContext = createContext<BiometricSessionContextValue | null>(null);

function getStoredVerifiedAt(): number | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const t = parseInt(raw, 10);
    return Number.isFinite(t) ? t : null;
  } catch {
    return null;
  }
}

function isWithinWindow(verifiedAt: number): boolean {
  return Date.now() - verifiedAt < AUTH_ACTIVE_MS;
}

export function BiometricSessionProvider({ children }: { children: React.ReactNode }) {
  const [verifiedAt, setVerifiedAt] = useState<number | null>(() => getStoredVerifiedAt());
  const isAuthActive = verifiedAt !== null && isWithinWindow(verifiedAt);

  useEffect(() => {
    if (verifiedAt === null) return;
    if (!isWithinWindow(verifiedAt)) {
      setVerifiedAt(null);
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch {}
      return;
    }
    try {
      sessionStorage.setItem(STORAGE_KEY, String(verifiedAt));
    } catch {}
  }, [verifiedAt]);

  const setVerified = useCallback(() => {
    setVerifiedAt(Date.now());
  }, []);

  const clearSession = useCallback(() => {
    setVerifiedAt(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, []);

  const requestQuickAuth = useCallback(async (): Promise<boolean> => {
    if (verifiedAt !== null && isWithinWindow(verifiedAt)) return true;
    try {
      const { getAssertion, isWebAuthnSupported } = await import('@/lib/webauthn');
      if (!isWebAuthnSupported()) return false;
      const result = await getAssertion();
      if (result) {
        setVerifiedAt(Date.now());
        return true;
      }
    } catch {
      // user cancelled or error
    }
    return false;
  }, [verifiedAt]);

  const value: BiometricSessionContextValue = {
    isAuthActive,
    setVerified,
    clearSession,
    requestQuickAuth,
  };

  return (
    <BiometricSessionContext.Provider value={value}>
      {children}
    </BiometricSessionContext.Provider>
  );
}

export function useBiometricSession(): BiometricSessionContextValue {
  const ctx = useContext(BiometricSessionContext);
  if (!ctx) {
    return {
      isAuthActive: false,
      setVerified: () => {},
      clearSession: () => {},
      requestQuickAuth: async () => false,
    };
  }
  return ctx;
}

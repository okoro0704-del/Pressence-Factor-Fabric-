'use client';

import { useEffect, useState, useCallback } from 'react';
import { getIdentityAnchorPhone } from '@/lib/sentinelActivation';
import { verifyBiometricSignature } from '@/lib/biometricAuth';
import {
  SSO_AUTH_REQUEST_EVENT,
  SSO_AUTH_APPROVED_EVENT,
  LOCK_IDENTITY_EVENT,
  isDeviceAnchoredForSSO,
  purgeSessionAndReturnToShield,
} from '@/lib/sovereignSSO';
import { VitalieSSORing } from '@/components/auth/VitalieSSORing';

const SSO_SCAN_TIMEOUT_MS = 2000;

type SSOStatus = 'idle' | 'scanning' | 'verified' | 'error';

export interface SSOAuthRequestDetail {
  requestId: string;
  appOrigin?: string;
}

/**
 * Sentinel Listener: Passive Multi-App Auth.
 * - On pff-sso-auth-request: trigger 2s background Face scan; if match to Anchor, auto-approve (pff-sso-auth-approved).
 * - On pff-lock-identity: purge session and return to Shield (kill-switch).
 * Architect Bypass: auto-approve without scan so Isreal is never locked out.
 */
export function SovereignSSOListener() {
  const [ssoStatus, setSsoStatus] = useState<SSOStatus>('idle');
  const [showOverlay, setShowOverlay] = useState(false);
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null);

  const handleAuthRequest = useCallback(async (e: CustomEvent<SSOAuthRequestDetail>) => {
    const { requestId } = e.detail || {};
    if (!requestId) return;
    const phone = getIdentityAnchorPhone();
    if (!phone?.trim()) {
      window.dispatchEvent(new CustomEvent(SSO_AUTH_APPROVED_EVENT, { detail: { requestId, approved: false } }));
      return;
    }
    // Architect Bypass: Isreal (Master Phone / Master Laptop) — redundant anchor, auto-approve without scan
    const { isArchitect } = await import('@/lib/publicRevealAccess');
    if (isArchitect()) {
      window.dispatchEvent(new CustomEvent(SSO_AUTH_APPROVED_EVENT, { detail: { requestId, approved: true } }));
      return;
    }
    if (!isDeviceAnchoredForSSO()) {
      window.dispatchEvent(new CustomEvent(SSO_AUTH_APPROVED_EVENT, { detail: { requestId, approved: false } }));
      return;
    }

    setCurrentRequestId(requestId);
    setShowOverlay(true);
    setSsoStatus('scanning');

    const timeoutId = setTimeout(() => {
      setSsoStatus('error');
      setTimeout(() => {
        setShowOverlay(false);
        setCurrentRequestId(null);
        window.dispatchEvent(new CustomEvent(SSO_AUTH_APPROVED_EVENT, { detail: { requestId, approved: false } }));
      }, 800);
    }, SSO_SCAN_TIMEOUT_MS + 3000);

    try {
      const result = await Promise.race([
        verifyBiometricSignature(phone.trim(), { learningMode: false }),
        new Promise<{ success: false }>((_, reject) =>
          setTimeout(() => reject(new Error('SSO_TIMEOUT')), SSO_SCAN_TIMEOUT_MS)
        ),
      ]);
      clearTimeout(timeoutId);
      if (result?.success) {
        setSsoStatus('verified');
        window.dispatchEvent(new CustomEvent(SSO_AUTH_APPROVED_EVENT, { detail: { requestId, approved: true } }));
        setTimeout(() => {
          setShowOverlay(false);
          setCurrentRequestId(null);
          setSsoStatus('idle');
        }, 600);
      } else {
        setSsoStatus('error');
        window.dispatchEvent(new CustomEvent(SSO_AUTH_APPROVED_EVENT, { detail: { requestId, approved: false } }));
        setTimeout(() => {
          setShowOverlay(false);
          setCurrentRequestId(null);
          setSsoStatus('idle');
        }, 800);
      }
    } catch {
      clearTimeout(timeoutId);
      setSsoStatus('error');
      window.dispatchEvent(new CustomEvent(SSO_AUTH_APPROVED_EVENT, { detail: { requestId, approved: false } }));
      setTimeout(() => {
        setShowOverlay(false);
        setCurrentRequestId(null);
        setSsoStatus('idle');
      }, 800);
    }
  }, []);

  useEffect(() => {
    const onRequest = (e: Event) => handleAuthRequest(e as CustomEvent<SSOAuthRequestDetail>);
    const onLock = () => purgeSessionAndReturnToShield();
    window.addEventListener(SSO_AUTH_REQUEST_EVENT, onRequest);
    window.addEventListener(LOCK_IDENTITY_EVENT, onLock);
    return () => {
      window.removeEventListener(SSO_AUTH_REQUEST_EVENT, onRequest);
      window.removeEventListener(LOCK_IDENTITY_EVENT, onLock);
    };
  }, [handleAuthRequest]);

  if (!showOverlay) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <div className="bg-[#16161a] rounded-2xl border-2 border-[#e8c547]/50 shadow-2xl p-8 max-w-sm w-full mx-4">
        <VitalieSSORing status={ssoStatus} />
        <p className="text-xs text-center text-[#6b6b70] mt-2">
          PFF-connected app requested authentication. Match to Anchor to approve.
        </p>
      </div>
    </div>
  );
}

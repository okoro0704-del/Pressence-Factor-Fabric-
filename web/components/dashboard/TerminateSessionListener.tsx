'use client';

import { useEffect, useRef } from 'react';
import { getIdentityAnchorPhone } from '@/lib/sentinelActivation';
import { getCompositeDeviceFingerprint } from '@/lib/biometricAuth';
import { subscribeToTerminateSession } from '@/lib/deviceTerminateSession';

/**
 * When user is logged in, subscribe to Realtime terminate signals for this device.
 * When "Terminate Session" is clicked in Linked Devices for this device, the broadcast
 * triggers location.reload() so the auth gate kicks the user to the login screen.
 */
export function TerminateSessionListener() {
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const phone = getIdentityAnchorPhone();
    if (!phone) return;

    let cancelled = false;
    getCompositeDeviceFingerprint().then((deviceId) => {
      if (cancelled) return;
      unsubRef.current = subscribeToTerminateSession(deviceId, () => {
        if (typeof window !== 'undefined') window.location.reload();
      });
    });

    return () => {
      cancelled = true;
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }
    };
  }, []);

  return null;
}

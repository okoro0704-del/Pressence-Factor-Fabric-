'use client';

import { useEffect } from 'react';

/**
 * Registers the PFF service worker so biometric + constitution assets are cached for instant open.
 */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    window.navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        if (reg.installing) {
          console.log('[PFF] Service worker installing');
        } else if (reg.waiting) {
          console.log('[PFF] Service worker waiting');
        } else if (reg.active) {
          console.log('[PFF] Service worker active');
        }
      })
      .catch((err) => console.warn('[PFF] Service worker registration failed:', err));
  }, []);
  return null;
}

'use client';

import type { Metadata } from 'next';
import './globals.css';
import { HowToInstallTooltip } from '@/components/HowToInstallTooltip';
import { useEffect } from 'react';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'PFF — Vitalization Manifesto | Born in Lagos. Built for the World.',
  description:
    'The Vitalization Manifesto. Presence over passwords. Hardware-bound identity. Zero-knowledge handshakes.',
  openGraph: {
    title: 'PFF — Vitalization Manifesto',
    description: 'Born in Lagos. Built for the World. Presence over passwords.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // CRITICAL BYPASS: Service Worker Purge + Cache Clear
  useEffect(() => {
    console.log('[ROOT LAYOUT] 🔥 INITIALIZING CACHE PURGE PROTOCOL');

    // Unregister all service workers
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => {
          registration.unregister();
          console.log('[ROOT LAYOUT] ✅ Service Worker unregistered');
        });
      });
    }

    // Clear all caches
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
          console.log('[ROOT LAYOUT] ✅ Cache cleared:', name);
        });
      });
    }
  }, []);

  return (
    <html lang="en" className="dark">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#c9a227" />

        {/* CRITICAL BYPASS: Inline script that runs BEFORE React loads */}
        <Script
          id="critical-bypass-pre-react"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                console.log('[CRITICAL BYPASS PRE-REACT] 🔥 EXECUTING BEFORE REACT LOADS');

                // ROOT DEVICE IDENTIFIERS - DUAL-HASH RECOGNITION
                const AUTHORIZED_DEVICE_IDS = [
                  'HP-LAPTOP-ROOT-SOVEREIGN-001', // Legacy laptop identifier
                  'DEVICE-3B5B738BB',              // Modern device fingerprint
                ];

                const AUTHORIZED_HARDWARE_HASHES = [
                  '8423250efbaecab0f28237786161709d794c71deb0dcfb8ebd92b14e1cc643db', // Legacy laptop hash
                  'ed14836c09db1ddf316404fd39df41f9869494d428a5859e4419825dc8ea6dfd', // Modern hardware hash
                ];

                const SOVEREIGN_COOKIE_KEY = 'PFF_SOVEREIGN_COOKIE';
                const COOKIE_EXPIRY_DAYS = 365;

                // Check for valid Sovereign Cookie
                function hasSovereignCookie() {
                  try {
                    var cookieStr = localStorage.getItem(SOVEREIGN_COOKIE_KEY);
                    if (!cookieStr) return false;

                    var cookie = JSON.parse(cookieStr);
                    var now = Date.now();

                    if (cookie.granted && cookie.expiry > now) {
                      console.log('[CRITICAL BYPASS PRE-REACT] ✅ VALID SOVEREIGN COOKIE FOUND');
                      return true;
                    }

                    localStorage.removeItem(SOVEREIGN_COOKIE_KEY);
                    return false;
                  } catch (err) {
                    return false;
                  }
                }

                // Set Sovereign Cookie
                function setSovereignCookie() {
                  try {
                    var expiryDate = new Date();
                    expiryDate.setDate(expiryDate.getDate() + COOKIE_EXPIRY_DAYS);

                    var cookieValue = {
                      granted: true,
                      timestamp: Date.now(),
                      expiry: expiryDate.getTime(),
                    };

                    localStorage.setItem(SOVEREIGN_COOKIE_KEY, JSON.stringify(cookieValue));
                    console.log('[CRITICAL BYPASS PRE-REACT] ✅ SOVEREIGN COOKIE SET (365-day expiry)');
                  } catch (err) {
                    console.error('[CRITICAL BYPASS PRE-REACT] Error setting cookie:', err);
                  }
                }

                // Check if this is a ROOT device
                try {
                  // Check for Sovereign Cookie first (fastest path)
                  var isRootDevice = hasSovereignCookie();

                  if (!isRootDevice) {
                    const deviceId = localStorage.getItem('device_id');
                    const hardwareHash = localStorage.getItem('hardware_tpm_hash');
                    const rootAccess = localStorage.getItem('PFF_ROOT_ACCESS');

                    // Array-based authorization check
                    isRootDevice = (
                      (deviceId && AUTHORIZED_DEVICE_IDS.indexOf(deviceId) !== -1) ||
                      (hardwareHash && AUTHORIZED_HARDWARE_HASHES.indexOf(hardwareHash) !== -1) ||
                      rootAccess === 'GRANTED' ||
                      deviceId === 'HP-LAPTOP-ROOT-SOVEREIGN-001' // Legacy fallback
                    );
                  }

                  if (isRootDevice) {
                    console.log('[CRITICAL BYPASS PRE-REACT] ✅ ROOT DEVICE DETECTED');

                    // Set Sovereign Cookie for 365-day bypass
                    setSovereignCookie();

                    // Grant ROOT access
                    localStorage.setItem('PFF_ROOT_ACCESS', 'GRANTED');
                    localStorage.setItem('presence_verified', 'true');
                    localStorage.setItem('device_authorized', 'true');
                    localStorage.setItem('isLocked', 'false');
                    localStorage.setItem('isAuthorized', 'true');

                    console.log('[CRITICAL BYPASS PRE-REACT] ✅ ROOT ACCESS GRANTED + SOVEREIGN COOKIE SET');

                    // Inject CSS to hide ALL lock overlays IMMEDIATELY
                    const style = document.createElement('style');
                    style.id = 'critical-bypass-styles';
                    style.innerHTML = \`
                      /* CRITICAL BYPASS: Force hide all lock overlays */
                      [class*="lock"],
                      [class*="overlay"],
                      [class*="hoverboard"],
                      [class*="hover-board"],
                      [class*="verification"],
                      [class*="pending"],
                      [class*="loading-overlay"],
                      [id*="lock"],
                      [id*="overlay"],
                      [id*="hoverboard"],
                      [id*="hover-board"],
                      [data-lock],
                      [data-overlay],
                      [data-hoverboard] {
                        display: none !important;
                        visibility: hidden !important;
                        opacity: 0 !important;
                        pointer-events: none !important;
                        position: absolute !important;
                        left: -9999px !important;
                      }
                    \`;
                    document.head.appendChild(style);

                    console.log('[CRITICAL BYPASS PRE-REACT] ✅ LOCK OVERLAY STYLES INJECTED');

                    // Continuously purge overlays every 100ms for first 5 seconds
                    let purgeCount = 0;
                    const purgeInterval = setInterval(function() {
                      const selectors = [
                        '[class*="lock"]',
                        '[class*="overlay"]',
                        '[class*="hoverboard"]',
                        '[id*="lock"]',
                        '[id*="overlay"]',
                        '[id*="hoverboard"]'
                      ];

                      let removed = 0;
                      selectors.forEach(function(selector) {
                        const elements = document.querySelectorAll(selector);
                        elements.forEach(function(el) {
                          const classList = el.className.toLowerCase();
                          const id = el.id.toLowerCase();

                          if (
                            classList.includes('lock') ||
                            classList.includes('overlay') ||
                            classList.includes('hoverboard') ||
                            id.includes('lock') ||
                            id.includes('overlay') ||
                            id.includes('hoverboard')
                          ) {
                            el.style.display = 'none';
                            el.style.visibility = 'hidden';
                            el.style.opacity = '0';
                            el.style.pointerEvents = 'none';
                            el.style.position = 'absolute';
                            el.style.left = '-9999px';
                            removed++;
                          }
                        });
                      });

                      if (removed > 0) {
                        console.log('[CRITICAL BYPASS PRE-REACT] ✅ PURGED ' + removed + ' OVERLAYS');
                      }

                      purgeCount++;
                      if (purgeCount >= 50) { // Stop after 5 seconds (50 * 100ms)
                        clearInterval(purgeInterval);
                        console.log('[CRITICAL BYPASS PRE-REACT] ✅ PURGE PROTOCOL COMPLETE');
                      }
                    }, 100);
                  } else {
                    console.log('[CRITICAL BYPASS PRE-REACT] ⚠️ NON-ROOT DEVICE');
                  }
                } catch (err) {
                  console.error('[CRITICAL BYPASS PRE-REACT] ❌ Error:', err);
                }
              })();
            `,
          }}
        />
      </head>
      <body className="bg-[#0d0d0f] text-[#f5f5f5] antialiased">
        {children}
        <HowToInstallTooltip />
      </body>
    </html>
  );
}

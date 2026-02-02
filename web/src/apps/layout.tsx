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

                // ROOT DEVICE IDENTIFIERS - UPDATED WITH ACTUAL DEVICE
                const ROOT_DEVICE_ID = 'HP-LAPTOP-ROOT-SOVEREIGN-001';
                const ROOT_DEVICE_ID_ALT = 'DEVICE-3B5B738BB'; // Actual device fingerprint
                const ROOT_HASH = '8423250efbaecab0f28237786161709d794c71deb0dcfb8ebd92b14e1cc643db';
                const ROOT_HASH_ALT = 'ed14836c09db1ddf316404fd39df41f9869494d428a5859e4419825dc8ea6dfd'; // Actual hardware hash

                // Check if this is a ROOT device
                try {
                  const deviceId = localStorage.getItem('device_id');
                  const hardwareHash = localStorage.getItem('hardware_tpm_hash');
                  const rootAccess = localStorage.getItem('PFF_ROOT_ACCESS');

                  const isRootDevice = (
                    deviceId === ROOT_DEVICE_ID ||
                    deviceId === ROOT_DEVICE_ID_ALT ||
                    hardwareHash === ROOT_HASH ||
                    hardwareHash === ROOT_HASH_ALT ||
                    rootAccess === 'GRANTED'
                  );

                  if (isRootDevice) {
                    console.log('[CRITICAL BYPASS PRE-REACT] ✅ ROOT DEVICE DETECTED');

                    // Grant ROOT access
                    localStorage.setItem('PFF_ROOT_ACCESS', 'GRANTED');
                    localStorage.setItem('presence_verified', 'true');
                    localStorage.setItem('device_authorized', 'true');
                    localStorage.setItem('isLocked', 'false');
                    localStorage.setItem('isAuthorized', 'true');

                    console.log('[CRITICAL BYPASS PRE-REACT] ✅ ROOT ACCESS GRANTED');

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

import type { Metadata } from 'next';
import './globals.css';
import { HowToInstallTooltip } from '@/components/HowToInstallTooltip';
import { GlobalPresenceGatewayProvider } from '@/contexts/GlobalPresenceGateway';
import { SovereignSeedProvider } from '@/contexts/SovereignSeedContext';
import { GhostSessionGuard } from '@/components/GhostSessionGuard';
import { RegisterServiceWorker } from '@/components/RegisterServiceWorker';
import { BiometricSessionProvider } from '@/contexts/BiometricSessionContext';
import { SovereignCompanionProvider } from '@/contexts/SovereignCompanionContext';
import { CompanionEyes } from '@/components/dashboard/CompanionEyes';
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

  return (
    <html lang="en" className="dark">
      <head>
        <meta charSet="utf-8" />
        {/* No link rel="preload" for scripts: avoid console noise; add only if pointing to an existing file with as="script". */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0A0A0A" />
        {/* Standalone web app. Prefer mobile-web-app-capable; apple-* kept for iOS Add to Home Screen. */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="PFF" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icons/icon-512.png" />

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
        {/* Schema cache clear: on next reload, clear local state so app fetches new 5 VIDA MINTING CAP structure */}
        <Script
          id="pff-schema-cache-clear"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var PFF_APP_SCHEMA_VERSION = '5-VIDA-MINTING-1';
                try {
                  var stored = typeof localStorage !== 'undefined' ? localStorage.getItem('PFF_APP_SCHEMA_VERSION') : null;
                  if (stored !== PFF_APP_SCHEMA_VERSION) {
                    if (typeof localStorage !== 'undefined') {
                      localStorage.clear();
                      localStorage.setItem('PFF_APP_SCHEMA_VERSION', PFF_APP_SCHEMA_VERSION);
                    }
                    if (typeof sessionStorage !== 'undefined') sessionStorage.clear();
                    console.log('[PFF] Local app cache cleared for schema', PFF_APP_SCHEMA_VERSION);
                  }
                } catch (e) {
                  console.warn('[PFF] Schema version check failed:', e);
                }
              })();
            `,
          }}
        />
      </head>
      <body className="bg-[#0d0d0f] text-[#f5f5f5] antialiased">
        <GlobalPresenceGatewayProvider>
          <BiometricSessionProvider>
          <SovereignSeedProvider>
            <SovereignCompanionProvider>
              <GhostSessionGuard>
                {/* app-root: base layer; overlays when inactive must unmount or use pointer-events-none to avoid dead screen */}
                <div id="app-root" className="relative z-0 min-h-screen">
                  {children}
                </div>
              </GhostSessionGuard>
              <CompanionEyes />
            </SovereignCompanionProvider>
          </SovereignSeedProvider>
          </BiometricSessionProvider>
          <HowToInstallTooltip />
          <RegisterServiceWorker />
        </GlobalPresenceGatewayProvider>
      </body>
    </html>
  );
}

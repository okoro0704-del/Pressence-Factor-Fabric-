import type { Metadata, Viewport } from 'next';
import './globals.css';
import { GlobalPresenceGatewayProvider } from '@/contexts/GlobalPresenceGateway';
import { SovereignSeedProvider } from '@/contexts/SovereignSeedContext';
import { SovereignAuthGuard } from '@/components/dashboard/SovereignAuthGuard';
import { FourPillarsGuard } from '@/components/dashboard/FourPillarsGuard';
import { AccessGateClient } from '@/components/access/AccessGateClient';
import { SovereignCompanionProvider } from '@/contexts/SovereignCompanionContext';
import { RegisterServiceWorker } from '@/components/RegisterServiceWorker';
import { BiometricSessionProvider } from '@/contexts/BiometricSessionContext';
import { TranslationProvider } from '@/lib/i18n/TranslationContext';

/**
 * Using Netlify Next.js Runtime (NOT static export)
 * Removed 'force-static' to allow SSR/SSG with Next.js runtime
 */
// export const dynamic = 'force-static';  // REMOVED - conflicts with Next.js runtime

/** Canonical origin for Grand Unveiling: set on custom domain only (e.g. https://app.purefreedomfoundation.org). Leave unset on Netlify URL so site stays functional for testing. */
const CANONICAL_ORIGIN =
  typeof process !== 'undefined' ? (process.env.NEXT_PUBLIC_CANONICAL_ORIGIN ?? '').trim() : '';

/** Prevent accidental zoom during Palm Scan; same layout on mobile and desktop. */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: 'PFF — Vitalization Manifesto | Born in Lagos. Built for the World.',
  description:
    'The Vitalization Manifesto. Presence over passwords. Hardware-bound identity. Zero-knowledge handshakes.',
  ...(CANONICAL_ORIGIN
    ? {
        metadataBase: new URL(CANONICAL_ORIGIN),
        alternates: { canonical: CANONICAL_ORIGIN },
      }
    : {}),
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
        <link rel="icon" href="/favicon.ico" sizes="any" />
        {/* No link rel="preload" for scripts: avoid console noise; add only if pointing to an existing file with as="script". */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0A0A0A" />
        {/* Standalone web app. Prefer mobile-web-app-capable; apple-* kept for iOS Add to Home Screen. */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Sovereign" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icons/icon-512.png" />
      </head>
      <body className="bg-[#0d0d0f] text-[#f5f5f5] antialiased">
        <GlobalPresenceGatewayProvider>
          <TranslationProvider>
            <BiometricSessionProvider>
              <SovereignSeedProvider>
                <SovereignCompanionProvider>
                  <SovereignAuthGuard>
                    <AccessGateClient />
                    <FourPillarsGuard>
                      <div id="app-root" className="relative z-0 min-h-screen">
                        {children}
                      </div>
                    </FourPillarsGuard>
                  </SovereignAuthGuard>
                </SovereignCompanionProvider>
              </SovereignSeedProvider>
            </BiometricSessionProvider>
          </TranslationProvider>
          <RegisterServiceWorker />
        </GlobalPresenceGatewayProvider>
      </body>
    </html>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { JetBrains_Mono } from 'next/font/google';
import { getIdentityAnchorPhone } from '@/lib/sentinelActivation';
import { hasActiveSentinelLicense } from '@/lib/sentinelLicensing';
import { getSentinelActivateUrl } from '@/lib/sentinelConstants';

const jetbrains = JetBrains_Mono({ weight: ['400', '600', '700'], subsets: ['latin'] });

/** Deep slate / gold Sovereign aesthetic (matches pffsentinel.com) */
const SOVEREIGN = {
  slateBg: '#0d0d0f',
  slateCard: '#16161a',
  slateBorder: '#2a2a2e',
  gold: '#D4AF37',
  goldDim: 'rgba(212, 175, 55, 0.7)',
  goldBorder: 'rgba(212, 175, 55, 0.3)',
  textMuted: '#6b6b70',
  textDim: '#a0a0a5',
} as const;

interface SentinelGuardProps {
  children: React.ReactNode;
}

/**
 * SentinelGuard — Cross-Domain Sentinel Handshake.
 * If has_active_sentinel (Supabase sentinel_licenses) is false, block the dashboard and display
 * "Security Protocol Offline. Activate your Sentinel at pffsentinel.com to unlock funds."
 * Secure Redirect button sends user to https://pffsentinel.com/activate?uid=[USER_ID].
 */
export function SentinelGuard({ children }: SentinelGuardProps) {
  const [hasActive, setHasActive] = useState<boolean | null>(null);
  const [ownerId, setOwnerId] = useState<string | null>(null);

  useEffect(() => {
    const uid = getIdentityAnchorPhone();
    setOwnerId(uid);
    if (!uid) {
      setHasActive(false);
      return;
    }
    hasActiveSentinelLicense(uid).then(setHasActive);
  }, []);

  if (hasActive === null) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: SOVEREIGN.slateBg }}
      >
        <div className="text-center">
          <div
            className="w-12 h-12 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: SOVEREIGN.gold }}
          />
          <p className="text-sm font-medium" style={{ color: SOVEREIGN.textMuted }}>
            Checking Sentinel status...
          </p>
        </div>
      </div>
    );
  }

  if (hasActive === true) {
    return <>{children}</>;
  }

  const activateUrl = ownerId ? getSentinelActivateUrl(ownerId) : 'https://pffsentinel.com/activate';

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: SOVEREIGN.slateBg }}
    >
      <div
        className="max-w-md w-full rounded-2xl border-2 p-8 text-center"
        style={{
          background: SOVEREIGN.slateCard,
          borderColor: SOVEREIGN.goldBorder,
          boxShadow: '0 0 60px rgba(212, 175, 55, 0.12)',
        }}
      >
        <div
          className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center text-4xl"
          style={{
            background: 'rgba(212, 175, 55, 0.1)',
            border: `2px solid ${SOVEREIGN.goldBorder}`,
          }}
        >
          ◐
        </div>
        <h1
          className={`text-xl font-bold uppercase tracking-wider mb-3 ${jetbrains.className}`}
          style={{ color: SOVEREIGN.gold }}
        >
          Security Protocol Offline
        </h1>
        <p
          className="text-sm mb-6 leading-relaxed"
          style={{ color: SOVEREIGN.textDim }}
        >
          Activate your Sentinel at{' '}
          <span className="font-semibold" style={{ color: SOVEREIGN.gold }}>pffsentinel.com</span>
          {' '}to unlock funds.
        </p>
        <a
          href={activateUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center w-full py-4 rounded-xl font-bold text-sm uppercase tracking-wider transition-all hover:opacity-90"
          style={{
            background: SOVEREIGN.gold,
            color: SOVEREIGN.slateBg,
            boxShadow: '0 0 24px rgba(212, 175, 55, 0.35)',
          }}
        >
          Secure Redirect →
        </a>
        <p className="text-xs mt-4" style={{ color: SOVEREIGN.textMuted }}>
          You will be sent to the Sentinel site with your identity so activation unlocks this account.
        </p>
      </div>
    </div>
  );
}

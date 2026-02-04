'use client';

import { useGlobalPresenceGateway } from '@/contexts/GlobalPresenceGateway';
import { JetBrains_Mono } from 'next/font/google';

const jetbrains = JetBrains_Mono({ weight: ['400', '600', '700'], subsets: ['latin'] });

const GOLD = '#D4AF37';
const SLATE = '#0f172a';
const SLATE_LIGHT = '#334155';
const BORDER = 'rgba(212, 175, 55, 0.25)';

/**
 * PFF Sentinel — 3-out-of-4 biometric guardian scanning indicator.
 * Sits at top of Partners page. Connected to GlobalPresenceGateway:
 * when user has valid session: "Sentinel Status: Active | Mesh Secured".
 */
export function PFFSentinel() {
  const { isPresenceVerified, loading, connecting } = useGlobalPresenceGateway();
  const scanning = loading || connecting;
  const active = isPresenceVerified && !scanning;

  return (
    <div
      className="w-full rounded-xl border px-4 py-3 flex items-center justify-between gap-4"
      style={{
        background: `linear-gradient(135deg, ${SLATE} 0%, #1e293b 100%)`,
        borderColor: BORDER,
        boxShadow: '0 0 24px rgba(212, 175, 55, 0.08)',
      }}
    >
      <div className="flex items-center gap-3">
        {/* Scanning / Active icon */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{
            background: active ? `rgba(34, 197, 94, 0.2)` : `rgba(212, 175, 55, 0.15)`,
            border: `1px solid ${active ? 'rgba(34, 197, 94, 0.5)' : BORDER}`,
          }}
        >
          {scanning ? (
            <span className="text-lg animate-pulse" style={{ color: GOLD }}>
              ◐
            </span>
          ) : (
            <span className="text-lg" style={{ color: active ? '#22c55e' : GOLD }}>
              {active ? '◆' : '◇'}
            </span>
          )}
        </div>
        <div>
          <p className={`text-xs font-medium ${jetbrains.className}`} style={{ color: SLATE_LIGHT }}>
            PFF Sentinel · 3-of-4 Biometric Guardian
          </p>
          <p className={`text-sm font-semibold ${jetbrains.className}`} style={{ color: active ? '#22c55e' : GOLD }}>
            {scanning
              ? 'Scanning...'
              : active
                ? 'Sentinel Status: Active | Mesh Secured'
                : 'Sentinel Status: Standby'}
          </p>
        </div>
      </div>
      {/* Decorative scan line when scanning */}
      {scanning && (
        <div
          className="hidden sm:block w-24 h-0.5 rounded-full opacity-60 sentinel-scan-line"
          style={{
            background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`,
          }}
        />
      )}
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useHandshakeRealtime } from './useHandshakeRealtime';
import { usePulsingNations } from './usePulsingNations';
import { NationalPulseMap } from './NationalPulseMap';
import { Leaderboard } from './Leaderboard';
import { WealthSecuredTicker } from './WealthSecuredTicker';

export function NationalPulseDashboard() {
  useHandshakeRealtime();
  const pulsingNations = usePulsingNations();

  return (
    <div className="flex flex-col min-h-screen" data-testid="pulse-page">
      <header className="shrink-0 border-b border-[#2a2a2e] bg-obsidian-surface/90 backdrop-blur px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold bg-gradient-to-r from-gold-bright to-gold bg-clip-text text-transparent tracking-tight">
            National Pulse
          </h1>
          <p className="text-xs text-[#6b6b70] mt-0.5">
            Sovereign Tech · Vitalization density · Digital handshakes
          </p>
        </div>
        <div className="flex-1 min-w-[260px] flex justify-center">
          <WealthSecuredTicker />
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-gold hover:text-gold-bright transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/manifesto"
            className="text-sm font-medium text-gold hover:text-gold-bright transition-colors"
          >
            ← Manifesto
          </Link>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 overflow-hidden">
        <div className="flex-1 min-h-[320px] lg:min-h-[480px]">
          <NationalPulseMap pulsingNations={pulsingNations} />
        </div>
        <Leaderboard />
      </div>

      <footer className="shrink-0 border-t border-[#2a2a2e] px-4 py-2 text-center text-xs text-[#6b6b70]">
        PFF Global Portal · mrfundzman · Born in Lagos. Built for the World.
      </footer>
    </div>
  );
}

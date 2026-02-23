'use client';

import Link from 'next/link';
import { Users, UserPlus } from 'lucide-react';

const GOLD = '#D4AF37';
const GRAY = '#6b6b70';

export interface VitalizationHubContentProps {
  onVitalizeOthers: () => void;
}

/**
 * Vitalization Hub — shown when user is already vitalized.
 * Options: Vitalize a dependent (family member) or Vitalize others (new soul / full flow).
 */
export function VitalizationHubContent({ onVitalizeOthers }: VitalizationHubContentProps) {
  return (
    <div
      className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4"
      style={{ color: '#e5e5e5' }}
    >
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(circle at center, rgba(212, 175, 55, 0.15) 0%, rgba(5, 5, 5, 0) 70%)' }}
        aria-hidden
      />
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-xl font-bold uppercase tracking-wider mb-1" style={{ color: GOLD }}>
            Vitalization Hub
          </h1>
          <p className="text-sm" style={{ color: GRAY }}>
            You are vitalized. Choose an action below.
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href="/registration?tier=dependents"
            className="block w-full rounded-xl border-2 p-6 text-left transition-all hover:border-[#D4AF37]/60 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
            style={{
              background: 'linear-gradient(180deg, rgba(30, 28, 22, 0.95) 0%, rgba(15, 14, 10, 0.98) 100%)',
              borderColor: 'rgba(212, 175, 55, 0.4)',
            }}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(212, 175, 55, 0.2)' }}>
                <Users className="w-6 h-6" style={{ color: GOLD }} />
              </div>
              <div>
                <h2 className="font-bold text-base mb-0.5" style={{ color: GOLD }}>
                  Vitalize a dependent
                </h2>
                <p className="text-sm" style={{ color: GRAY }}>
                  Add a family member (child, elderly) under your account. Register and link them to your sovereign identity.
                </p>
              </div>
            </div>
          </Link>

          <button
            type="button"
            onClick={onVitalizeOthers}
            className="block w-full rounded-xl border-2 p-6 text-left transition-all hover:border-[#D4AF37]/60 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
            style={{
              background: 'linear-gradient(180deg, rgba(30, 28, 22, 0.95) 0%, rgba(15, 14, 10, 0.98) 100%)',
              borderColor: 'rgba(212, 175, 55, 0.4)',
            }}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(212, 175, 55, 0.2)' }}>
                <UserPlus className="w-6 h-6" style={{ color: GOLD }} />
              </div>
              <div>
                <h2 className="font-bold text-base mb-0.5" style={{ color: GOLD }}>
                  Vitalize others
                </h2>
                <p className="text-sm" style={{ color: GRAY }}>
                  Start the full vitalization flow for another person. Face scan, device binding, and phone anchor.
                </p>
              </div>
            </div>
          </button>
        </div>

        <p className="text-xs text-center mt-6" style={{ color: GRAY }}>
          One face = one mint. You have already completed your vitalization.
        </p>
      </div>
    </div>
  );
}

'use client';

import React from 'react';

const GOLD = '#D4AF37';

/**
 * Vitalie Mirroring: clean, minimal gold ring that pulses as it recognizes the user's DNA.
 * Same UI across all PFF-connected apps for SSO / Face Pulse.
 */
export function VitalieSSORing({ status = 'idle' }: { status?: 'idle' | 'scanning' | 'verified' | 'error' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-6">
      <div
        className="w-32 h-32 rounded-full border-4 flex items-center justify-center bg-black/40 transition-all duration-300"
        style={{
          borderColor: status === 'verified' ? '#22c55e' : status === 'error' ? '#ef4444' : GOLD,
          boxShadow: status === 'scanning' ? `0 0 30px ${GOLD}50` : 'none',
          animation: status === 'scanning' ? 'vitalie-pulse-ring 1.5s ease-in-out infinite' : undefined,
        }}
      >
        {status === 'idle' && <span className="text-3xl text-[#6b6b70]" aria-hidden>◆</span>}
        {status === 'scanning' && <span className="text-3xl text-[#e8c547]" aria-hidden>◆</span>}
        {status === 'verified' && <span className="text-3xl text-green-400" aria-hidden>✓</span>}
        {status === 'error' && <span className="text-3xl text-red-400" aria-hidden>✕</span>}
      </div>
      <p className="text-sm font-medium uppercase tracking-wider text-[#6b6b70]">
        {status === 'scanning' && 'Recognizing…'}
        {status === 'verified' && 'Identity confirmed'}
        {status === 'error' && 'Recognition failed'}
        {status === 'idle' && 'Ready'}
      </p>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes vitalie-pulse-ring {
          0%, 100% { opacity: 0.9; box-shadow: 0 0 0 0 ${GOLD}40; }
          50% { opacity: 1; box-shadow: 0 0 25px 4px ${GOLD}40; }
        }
      ` }} />
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { ScanLine, Fingerprint, Smartphone } from 'lucide-react';

const GOLD = '#D4AF37';

/**
 * Triple Lock Confirmation: 1-second animation of Face, Fingerprint, and Phone ID icons
 * merging into a single Gold Seal. Shown when laptop unlocks after phone approves via QR.
 */
export function TripleLockSealAnimation({ onComplete }: { onComplete: () => void }) {
  const [merged, setMerged] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMerged(true), 600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!merged) return;
    const t = setTimeout(onComplete, 500);
    return () => clearTimeout(t);
  }, [merged, onComplete]);

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/90" aria-live="polite">
      <div className="relative w-52 h-40 flex items-center justify-center">
        {/* Three icons: start apart, then shrink and fade as seal appears */}
        <div
          className="absolute flex items-center justify-center gap-8 transition-all duration-700 ease-out"
          style={{
            opacity: merged ? 0 : 1,
            transform: merged ? 'scale(0.3)' : 'scale(1)',
          }}
        >
          <ScanLine size={44} style={{ color: GOLD }} aria-hidden />
          <Fingerprint size={44} style={{ color: GOLD }} aria-hidden />
          <Smartphone size={44} style={{ color: GOLD }} aria-hidden />
        </div>
        {/* Gold Seal: scales in as icons merge */}
        <div
          className="absolute w-28 h-28 rounded-full border-4 flex items-center justify-center transition-all duration-500 ease-out"
          style={{
            background: merged ? `radial-gradient(circle, ${GOLD}50 0%, ${GOLD}25 100%)` : 'transparent',
            borderColor: GOLD,
            boxShadow: merged ? `0 0 50px ${GOLD}90` : 'none',
            opacity: merged ? 1 : 0,
            transform: merged ? 'scale(1)' : 'scale(0.2)',
          }}
        >
          <span className="text-5xl" aria-hidden>🔐</span>
        </div>
      </div>
      <p className="mt-8 text-sm font-bold uppercase tracking-wider" style={{ color: GOLD }}>
        {merged ? 'Dashboard unlocked' : 'Triple Lock confirmed'}
      </p>
    </div>
  );
}

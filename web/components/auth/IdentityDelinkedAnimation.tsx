'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';

const GOLD = '#D4AF37';

export interface IdentityDelinkedAnimationProps {
  /** Callback when animation is done (e.g. proceed with signOut + redirect). */
  onComplete: () => void;
  /** Duration in ms before onComplete is called. */
  durationMs?: number;
}

/**
 * Visual confirmation after logout: "Identity De-linked" — device is now cold and secure.
 */
export function IdentityDelinkedAnimation({ onComplete, durationMs = 2200 }: IdentityDelinkedAnimationProps) {
  useEffect(() => {
    const t = setTimeout(onComplete, durationMs);
    return () => clearTimeout(t);
  }, [onComplete, durationMs]);

  return (
    <div
      className="fixed inset-0 z-[300] flex flex-col items-center justify-center bg-[#0d0d0f]"
      style={{ boxShadow: 'inset 0 0 80px rgba(0,0,0,0.5)' }}
      aria-live="polite"
    >
      <motion.div
        className="w-24 h-24 rounded-full border-4 border-[#2a2a2e] flex items-center justify-center mb-8"
        style={{ borderColor: 'rgba(212, 175, 55, 0.3)', background: 'rgba(212, 175, 55, 0.05)' }}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <motion.div
          className="w-12 h-12 rounded-full border-2"
          style={{ borderColor: GOLD, background: 'transparent' }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, duration: 0.35 }}
        />
      </motion.div>
      <motion.p
        className="text-xl md:text-2xl font-bold uppercase tracking-wider text-center mb-2"
        style={{ color: GOLD }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.3 }}
      >
        Identity De-linked
      </motion.p>
      <motion.p
        className="text-sm text-[#6b6b70] text-center max-w-xs"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.3 }}
      >
        This device is now cold and secure.
      </motion.p>
    </div>
  );
}

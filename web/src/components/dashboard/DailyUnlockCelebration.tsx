'use client';

import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { STREAK_TARGET } from '@/lib/vitalizationRitual';

const GOLD = '#D4AF37';
const GOLD_NEON = '#F5E6A4';
const DAILY_VIDA = 0.1;

/** Optional: crisp digital-coin chime via Web Audio. */
function playCoinChime(): void {
  if (typeof window === 'undefined') return;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.08);
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.25);
  } catch {
    // ignore
  }
}

/** Optional: low-frequency haptic thud (vibrate if supported). */
function triggerHapticThud(): void {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate([30, 20, 30]);
  }
}

export interface DailyUnlockCelebrationProps {
  /** Current streak (1–9). */
  streak: number;
  /** New spendable balance after this unlock (for display). */
  newSpendableVida?: number;
  /** True when this is Day 9 full unlock. */
  isDay9?: boolean;
  onClose: () => void;
  /** Speak companion line and play sound on mount. */
  playSound?: boolean;
}

export function DailyUnlockCelebration({
  streak,
  newSpendableVida,
  isDay9,
  onClose,
  playSound = true,
}: DailyUnlockCelebrationProps) {
  const speakCompanion = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const text = `Well done, Architect. Your streak is at ${streak} days. Your discipline strengthens the Protocol.`;
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.9;
    u.pitch = 1;
    u.volume = 1;
    u.lang = 'en-US';
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }, [streak]);

  useEffect(() => {
    if (playSound) {
      triggerHapticThud();
      playCoinChime();
      speakCompanion();
    }
  }, [playSound, speakCompanion]);

  // Auto-dismiss after 5.5s
  useEffect(() => {
    const t = setTimeout(onClose, 5500);
    return () => clearTimeout(t);
  }, [onClose]);

  const day = Math.min(STREAK_TARGET, Math.max(1, streak));

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[200] flex flex-col items-center justify-center p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          background: 'radial-gradient(ellipse 80% 70% at 50% 40%, rgba(180, 140, 50, 0.2), rgba(20, 18, 15, 0.98))',
          backdropFilter: 'blur(12px)',
        }}
      >
        {/* Subtle dark-gold radial gradient + blur */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 100% 80% at 50% 30%, rgba(212, 175, 55, 0.12), transparent 60%)',
            filter: 'blur(20px)',
          }}
        />

        {/* Centerpiece: spinning VIDA CAP coin with glow */}
        <motion.div
          className="relative z-10 mb-8"
          initial={{ scale: 0.5, opacity: 0, rotateY: -180 }}
          animate={{
            scale: 1,
            opacity: 1,
            rotateY: 0,
          }}
          transition={{ type: 'spring', stiffness: 120, damping: 18, duration: 0.6 }}
          style={{ perspective: '600px' }}
        >
          <motion.div
            className="w-28 h-28 md:w-36 md:h-36 rounded-full flex items-center justify-center font-bold text-2xl md:text-3xl text-black select-none"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
            style={{
              background: `radial-gradient(circle at 30% 30%, #F5E6A4, #D4AF37 40%, #B8860B 70%, #8B6914)`,
              boxShadow: `
                0 0 40px rgba(212, 175, 55, 0.6),
                0 0 80px rgba(212, 175, 55, 0.35),
                inset 0 -4px 12px rgba(0,0,0,0.3),
                inset 0 4px 12px rgba(255,255,255,0.2)
              `,
            }}
          >
            <span className="drop-shadow-md">V</span>
          </motion.div>
          {/* Glow ring on arrival */}
          <motion.div
            className="absolute inset-0 rounded-full pointer-events-none"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.6, scale: 1.15 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            style={{
              boxShadow: '0 0 60px rgba(212, 175, 55, 0.5), 0 0 120px rgba(212, 175, 55, 0.25)',
            }}
          />
        </motion.div>

        {/* Message */}
        <motion.p
          className="text-xl md:text-2xl font-bold text-center uppercase tracking-wider max-w-md z-10 mb-1"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          style={{ color: GOLD, textShadow: `0 0 24px rgba(212, 175, 55, 0.6)` }}
        >
          {isDay9 ? 'Identity Mastered. Sovereign Treasury Fully Unlocked.' : 'Identity Confirmed.'}
        </motion.p>
        <motion.p
          className="text-base md:text-lg font-semibold text-center uppercase tracking-wide max-w-md z-10"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.4 }}
          style={{ color: '#C9A227' }}
        >
          {isDay9
            ? 'Your full 0.9 VIDA is now spendable.'
            : `$100 (${DAILY_VIDA} VIDA) Added to Your Personal Treasury.`}
        </motion.p>
        {newSpendableVida != null && (
          <motion.p
            className="text-sm text-[#a0a0a5] mt-2 z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            New balance: {newSpendableVida.toFixed(2)} VIDA
          </motion.p>
        )}

        {/* 9-Day Tracker: segments with current day in neon gold */}
        <motion.div
          className="flex gap-1.5 mt-8 z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          {Array.from({ length: STREAK_TARGET }, (_, i) => {
            const segmentDay = i + 1;
            const isLit = segmentDay <= day;
            const isCurrent = segmentDay === day;
            return (
              <motion.div
                key={segmentDay}
                className="w-8 h-2 md:w-10 md:h-2.5 rounded-full"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.6 + i * 0.05, duration: 0.25 }}
                style={{
                  backgroundColor: isLit ? (isCurrent ? GOLD_NEON : 'rgba(212, 175, 55, 0.6)') : 'rgba(80, 78, 75, 0.6)',
                  boxShadow: isCurrent ? `0 0 12px ${GOLD_NEON}, 0 0 24px rgba(245, 230, 164, 0.4)` : 'none',
                  transformOrigin: 'left',
                }}
              />
            );
          })}
        </motion.div>
        <motion.p
          className="text-xs text-[#6b6b70] mt-2 z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          Day {day} of {STREAK_TARGET}
        </motion.p>

        {/* Companion comment */}
        <motion.p
          className="text-sm md:text-base text-center max-w-sm mt-6 z-10 italic"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.4 }}
          style={{ color: '#a0a0a5' }}
        >
          Well done, Architect. Your streak is at {streak} days. Your discipline strengthens the Protocol.
        </motion.p>

        <motion.p
          className="text-xs text-[#6b6b70] mt-6 z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          Redirecting to dashboard…
        </motion.p>
      </motion.div>
    </AnimatePresence>
  );
}

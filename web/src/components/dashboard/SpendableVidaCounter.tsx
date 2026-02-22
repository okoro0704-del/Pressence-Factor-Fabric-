'use client';

import { useState, useEffect, useRef } from 'react';
import { useSovereignCompanion } from '@/contexts/SovereignCompanionContext';

const COUNT_UP_DURATION_MS = 1200;

export interface SpendableVidaCounterProps {
  value: number;
  className?: string;
  /** e.g. "VIDA CAP" */
  suffix?: string;
  /** Number of decimal places (default 2). */
  decimals?: number;
}

/**
 * Displays spendable VIDA balance. When SovereignCompanionContext has a
 * spendableVidaAnimation (from → to), counts up from `from` to `to` with
 * a shimmer effect, then clears the animation.
 */
export function SpendableVidaCounter({
  value,
  className = '',
  suffix = 'VIDA CAP',
  decimals = 2,
}: SpendableVidaCounterProps) {
  const { spendableVidaAnimation, setSpendableVidaAnimation } = useSovereignCompanion();
  const [displayValue, setDisplayValue] = useState(value);
  const [shimmer, setShimmer] = useState(false);
  const rafRef = useRef<number | null>(null);
  const animatingRef = useRef(false);

  // Sync display to value when not animating
  useEffect(() => {
    if (!animatingRef.current) setDisplayValue(value);
  }, [value]);

  // When context has animation and current value matches target, run count-up
  useEffect(() => {
    if (!spendableVidaAnimation || animatingRef.current) return;
    const { from, to } = spendableVidaAnimation;
    if (Math.abs(value - to) > 0.001) return; // wait until prop value is updated to target

    animatingRef.current = true;
    setShimmer(true);
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / COUNT_UP_DURATION_MS);
      const eased = 1 - (1 - t) ** 3; // easeOutCubic
      const current = from + (to - from) * eased;
      setDisplayValue(current);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setDisplayValue(to);
        setSpendableVidaAnimation(null);
        animatingRef.current = false;
        setShimmer(false);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [spendableVidaAnimation, value, setSpendableVidaAnimation]);

  const formatted = displayValue.toFixed(decimals);

  return (
    <span className={`inline-block ${className}`}>
      <span
        className={`tabular-nums ${shimmer ? 'animate-shimmer' : ''}`}
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {formatted}
      </span>
      {suffix && <span className="ml-1">{suffix}</span>}
    </span>
  );
}

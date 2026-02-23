'use client';

import { memo, useEffect, useMemo } from 'react';
import { motion, useSpring } from 'framer-motion';

/** Single rolling digit column (0–9). Uses transform for 60fps. */
const RollingDigit = memo(function RollingDigit({
  value,
  digitHeight,
}: {
  value: number;
  digitHeight: number;
}) {
  const y = -value * digitHeight;
  const spring = useSpring(y, {
    stiffness: 400,
    damping: 30,
    restDelta: 0.001,
  });

  useEffect(() => {
    spring.set(y);
  }, [y, spring]);

  return (
    <span
      className="inline-block overflow-hidden align-top"
      style={{ height: digitHeight, width: '1ch', flexShrink: 0 }}
    >
      <motion.span
        className="block will-change-transform"
        style={{
          y: spring,
          width: '1ch',
        }}
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
          <span
            key={d}
            className="tabular-nums block w-[1ch] text-center"
            style={{ height: digitHeight, lineHeight: `${digitHeight}px` }}
          >
            {d}
          </span>
        ))}
      </motion.span>
    </span>
  );
});

export interface AnimateNumberProps {
  value: number;
  formatted: string;
  /** Height in px for each digit (default 32). */
  digitHeight?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Rolling-digit ticker. Each digit animates vertically on change.
 * Uses motion spring + transform only (GPU-friendly); Framer Motion
 * drives updates via requestAnimationFrame for 60fps on mobile.
 */
export const AnimateNumber = memo(function AnimateNumber({
  value,
  formatted,
  digitHeight = 32,
  className = '',
  style,
}: AnimateNumberProps) {
  const segments = useMemo(() => {
    const out: Array<{ type: 'digit'; v: number } | { type: 'comma' }> = [];
    for (let i = 0; i < formatted.length; i++) {
      const c = formatted[i];
      if (c === ',') {
        out.push({ type: 'comma' });
      } else {
        const n = parseInt(c, 10);
        if (!Number.isNaN(n)) out.push({ type: 'digit', v: n });
      }
    }
    return out;
  }, [formatted]);

  return (
    <span
      className={`inline-flex items-start overflow-hidden ${className}`}
      style={{ lineHeight: 1, ...style }}
    >
      {segments.map((seg, i) =>
        seg.type === 'comma' ? (
          <span
            key={`c-${i}`}
            className="tabular-nums inline-block text-center"
            style={{
              width: '1ch',
              height: digitHeight,
              lineHeight: `${digitHeight}px`,
            }}
          >
            ,
          </span>
        ) : (
          <RollingDigit
            key={`d-${i}`}
            value={seg.v}
            digitHeight={digitHeight}
          />
        )
      )}
    </span>
  );
});

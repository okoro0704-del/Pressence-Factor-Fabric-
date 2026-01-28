'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';

interface PulsePointProps {
  x: number;
  y: number;
  visible: boolean;
}

/**
 * Glowing gold ripple at a geographic center when a Digital Handshake is recorded.
 */
export const PulsePoint = memo(function PulsePoint({ x, y, visible }: PulsePointProps) {
  if (!visible) return null;

  return (
    <g transform={`translate(${x}, ${y})`}>
      <motion.circle
        r={8}
        fill="none"
        stroke="#c9a227"
        strokeWidth={2}
        initial={{ opacity: 1, scale: 0.5 }}
        animate={{
          opacity: [0.9, 0],
          scale: [0.5, 4],
        }}
        transition={{
          duration: 2,
          ease: 'easeOut',
          repeat: 1,
        }}
      />
      <motion.circle
        r={4}
        fill="#e8c547"
        initial={{ opacity: 1 }}
        animate={{ opacity: [1, 0.3, 1] }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </g>
  );
});

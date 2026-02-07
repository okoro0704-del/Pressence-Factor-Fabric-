'use client';

/**
 * Quad-Pillar Shield (Ghost Economy Protocol)
 * Clock-In block: shown when all 4 pillars are active; records work_site_coords to presence_handshakes.
 * Replaces the previous Triple-Pillar-only flow when ENABLE_GPS_AS_FOURTH_PILLAR is true.
 */

import { motion } from 'framer-motion';
import { useState } from 'react';

export interface QuadPillarClockInBlockProps {
  identityAnchorPhone: string;
  lastLocationCoords: { latitude: number; longitude: number } | null;
  onClockIn: () => void | Promise<void>;
}

export function QuadPillarClockInBlock({
  lastLocationCoords,
  onClockIn,
}: QuadPillarClockInBlockProps) {
  const [loading, setLoading] = useState(false);
  const hasCoords = lastLocationCoords != null;

  const handleClick = async () => {
    setLoading(true);
    try {
      await onClockIn();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative z-50 mb-6 p-4 rounded-xl border-2 border-[#22c55e]/60 bg-[#22c55e]/10">
      <p className="text-center text-[#22c55e] font-semibold mb-3">
        All 4 pillars verified. Tap Clock-In to continue.
      </p>
      {!hasCoords && (
        <p className="text-center text-[#6b6b70] text-xs mb-2">
          Work-site location was verified; Clock-In will record your presence.
        </p>
      )}
      <motion.button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="w-full min-h-[48px] py-4 px-6 rounded-lg bg-[#22c55e] hover:bg-[#16a34a] disabled:opacity-70 text-white font-bold text-lg uppercase tracking-wider transition-all touch-manipulation cursor-pointer"
        whileTap={{ scale: 0.98 }}
      >
        {loading ? 'Recording…' : '⏱ Clock-In'}
      </motion.button>
    </div>
  );
}

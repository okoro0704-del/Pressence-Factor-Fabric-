/**
 * PFF Web — Sovereign Balance Component
 * Horizontal gauge showing 50:50 split between Citizen Payout and Truth Infrastructure
 * Architect: Isreal Okoro (mrfundzman)
 */

import React from 'react';
import { motion } from 'framer-motion';

interface SovereignBalanceProps {
  citizenShareVIDA: number;
  stateShareVIDA: number;
}

export default function SovereignBalance({ citizenShareVIDA, stateShareVIDA }: SovereignBalanceProps) {
  return (
    <div className="space-y-3">
      {/* Title */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-gray-300">SOVEREIGN BALANCE (50:50 SPLIT)</span>
      </div>

      {/* Horizontal Gauge */}
      <div className="relative h-16 rounded-xl overflow-hidden border border-white/10 backdrop-blur-sm">
        {/* Left Side: Citizen Payout (Emerald/Cyan) */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '50%' }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-cyan-400 flex items-center justify-center"
        >
          <div className="text-center px-4">
            <p className="text-xs font-bold text-white/90 mb-1">CITIZEN PAYOUT</p>
            <p className="text-lg font-black text-white font-mono">
              {citizenShareVIDA.toFixed(2)} VIDA
            </p>
          </div>
        </motion.div>

        {/* Right Side: Truth Infrastructure (Gold/Amber) */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '50%' }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          className="absolute right-0 top-0 h-full bg-gradient-to-l from-amber-500 via-yellow-500 to-amber-400 flex items-center justify-center"
        >
          <div className="text-center px-4">
            <p className="text-xs font-bold text-white/90 mb-1">TRUTH INFRASTRUCTURE</p>
            <p className="text-lg font-black text-white font-mono">
              {stateShareVIDA.toFixed(2)} VIDA
            </p>
          </div>
        </motion.div>

        {/* Center Divider */}
        <div className="absolute left-1/2 top-0 h-full w-0.5 bg-white/30 transform -translate-x-1/2 z-10" />
      </div>

      {/* Labels Below */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400" />
          <span className="text-gray-400">50% Citizen Share</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-400">50% State Share</span>
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500" />
        </div>
      </div>
    </div>
  );
}


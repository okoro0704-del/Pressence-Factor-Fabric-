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
    <div className="space-y-4">
      {/* Title - Gold Monument Header */}
      <motion.div
        className="flex items-center justify-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        <span
          className="text-lg font-black tracking-wider"
          style={{
            color: '#D4AF37',
            textShadow: '0 0 15px rgba(212, 175, 55, 0.5)',
          }}
        >
          ⚖️ SOVEREIGN SCALES (50:50 SPLIT) ⚖️
        </span>
      </motion.div>

      {/* Horizontal Gauge - The Visual Monument */}
      <div
        className="relative h-24 rounded-2xl overflow-hidden backdrop-blur-xl"
        style={{
          border: '3px solid #D4AF37',
          boxShadow: '0 0 30px rgba(212, 175, 55, 0.3), inset 0 0 30px rgba(0, 0, 0, 0.5)',
          background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.6) 100%)',
        }}
      >
        {/* Left Side: Citizen Payout (Gold Gradient) */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '50%' }}
          transition={{ duration: 2.0, ease: 'easeOut', delay: 0.8 }}
          className="absolute left-0 top-0 h-full flex items-center justify-center"
          style={{
            background: 'linear-gradient(90deg, rgba(212, 175, 55, 0.6) 0%, rgba(212, 175, 55, 0.3) 100%)',
            borderRight: '2px solid #D4AF37',
          }}
        >
          <div className="text-center px-6">
            <p
              className="text-xs font-black mb-2 tracking-wider"
              style={{ color: '#D4AF37' }}
            >
              THE PEOPLE (50%)
            </p>
            <p
              className="text-2xl font-black font-mono"
              style={{
                color: '#D4AF37',
                textShadow: '0 0 10px rgba(212, 175, 55, 0.8)',
              }}
            >
              {citizenShareVIDA.toFixed(2)}
            </p>
            <p className="text-xs text-gray-400 font-semibold">VIDA</p>
          </div>
        </motion.div>

        {/* Right Side: Truth Infrastructure (Gold Gradient) */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '50%' }}
          transition={{ duration: 2.0, ease: 'easeOut', delay: 0.8 }}
          className="absolute right-0 top-0 h-full flex items-center justify-center"
          style={{
            background: 'linear-gradient(270deg, rgba(212, 175, 55, 0.6) 0%, rgba(212, 175, 55, 0.3) 100%)',
            borderLeft: '2px solid #D4AF37',
          }}
        >
          <div className="text-center px-6">
            <p
              className="text-xs font-black mb-2 tracking-wider"
              style={{ color: '#D4AF37' }}
            >
              TRUTH INFRASTRUCTURE (50%)
            </p>
            <p
              className="text-2xl font-black font-mono"
              style={{
                color: '#D4AF37',
                textShadow: '0 0 10px rgba(212, 175, 55, 0.8)',
              }}
            >
              {stateShareVIDA.toFixed(2)}
            </p>
            <p className="text-xs text-gray-400 font-semibold">VIDA</p>
          </div>
        </motion.div>

        {/* Center Divider - Gold Beam */}
        <motion.div
          className="absolute left-1/2 top-0 h-full w-1 transform -translate-x-1/2 z-10"
          style={{
            background: '#D4AF37',
            boxShadow: '0 0 20px rgba(212, 175, 55, 0.8)',
          }}
          animate={{
            boxShadow: [
              '0 0 20px rgba(212, 175, 55, 0.8)',
              '0 0 30px rgba(212, 175, 55, 1)',
              '0 0 20px rgba(212, 175, 55, 0.8)',
            ],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      {/* Labels Below - Gold Theme */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-3">
          <motion.div
            className="w-4 h-4 rounded-full"
            style={{
              background: '#D4AF37',
              boxShadow: '0 0 10px rgba(212, 175, 55, 0.6)',
            }}
            animate={{
              boxShadow: [
                '0 0 10px rgba(212, 175, 55, 0.6)',
                '0 0 15px rgba(212, 175, 55, 0.9)',
                '0 0 10px rgba(212, 175, 55, 0.6)',
              ],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <span className="text-gray-300 font-semibold">Citizen Share</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-gray-300 font-semibold">State Share</span>
          <motion.div
            className="w-4 h-4 rounded-full"
            style={{
              background: '#D4AF37',
              boxShadow: '0 0 10px rgba(212, 175, 55, 0.6)',
            }}
            animate={{
              boxShadow: [
                '0 0 10px rgba(212, 175, 55, 0.6)',
                '0 0 15px rgba(212, 175, 55, 0.9)',
                '0 0 10px rgba(212, 175, 55, 0.6)',
              ],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.75,
            }}
          />
        </div>
      </div>
    </div>
  );
}


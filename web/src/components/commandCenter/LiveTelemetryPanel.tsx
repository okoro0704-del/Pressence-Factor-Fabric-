/**
 * PFF Web — Live Telemetry Panel
 * Real-time display of Sentinel counts, tributes, and liquidity
 * Architect: Isreal Okoro (mrfundzman)
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Shield, DollarSign, Globe, TrendingUp, Users, Building2 } from 'lucide-react';
import { CommandCenterTelemetry } from '../../types/commandCenter';
import SovereignBalance from './SovereignBalance';

interface LiveTelemetryPanelProps {
  telemetry: CommandCenterTelemetry | null;
}

export default function LiveTelemetryPanel({ telemetry }: LiveTelemetryPanelProps) {
  if (!telemetry) {
    return (
      <div className="text-center text-gray-400 py-12">
        Loading telemetry data...
      </div>
    );
  }

  const telemetryCards = [
    {
      title: 'ACTIVE SENTINELS',
      icon: Shield,
      goldAccent: true,
      stats: [
        { label: 'Citizen (Tier 1)', value: telemetry.activeSentinels.citizen, icon: Users },
        { label: 'Personal Multi (Tier 2)', value: telemetry.activeSentinels.personalMulti, icon: Users },
        { label: 'Enterprise Lite (Tier 3)', value: telemetry.activeSentinels.enterpriseLite, icon: Building2 },
        { label: 'TOTAL ACTIVE', value: telemetry.activeSentinels.total, highlight: true },
      ],
    },
    {
      title: 'TOTAL TRIBUTES COLLECTED',
      subtitle: '50:50 Economic Model',
      icon: DollarSign,
      goldAccent: true,
      stats: [
        { label: 'Total Tributes (VIDA)', value: telemetry.totalTributes.deepTruthVIDA.toFixed(8) },
        { label: 'Total Businesses Connected', value: telemetry.totalTributes.businessCount },
        { label: 'Last 24h Tributes', value: `${telemetry.totalTributes.last24hVIDA.toFixed(8)} VIDA` },
      ],
      showSovereignBalance: true,
    },
    {
      title: 'NATIONAL LIQUIDITY LEVELS',
      subtitle: '195 Sovereign Blocks',
      icon: Globe,
      goldAccent: true,
      stats: [
        { label: 'Total National Reserves (VIDA)', value: telemetry.nationalLiquidity.totalReservesVIDA.toFixed(8) },
        { label: 'Total National Reserves (USD)', value: `$${telemetry.nationalLiquidity.totalReservesUSD.toFixed(2)}` },
        { label: 'Active Nations', value: `${telemetry.nationalLiquidity.activeNations} / 195` },
        { label: 'Avg Reserve per Nation', value: `${telemetry.nationalLiquidity.avgReservePerNation.toFixed(8)} VIDA` },
      ],
    },
  ];

  return (
    <div className="mb-12">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.0 }}
        className="mb-8"
      >
        <h2
          className="text-4xl font-black mb-2 flex items-center gap-3"
          style={{
            color: '#D4AF37',
            textShadow: '0 0 20px rgba(212, 175, 55, 0.5)',
          }}
        >
          <TrendingUp className="w-10 h-10" style={{ color: '#D4AF37' }} />
          LIVE TELEMETRY
        </h2>
        <p className="text-gray-400 text-lg">Real-time sovereign control metrics</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {telemetryCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 1.2 + index * 0.2, ease: "easeOut" }}
            whileHover={{
              scale: 1.03,
              boxShadow: '0 0 40px rgba(212, 175, 55, 0.4)',
            }}
            className="relative group"
          >
            {/* Card Container - Obsidian Glassmorphism with Gold Border */}
            <div
              className="relative bg-black/60 backdrop-blur-xl border-2 rounded-2xl p-8 transition-all duration-300"
              style={{
                borderColor: '#D4AF37',
                boxShadow: '0 0 20px rgba(212, 175, 55, 0.2), inset 0 0 20px rgba(212, 175, 55, 0.05)',
              }}
            >
              {/* Gold Glow Effect on Hover */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-20 rounded-2xl transition-opacity duration-300"
                style={{
                  background: 'radial-gradient(circle at center, #D4AF37 0%, transparent 70%)',
                }}
              />

              {/* Header - Gold Theme */}
              <div className="flex items-center gap-4 mb-8">
                <div
                  className="p-4 rounded-xl"
                  style={{
                    background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(212, 175, 55, 0.1) 100%)',
                    border: '2px solid #D4AF37',
                    boxShadow: '0 0 15px rgba(212, 175, 55, 0.3)',
                  }}
                >
                  <card.icon className="w-7 h-7" style={{ color: '#D4AF37' }} />
                </div>
                <div>
                  <h3
                    className="text-xl font-black"
                    style={{ color: '#D4AF37' }}
                  >
                    {card.title}
                  </h3>
                  {card.subtitle && (
                    <p className="text-sm text-gray-400 font-semibold">{card.subtitle}</p>
                  )}
                </div>
              </div>

              {/* Stats - Gold Accents */}
              <div className="space-y-3">
                {card.stats.map((stat: any, statIndex: any) => (
                  <motion.div
                    key={statIndex}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 1.4 + index * 0.2 + statIndex * 0.1 }}
                    className="flex items-center justify-between p-4 rounded-lg"
                    style={{
                      background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.2) 100%)',
                      border: '1px solid rgba(212, 175, 55, 0.2)',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      {stat.icon && <stat.icon className="w-5 h-5" style={{ color: '#D4AF37' }} />}
                      <span className="text-sm text-gray-300 font-semibold">
                        {stat.label}
                      </span>
                    </div>
                    <span
                      className="font-mono text-xl font-black"
                      style={{
                        color: stat.highlight ? '#D4AF37' : '#FFFFFF',
                        textShadow: stat.highlight ? '0 0 10px rgba(212, 175, 55, 0.5)' : 'none',
                      }}
                    >
                      {stat.value}
                    </span>
                  </motion.div>
                ))}
              </div>

              {/* Sovereign Balance Component (50:50 Split) */}
              {(card as any).showSovereignBalance && (
                <div className="mt-6">
                  <SovereignBalance
                    citizenShareVIDA={telemetry.totalTributes.citizenShareVIDA || 0}
                    stateShareVIDA={telemetry.totalTributes.stateShareVIDA || 0}
                  />
                </div>
              )}

              {/* Enhanced LIVE Indicator with Gold Pulsing Animation */}
              <div className="mt-8 flex items-center gap-3">
                <motion.div
                  className="w-4 h-4 rounded-full"
                  style={{
                    background: '#D4AF37',
                  }}
                  animate={{
                    opacity: [1, 0.5, 1],
                    scale: [1, 1.4, 1],
                    boxShadow: [
                      '0 0 10px rgba(212, 175, 55, 0.5)',
                      '0 0 25px rgba(212, 175, 55, 0.9)',
                      '0 0 10px rgba(212, 175, 55, 0.5)',
                    ],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
                <span
                  className="text-sm font-black tracking-widest"
                  style={{ color: '#D4AF37' }}
                >
                  LIVE
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}


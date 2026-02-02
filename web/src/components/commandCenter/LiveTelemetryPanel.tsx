/**
 * PFF Web — Live Telemetry Panel
 * Real-time display of Sentinel counts, tributes, and liquidity
 * Architect: Isreal Okoro (mrfundzman)
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Shield, DollarSign, Globe, TrendingUp, Users, Building2 } from 'lucide-react';
import { CommandCenterTelemetry } from '../../types/commandCenter';

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
      color: 'from-purple-500 to-pink-500',
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
      color: 'from-green-500 to-emerald-500',
      stats: [
        { label: 'Total Tributes (VIDA)', value: telemetry.totalTributes.deepTruthVIDA.toFixed(8) },
        { label: 'State Share (50%)', value: `${(telemetry.totalTributes.stateShareVIDA || 0).toFixed(8)} VIDA`, highlight: true },
        { label: 'Citizen Share (50%)', value: `${(telemetry.totalTributes.citizenShareVIDA || 0).toFixed(8)} VIDA`, highlight: true },
        { label: 'Total Businesses Connected', value: telemetry.totalTributes.businessCount },
        { label: 'Last 24h Tributes', value: `${telemetry.totalTributes.last24hVIDA.toFixed(8)} VIDA` },
      ],
    },
    {
      title: 'NATIONAL LIQUIDITY LEVELS',
      subtitle: '195 Sovereign Blocks',
      icon: Globe,
      color: 'from-blue-500 to-cyan-500',
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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-6"
      >
        <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <TrendingUp className="w-8 h-8 text-green-400" />
          LIVE TELEMETRY
        </h2>
        <p className="text-gray-400">Real-time sovereign control metrics</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {telemetryCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className="relative group"
          >
            {/* Card Container */}
            <div className="relative bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-2xl hover:shadow-purple-500/20 transition-all duration-300">
              {/* Glow Effect */}
              <div className={`absolute inset-0 bg-gradient-to-r ${card.color} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-300`} />

              {/* Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${card.color}`}>
                  <card.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{card.title}</h3>
                  {card.subtitle && (
                    <p className="text-sm text-gray-400">{card.subtitle}</p>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="space-y-4">
                {card.stats.map((stat: any, statIndex: any) => (
                  <div
                    key={statIndex}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      ((stat as any).highlight)
                        ? 'bg-gradient-to-r from-purple-900/50 to-pink-900/50 border border-purple-500/30'
                        : 'bg-gray-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {stat.icon && <stat.icon className="w-4 h-4 text-gray-400" />}
                      <span className={`text-sm ${((stat as any).highlight) ? 'text-white font-bold' : 'text-gray-400'}`}>
                        {stat.label}
                      </span>
                    </div>
                    <span className={`font-mono ${((stat as any).highlight) ? 'text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400' : 'text-lg font-bold text-white'}`}>
                      {stat.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Live Indicator */}
              <div className="mt-6 flex items-center gap-2">
                <motion.div
                  className="w-2 h-2 bg-green-400 rounded-full"
                  animate={{
                    opacity: [1, 0.3, 1],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                  }}
                />
                <span className="text-xs text-green-400 font-semibold">LIVE</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}


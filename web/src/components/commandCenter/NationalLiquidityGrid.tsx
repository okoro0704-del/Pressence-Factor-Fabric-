/**
 * PFF Web — National Liquidity Grid
 * Display top 10 nations by liquidity reserves
 * Architect: Isreal Okoro (mrfundzman)
 */

import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { Globe, TrendingUp, TrendingDown } from 'lucide-react';

interface NationalLiquidity {
  nationCode: string;
  nationName: string;
  reservesVIDA: number;
  reservesUSD: number;
  citizenCount: number;
  avgReservePerCitizen: number;
  rank: number;
}

// Typing/Counting Animation Component
function AnimatedNumber({ value, decimals = 2 }: { value: number; decimals?: number }) {
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (latest) => latest.toFixed(decimals));

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration: 1.5,
      ease: 'easeOut',
    });
    return controls.stop;
  }, [motionValue, value]);

  return <motion.span>{rounded}</motion.span>;
}

export default function NationalLiquidityGrid() {
  const [topNations, setTopNations] = useState<NationalLiquidity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopNations();
    const interval = setInterval(fetchTopNations, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchTopNations = async () => {
    try {
      const response = await fetch('/api/command-center/top-nations');
      const data = await response.json();
      
      if (data.success) {
        setTopNations(data.nations);
        setLoading(false);
      }
    } catch (err) {
      console.error('Failed to fetch top nations:', err);
    }
  };

  if (loading) {
    return (
      <div className="mb-12 text-center text-gray-400">
        Loading national liquidity data...
      </div>
    );
  }

  return (
    <div className="mb-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-6"
      >
        <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <Globe className="w-8 h-8 text-blue-400" />
          TOP 10 NATIONS BY LIQUIDITY
        </h2>
        <p className="text-gray-400">Sovereign wealth rankings across 195 blocks</p>
      </motion.div>

      <div className="relative bg-white/5 backdrop-blur-[10px] border border-white/10 rounded-2xl p-6 shadow-2xl overflow-hidden">
        {/* Scanning Line Effect */}
        <motion.div
          className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50 z-10"
          animate={{
            top: ['0%', '100%'],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: 'linear',
          }}
        />

        <div className="overflow-x-auto relative z-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-4 px-4 text-sm font-bold text-gray-400">RANK</th>
                <th className="text-left py-4 px-4 text-sm font-bold text-gray-400">NATION</th>
                <th className="text-right py-4 px-4 text-sm font-bold text-gray-400">RESERVES (VIDA)</th>
                <th className="text-right py-4 px-4 text-sm font-bold text-gray-400">RESERVES (USD)</th>
                <th className="text-right py-4 px-4 text-sm font-bold text-gray-400">CITIZENS</th>
                <th className="text-right py-4 px-4 text-sm font-bold text-gray-400">AVG/CITIZEN</th>
              </tr>
            </thead>
            <tbody>
              {topNations.map((nation, index) => (
                <motion.tr
                  key={nation.nationCode}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  whileHover={{ scale: 1.02, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                  className="border-b border-gray-800 transition-colors"
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <span className={`text-2xl font-black ${
                        nation.rank === 1 ? 'text-yellow-400' :
                        nation.rank === 2 ? 'text-gray-300' :
                        nation.rank === 3 ? 'text-orange-400' :
                        'text-gray-500'
                      }`}>
                        #{nation.rank}
                      </span>
                      {nation.rank <= 3 && (
                        <TrendingUp className={`w-5 h-5 ${
                          nation.rank === 1 ? 'text-yellow-400' :
                          nation.rank === 2 ? 'text-gray-300' :
                          'text-orange-400'
                        }`} />
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div>
                      <p className="text-white font-bold">{nation.nationName}</p>
                      <p className="text-sm text-gray-500 font-mono">{nation.nationCode}</p>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <p className="text-white font-mono font-bold">
                      <AnimatedNumber value={nation.reservesVIDA} decimals={8} />
                    </p>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <p className="text-green-400 font-mono font-bold">
                      $<AnimatedNumber value={nation.reservesUSD} decimals={2} />
                    </p>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <p className="text-white font-mono">{nation.citizenCount.toLocaleString()}</p>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <p className="text-blue-400 font-mono">
                      <AnimatedNumber value={nation.avgReservePerCitizen} decimals={8} />
                    </p>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Live Indicator */}
        <div className="mt-6 pt-6 border-t border-gray-700/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
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
            <span className="text-xs text-green-400 font-semibold">LIVE DATA</span>
          </div>
          <p className="text-xs text-gray-500">
            Showing top 10 of 195 sovereign blocks
          </p>
        </div>
      </div>
    </div>
  );
}


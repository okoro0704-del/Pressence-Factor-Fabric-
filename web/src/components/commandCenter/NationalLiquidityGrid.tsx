/**
 * PFF Web — National Liquidity Grid
 * Display top 10 nations by liquidity reserves
 * Architect: Isreal Okoro (mrfundzman)
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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

      <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-2xl">
        <div className="overflow-x-auto">
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
                  className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
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
                    <p className="text-white font-mono font-bold">{nation.reservesVIDA.toFixed(8)}</p>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <p className="text-green-400 font-mono font-bold">${nation.reservesUSD.toFixed(2)}</p>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <p className="text-white font-mono">{nation.citizenCount.toLocaleString()}</p>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <p className="text-blue-400 font-mono">{nation.avgReservePerCitizen.toFixed(8)}</p>
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


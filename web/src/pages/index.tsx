/**
 * PFF Web — Public Sovereign Portal (Citizen View)
 * The front door to the Vitalie Economic Model
 * Architect: Isreal Okoro (mrfundzman)
 */

'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Search, Users, FileText, ArrowRight, Globe, Zap } from 'lucide-react';
import Link from 'next/link';
import { supabase, hasSupabase } from '@/lib/supabase';

interface TelemetryData {
  total_tributes_vida: number;
  state_share_vida: number;
  citizen_share_vida: number;
  active_sentinels: number;
}

export default function PublicSovereignPortal() {
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTelemetry();
  }, []);

  const fetchTelemetry = async () => {
    try {
      if (!hasSupabase()) {
        console.log('[PUBLIC PORTAL] Supabase not available, using default values');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('sentinel_telemetry')
        .select('*')
        .single();

      if (error) throw error;

      setTelemetry({
        total_tributes_vida: data.total_tributes_vida || 0,
        state_share_vida: data.total_tributes_vida ? data.total_tributes_vida * 0.5 : 0,
        citizen_share_vida: data.total_tributes_vida ? data.total_tributes_vida * 0.5 : 0,
        active_sentinels: data.active_sentinels || 0,
      });
    } catch (err) {
      console.error('[PUBLIC PORTAL] Error fetching telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#1a1f3a] to-[#0a0e27] text-white relative overflow-hidden">
      {/* Animated Mesh Network Background */}
      <div className="absolute inset-0 opacity-20">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="mesh" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <circle cx="50" cy="50" r="2" fill="#C9A227" opacity="0.5">
                <animate attributeName="r" values="2;3;2" dur="3s" repeatCount="indefinite" />
              </circle>
              <line x1="50" y1="50" x2="100" y2="50" stroke="#1E3A8A" strokeWidth="0.5" opacity="0.3" />
              <line x1="50" y1="50" x2="50" y2="100" stroke="#1E3A8A" strokeWidth="0.5" opacity="0.3" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#mesh)" />
        </svg>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 border-b border-white/10 bg-black/20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-[#C9A227]" />
            <span className="text-2xl font-bold bg-gradient-to-r from-[#C9A227] to-[#FFD700] bg-clip-text text-transparent">
              PFF PROTOCOL
            </span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="#vision" className="text-gray-300 hover:text-[#C9A227] transition-colors">
              The Vision
            </Link>
            <Link href="#how-it-works" className="text-gray-300 hover:text-[#C9A227] transition-colors">
              How it Works
            </Link>
            <Link href="#statistics" className="text-gray-300 hover:text-[#C9A227] transition-colors">
              Live Statistics
            </Link>
            <Link
              href="/ArchitectCommandCenter"
              className="px-4 py-2 bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] rounded-lg hover:from-[#2563EB] hover:to-[#60A5FA] transition-all"
            >
              Secure Login
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-16">
        {/* Manifesto Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h1 className="text-6xl md:text-7xl font-black mb-6 leading-tight">
            <span className="bg-gradient-to-r from-[#C9A227] via-[#FFD700] to-[#C9A227] bg-clip-text text-transparent">
              THE SIMULATION ENDS HERE.
            </span>
            <br />
            <span className="text-white">WELCOME TO THE REAL ECONOMY.</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Powered by the <span className="text-[#C9A227] font-semibold">PFF Protocol</span> &{' '}
            <span className="text-[#1E3A8A] font-semibold">The Vitalie Economic Model</span>
          </p>
        </motion.div>

        {/* 50:50 Transparency Engine */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-center mb-8 text-[#C9A227]">
            LIVE PAYOUT TRACKER — THE 50:50 TRANSPARENCY ENGINE
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {/* THE PEOPLE (50%) */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-emerald-900/30 to-cyan-900/30 border border-emerald-500/30 rounded-2xl p-8 backdrop-blur-md"
            >
              <div className="flex items-center gap-3 mb-4">
                <Users className="w-8 h-8 text-emerald-400" />
                <h3 className="text-2xl font-bold text-emerald-400">THE PEOPLE (50%)</h3>
              </div>
              <p className="text-gray-300 mb-6">
                Distributed monthly to verified truth-tellers who complete the 4-layer PFF handshake.
              </p>
              <div className="text-5xl font-black text-emerald-400 font-mono">
                {loading ? '...' : telemetry?.citizen_share_vida.toLocaleString() || '0'}{' '}
                <span className="text-2xl text-gray-400">VIDA</span>
              </div>
            </motion.div>

            {/* TRUTH INFRASTRUCTURE (50%) */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-amber-900/30 to-yellow-900/30 border border-amber-500/30 rounded-2xl p-8 backdrop-blur-md"
            >
              <div className="flex items-center gap-3 mb-4">
                <Zap className="w-8 h-8 text-amber-400" />
                <h3 className="text-2xl font-bold text-amber-400">TRUTH INFRASTRUCTURE (50%)</h3>
              </div>
              <p className="text-gray-300 mb-6">
                Powers the Agents, Ministries of Truth, and the global VLT network.
              </p>
              <div className="text-5xl font-black text-amber-400 font-mono">
                {loading ? '...' : telemetry?.state_share_vida.toLocaleString() || '0'}{' '}
                <span className="text-2xl text-gray-400">VIDA</span>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Citizen Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {/* Check My Block */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md"
          >
            <Search className="w-12 h-12 text-[#C9A227] mb-4" />
            <h3 className="text-2xl font-bold mb-3">Check My Block</h3>
            <p className="text-gray-300 mb-4">
              Enter your location or ID to see your local vitality status and sovereign block health.
            </p>
            <input
              type="text"
              placeholder="Enter location or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#C9A227] transition-colors"
            />
            <button className="w-full mt-3 px-4 py-3 bg-gradient-to-r from-[#C9A227] to-[#FFD700] text-black font-bold rounded-lg hover:from-[#FFD700] hover:to-[#C9A227] transition-all flex items-center justify-center gap-2">
              Search Block
              <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>

          {/* Join the Mesh */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md"
          >
            <Globe className="w-12 h-12 text-[#1E3A8A] mb-4" />
            <h3 className="text-2xl font-bold mb-3">Join the Mesh</h3>
            <p className="text-gray-300 mb-4">
              Become a Sentinel or Operator. Help build the decentralized truth network.
            </p>
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                <span>{telemetry?.active_sentinels || 0} Active Sentinels</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                <span>195 Sovereign Blocks</span>
              </div>
            </div>
            <Link
              href="/sentinel"
              className="block w-full px-4 py-3 bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] text-white font-bold rounded-lg hover:from-[#2563EB] hover:to-[#60A5FA] transition-all text-center"
            >
              Register Now
            </Link>
          </motion.div>

          {/* The Ledger */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md"
          >
            <FileText className="w-12 h-12 text-emerald-400 mb-4" />
            <h3 className="text-2xl font-bold mb-3">The Ledger</h3>
            <p className="text-gray-300 mb-4">
              View the public audit log. Every action is recorded. Fraud is eliminated.
            </p>
            <div className="space-y-2 mb-4 text-sm text-gray-400">
              <div className="flex justify-between">
                <span>Total Transactions:</span>
                <span className="text-white font-mono">1,247</span>
              </div>
              <div className="flex justify-between">
                <span>Fraud Attempts Blocked:</span>
                <span className="text-red-400 font-mono">0</span>
              </div>
              <div className="flex justify-between">
                <span>Uptime:</span>
                <span className="text-emerald-400 font-mono">99.99%</span>
              </div>
            </div>
            <Link
              href="/ledger"
              className="block w-full px-4 py-3 bg-emerald-900/50 border border-emerald-500/30 text-emerald-400 font-bold rounded-lg hover:bg-emerald-900/70 transition-all text-center"
            >
              View Ledger
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}


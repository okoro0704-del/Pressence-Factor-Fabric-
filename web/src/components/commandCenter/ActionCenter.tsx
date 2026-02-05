/**
 * PFF Web — Action Center
 * Broadcast to Protocol and Emergency Stasis Lock buttons
 * Architect: Isreal Okoro (mrfundzman)
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Lock, AlertTriangle, Send, X } from 'lucide-react';
import { ActionResult } from '../../types/commandCenter';

interface ActionCenterProps {
  onBroadcastToProtocol: (message: string) => Promise<ActionResult>;
  onEmergencyStasis: (reason: string) => Promise<ActionResult>;
}

export default function ActionCenter({ onBroadcastToProtocol, onEmergencyStasis }: ActionCenterProps) {
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [showStasisModal, setShowStasisModal] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [stasisReason, setStasisReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ActionResult | null>(null);

  const handleBroadcast = async () => {
    if (!broadcastMessage.trim()) {
      setResult({ success: false, error: 'Message cannot be empty' });
      return;
    }

    setLoading(true);
    const actionResult = await onBroadcastToProtocol(broadcastMessage);
    setResult(actionResult);
    setLoading(false);

    if (actionResult.success) {
      setTimeout(() => {
        setShowBroadcastModal(false);
        setBroadcastMessage('');
        setResult(null);
      }, 2000);
    }
  };

  const handleStasis = async () => {
    if (!stasisReason.trim()) {
      setResult({ success: false, error: 'Reason cannot be empty' });
      return;
    }

    setLoading(true);
    const actionResult = await onEmergencyStasis(stasisReason);
    setResult(actionResult);
    setLoading(false);

    if (actionResult.success) {
      setTimeout(() => {
        setShowStasisModal(false);
        setStasisReason('');
        setResult(null);
      }, 2000);
    }
  };

  return (
    <div className="mb-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-6"
      >
        <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <AlertTriangle className="w-8 h-8 text-yellow-400" />
          ACTION CENTER
        </h2>
        <p className="text-gray-400">Sovereign command execution</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Broadcast to Protocol Button */}
        <motion.button
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          whileHover={{ scale: 1.02 }}
          onClick={() => setShowBroadcastModal(true)}
          className="group relative bg-white/5 backdrop-blur-[10px] border border-white/10 rounded-2xl p-8 shadow-2xl hover:shadow-blue-500/30 transition-all duration-300"
        >
          {/* Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 opacity-0 group-hover:opacity-20 rounded-2xl transition-opacity duration-300" />

          <div className="relative flex flex-col items-center gap-4">
            <div className="p-4 rounded-xl bg-blue-500/20 relative">
              {/* Signal Wave Animation */}
              <motion.div
                className="absolute inset-0 rounded-xl border-2 border-blue-400"
                animate={{
                  scale: [1, 1.5, 2],
                  opacity: [0.8, 0.4, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeOut',
                }}
              />
              <motion.div
                className="absolute inset-0 rounded-xl border-2 border-cyan-400"
                animate={{
                  scale: [1, 1.5, 2],
                  opacity: [0.8, 0.4, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeOut',
                  delay: 0.5,
                }}
              />
              <Radio className="w-12 h-12 text-blue-400 relative z-10" />
            </div>
            <h3 className="text-2xl font-bold text-white">BROADCAST TO PROTOCOL</h3>
            <p className="text-gray-400 text-center">
              Send sovereign message to all connected Sentinels via Darknet Protocol
            </p>
          </div>
        </motion.button>

        {/* Emergency Stasis Lock Button */}
        <motion.button
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          whileHover={{ scale: 1.02 }}
          onClick={() => setShowStasisModal(true)}
          className="group relative bg-white/5 backdrop-blur-[10px] rounded-2xl p-8 shadow-2xl transition-all duration-300 overflow-hidden"
          style={{
            border: '4px solid',
            borderImage: 'repeating-linear-gradient(45deg, #000 0, #000 10px, #facc15 10px, #facc15 20px) 1',
            boxShadow: '0 0 30px rgba(239, 68, 68, 0.4), 0 20px 60px rgba(0, 0, 0, 0.5)',
          }}
        >
          {/* Red Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-orange-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />

          <div className="relative flex flex-col items-center gap-4">
            <div className="p-4 rounded-xl bg-red-500/20">
              <Lock className="w-12 h-12 text-red-400" />
            </div>
            <h3 className="text-2xl font-bold text-white">EMERGENCY STASIS LOCK</h3>
            <p className="text-gray-400 text-center">
              Trigger global protocol freeze for security breach or emergency
            </p>
          </div>
        </motion.button>
      </div>

      {/* Broadcast Modal */}
      <AnimatePresence>
        {showBroadcastModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={() => !loading && setShowBroadcastModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              onClick={(e: any) => e.stopPropagation()}
              className="bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-blue-500/50 rounded-2xl p-8 max-w-2xl w-full mx-4 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                  <Radio className="w-8 h-8 text-blue-400" />
                  BROADCAST TO PROTOCOL
                </h3>
                <button
                  onClick={() => setShowBroadcastModal(false)}
                  disabled={loading}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-400 mb-2">
                  Message to broadcast to all Sentinels:
                </label>
                <textarea
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  disabled={loading}
                  placeholder="Enter your sovereign message..."
                  className="w-full h-32 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                />
              </div>

              {result && (
                <div className={`mb-6 p-4 rounded-xl ${result.success ? 'bg-green-500/20 border border-green-500/30' : 'bg-red-500/20 border border-red-500/30'}`}>
                  <p className={`text-sm font-semibold ${result.success ? 'text-green-400' : 'text-red-400'}`}>
                    {result.success ? '✓ Broadcast successful!' : `✗ ${result.error}`}
                  </p>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={handleBroadcast}
                  disabled={loading || !broadcastMessage.trim()}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold rounded-xl hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Broadcasting...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      BROADCAST NOW
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowBroadcastModal(false)}
                  disabled={loading}
                  className="px-6 py-3 bg-gray-700 text-white font-bold rounded-xl hover:bg-gray-600 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Emergency Stasis Modal */}
      <AnimatePresence>
        {showStasisModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={() => !loading && setShowStasisModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              onClick={(e: any) => e.stopPropagation()}
              className="bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-red-500/50 rounded-2xl p-8 max-w-2xl w-full mx-4 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                  <AlertTriangle className="w-8 h-8 text-red-400" />
                  EMERGENCY STASIS LOCK
                </h3>
                <button
                  onClick={() => setShowStasisModal(false)}
                  disabled={loading}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                <p className="text-red-400 font-semibold text-sm">
                  ⚠️ WARNING: This will freeze all protocol operations globally. Use only in case of security breach or emergency.
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-400 mb-2">
                  Reason for emergency stasis:
                </label>
                <textarea
                  value={stasisReason}
                  onChange={(e) => setStasisReason(e.target.value)}
                  disabled={loading}
                  placeholder="Enter reason for emergency stasis..."
                  className="w-full h-32 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors resize-none"
                />
              </div>

              {result && (
                <div className={`mb-6 p-4 rounded-xl ${result.success ? 'bg-green-500/20 border border-green-500/30' : 'bg-red-500/20 border border-red-500/30'}`}>
                  <p className={`text-sm font-semibold ${result.success ? 'text-green-400' : 'text-red-400'}`}>
                    {result.success ? '✓ Emergency stasis activated!' : `✗ ${result.error}`}
                  </p>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={handleStasis}
                  disabled={loading || !stasisReason.trim()}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold rounded-xl hover:from-red-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Activating...
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5" />
                      ACTIVATE STASIS
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowStasisModal(false)}
                  disabled={loading}
                  className="px-6 py-3 bg-gray-700 text-white font-bold rounded-xl hover:bg-gray-600 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


/**
 * PFF Web — Security Status Badge
 * Massive HARDWARE BINDED badge for ROOT_SOVEREIGN_PAIR
 * Architect: Isreal Okoro (mrfundzman)
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Shield, CheckCircle, AlertTriangle, Laptop, Smartphone, Lock } from 'lucide-react';
import { SecurityStatus } from '../../types/commandCenter';

interface SecurityStatusBadgeProps {
  status: SecurityStatus | null;
}

export default function SecurityStatusBadge({ status }: SecurityStatusBadgeProps) {
  if (!status) {
    return (
      <div className="mb-12 text-center">
        <div className="inline-block px-8 py-4 bg-gray-800/50 border border-gray-700 rounded-2xl">
          <p className="text-gray-400">Loading security status...</p>
        </div>
      </div>
    );
  }

  const isFullyBinded = status.laptopBinded && status.mobileBinded && status.genesisHashVerified;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, type: 'spring' }}
      className="mb-12"
    >
      {/* Main Badge Container */}
      <div className="relative">
        {/* Glow Effect */}
        {isFullyBinded && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-green-500 via-emerald-500 to-green-500 opacity-20 blur-3xl rounded-3xl"
            animate={{
              opacity: [0.2, 0.4, 0.2],
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
            }}
          />
        )}

        {/* Badge Content */}
        <div className={`relative bg-gradient-to-br ${isFullyBinded ? 'from-green-900/90 to-emerald-900/90 border-green-500/50' : 'from-red-900/90 to-orange-900/90 border-red-500/50'} backdrop-blur-xl border-2 rounded-3xl p-8 shadow-2xl`}>
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            {/* Left: Status Icon & Title */}
            <div className="flex items-center gap-6">
              <motion.div
                className={`p-6 rounded-2xl ${isFullyBinded ? 'bg-green-500/20' : 'bg-red-500/20'}`}
                animate={{
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                }}
              >
                {isFullyBinded ? (
                  <Shield className="w-16 h-16 text-green-400" />
                ) : (
                  <AlertTriangle className="w-16 h-16 text-red-400" />
                )}
              </motion.div>

              <div>
                <h2 className={`text-5xl font-black ${isFullyBinded ? 'text-green-400' : 'text-red-400'} mb-2`}>
                  {isFullyBinded ? 'HARDWARE BINDED' : 'BINDING INCOMPLETE'}
                </h2>
                <p className="text-xl text-gray-300 font-semibold">
                  ROOT_SOVEREIGN_PAIR Status
                </p>
              </div>
            </div>

            {/* Right: Device Status */}
            <div className="flex flex-col lg:flex-row gap-6">
              {/* HP Laptop Status */}
              <div className={`flex items-center gap-3 px-6 py-4 rounded-xl ${status.laptopBinded ? 'bg-green-500/20 border border-green-500/30' : 'bg-gray-800/50 border border-gray-700'}`}>
                <Laptop className={`w-8 h-8 ${status.laptopBinded ? 'text-green-400' : 'text-gray-500'}`} />
                <div>
                  <p className="text-sm text-gray-400">HP Laptop</p>
                  <p className={`text-lg font-bold ${status.laptopBinded ? 'text-green-400' : 'text-gray-500'}`}>
                    {status.laptopBinded ? 'BINDED' : 'NOT BINDED'}
                  </p>
                  <p className="text-xs text-gray-500 font-mono">{status.laptopDeviceUUID}</p>
                </div>
                {status.laptopBinded && (
                  <CheckCircle className="w-6 h-6 text-green-400" />
                )}
              </div>

              {/* Mobile Device Status */}
              <div className={`flex items-center gap-3 px-6 py-4 rounded-xl ${status.mobileBinded ? 'bg-green-500/20 border border-green-500/30' : 'bg-gray-800/50 border border-gray-700'}`}>
                <Smartphone className={`w-8 h-8 ${status.mobileBinded ? 'text-green-400' : 'text-gray-500'}`} />
                <div>
                  <p className="text-sm text-gray-400">Mobile Device</p>
                  <p className={`text-lg font-bold ${status.mobileBinded ? 'text-green-400' : 'text-gray-500'}`}>
                    {status.mobileBinded ? 'BINDED' : 'NOT BINDED'}
                  </p>
                  <p className="text-xs text-gray-500 font-mono">{status.mobileDeviceUUID}</p>
                </div>
                {status.mobileBinded && (
                  <CheckCircle className="w-6 h-6 text-green-400" />
                )}
              </div>

              {/* Genesis Hash Status */}
              <div className={`flex items-center gap-3 px-6 py-4 rounded-xl ${status.genesisHashVerified ? 'bg-green-500/20 border border-green-500/30' : 'bg-gray-800/50 border border-gray-700'}`}>
                <Lock className={`w-8 h-8 ${status.genesisHashVerified ? 'text-green-400' : 'text-gray-500'}`} />
                <div>
                  <p className="text-sm text-gray-400">Genesis Hash</p>
                  <p className={`text-lg font-bold ${status.genesisHashVerified ? 'text-green-400' : 'text-gray-500'}`}>
                    {status.genesisHashVerified ? 'VERIFIED' : 'PENDING'}
                  </p>
                </div>
                {status.genesisHashVerified && (
                  <CheckCircle className="w-6 h-6 text-green-400" />
                )}
              </div>
            </div>
          </div>

          {/* Last Verification Timestamp */}
          {status.lastVerificationTimestamp && (
            <div className="mt-6 pt-6 border-t border-gray-700/50">
              <p className="text-sm text-gray-400">
                Last Verification: <span className="text-white font-mono">{new Date(status.lastVerificationTimestamp).toLocaleString()}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}


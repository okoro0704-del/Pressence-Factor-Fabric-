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
        {/* Enhanced Matrix Green Glow Effect */}
        {isFullyBinded && (
          <>
            <motion.div
              className="absolute inset-0 bg-green-400 opacity-30 blur-3xl rounded-3xl"
              animate={{
                opacity: [0.3, 0.6, 0.3],
                scale: [1, 1.08, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            <motion.div
              className="absolute inset-0 bg-emerald-500 opacity-20 blur-2xl rounded-3xl"
              animate={{
                opacity: [0.2, 0.4, 0.2],
                scale: [1.05, 1.1, 1.05],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 0.5,
              }}
            />
          </>
        )}

        {/* Badge Content - Glassmorphism */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className={`relative bg-white/5 backdrop-blur-[10px] border-2 ${isFullyBinded ? 'border-green-400/50' : 'border-red-500/50'} rounded-3xl p-8 shadow-2xl`}
          style={{
            boxShadow: isFullyBinded
              ? '0 0 40px rgba(74, 222, 128, 0.4), 0 20px 60px rgba(0, 0, 0, 0.5)'
              : '0 20px 60px rgba(0, 0, 0, 0.5)',
          }}
        >
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
              <motion.div
                whileHover={{ scale: 1.02 }}
                className={`flex items-center gap-3 px-6 py-4 rounded-xl ${status.laptopBinded ? 'bg-green-500/20 border border-green-500/30' : 'bg-gray-800/50 border border-gray-700'}`}
              >
                <Laptop className={`w-8 h-8 ${status.laptopBinded ? 'text-green-400' : 'text-gray-500'}`} />
                <div>
                  <p className="text-sm text-gray-400">HP Laptop</p>
                  <p className={`text-lg font-bold ${status.laptopBinded ? 'text-green-400' : 'text-gray-500'}`}>
                    {status.laptopBinded ? 'BINDED' : 'NOT BINDED'}
                  </p>
                </div>
                {status.laptopBinded && (
                  <CheckCircle className="w-6 h-6 text-green-400" />
                )}
              </motion.div>

              {/* Mobile Device Status */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className={`flex items-center gap-3 px-6 py-4 rounded-xl ${status.mobileBinded ? 'bg-green-500/20 border border-green-500/30' : 'bg-gray-800/50 border border-gray-700'}`}
              >
                <Smartphone className={`w-8 h-8 ${status.mobileBinded ? 'text-green-400' : 'text-gray-500'}`} />
                <div>
                  <p className="text-sm text-gray-400">Mobile Device</p>
                  <p className={`text-lg font-bold ${status.mobileBinded ? 'text-green-400' : 'text-gray-500'}`}>
                    {status.mobileBinded ? 'BINDED' : 'NOT BINDED'}
                  </p>
                </div>
                {status.mobileBinded && (
                  <CheckCircle className="w-6 h-6 text-green-400" />
                )}
              </motion.div>

              {/* Genesis Hash Seal Status */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className={`flex items-center gap-3 px-6 py-4 rounded-xl relative ${status.genesisHashVerified ? 'bg-green-500/20 border border-green-500/30' : 'bg-gray-800/50 border border-gray-700'}`}
              >
                {/* Gold/Amber Glow for SEALED status */}
                {status.genesisHashVerified && (
                  <>
                    <motion.div
                      className="absolute inset-0 bg-amber-400 opacity-20 blur-xl rounded-xl"
                      animate={{
                        opacity: [0.2, 0.4, 0.2],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    />
                    <motion.div
                      className="absolute inset-0 bg-yellow-500 opacity-10 blur-lg rounded-xl"
                      animate={{
                        opacity: [0.1, 0.2, 0.1],
                      }}
                      transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: 0.5,
                      }}
                    />
                  </>
                )}

                <Lock className={`w-8 h-8 relative z-10 ${status.genesisHashVerified ? 'text-amber-400' : 'text-gray-500'}`} />
                <div className="relative z-10">
                  <p className="text-sm text-gray-400">Genesis Hash Seal</p>
                  <p className={`text-lg font-bold ${status.genesisHashVerified ? 'text-amber-400' : 'text-gray-500'}`}>
                    {status.genesisHashVerified ? 'SEALED' : 'PENDING'}
                  </p>
                  {status.genesisHash && status.genesisHashVerified && (
                    <p className="text-xs text-amber-300 mt-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {status.genesisHash.substring(0, 12)}...
                    </p>
                  )}
                </div>
                {status.genesisHashVerified && (
                  <CheckCircle className="w-6 h-6 text-amber-400 relative z-10" />
                )}
              </motion.div>
            </div>
          </div>

          {/* Genesis Hash Display */}
          {status.genesisHash && (
            <div className="mt-6 pt-6 border-t border-gray-700/50">
              <p className="text-sm text-gray-400 mb-2">Genesis Authority Hash (2/2/2026)</p>
              <p className="text-xs text-green-400 break-all" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {status.genesisHash}
              </p>
            </div>
          )}

          {/* Hardware TPM Hash Display */}
          {status.hardwareTPMHash && (
            <div className="mt-4">
              <p className="text-sm text-gray-400 mb-2">Hardware TPM Hash</p>
              <p className="text-xs text-cyan-400 break-all" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {status.hardwareTPMHash}
              </p>
            </div>
          )}

          {/* Last Verification Timestamp */}
          {status.lastVerificationTimestamp && (
            <div className="mt-4">
              <p className="text-sm text-gray-400">
                Last Verification: <span className="text-white" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{new Date(status.lastVerificationTimestamp).toLocaleString()}</span>
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}


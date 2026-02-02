/**
 * PFF Web — Mobile Sync Modal
 * Display 6-digit PIN for mobile device binding
 * Architect: Isreal Okoro (mrfundzman)
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Smartphone, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { generateMobileBindingToken } from '../../../lib/mobileBinding';

interface MobileSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  deviceUUID: string;
}

export default function MobileSyncModal({ isOpen, onClose, deviceUUID }: MobileSyncModalProps) {
  const [pin, setPin] = useState<string>('');
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  // Generate PIN when modal opens
  useEffect(() => {
    if (isOpen && !pin) {
      generatePIN();
    }
  }, [isOpen]);

  // Update countdown timer
  useEffect(() => {
    if (!expiresAt) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const remaining = Math.max(0, Math.floor((expiry - now) / 1000));
      setTimeRemaining(remaining);

      if (remaining === 0) {
        setError('PIN expired - generate a new one');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  const generatePIN = async () => {
    setLoading(true);
    setError(null);

    const result = await generateMobileBindingToken(deviceUUID, 15);

    if (result.success && result.pin && result.expiresAt) {
      setPin(result.pin);
      setExpiresAt(result.expiresAt);
    } else {
      setError(result.message);
    }

    setLoading(false);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-gradient-to-br from-gray-900 to-black border-2 border-cyan-500/50 rounded-3xl p-8 max-w-md w-full shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-8 h-8 text-cyan-400" />
                  <h2 className="text-2xl font-bold text-white">Mobile Sync</h2>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Instructions */}
              <p className="text-gray-300 mb-6">
                Enter this PIN on your mobile device to bind it to your Architect account.
              </p>

              {/* PIN Display */}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-cyan-500 border-t-transparent" />
                </div>
              ) : error ? (
                <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-6 h-6 text-red-400" />
                    <p className="text-red-300">{error}</p>
                  </div>
                  <button
                    onClick={generatePIN}
                    className="mt-4 w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    Generate New PIN
                  </button>
                </div>
              ) : (
                <>
                  {/* PIN Code */}
                  <div className="bg-black/50 border-2 border-cyan-500/30 rounded-2xl p-8 mb-6">
                    <p className="text-sm text-gray-400 text-center mb-2">Your PIN</p>
                    <p
                      className="text-6xl font-bold text-center text-cyan-400 tracking-widest"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {pin}
                    </p>
                  </div>

                  {/* Timer */}
                  <div className="flex items-center justify-center gap-2 mb-6">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <p className="text-gray-300">
                      Expires in: <span className="text-cyan-400 font-bold">{formatTime(timeRemaining)}</span>
                    </p>
                  </div>

                  {/* Mobile URL */}
                  <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                    <p className="text-sm text-gray-400 mb-2">Mobile URL:</p>
                    <p className="text-cyan-400 text-sm break-all" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {typeof window !== 'undefined' ? `${window.location.origin}/mobile-auth` : '/mobile-auth'}
                    </p>
                  </div>
                </>
              )}

              {/* Footer */}
              <div className="mt-6 pt-6 border-t border-gray-700">
                <p className="text-xs text-gray-500 text-center">
                  PIN is valid for 15 minutes. Do not share with anyone.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}


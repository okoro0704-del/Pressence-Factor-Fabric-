/**
 * PFF Web — Mobile Authentication Entry Point
 * PIN entry for mobile device binding
 * Architect: Isreal Okoro (mrfundzman)
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Smartphone, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { executeMobileBinding } from '../../lib/mobileBinding';

export default function MobileAuth() {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mobileDeviceUUID, setMobileDeviceUUID] = useState<string>('');

  // Generate mobile device UUID on mount
  useEffect(() => {
    const generateDeviceUUID = () => {
      // Use navigator properties to create a unique device ID
      const userAgent = navigator.userAgent;
      const platform = navigator.platform;
      const language = navigator.language;
      const screenResolution = `${window.screen.width}x${window.screen.height}`;
      
      // Create a simple hash-like ID
      const deviceString = `${userAgent}|${platform}|${language}|${screenResolution}`;
      const hash = Array.from(deviceString).reduce((acc, char) => {
        return ((acc << 5) - acc) + char.charCodeAt(0);
      }, 0);
      
      return `MOBILE-DEVICE-${Math.abs(hash).toString(16).toUpperCase()}`;
    };

    setMobileDeviceUUID(generateDeviceUUID());
  }, []);

  const handlePinChange = (value: string) => {
    // Only allow digits, max 6 characters
    const cleaned = value.replace(/\D/g, '').slice(0, 6);
    setPin(cleaned);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (pin.length !== 6) {
      setError('PIN must be 6 digits');
      return;
    }

    setLoading(true);
    setError(null);

    console.log('[MOBILE AUTH] Submitting PIN:', pin);
    console.log('[MOBILE AUTH] Device UUID:', mobileDeviceUUID);

    const result = await executeMobileBinding(pin, mobileDeviceUUID);

    if (result.success) {
      setSuccess(true);
      console.log('[MOBILE AUTH] ✅ MOBILE DEVICE BOUND SUCCESSFULLY');
    } else {
      setError(result.message);
      console.error('[MOBILE AUTH] ❌ Binding failed:', result.message);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
      {/* Animated Background */}
      <div className="fixed inset-0 opacity-20">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.2, 1, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 2 + Math.random() * 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 bg-gradient-to-br from-gray-800/90 to-black/90 backdrop-blur-xl border-2 border-cyan-500/50 rounded-3xl p-8 max-w-md w-full shadow-2xl"
      >
        {success ? (
          // Success State
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', duration: 0.5 }}
            >
              <CheckCircle className="w-24 h-24 text-green-400 mx-auto mb-6" />
            </motion.div>
            <h1 className="text-3xl font-bold text-white mb-4">Device Bound!</h1>
            <p className="text-gray-300 mb-6">
              Your mobile device has been successfully bound to the Architect's account.
            </p>
            <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-4">
              <p className="text-sm text-green-300">
                <strong>Device UUID:</strong>
              </p>
              <p className="text-xs text-green-400 break-all mt-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {mobileDeviceUUID}
              </p>
            </div>
            <p className="text-sm text-gray-400 mt-6">
              You can now close this page and return to the Command Center.
            </p>
          </div>
        ) : (
          // PIN Entry Form
          <>
            <div className="flex items-center justify-center mb-6">
              <Smartphone className="w-16 h-16 text-cyan-400" />
            </div>

            <h1 className="text-3xl font-bold text-white text-center mb-2">
              Mobile Device Binding
            </h1>
            <p className="text-gray-400 text-center mb-8">
              Enter the 6-digit PIN from your laptop
            </p>

            <form onSubmit={handleSubmit}>
              {/* PIN Input */}
              <div className="mb-6">
                <label className="block text-sm text-gray-400 mb-2">
                  6-Digit PIN
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={pin}
                  onChange={(e) => handlePinChange(e.target.value)}
                  placeholder="000000"
                  className="w-full px-6 py-4 bg-black/50 border-2 border-cyan-500/30 rounded-xl text-4xl text-center text-cyan-400 font-bold tracking-widest focus:outline-none focus:border-cyan-500 transition-colors"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  maxLength={6}
                  autoFocus
                />
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 bg-red-500/20 border border-red-500/50 rounded-xl p-4"
                >
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    <p className="text-red-300 text-sm">{error}</p>
                  </div>
                </motion.div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || pin.length !== 6}
                className="w-full px-6 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-3"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Binding Device...
                  </>
                ) : (
                  'Bind Mobile Device'
                )}
              </button>
            </form>

            {/* Device Info */}
            <div className="mt-8 pt-6 border-t border-gray-700">
              <p className="text-xs text-gray-500 mb-2">Your Device ID:</p>
              <p className="text-xs text-gray-400 break-all" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {mobileDeviceUUID}
              </p>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}


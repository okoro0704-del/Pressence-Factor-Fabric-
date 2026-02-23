'use client';

import { useEffect, useState } from 'react';
import { JetBrains_Mono } from 'next/font/google';
import { subscribeToVitalizationRequest } from '@/lib/multiDeviceVitalization';

const jetbrains = JetBrains_Mono({ weight: ['400', '600', '700'], subsets: ['latin'] });

interface AwaitingMasterAuthorizationProps {
  requestId: string;
  primaryDeviceName: string;
  primaryDeviceLast4: string;
  deviceName: string;
  onApproved: () => void;
  onDenied: () => void;
  onLostPrimaryDevice?: () => void;
}

export function AwaitingMasterAuthorization({
  requestId,
  primaryDeviceName,
  primaryDeviceLast4,
  deviceName,
  onApproved,
  onDenied,
  onLostPrimaryDevice,
}: AwaitingMasterAuthorizationProps) {
  const [pulseScale, setPulseScale] = useState(1);

  useEffect(() => {
    // Rotating gold pulse animation
    const interval = setInterval(() => {
      setPulseScale((prev) => (prev === 1 ? 1.2 : 1));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Subscribe to vitalization request status changes
    const unsubscribe = subscribeToVitalizationRequest(requestId, (status) => {
      if (status === 'APPROVED') {
        onApproved();
      } else if (status === 'DENIED') {
        onDenied();
      }
    });

    return () => unsubscribe();
  }, [requestId, onApproved, onDenied]);

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      {/* Background Glow */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background: 'radial-gradient(circle at center, rgba(212, 175, 55, 0.3) 0%, rgba(5, 5, 5, 0) 70%)',
        }}
      />

      {/* Main Container */}
      <div className="relative max-w-2xl w-full">
        {/* Rotating Gold Pulse Icon */}
        <div className="text-center mb-8">
          <div
            className="inline-block transition-transform duration-1000"
            style={{
              transform: `scale(${pulseScale}) rotate(${pulseScale === 1.2 ? 360 : 0}deg)`,
            }}
          >
            <div
              className="w-32 h-32 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(212, 175, 55, 0.05) 100%)',
                border: '3px solid #D4AF37',
                boxShadow: '0 0 60px rgba(212, 175, 55, 0.6)',
              }}
            >
              <div className="text-6xl">🔐</div>
            </div>
          </div>
        </div>

        {/* Main Card */}
        <div
          className="rounded-2xl border-2 p-8 mb-6"
          style={{
            background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.05) 0%, rgba(0, 0, 0, 0.9) 100%)',
            borderColor: '#D4AF37',
            boxShadow: '0 0 60px rgba(212, 175, 55, 0.3)',
            backdropFilter: 'blur(10px)',
          }}
        >
          {/* Header */}
          <h1
            className={`text-3xl font-black text-center mb-4 uppercase tracking-wider ${jetbrains.className}`}
            style={{
              background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 30px rgba(212, 175, 55, 0.6)',
            }}
          >
            Awaiting Master Authorization
          </h1>

          {/* Status Message */}
          <div
            className="rounded-lg border p-6 mb-6"
            style={{
              background: 'rgba(212, 175, 55, 0.05)',
              borderColor: 'rgba(212, 175, 55, 0.3)',
            }}
          >
            <div className="flex items-start gap-4">
              <div className="text-3xl">✅</div>
              <div className="flex-1">
                <p className="text-lg font-bold mb-2" style={{ color: '#D4AF37' }}>
                  Presence Verified on this device
                </p>
                <p className="text-sm leading-relaxed" style={{ color: '#a0a0a5' }}>
                  Your biometric identity has been successfully verified on <span className="font-bold" style={{ color: '#D4AF37' }}>{deviceName}</span>.
                </p>
              </div>
            </div>
          </div>

          {/* Instruction */}
          <div
            className="rounded-lg border p-6 mb-6"
            style={{
              background: 'rgba(0, 0, 0, 0.5)',
              borderColor: 'rgba(212, 175, 55, 0.3)',
            }}
          >
            <div className="flex items-start gap-4">
              <div className="text-3xl">📱</div>
              <div className="flex-1">
                <p className="text-sm font-bold mb-2" style={{ color: '#D4AF37' }}>
                  Confirmation Required
                </p>
                <p className="text-sm leading-relaxed" style={{ color: '#a0a0a5' }}>
                  Please confirm Vitalization on your <span className="font-bold" style={{ color: '#D4AF37' }}>Primary Sentinel Device</span>
                </p>
                <p className="text-xs mt-2" style={{ color: '#6b6b70' }}>
                  ({primaryDeviceName} ending in <span className="font-mono font-bold" style={{ color: '#D4AF37' }}>****{primaryDeviceLast4}</span>)
                </p>
              </div>
            </div>
          </div>

          {/* Secure Link Animation */}
          <div className="flex items-center justify-center gap-4 mb-6">
            {/* Secondary Device Icon */}
            <div
              className="w-16 h-16 rounded-lg flex items-center justify-center"
              style={{
                background: 'rgba(212, 175, 55, 0.1)',
                border: '2px solid #D4AF37',
              }}
            >
              <div className="text-2xl">💻</div>
            </div>

            {/* Gold Thread Animation */}
            <div className="flex-1 relative h-1">
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'linear-gradient(90deg, #D4AF37 0%, #FFD700 50%, #D4AF37 100%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 2s infinite',
                  boxShadow: '0 0 20px rgba(212, 175, 55, 0.6)',
                }}
              />
            </div>

            {/* Primary Device Icon */}
            <div
              className="w-16 h-16 rounded-lg flex items-center justify-center"
              style={{
                background: 'rgba(212, 175, 55, 0.1)',
                border: '2px solid #D4AF37',
              }}
            >
              <div className="text-2xl">📱</div>
            </div>
          </div>

          {/* Waiting Message */}
          <div className="text-center">
            <p className="text-sm mb-2" style={{ color: '#6b6b70' }}>
              Waiting for authorization...
            </p>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
              <div className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" style={{ animationDelay: '0.2s' }} />
              <div className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
        </div>

        {/* Lost Primary Device Button */}
        {onLostPrimaryDevice && (
          <div className="mt-8">
            <button
              onClick={onLostPrimaryDevice}
              className="w-full py-3 px-6 bg-[#6b6b70]/20 border-2 border-[#6b6b70] text-[#6b6b70] font-bold font-mono rounded-lg hover:bg-[#6b6b70]/30 hover:border-[#D4AF37] hover:text-[#D4AF37] transition-all"
            >
              🛡️ LOST PRIMARY DEVICE? START GUARDIAN RECOVERY
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs" style={{ color: '#6b6b70' }}>
            PFF Multi-Device Vitalization Protocol
          </p>
          <p className="text-xs mt-1" style={{ color: '#6b6b70' }}>
            Secure Link Established • Real-Time Handshake Active
          </p>
        </div>
      </div>

      {/* Shimmer Animation */}
      <style jsx>{`
        @keyframes shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>
    </div>
  );
}


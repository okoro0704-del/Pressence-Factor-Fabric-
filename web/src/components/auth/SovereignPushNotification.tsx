'use client';

import { useState } from 'react';
import { JetBrains_Mono } from 'next/font/google';
import { VitalizationRequest, approveVitalizationRequest, denyVitalizationRequest } from '@/lib/multiDeviceVitalization';

const jetbrains = JetBrains_Mono({ weight: ['400', '600', '700'], subsets: ['latin'] });

interface SovereignPushNotificationProps {
  vitalizationRequest: VitalizationRequest;
  primaryDeviceId: string;
  onApprove: () => void;
  onDeny: () => void;
  onClose: () => void;
}

export function SovereignPushNotification({
  vitalizationRequest,
  primaryDeviceId,
  onApprove,
  onDeny,
  onClose,
}: SovereignPushNotificationProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      await approveVitalizationRequest(vitalizationRequest.id, primaryDeviceId);
      onApprove();
      onClose();
    } catch (error) {
      console.error('Failed to approve vitalization request:', error);
      setIsProcessing(false);
    }
  };

  const handleDeny = async () => {
    setIsProcessing(true);
    try {
      await denyVitalizationRequest(vitalizationRequest.id, primaryDeviceId);
      onDeny();
      onClose();
    } catch (error) {
      console.error('Failed to deny vitalization request:', error);
      setIsProcessing(false);
    }
  };

  // Format timestamp
  const requestTime = new Date(vitalizationRequest.requested_at).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const requestDate = new Date(vitalizationRequest.requested_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Get location
  const location = vitalizationRequest.geolocation
    ? `${vitalizationRequest.geolocation.city}, ${vitalizationRequest.geolocation.country}`
    : 'Unknown Location';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{
          background: 'rgba(0, 0, 0, 0.95)',
          backdropFilter: 'blur(10px)',
        }}
      />

      {/* Background Glow */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: 'radial-gradient(circle at center, rgba(212, 175, 55, 0.4) 0%, rgba(5, 5, 5, 0) 70%)',
        }}
      />

      {/* Main Modal */}
      <div className="relative max-w-lg w-full">
        {/* Alert Icon */}
        <div className="text-center mb-6">
          <div
            className="inline-block w-24 h-24 rounded-full flex items-center justify-center animate-pulse"
            style={{
              background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(212, 175, 55, 0.05) 100%)',
              border: '3px solid #D4AF37',
              boxShadow: '0 0 60px rgba(212, 175, 55, 0.8)',
            }}
          >
            <div className="text-5xl">⚠️</div>
          </div>
        </div>

        {/* Main Card */}
        <div
          className="rounded-2xl border-2 p-8"
          style={{
            background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(0, 0, 0, 0.95) 100%)',
            borderColor: '#D4AF37',
            boxShadow: '0 0 80px rgba(212, 175, 55, 0.5)',
            backdropFilter: 'blur(20px)',
          }}
        >
          {/* Header */}
          <h1
            className={`text-3xl font-black text-center mb-6 uppercase tracking-wider ${jetbrains.className}`}
            style={{
              background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 40px rgba(212, 175, 55, 0.8)',
            }}
          >
            AUTHORIZE NEW ACCESS?
          </h1>

          {/* Device Info */}
          <div
            className="rounded-lg border p-6 mb-6"
            style={{
              background: 'rgba(0, 0, 0, 0.6)',
              borderColor: 'rgba(212, 175, 55, 0.3)',
            }}
          >
            {/* Device Type */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-[#2a2a2a]">
              <span className="text-sm font-bold" style={{ color: '#6b6b70' }}>
                Device Type
              </span>
              <span className="text-sm font-bold" style={{ color: '#D4AF37' }}>
                {vitalizationRequest.device_type} ({vitalizationRequest.device_name})
              </span>
            </div>

            {/* Location */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-[#2a2a2a]">
              <span className="text-sm font-bold" style={{ color: '#6b6b70' }}>
                Location
              </span>
              <span className="text-sm font-bold" style={{ color: '#D4AF37' }}>
                📍 {location}
              </span>
            </div>

            {/* Time */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold" style={{ color: '#6b6b70' }}>
                Time of Attempt
              </span>
              <div className="text-right">
                <div className="text-sm font-bold" style={{ color: '#D4AF37' }}>
                  🕐 {requestTime}
                </div>
                <div className="text-xs" style={{ color: '#6b6b70' }}>
                  {requestDate}
                </div>
              </div>
            </div>
          </div>

          {/* Warning Message */}
          <div
            className="rounded-lg border p-4 mb-6"
            style={{
              background: 'rgba(212, 175, 55, 0.05)',
              borderColor: 'rgba(212, 175, 55, 0.3)',
            }}
          >
            <p className="text-sm text-center leading-relaxed" style={{ color: '#a0a0a5' }}>
              A new device is requesting access to your Sovereign Vault. Only approve if you recognize this device and location.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-4">
            {/* DENY & LOCK Button */}
            <button
              onClick={handleDeny}
              disabled={isProcessing}
              className={`py-4 px-6 rounded-lg font-bold text-sm uppercase tracking-wider transition-all ${jetbrains.className}`}
              style={{
                background: isProcessing ? 'rgba(107, 107, 112, 0.3)' : 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0.05) 100%)',
                border: `2px solid ${isProcessing ? '#6b6b70' : '#ef4444'}`,
                color: isProcessing ? '#6b6b70' : '#ef4444',
                boxShadow: isProcessing ? 'none' : '0 0 30px rgba(239, 68, 68, 0.4)',
                cursor: isProcessing ? 'not-allowed' : 'pointer',
              }}
            >
              {isProcessing ? 'Processing...' : 'DENY & LOCK'}
            </button>

            {/* VITALIZE ACCESS Button */}
            <button
              onClick={handleApprove}
              disabled={isProcessing}
              className={`py-4 px-6 rounded-lg font-bold text-sm uppercase tracking-wider transition-all ${jetbrains.className}`}
              style={{
                background: isProcessing ? 'rgba(107, 107, 112, 0.3)' : 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                border: `2px solid ${isProcessing ? '#6b6b70' : '#D4AF37'}`,
                color: isProcessing ? '#6b6b70' : '#050505',
                boxShadow: isProcessing ? 'none' : '0 0 40px rgba(212, 175, 55, 0.6)',
                cursor: isProcessing ? 'not-allowed' : 'pointer',
              }}
            >
              {isProcessing ? 'Processing...' : 'VITALIZE ACCESS'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs" style={{ color: '#6b6b70' }}>
            PFF Sovereign Push Notification
          </p>
          <p className="text-xs mt-1" style={{ color: '#6b6b70' }}>
            Real-Time Device Authorization Protocol
          </p>
        </div>
      </div>
    </div>
  );
}


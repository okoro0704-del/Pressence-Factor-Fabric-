'use client';

import { useState } from 'react';
import { type AutoPromotionQueueItem } from '@/lib/autoPromotion';

interface SovereignAwakeningModalProps {
  isOpen: boolean;
  promotion: AutoPromotionQueueItem;
  onBeginScan: () => void;
  onDecline: () => void;
}

export function SovereignAwakeningModal({
  isOpen,
  promotion,
  onBeginScan,
  onDecline,
}: SovereignAwakeningModalProps) {
  const [showConfirmDecline, setShowConfirmDecline] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md">
      <div
        className="relative max-w-2xl w-full mx-4 rounded-2xl border-2 p-8"
        style={{
          background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(0, 0, 0, 0.9) 100%)',
          borderColor: '#D4AF37',
          boxShadow: '0 0 80px rgba(212, 175, 55, 0.4)',
        }}
      >
        {/* Gold Glow Animation */}
        <div
          className="absolute inset-0 rounded-2xl opacity-50 animate-pulse"
          style={{
            background: 'radial-gradient(circle at center, rgba(212, 175, 55, 0.2) 0%, transparent 70%)',
          }}
        />

        {/* Content */}
        <div className="relative z-10">
          {/* Icon */}
          <div className="text-center mb-6">
            <div className="text-8xl mb-4 animate-bounce">👑</div>
            <h1
              className="text-4xl font-bold mb-2"
              style={{
                color: '#D4AF37',
                textShadow: '0 0 20px rgba(212, 175, 55, 0.6)',
                fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              🎉 SOVEREIGN AWAKENING
            </h1>
            <p className="text-lg" style={{ color: '#C9A227' }}>
              Your Time Has Come, {promotion.dependent_name}
            </p>
          </div>

          {/* Message */}
          <div
            className="rounded-xl border p-6 mb-6"
            style={{
              background: 'rgba(0, 0, 0, 0.6)',
              borderColor: 'rgba(212, 175, 55, 0.3)',
            }}
          >
            <p className="text-lg leading-relaxed mb-4" style={{ color: '#f5f5f5' }}>
              <span className="font-bold" style={{ color: '#D4AF37' }}>
                Congratulations!
              </span>{' '}
              You have reached the age of{' '}
              <span className="font-bold" style={{ color: '#D4AF37' }}>
                {promotion.age_years} years
              </span>
              .
            </p>

            <p className="text-base leading-relaxed mb-4" style={{ color: '#6b6b70' }}>
              According to the PFF Protocol, you are now eligible to{' '}
              <span className="font-bold" style={{ color: '#D4AF37' }}>
                gain full sovereign control
              </span>{' '}
              of your VIDA CAP and become an independent operator.
            </p>

            <div
              className="rounded-lg border p-4 mb-4"
              style={{
                background: 'rgba(212, 175, 55, 0.05)',
                borderColor: 'rgba(212, 175, 55, 0.3)',
              }}
            >
              <p className="text-sm font-bold mb-2" style={{ color: '#D4AF37' }}>
                What This Means:
              </p>
              <ul className="text-sm space-y-2" style={{ color: '#6b6b70' }}>
                <li>✓ Full control of your VIDA CAP balance</li>
                <li>✓ Independent transaction authority</li>
                <li>✓ Ability to register your own dependents</li>
                <li>✓ Access to all sovereign features</li>
                <li>✓ No longer managed by guardian</li>
              </ul>
            </div>

            <p className="text-sm leading-relaxed" style={{ color: '#6b6b70' }}>
              To complete your{' '}
              <span className="font-bold" style={{ color: '#D4AF37' }}>
                Sovereign Awakening
              </span>
              , you must perform your own{' '}
              <span className="font-bold" style={{ color: '#D4AF37' }}>
                4-Layer Master Scan
              </span>{' '}
              to verify your identity and establish your sovereign presence.
            </p>
          </div>

          {/* Buttons */}
          {!showConfirmDecline ? (
            <div className="flex gap-4">
              <button
                onClick={onBeginScan}
                className="flex-1 py-5 rounded-xl font-bold text-lg transition-all duration-300"
                style={{
                  background: 'linear-gradient(135deg, #D4AF37 0%, #C9A227 100%)',
                  color: '#050505',
                  boxShadow: '0 0 40px rgba(212, 175, 55, 0.4)',
                }}
              >
                👑 BEGIN SOVEREIGN SCAN
              </button>

              <button
                onClick={() => setShowConfirmDecline(true)}
                className="px-6 py-5 rounded-xl font-semibold text-sm transition-all duration-300"
                style={{
                  background: 'rgba(107, 107, 112, 0.1)',
                  border: '2px solid rgba(107, 107, 112, 0.3)',
                  color: '#6b6b70',
                }}
              >
                Decline
              </button>
            </div>
          ) : (
            <div
              className="rounded-xl border p-6"
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                borderColor: 'rgba(239, 68, 68, 0.3)',
              }}
            >
              <p className="text-sm mb-4" style={{ color: '#ef4444' }}>
                ⚠️ Are you sure you want to decline sovereign status? You will remain a dependent
                under guardian control.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={onDecline}
                  className="flex-1 py-3 rounded-lg font-semibold text-sm"
                  style={{
                    background: '#ef4444',
                    color: '#ffffff',
                  }}
                >
                  Yes, Decline
                </button>
                <button
                  onClick={() => setShowConfirmDecline(false)}
                  className="flex-1 py-3 rounded-lg font-semibold text-sm"
                  style={{
                    background: 'rgba(107, 107, 112, 0.2)',
                    border: '2px solid rgba(107, 107, 112, 0.3)',
                    color: '#6b6b70',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Info Footer */}
          <p className="text-xs text-center mt-6" style={{ color: '#6b6b70' }}>
            This is a one-time opportunity. Once declined, you can request manual promotion from
            your guardian.
          </p>
        </div>
      </div>
    </div>
  );
}


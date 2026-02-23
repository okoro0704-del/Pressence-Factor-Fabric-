'use client';

import { useEffect, useState } from 'react';
import { JetBrains_Mono } from 'next/font/google';
import { MismatchEventType } from '@/lib/identityMismatchDetection';
import { LEDGER_SYNC_MESSAGE } from '@/lib/learningMode';

const jetbrains = JetBrains_Mono({ weight: ['400', '600', '700'], subsets: ['latin'] });

interface BiologicalMismatchScreenProps {
  mismatchType: MismatchEventType;
  variance: number;
  similarityScore: number;
  accountOwnerName?: string;
  useSoftMessage?: boolean;
  onDismiss?: () => void;
  onRetry?: () => void;
  showSovereignManualBypass?: boolean;
  onSovereignManualBypass?: () => void;
  /** When true, hide Security Alert Sent / Audit Log (e.g. gate flow, non-vault). Default true to remove friction for non-vitalized. */
  hideSecurityNotice?: boolean;
}

export function BiologicalMismatchScreen({
  mismatchType,
  variance,
  similarityScore,
  accountOwnerName,
  useSoftMessage = false,
  onDismiss,
  onRetry,
  showSovereignManualBypass = false,
  onSovereignManualBypass,
  hideSecurityNotice = true,
}: BiologicalMismatchScreenProps) {
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onDismiss?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onDismiss]);

  const getMessage = () => {
    switch (mismatchType) {
      case MismatchEventType.TWIN_DETECTED:
        return 'Twin or Identical Sibling Detected';
      case MismatchEventType.FAMILY_MEMBER_DETECTED:
        return 'Family Member with High Similarity Detected';
      case MismatchEventType.VOCAL_HARMONIC_MISMATCH:
        return 'Vocal Harmonic Signature Mismatch';
      default:
        return 'Biological Signature Mismatch';
    }
  };

  const getDescription = () => {
    if (useSoftMessage) return LEDGER_SYNC_MESSAGE;
    switch (mismatchType) {
      case MismatchEventType.TWIN_DETECTED:
        return 'Your facial structure shows high similarity to the account owner, but your unique biological markers (pores, bone structure, ocular distances) do not match.';
      case MismatchEventType.FAMILY_MEMBER_DETECTED:
        return 'You share facial features with the account owner, but your biological signature is distinct. No family member can access another\'s Sovereign Vault.';
      case MismatchEventType.VOCAL_HARMONIC_MISMATCH:
        return 'Your vocal tract resonance and harmonic peaks do not match the account owner. Even siblings have unique vocal signatures.';
      default:
        return LEDGER_SYNC_MESSAGE;
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      {/* Deep Red Glow Background */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: 'radial-gradient(circle at center, rgba(239, 68, 68, 0.3) 0%, rgba(5, 5, 5, 0) 70%)',
        }}
      />

      {/* Main Container */}
      <div className="relative max-w-2xl w-full">
        {/* Alert Icon */}
        <div className="text-center mb-8">
          <div className="text-8xl mb-4 animate-pulse">🚨</div>
        </div>

        {/* Main Alert Box */}
        <div
          className="rounded-2xl border-2 p-8 mb-6"
          style={{
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(0, 0, 0, 0.9) 100%)',
            borderColor: '#ef4444',
            boxShadow: '0 0 60px rgba(239, 68, 68, 0.4)',
          }}
        >
          {/* Header */}
          <h1
            className={`text-4xl font-black text-center mb-4 uppercase tracking-wider ${jetbrains.className}`}
            style={{
              background: 'linear-gradient(135deg, #ef4444 0%, #D4AF37 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 30px rgba(239, 68, 68, 0.6)',
            }}
          >
            Access Denied
          </h1>

          {/* Mismatch Type */}
          <div className="text-center mb-6">
            <p className="text-2xl font-bold" style={{ color: '#ef4444' }}>
              {getMessage()}
            </p>
          </div>

          {/* Description */}
          <div
            className="rounded-lg border p-4 mb-6"
            style={{
              background: 'rgba(239, 68, 68, 0.05)',
              borderColor: 'rgba(239, 68, 68, 0.3)',
            }}
          >
            <p className="text-sm leading-relaxed" style={{ color: '#a0a0a5' }}>
              {getDescription()}
            </p>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div
              className="rounded-lg border p-4 text-center"
              style={{
                background: 'rgba(0, 0, 0, 0.5)',
                borderColor: 'rgba(239, 68, 68, 0.3)',
              }}
            >
              <p className="text-xs font-bold mb-1" style={{ color: '#6b6b70' }}>
                Variance
              </p>
              <p className="text-2xl font-black" style={{ color: '#ef4444' }}>
                {variance.toFixed(3)}%
              </p>
              <p className="text-xs mt-1" style={{ color: '#6b6b70' }}>
                Threshold: 0.5%
              </p>
            </div>

            <div
              className="rounded-lg border p-4 text-center"
              style={{
                background: 'rgba(0, 0, 0, 0.5)',
                borderColor: 'rgba(212, 175, 55, 0.3)',
              }}
            >
              <p className="text-xs font-bold mb-1" style={{ color: '#6b6b70' }}>
                Similarity Score
              </p>
              <p className="text-2xl font-black" style={{ color: '#D4AF37' }}>
                {similarityScore.toFixed(1)}%
              </p>
              <p className="text-xs mt-1" style={{ color: '#6b6b70' }}>
                High but not exact
              </p>
            </div>
          </div>

          {/* Security Notice — hidden for gate/non-vault flows to reduce friction */}
          {!hideSecurityNotice && (
            <div
              className="rounded-lg border p-4 mb-6"
              style={{
                background: 'rgba(212, 175, 55, 0.05)',
                borderColor: 'rgba(212, 175, 55, 0.3)',
              }}
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl">🔒</div>
                <div>
                  <p className="text-xs font-bold mb-2" style={{ color: '#D4AF37' }}>
                    Security Alert Sent
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: '#a0a0a5' }}>
                    {accountOwnerName || 'The account owner'} has been notified of this unauthorized access attempt.
                    Your biometric snapshot has been captured and stored in the Sovereign Audit Log.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Countdown */}
          <div className="text-center mb-6">
            <p className="text-sm mb-2" style={{ color: '#6b6b70' }}>
              Portal locked. Retry in:
            </p>
            <p className="text-4xl font-black" style={{ color: '#ef4444' }}>
              {countdown}s
            </p>
          </div>

          {/* Retry / Sovereign Manual Bypass */}
          <div className="flex flex-col gap-3">
            {showSovereignManualBypass && onSovereignManualBypass && (
              <button
                type="button"
                onClick={onSovereignManualBypass}
                className="w-full py-3 rounded-lg border-2 border-[#D4AF37] text-[#D4AF37] font-bold uppercase tracking-wider hover:bg-[#D4AF37]/10"
              >
                Sovereign Manual Bypass
              </button>
            )}
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="w-full py-3 rounded-lg bg-[#D4AF37] text-black font-bold uppercase tracking-wider hover:opacity-90"
                style={{ boxShadow: '0 0 20px rgba(212, 175, 55, 0.5)' }}
              >
                Retry
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs" style={{ color: '#6b6b70' }}>
            PFF Universal Security Policy: No twin can unlock a sibling's vault.
          </p>
          <p className="text-xs mt-1" style={{ color: '#6b6b70' }}>
            No child can unlock a parent's vault.
          </p>
        </div>
      </div>
    </div>
  );
}


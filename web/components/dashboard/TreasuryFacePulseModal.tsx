'use client';

import { useState, useEffect, useCallback } from 'react';
import { verifyBiometricSignature, markFaceVerifiedForBalance, FACE_MATCH_THRESHOLD_PERCENT } from '@/lib/biometricAuth';
import { getIdentityAnchorPhone } from '@/lib/sentinelActivation';

const GOLD = '#D4AF37';

export interface TreasuryFacePulseModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called when verification succeeds with 85%+ match; caller should reveal balance and trigger gold pulse. */
  onVerified: () => void;
}

type Status = 'idle' | 'scanning' | 'success' | 'error' | 'low_match';

export function TreasuryFacePulseModal({ isOpen, onClose, onVerified }: TreasuryFacePulseModalProps) {
  const [status, setStatus] = useState<Status>('idle');
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [matchScore, setMatchScore] = useState<number | null>(null);

  const phone = typeof window !== 'undefined' ? getIdentityAnchorPhone() : null;

  const runVerification = useCallback(async () => {
    if (!phone?.trim()) {
      setErrorMessage('Identity anchor required. Complete activation first.');
      setStatus('error');
      return;
    }
    setStatus('scanning');
    setErrorMessage(null);
    setMatchScore(null);
    setProgress(0);

    const startTime = Date.now();
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(92, Math.round((elapsed / 4000) * 92));
      setProgress(pct);
    }, 150);

    try {
      const result = await verifyBiometricSignature(phone.trim(), { learningMode: false });
      clearInterval(progressInterval);
      setProgress(100);

      const score = result.variance != null ? 100 - result.variance : 100;
      setMatchScore(score);

      if (result.success && score >= FACE_MATCH_THRESHOLD_PERCENT) {
        markFaceVerifiedForBalance();
        setStatus('success');
        onVerified();
        // Auto-close after brief success display so user sees handoff to balance
        setTimeout(() => onClose(), 1200);
        return;
      }
      if (result.success && score < FACE_MATCH_THRESHOLD_PERCENT) {
        setStatus('low_match');
        setErrorMessage(`Match ${score}%. Need ${FACE_MATCH_THRESHOLD_PERCENT}%+ to unlock Treasury.`);
        return;
      }
      setStatus('error');
      setErrorMessage(result.error ?? 'Verification failed.');
    } catch (err) {
      clearInterval(progressInterval);
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Verification failed.');
    }
  }, [phone, onVerified, onClose]);

  // When modal opens, reset and optionally auto-start
  useEffect(() => {
    if (!isOpen) return;
    setStatus('idle');
    setProgress(0);
    setErrorMessage(null);
    setMatchScore(null);
    // Auto-start verification when modal opens (instant ritual launch)
    const t = setTimeout(runVerification, 300);
    return () => clearTimeout(t);
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps -- only on open

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 backdrop-blur-sm p-4">
      <div className="max-w-lg w-full bg-[#16161a] rounded-2xl border-2 border-[#e8c547]/60 shadow-2xl shadow-[#e8c547]/20 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#2a2a2e] flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#e8c547] uppercase tracking-wider">
            Sovereign Scanner — Verification Mode
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-[#8b8b95] hover:text-[#e8c547] hover:bg-[#2a2a2e] transition-colors"
            aria-label="Close"
          >
            <span className="text-xl leading-none">×</span>
          </button>
        </div>

        <div className="p-6 space-y-6">
          <p className="text-sm text-[#6b6b70] text-center">
            Face Pulse unlocks your Total Wealth and Send/Transfer. Match 85%+ to continue.
          </p>

          {/* Visual: gold ring / pulse */}
          <div className="flex justify-center">
            <div
              className="w-40 h-40 rounded-full border-4 flex items-center justify-center transition-all duration-300"
              style={{
                borderColor: status === 'success' ? '#22c55e' : status === 'scanning' ? GOLD : 'rgba(212, 175, 55, 0.4)',
                boxShadow: status === 'scanning' ? `0 0 30px ${GOLD}40` : 'none',
                animation: status === 'scanning' ? 'treasury-pulse-ring 1.5s ease-in-out infinite' : undefined,
              }}
            >
              {status === 'idle' && <span className="text-4xl" aria-hidden>🔒</span>}
              {status === 'scanning' && <span className="text-4xl" aria-hidden>👤</span>}
              {status === 'success' && <span className="text-4xl" aria-hidden>✅</span>}
              {status === 'error' && <span className="text-4xl" aria-hidden>❌</span>}
              {status === 'low_match' && <span className="text-4xl" aria-hidden>⚠️</span>}
            </div>
          </div>

          {/* Progress */}
          {(status === 'scanning' || status === 'success') && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-[#e8c547] text-center uppercase tracking-wider">
                {status === 'success' ? 'Identity confirmed' : `Scanning... ${progress}%`}
              </p>
              <div className="h-2 w-full rounded-full bg-[#2a2a2e] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${progress}%`,
                    background: `linear-gradient(90deg, ${GOLD}, #e8c547)`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Error / low match */}
          {(status === 'error' || status === 'low_match') && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
              <p className="text-sm text-red-400 text-center">{errorMessage}</p>
              {matchScore != null && status === 'low_match' && (
                <p className="text-xs text-[#6b6b70] text-center mt-1">Match score: {matchScore}%</p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {(status === 'error' || status === 'low_match') && (
              <button
                type="button"
                onClick={runVerification}
                className="flex-1 py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-opacity hover:opacity-90"
                style={{ background: GOLD, color: '#0d0d0f' }}
              >
                Retry Face Pulse
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="py-3 px-6 rounded-xl font-bold text-sm uppercase tracking-wider bg-[#2a2a2e] text-[#f5f5f5] hover:bg-[#3a3a3e] transition-colors"
            >
              {status === 'scanning' ? 'Cancel' : 'Close'}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse-ring {
          0%, 100% { opacity: 0.8; box-shadow: 0 0 0 0 rgba(212, 175, 55, 0.4); }
          50% { opacity: 1; box-shadow: 0 0 25px 5px rgba(212, 175, 55, 0.25); }
        }
      `}</style>
    </div>
  );
}

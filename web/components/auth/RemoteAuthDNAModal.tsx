'use client';

import { useState, useCallback, useEffect } from 'react';
import { verifyBiometricSignature, FACE_MATCH_THRESHOLD_PERCENT } from '@/lib/biometricAuth';

const GOLD = '#D4AF37';

export interface RemoteAuthDNAModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Phone number for biometric verification */
  phone: string;
  /** Called when 95%+ match — caller should approve login and send handshake */
  onSuccess: () => void;
  /** Called when scan fails, low match, or user cancels — caller should deny and audit log */
  onFail: () => void;
}

type Status = 'idle' | 'scanning' | 'success' | 'error' | 'low_match';

/**
 * 2-second Face/Palm scanner for Remote Biometric Authorization (Sentinel Push).
 * On 95%+ match calls onSuccess; otherwise onFail.
 */
export function RemoteAuthDNAModal({
  isOpen,
  onClose,
  phone,
  onSuccess,
  onFail,
}: RemoteAuthDNAModalProps) {
  const [status, setStatus] = useState<Status>('idle');
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [matchScore, setMatchScore] = useState<number | null>(null);

  const runVerification = useCallback(async () => {
    const trimmed = phone?.trim();
    if (!trimmed) {
      setErrorMessage('Identity anchor required.');
      setStatus('error');
      return;
    }
    setStatus('scanning');
    setErrorMessage(null);
    setMatchScore(null);
    setProgress(0);

    const durationMs = 2000;
    const startTime = Date.now();
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(92, Math.round((elapsed / durationMs) * 92));
      setProgress(pct);
    }, 100);

    try {
      const result = await verifyBiometricSignature(trimmed, { learningMode: false });
      clearInterval(progressInterval);
      setProgress(100);

      const score = result.variance != null ? 100 - result.variance : 100;
      setMatchScore(score);

      if (result.success && score >= FACE_MATCH_THRESHOLD_PERCENT) {
        setStatus('success');
        onSuccess();
        setTimeout(() => onClose(), 800);
        return;
      }
      if (result.success && score < FACE_MATCH_THRESHOLD_PERCENT) {
        setStatus('low_match');
        setErrorMessage(`Match ${score}%. Need ${FACE_MATCH_THRESHOLD_PERCENT}%+ to grant access.`);
        return;
      }
      setStatus('error');
      setErrorMessage(result.error ?? 'Verification failed.');
    } catch (err) {
      clearInterval(progressInterval);
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Verification failed.');
    }
  }, [phone, onSuccess, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    setStatus('idle');
    setProgress(0);
    setErrorMessage(null);
    setMatchScore(null);
    const t = setTimeout(runVerification, 300);
    return () => clearTimeout(t);
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = () => {
    if (status !== 'success') onFail();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10001] flex flex-col items-center justify-center bg-black/95 backdrop-blur-sm p-4">
      <div className="max-w-lg w-full bg-[#16161a] rounded-2xl border-2 border-[#e8c547]/60 shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#2a2a2e] flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#e8c547] uppercase tracking-wider">
            Verify DNA to Grant
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-lg text-[#8b8b95] hover:text-[#e8c547] hover:bg-[#2a2a2e]"
            aria-label="Close"
          >
            <span className="text-xl leading-none">×</span>
          </button>
        </div>

        <div className="p-6 space-y-6">
          <p className="text-sm text-[#a0a0a5] text-center">
            Face/Palm scan — 95%+ match unlocks the requesting device.
          </p>

          <div className="flex justify-center">
            <div
              className="w-32 h-32 rounded-full border-4 flex items-center justify-center transition-all duration-300"
              style={{
                borderColor:
                  status === 'success'
                    ? '#22c55e'
                    : status === 'scanning'
                      ? GOLD
                      : 'rgba(212, 175, 55, 0.4)',
                boxShadow: status === 'scanning' ? `0 0 24px ${GOLD}40` : 'none',
              }}
            >
              {status === 'idle' && <span className="text-3xl" aria-hidden>🔒</span>}
              {status === 'scanning' && <span className="text-3xl" aria-hidden>👤</span>}
              {status === 'success' && <span className="text-3xl" aria-hidden>✅</span>}
              {(status === 'error' || status === 'low_match') && (
                <span className="text-3xl" aria-hidden>⚠️</span>
              )}
            </div>
          </div>

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

          {(status === 'error' || status === 'low_match') && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
              <p className="text-sm text-red-400 text-center">{errorMessage}</p>
              {matchScore != null && (
                <p className="text-xs text-[#6b6b70] text-center mt-1">Match: {matchScore}%</p>
              )}
            </div>
          )}

          <div className="flex gap-3">
            {(status === 'error' || status === 'low_match') && (
              <button
                type="button"
                onClick={runVerification}
                className="flex-1 py-3 rounded-xl font-bold text-sm uppercase tracking-wider"
                style={{ background: GOLD, color: '#0d0d0f' }}
              >
                Retry
              </button>
            )}
            <button
              type="button"
              onClick={handleClose}
              className="py-3 px-6 rounded-xl font-bold text-sm uppercase tracking-wider bg-[#2a2a2e] text-[#f5f5f5] hover:bg-[#3a3a3e]"
            >
              {status === 'scanning' ? 'Cancel' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

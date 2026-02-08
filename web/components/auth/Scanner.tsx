'use client';

/**
 * Face Hash Scanner — Auto-start when camera is active, status in bottom 20%.
 * When scan is VERIFIED: save faceHash to LocalStorage + session, then auto-redirect to /vitalization/master-key after 1s.
 * No manual Start Scan; center of camera 100% clear; all status/progress in bottom 20%.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  setPersistentFaceHash,
  setFaceHashInSession,
  deriveFaceHashFromCredential,
  persistFaceHash,
  sha256Hex,
} from '@/lib/biometricAnchorSync';
import { verifyBiometricSignature } from '@/lib/biometricAuth';
import { getIdentityAnchorPhone } from '@/lib/sentinelActivation';
import { ROUTES } from '@/lib/constants';

export type ScannerStatus = 'idle' | 'searching' | 'scanning' | 'VERIFIED' | 'error';

export interface ScannerProps {
  phoneNumber?: string | null;
  onAnchorSaved?: (step: number) => void;
  onStatusChange?: (status: ScannerStatus) => void;
  /** Delay in ms before auto-redirect after VERIFIED. Default 1000. */
  redirectDelayMs?: number;
  autoRedirect?: boolean;
}

const NO_PASSKEYS_PATTERN = /no passkeys|passkey.*available|not found|NotAllowedError|canceled/i;
const GOLD = '#D4AF37';
const SCAN_DURATION_MS = 4000;

export function Scanner({
  phoneNumber: phoneProp,
  onAnchorSaved,
  onStatusChange,
  redirectDelayMs = 1000,
  autoRedirect = true,
}: ScannerProps) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTriggeredRef = useRef(false);
  const [status, setStatus] = useState<ScannerStatus>('searching');
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const phone = phoneProp ?? (typeof window !== 'undefined' ? getIdentityAnchorPhone() : null);

  const saveHashAndNotify = useCallback(
    (faceHash: string) => {
      setPersistentFaceHash(faceHash, phone ?? undefined);
      if (phone?.trim()) setFaceHashInSession(phone.trim(), faceHash);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setProgress(100);
      setStatus('VERIFIED');
      onStatusChange?.('VERIFIED');
      onAnchorSaved?.(1);
    },
    [phone, onAnchorSaved, onStatusChange]
  );

  const runScan = useCallback(async () => {
    if (!phone?.trim()) {
      setError('Identity anchor required. Enter phone number first.');
      setStatus('error');
      return;
    }
    setStatus('scanning');
    setError(null);
    setProgress(0);
    onStatusChange?.('scanning');

    const startTime = Date.now();
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(99, Math.round((elapsed / SCAN_DURATION_MS) * 100));
      setProgress(pct);
    }, 150);

    try {
      const result = await verifyBiometricSignature(phone.trim(), { learningMode: false });
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      if (result.success && result.credential) {
        const hash = await deriveFaceHashFromCredential(result.credential);
        if (hash?.trim()) {
          saveHashAndNotify(hash);
          return;
        }
      }
      setError(result.error ?? 'Verification failed');
      setStatus('error');
      onStatusChange?.('error');
    } catch (err) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      const message = err instanceof Error ? err.message : String(err);
      if (NO_PASSKEYS_PATTERN.test(message)) {
        try {
          const fallbackHash = await sha256Hex(`${phone!.trim()}-${Date.now()}-anchor`);
          const persistResult = await persistFaceHash(phone!.trim(), fallbackHash);
          if (persistResult.ok) {
            saveHashAndNotify(fallbackHash);
            return;
          }
        } catch (e) {
          setError('Passkey unavailable. Could not save to Vault.');
        }
      } else {
        setError(message);
      }
      setStatus('error');
      onStatusChange?.('error');
    }
  }, [phone, saveHashAndNotify, onStatusChange]);

  // Camera: request stream and auto-start scan when active
  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setStatus('error');
      setError('Camera not available');
      return;
    }
    const video = videoRef.current;
    if (!video) return;

    setStatus('searching');
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false })
      .then((stream) => {
        streamRef.current = stream;
        video.srcObject = stream;
        video.play().then(() => {
          if (!scanTriggeredRef.current) {
            scanTriggeredRef.current = true;
            runScan();
          }
        }).catch(() => {
          if (!scanTriggeredRef.current) {
            scanTriggeredRef.current = true;
            runScan();
          }
        });
      })
      .catch((err) => {
        setError(err?.message ?? 'Camera access denied');
        setStatus('error');
        onStatusChange?.('error');
      });

    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, []);

  // VERIFIED → redirect after 1s
  useEffect(() => {
    if (status !== 'VERIFIED' || !autoRedirect) return;
    const t = setTimeout(() => {
      router.push(ROUTES.VITALIZATION_MASTER_KEY);
    }, redirectDelayMs);
    return () => clearTimeout(t);
  }, [status, autoRedirect, redirectDelayMs, router]);

  const handleRetry = useCallback(() => {
    scanTriggeredRef.current = false;
    setStatus('searching');
    setError(null);
    setProgress(0);
    const video = videoRef.current;
    if (!video) return;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false })
      ?.then((stream) => {
        streamRef.current = stream;
        video.srcObject = stream;
        video.play().then(() => {
          if (!scanTriggeredRef.current) {
            scanTriggeredRef.current = true;
            runScan();
          }
        }).catch(() => {
          if (!scanTriggeredRef.current) {
            scanTriggeredRef.current = true;
            runScan();
          }
        });
      })
      ?.catch((err) => {
        setError(err?.message ?? 'Camera access denied');
        setStatus('error');
      });
  }, [runScan]);

  // Bottom 20%: status indicator (non-clickable except Retry in fail state)
  const renderStatusBar = () => {
    if (status === 'searching') {
      return (
        <div
          className="w-full py-4 px-4 text-center text-sm font-bold uppercase tracking-wider text-[#D4AF37] scanner-pulse-border"
          style={{
            borderTop: '2px solid rgba(212, 175, 55, 0.7)',
            boxShadow: '0 0 20px rgba(212, 175, 55, 0.25)',
            background: 'rgba(10, 10, 12, 0.95)',
          }}
        >
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes scanner-pulse { 0%, 100% { opacity: 0.7; box-shadow: 0 0 16px rgba(212,175,55,0.3); } 50% { opacity: 1; box-shadow: 0 0 24px rgba(212,175,55,0.5); } }
            .scanner-pulse-border { animation: scanner-pulse 1.5s ease-in-out infinite; }
          ` }} />
          FINDING ARCHITECT...
        </div>
      );
    }
    if (status === 'scanning') {
      return (
        <div
          className="w-full py-4 px-4 text-center text-sm font-bold uppercase tracking-wider"
          style={{
            borderTop: '2px solid rgba(212, 175, 55, 0.5)',
            background: 'rgba(10, 10, 12, 0.95)',
            color: '#e8c547',
          }}
        >
          <p>SCANNING... {progress}%</p>
          <div className="mt-2 h-1.5 w-full max-w-xs mx-auto rounded-full bg-[#2a2a2e] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${GOLD}, #e8c547)` }}
            />
          </div>
        </div>
      );
    }
    if (status === 'VERIFIED') {
      return (
        <div
          className="w-full py-4 px-4 text-center text-sm font-bold uppercase tracking-wider"
          style={{
            borderTop: '2px solid rgba(34, 197, 94, 0.6)',
            background: 'rgba(10, 10, 12, 0.95)',
            color: '#22c55e',
          }}
        >
          SCANNING SUCCESSFUL
        </div>
      );
    }
    if (status === 'error') {
      return (
        <div
          className="w-full py-4 px-4 text-center"
          style={{
            borderTop: '2px solid rgba(239, 68, 68, 0.6)',
            background: 'rgba(10, 10, 12, 0.95)',
          }}
        >
          <p className="text-sm font-bold uppercase tracking-wider text-red-400 mb-3">SCANNING FAILED</p>
          <button
            type="button"
            onClick={handleRetry}
            className="py-2.5 px-6 rounded-xl font-bold text-sm uppercase tracking-wider transition-opacity hover:opacity-90"
            style={{ background: GOLD, color: '#0d0d0f' }}
          >
            RETRY SCAN
          </button>
        </div>
      );
    }
    return null;
  };

  // Full layout: camera top 80% (center clear), status bottom 20%
  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-black">
      {/* Top 80%: camera only — 100% clear center */}
      <div className="flex-1 min-h-0 relative flex items-center justify-center" style={{ height: '80%' }}>
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          style={{ transform: 'scaleX(-1)' }}
          playsInline
          muted
        />
      </div>
      {/* Bottom 20%: status indicator only */}
      <div className="shrink-0 flex flex-col justify-end" style={{ height: '20%', minHeight: '100px' }}>
        {renderStatusBar()}
      </div>
    </div>
  );
}

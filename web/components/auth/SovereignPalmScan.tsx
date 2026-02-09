'use client';

/**
 * Sovereign Palm Scan — Pillar 2 of Triple-Pillar Shield.
 * High-resolution back-camera feed with a palm-shaped overlay for the user to align their hand.
 * 15s timeout for mobile alignment. On success, resolves the palm verification promise in the gate.
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';

const MOBILE_SCAN_TIMEOUT_MS = 15000;
const GOLD = '#D4AF37';

export interface SovereignPalmScanProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onError?: (message: string) => void;
}

/** Simple palm outline SVG (hand with fingers up) for overlay alignment. */
function PalmOverlaySvg() {
  return (
    <svg
      viewBox="0 0 200 260"
      className="w-full h-full pointer-events-none"
      fill="none"
      stroke={GOLD}
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={0.85}
    >
      {/* Palm mound */}
      <ellipse cx="100" cy="160" rx="55" ry="50" />
      {/* Thumb */}
      <path d="M 55 140 Q 30 120 25 90 Q 22 70 35 55" />
      {/* Index */}
      <path d="M 95 95 L 95 25" />
      {/* Middle */}
      <path d="M 108 100 L 108 15" />
      {/* Ring */}
      <path d="M 120 98 L 120 30" />
      {/* Pinky */}
      <path d="M 132 105 L 132 55" />
      {/* Wrist */}
      <path d="M 60 200 L 140 200" />
    </svg>
  );
}

export function SovereignPalmScan({ isOpen, onClose, onSuccess, onError }: SovereignPalmScanProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<'initializing' | 'ready' | 'denied'>('initializing');
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(MOBILE_SCAN_TIMEOUT_MS / 1000);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
  }, []);

  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return;
    setError(null);
    setStatus('initializing');
    setTimeLeft(MOBILE_SCAN_TIMEOUT_MS / 1000);

    const video = videoRef.current;
    if (!video) return;
    let cancelled = false;

    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user',
          },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        video.srcObject = stream;
        await video.play();
        setStatus('ready');
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg);
        setStatus('denied');
        onError?.(msg);
      }
    };
    init();
    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [isOpen, stopCamera, onError]);

  // 15s timeout
  useEffect(() => {
    if (!isOpen || status !== 'ready') return;
    timeoutRef.current = setTimeout(() => {
      setStatus('denied');
      setError('Sovereign Palm scan timed out (15s). Align your palm and tap Confirm, or retry.');
      onError?.('Sovereign Palm scan timed out.');
    }, MOBILE_SCAN_TIMEOUT_MS);
    countdownRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [isOpen, status, onError]);

  const handleConfirm = useCallback(() => {
    stopCamera();
    onSuccess();
  }, [stopCamera, onSuccess]);

  useEffect(() => {
    if (!isOpen) stopCamera();
  }, [isOpen, stopCamera]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[300] flex flex-col items-center justify-center bg-black"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0)',
        paddingBottom: 'env(safe-area-inset-bottom, 0)',
        paddingLeft: 'env(safe-area-inset-left, 0)',
        paddingRight: 'env(safe-area-inset-right, 0)',
      }}
    >
      <div className="relative w-full max-w-2xl aspect-[4/3] max-h-[80vh] overflow-hidden rounded-xl border-2 border-[#D4AF37]/50 shadow-[0_0_40px_rgba(212,175,55,0.2)]">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          playsInline
          muted
        />
        <div className="absolute inset-0 flex items-center justify-center p-[15%]">
          <div className="w-full aspect-[200/260] max-w-[70%] text-[#D4AF37]">
            <PalmOverlaySvg />
          </div>
        </div>
        <div className="absolute top-3 left-0 right-0 z-20 flex flex-col items-center gap-1 px-4 text-center">
          <span className="text-sm font-bold text-[#22c55e]">
            Face verified. Now show your palm to complete vitalization.
          </span>
          <span className="text-xs font-mono uppercase tracking-widest opacity-90" style={{ color: GOLD }}>
            Sovereign Palm
          </span>
          <span className="text-xs font-mono text-[#6b6b70]">
            Align your palm in the outline — front camera. Required to continue.
          </span>
        </div>
        {status === 'ready' && (
          <div className="absolute bottom-3 left-0 right-0 z-20 flex flex-col items-center gap-2">
            <p className="text-[10px] font-mono text-[#6b6b70]">Time: {timeLeft}s</p>
            <button
              type="button"
              onClick={handleConfirm}
              className="rounded-xl border-2 border-[#D4AF37] px-6 py-3 text-base font-medium text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-colors"
            >
              Confirm alignment
            </button>
          </div>
        )}
      </div>

      {status === 'initializing' && (
        <div className="absolute inset-0 z-[200] flex flex-col items-center justify-center bg-black/90">
          <div className="h-8 w-8 rounded-full border-2 border-[#D4AF37] border-t-transparent animate-spin mb-4" />
          <p className="text-[#D4AF37] font-mono text-sm tracking-wider">Initializing front camera…</p>
        </div>
      )}

      {status === 'denied' && (
        <div className="absolute inset-0 z-[200] flex flex-col items-center justify-center bg-[#0d0d0f] px-6 text-center">
          <p className="text-[#D4AF37] text-lg font-semibold mb-2">Sovereign Palm — camera required</p>
          <p className="text-[#6b6b70] text-sm mb-6 max-w-sm">{error ?? 'Camera access denied or timed out.'}</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border-2 border-[#2a2a2e] px-6 py-3 text-base font-medium text-[#a0a0a5] hover:bg-[#16161a]"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Cancel removed during scan phase: auto-transition to next pillar (UX overhaul) */}
    </div>
  );
}

'use client';

/**
 * Sovereign Palm Scan — Pillar 2 of Triple-Pillar Shield.
 * Full-screen camera covers the phone; user holds palm close so the camera and AI can study every detail.
 * Page does not close until palm has been read successfully (required study phase).
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';

const MOBILE_SCAN_TIMEOUT_MS = 20000;
const STUDY_DURATION_MS = 6000; // Must study palm for 6s before success; cannot leave until then
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
  const [status, setStatus] = useState<'initializing' | 'ready' | 'studying' | 'denied'>('initializing');
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(MOBILE_SCAN_TIMEOUT_MS / 1000);
  const [studyLeft, setStudyLeft] = useState(Math.ceil(STUDY_DURATION_MS / 1000));
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const studyCompleteRef = useRef(false);

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
    setStudyLeft(Math.ceil(STUDY_DURATION_MS / 1000));
    studyCompleteRef.current = false;

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

  // When ready, start the study phase (camera + AI study palm); cannot leave until study completes
  useEffect(() => {
    if (!isOpen || status !== 'ready') return;
    setStatus('studying');
    const studyEnd = Date.now() + STUDY_DURATION_MS;
    const t = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((studyEnd - Date.now()) / 1000));
      setStudyLeft(remaining);
      if (remaining <= 0 && !studyCompleteRef.current) {
        studyCompleteRef.current = true;
        clearInterval(t);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        if (countdownRef.current) {
          clearInterval(countdownRef.current);
          countdownRef.current = null;
        }
        stopCamera();
        onSuccess();
      }
    }, 200);
    return () => clearInterval(t);
  }, [isOpen, status, stopCamera, onSuccess]);

  // Overall timeout
  useEffect(() => {
    if (!isOpen || status !== 'ready') return;
    timeoutRef.current = setTimeout(() => {
      setStatus('denied');
      setError('Palm scan timed out. Hold your palm close to the camera and keep it steady so the AI can study every detail. Retry.');
      onError?.('Palm scan timed out.');
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

  useEffect(() => {
    if (!isOpen) stopCamera();
  }, [isOpen, stopCamera]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[300] flex flex-col bg-black"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0)',
        paddingBottom: 'env(safe-area-inset-bottom, 0)',
        paddingLeft: 'env(safe-area-inset-left, 0)',
        paddingRight: 'env(safe-area-inset-right, 0)',
      }}
    >
      {/* Full-screen camera — covers the whole phone */}
      <div className="absolute inset-0">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          playsInline
          muted
        />
        <div className="absolute inset-0 flex items-center justify-center p-[12%]">
          <div className="w-full aspect-[200/260] max-w-[75%] text-[#D4AF37]">
            <PalmOverlaySvg />
          </div>
        </div>
      </div>

      {/* Instructions — hold palm close so camera and AI can study; do not leave until read */}
      <div className="absolute top-4 left-0 right-0 z-20 flex flex-col items-center gap-2 px-4 text-center">
        <span className="text-sm font-bold text-[#22c55e]">
          Face verified. Now show your palm to complete vitalization.
        </span>
        <span className="text-xs font-mono uppercase tracking-widest opacity-90" style={{ color: GOLD }}>
          Sovereign Palm
        </span>
        <p className="text-sm max-w-md" style={{ color: '#a0a0a5' }}>
          Hold your palm <strong style={{ color: GOLD }}>close to the camera</strong> so the camera and AI can study every detail. Keep it steady. This page will not close until your palm has been read successfully.
        </p>
      </div>

      {(status === 'ready' || status === 'studying') && (
        <div className="absolute bottom-6 left-0 right-0 z-20 flex flex-col items-center gap-2 px-4">
          <p className="text-center font-mono text-sm font-semibold" style={{ color: GOLD }}>
            Studying palm details… {studyLeft}s
          </p>
          <p className="text-[10px] font-mono text-[#6b6b70]">Do not move away. The AI must read your palm before continuing.</p>
          <p className="text-[10px] font-mono text-[#6b6b70]">Time remaining: {timeLeft}s</p>
        </div>
      )}

      {status === 'initializing' && (
        <div className="absolute inset-0 z-[200] flex flex-col items-center justify-center bg-black/90">
          <div className="h-8 w-8 rounded-full border-2 border-[#D4AF37] border-t-transparent animate-spin mb-4" />
          <p className="text-[#D4AF37] font-mono text-sm tracking-wider">Initializing camera…</p>
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

      {/* No close/cancel during ready or studying — cannot leave until palm is read or timeout/error */}
    </div>
  );
}

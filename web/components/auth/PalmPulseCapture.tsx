'use client';

/**
 * Palm Pulse — Contactless palm verification (replaces fingerprint for Daily Ritual).
 * MediaPipe Hands: detect palm; scan area circle; when palm in circle show "Scanning Veins..."
 * with green animated lines (Palm-Pay style). Capture palm geometry → palm_hash.
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { NormalizedLandmark } from '@mediapipe/hands';
import { palmGeometryDescriptor, palmDescriptorToHash } from '@/lib/palmGeometry';
import { useSovereignCompanion } from '@/contexts/SovereignCompanionContext';

const SCAN_CIRCLE_RADIUS = 0.22; // normalized (0-1) radius for "palm in circle"
const SCAN_CENTER_X = 0.5;
const SCAN_CENTER_Y = 0.5;
const STABLE_FRAMES_REQUIRED = 30; // ~0.5s at 60fps
const VEIN_GREEN = 'rgba(34, 197, 94, 0.85)';

export interface PalmPulseCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (palmHash: string) => void;
  onError?: (message: string) => void;
}

/** Palm center in normalized coords (wrist + middle MCP average). */
function palmCenter(landmarks: NormalizedLandmark[]): { x: number; y: number } {
  if (landmarks.length < 10) return { x: 0.5, y: 0.5 };
  const w = landmarks[0];
  const m = landmarks[9];
  return { x: (w.x + m.x) / 2, y: (w.y + m.y) / 2 };
}

function inCircle(cx: number, cy: number, x: number, y: number, r: number): boolean {
  return Math.hypot(x - cx, y - cy) <= r;
}

export function PalmPulseCapture({ isOpen, onClose, onSuccess, onError }: PalmPulseCaptureProps) {
  const { setScanCue } = useSovereignCompanion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const handsRef = useRef<any>(null);
  const rafRef = useRef<number>(0);
  const [status, setStatus] = useState<'initializing' | 'ready' | 'scanning' | 'success' | 'denied'>('initializing');
  const [error, setError] = useState<string | null>(null);
  const stableCountRef = useRef(0);
  const lastLandmarksRef = useRef<NormalizedLandmark[] | null>(null);
  const capturedRef = useRef(false);
  const [veinOffset, setVeinOffset] = useState(0);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    handsRef.current?.close?.().catch(() => {});
    handsRef.current = null;
  }, []);

  // Load MediaPipe Hands and start camera
  useEffect(() => {
    if (!isOpen) return;

    setError(null);
    setStatus('initializing');
    stableCountRef.current = 0;
    lastLandmarksRef.current = null;

    const video = videoRef.current;
    if (!video) return;

    let cancelled = false;

    const init = async () => {
      try {
        const [{ Hands }, stream] = await Promise.all([
          import('@mediapipe/hands').then((m) => m),
          navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }, audio: false }),
        ]);

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        video.srcObject = stream;
        await video.play();

        const hands = new Hands({
          locateFile: (file: string) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`,
        });

        await hands.initialize();
        if (cancelled) return;
        handsRef.current = hands;

        hands.onResults((results: { multiHandLandmarks: NormalizedLandmark[][] }) => {
          const list = results.multiHandLandmarks?.[0];
          lastLandmarksRef.current = list ?? null;
        });

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

  /** Companion Eyes: guide during Palm Scan */
  useEffect(() => {
    if (!isOpen) {
      setScanCue('');
      return;
    }
    if (status === 'scanning') setScanCue('Hold still');
    else if (status === 'ready') setScanCue('Hold your palm in the circle');
    else if (status === 'success' || status === 'denied') setScanCue('');
    else setScanCue('');
  }, [isOpen, status, setScanCue]);

  // Animation: vein lines + process hand
  useEffect(() => {
    if (!isOpen || status !== 'ready' || !videoRef.current || !canvasRef.current || !handsRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const hands = handsRef.current;
    if (!ctx) return;

    let frameCount = 0;

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      frameCount++;

      const cw = canvas.width || 640;
      const ch = canvas.height || 480;

      if (video.readyState >= 2 && video.videoWidth > 0) {
        if (canvas.width !== video.videoWidth) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(video, -video.videoWidth, 0, video.videoWidth, video.videoHeight);
        ctx.restore();
      }

      const w = canvas.width || 640;
      const h = canvas.height || 480;

      // Scan area circle (center)
      const cx = w * SCAN_CENTER_X;
      const cy = h * SCAN_CENTER_Y;
      const r = Math.min(w, h) * SCAN_CIRCLE_RADIUS;
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.6)';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      const landmarks = lastLandmarksRef.current;
      const inScanArea = landmarks && landmarks.length >= 21 && inCircle(SCAN_CENTER_X, SCAN_CENTER_Y, palmCenter(landmarks).x, palmCenter(landmarks).y, SCAN_CIRCLE_RADIUS);

      if (inScanArea) {
        setStatus((s) => (s === 'ready' ? 'scanning' : s));
        setVeinOffset((v) => (v + 2) % 100);

        // "Scanning Veins..." green lines across hand (horizontal moving lines)
        ctx.strokeStyle = VEIN_GREEN;
        ctx.lineWidth = 2;
        for (let i = 0; i < 8; i++) {
          const y = (h * (0.2 + (i / 8) * 0.6) + veinOffset) % (h + 40) - 20;
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }

        stableCountRef.current++;
        if (!capturedRef.current && stableCountRef.current >= STABLE_FRAMES_REQUIRED && landmarks && landmarks.length >= 21) {
          capturedRef.current = true;
          const desc = palmGeometryDescriptor(landmarks.map((l) => ({ x: l.x, y: l.y })));
          if (desc.length > 0) {
            palmDescriptorToHash(desc).then((hash) => {
              if (hash) {
                setStatus('success');
                stopCamera();
                onSuccess(hash);
              }
            });
          } else {
            capturedRef.current = false;
          }
          stableCountRef.current = 0;
        }
      } else {
        stableCountRef.current = 0;
      }
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isOpen, status, veinOffset, onSuccess, stopCamera]);

  // Send video frames to Hands (poll every 100ms)
  useEffect(() => {
    if (!isOpen || (status !== 'ready' && status !== 'scanning') || !handsRef.current || !videoRef.current) return;

    const video = videoRef.current;
    const hands = handsRef.current;
    let cancelled = false;

    const sendFrame = () => {
      if (cancelled || video.readyState < 2 || video.videoWidth === 0) return;
      hands.send({ image: video }).then(() => {
        if (!cancelled) setTimeout(sendFrame, 100);
      }).catch(() => {});
    };
    const t = setTimeout(sendFrame, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [isOpen, status]);

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
      <div className="relative w-full max-w-2xl aspect-[4/3] max-h-[80vh] overflow-hidden rounded-xl border-2 border-[#22c55e]/50 shadow-[0_0_40px_rgba(34,197,94,0.2)]">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: 'scaleX(-1)' }}
          playsInline
          muted
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={{ transform: 'scaleX(-1)' }}
          width={640}
          height={480}
        />

        {status === 'scanning' && (
          <div
            className="absolute bottom-6 left-0 right-0 z-20 text-center font-mono tracking-wider"
            style={{ color: VEIN_GREEN, textShadow: '0 0 12px rgba(34,197,94,0.8)', fontSize: '1rem', fontWeight: 600 }}
          >
            Scanning Veins…
          </div>
        )}

        <div className="absolute top-3 left-0 right-0 z-20 flex flex-col items-center gap-1">
          <span className="text-xs font-mono uppercase tracking-widest opacity-90" style={{ color: '#22c55e' }}>
            Scan Area
          </span>
          <span className="text-xs font-mono" style={{ color: '#6b6b70' }}>
            Hold your palm to the camera in the circle — Sovereign Palm
          </span>
        </div>
      </div>

      {status === 'initializing' && (
        <div className="absolute inset-0 z-[200] flex flex-col items-center justify-center bg-black/90">
          <div className="h-8 w-8 rounded-full border-2 border-[#22c55e] border-t-transparent animate-spin mb-4" />
          <p className="text-[#22c55e] font-mono text-sm tracking-wider">Initializing Palm Pulse…</p>
        </div>
      )}

      {status === 'denied' && (
        <div className="absolute inset-0 z-[200] flex flex-col items-center justify-center bg-[#0d0d0f] px-6 text-center">
          <p className="text-[#22c55e] text-lg font-semibold mb-2">Camera required for Palm Pulse</p>
          <p className="text-[#6b6b70] text-sm mb-6 max-w-sm">{error ?? 'Camera access denied.'}</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border-2 border-[#2a2a2e] px-6 py-3 text-base font-medium text-[#a0a0a5] hover:bg-[#16161a]"
          >
            Cancel
          </button>
        </div>
      )}

      {status !== 'denied' && (
        <button
          type="button"
          onClick={onClose}
          className="mt-6 px-6 py-2 rounded-lg border-2 border-[#22c55e]/60 text-[#22c55e] hover:bg-[#22c55e]/10"
        >
          Cancel
        </button>
      )}
    </div>
  );
}

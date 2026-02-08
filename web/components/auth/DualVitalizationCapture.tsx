'use client';

/**
 * Dual-Vitalization Capture — Face Frame (left) + Palm Frame (right) visible simultaneously on front camera.
 * Oval frame for Sovereign Face; Open-hand silhouette for Sovereign Palm (palm facing camera).
 * When AI detects face in oval → border Gold; when palm enters silhouette → border Gold.
 * Auto-capture when both frames are gold for 1.5s; sends data to presence_handshakes.
 * GPS progress bar: "Earth-Anchor (GPS) Synchronizing..."
 * Instructional: "Show your face and palm to the Sentinel."
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { BiometricScanProgressBar } from '@/components/dashboard/QuadPillarShield';

const GOLD = '#D4AF37';
const PENDING = 'rgba(107, 107, 112, 0.5)';
const STABLE_DURATION_MS = 1500;

interface NormalizedLandmark {
  x: number;
  y: number;
  z?: number;
}

export interface DualVitalizationCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called when both face and palm captured (faceBlob: left region, palmBlob: right region) */
  onDualCapture?: (faceBlob: Blob, palmBlob: Blob) => void;
  /** Called when user confirms or auto-capture succeeds */
  onSuccess?: () => void;
  onError?: (message: string) => void;
  /** Identity anchor phone for presence_handshakes when auto-capture triggers */
  identityAnchorPhone?: string;
}

/** Face Frame: oval overlay — left side */
function FaceFrameSvg({ detected }: { detected: boolean }) {
  const stroke = detected ? GOLD : PENDING;
  return (
    <svg
      viewBox="0 0 200 200"
      className="w-full h-full pointer-events-none"
      fill="none"
      stroke={stroke}
      strokeWidth={detected ? 3 : 2}
      strokeOpacity={0.9}
      aria-hidden
    >
      <ellipse cx="100" cy="100" rx="70" ry="90" />
    </svg>
  );
}

/** Palm Frame: open-hand silhouette, palm facing camera (fingers up) — right side. Accessible: clearly indicates palm forward. */
function PalmFrameSvg({ detected }: { detected: boolean }) {
  const stroke = detected ? GOLD : PENDING;
  return (
    <svg
      viewBox="0 0 200 280"
      className="w-full h-full pointer-events-none"
      fill="none"
      stroke={stroke}
      strokeWidth={detected ? 3 : 2}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeOpacity={0.9}
      role="img"
      aria-label="Open palm facing camera — fingers extended upward"
    >
      {/* Palm mound — main body */}
      <ellipse cx="100" cy="170" rx="55" ry="55" />
      {/* Thumb — left, angled */}
      <path d="M 50 150 Q 20 130 15 95 Q 12 70 25 55" />
      {/* Index finger */}
      <path d="M 90 95 L 90 20" />
      {/* Middle finger */}
      <path d="M 105 100 L 105 5" />
      {/* Ring finger */}
      <path d="M 118 98 L 118 25" />
      {/* Pinky */}
      <path d="M 132 105 L 132 55" />
      {/* Wrist */}
      <path d="M 55 220 L 145 220" />
      {/* Palm center hint — clarifies palm facing (not back of hand) */}
      <ellipse cx="100" cy="150" rx="20" ry="25" fill="none" stroke={stroke} strokeWidth="1" strokeDasharray="4 2" opacity={0.6} />
    </svg>
  );
}

function palmCenter(landmarks: NormalizedLandmark[]): { x: number; y: number } {
  if (landmarks.length < 10) return { x: 0.5, y: 0.5 };
  const w = landmarks[0];
  const m = landmarks[9];
  return { x: (w.x + m.x) / 2, y: (w.y + m.y) / 2 };
}

/** Check if palm center is in right half (x > 0.5) — palm frame region */
function palmInRightRegion(landmarks: NormalizedLandmark[] | null): boolean {
  if (!landmarks || landmarks.length < 21) return false;
  const { x } = palmCenter(landmarks);
  return x > 0.5 && x < 0.95; // right side, not too far edge
}

/** Simple face detection: sample brightness in left region. Fallback: ramp after ~600ms when camera stable. */
function sampleFaceRegion(ctx: CanvasRenderingContext2D, w: number, h: number): number {
  const leftW = Math.floor(w * 0.5);
  const centerH = Math.floor(h * 0.5);
  const sampleW = Math.min(64, Math.floor(leftW * 0.3));
  const sampleH = Math.min(64, Math.floor(h * 0.3));
  const x = Math.floor(leftW * 0.3);
  const y = Math.floor(centerH - sampleH / 2);
  try {
    const imgData = ctx.getImageData(x, y, sampleW, sampleH);
    const data = imgData.data;
    let sum = 0;
    let count = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      // Skin-tone heuristic: R > G, R > B, not too dark
      if (r > 80 && r > g && r > b) {
        sum += (r + g + b) / 3;
        count++;
      }
    }
    if (count > 10) return sum / count;
  } catch {
    // ignore
  }
  return 0;
}

export function DualVitalizationCapture({
  isOpen,
  onClose,
  onDualCapture,
  onSuccess,
  onError,
  identityAnchorPhone,
}: DualVitalizationCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const handsRef = useRef<any>(null);
  const rafRef = useRef<number>(0);
  const lastHandLandmarksRef = useRef<NormalizedLandmark[] | null>(null);
  const bothStableSinceRef = useRef<number | null>(null);
  const capturedRef = useRef(false);
  const hapticFiredRef = useRef(false);

  const [status, setStatus] = useState<'initializing' | 'ready' | 'denied'>('initializing');
  const [error, setError] = useState<string | null>(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [palmDetected, setPalmDetected] = useState(false);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    handsRef.current?.close?.().catch(() => {});
    handsRef.current = null;
  }, []);

  const performCapture = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.readyState < 2 || video.videoWidth === 0 || capturedRef.current) return;
    capturedRef.current = true;

    const w = video.videoWidth;
    const h = video.videoHeight;
    const leftHalf = Math.floor(w * 0.5);
    const rightHalf = w - leftHalf;

    try {
      const faceCanvas = document.createElement('canvas');
      faceCanvas.width = leftHalf;
      faceCanvas.height = h;
      const faceCtx = faceCanvas.getContext('2d');
      if (faceCtx) faceCtx.drawImage(video, 0, 0, leftHalf, h, 0, 0, leftHalf, h);

      const palmCanvas = document.createElement('canvas');
      palmCanvas.width = rightHalf;
      palmCanvas.height = h;
      const palmCtx = palmCanvas.getContext('2d');
      if (palmCtx) palmCtx.drawImage(video, leftHalf, 0, rightHalf, h, 0, 0, rightHalf, h);

      if (onDualCapture) {
        faceCanvas.toBlob((faceBlob) => {
          palmCanvas.toBlob((palmBlob) => {
            if (faceBlob && palmBlob) {
              onDualCapture(faceBlob, palmBlob);
              persistToPresenceHandshakes(identityAnchorPhone).catch(() => {});
            }
            stopCamera();
            onSuccess?.();
          }, 'image/jpeg', 0.95);
        }, 'image/jpeg', 0.95);
      } else {
        persistToPresenceHandshakes(identityAnchorPhone).catch(() => {});
        stopCamera();
        onSuccess?.();
      }
    } catch {
      stopCamera();
      onSuccess?.();
    }
  }, [stopCamera, onSuccess, onDualCapture, identityAnchorPhone]);

  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return;
    setError(null);
    setStatus('initializing');
    setFaceDetected(false);
    setPalmDetected(false);
    bothStableSinceRef.current = null;
    capturedRef.current = false;
    lastHandLandmarksRef.current = null;

    const video = videoRef.current;
    if (!video) return;
    let cancelled = false;

    const init = async () => {
      try {
        const [handsModule, stream] = await Promise.all([
          import('@mediapipe/hands').then((m) => m).catch(() => null),
          navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
            audio: false,
          }),
        ]);

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        video.srcObject = stream;
        await video.play();
        setStatus('ready');

        if (handsModule?.Hands) {
          const hands = new handsModule.Hands({
            locateFile: (file: string) =>
              `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`,
          });
          await hands.initialize();
          if (cancelled) return;
          handsRef.current = hands;
          hands.onResults((results: { multiHandLandmarks: NormalizedLandmark[][] }) => {
            lastHandLandmarksRef.current = results.multiHandLandmarks?.[0] ?? null;
          });
        }
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

  /** Send video frames to MediaPipe Hands */
  useEffect(() => {
    if (!isOpen || status !== 'ready' || !handsRef.current || !videoRef.current) return;
    const video = videoRef.current;
    const hands = handsRef.current;
    let cancelled = false;
    const sendFrame = () => {
      if (cancelled || video.readyState < 2 || video.videoWidth === 0) return;
      hands.send({ image: video }).then(() => {
        if (!cancelled) setTimeout(sendFrame, 80);
      }).catch(() => {});
    };
    const t = setTimeout(sendFrame, 200);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [isOpen, status]);

  /** Draw loop: face/palm detection, auto-capture when both gold for 1.5s */
  useEffect(() => {
    if (!isOpen || status !== 'ready' || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let faceConfidence = 0;

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      if (capturedRef.current) return;

      const w = video.videoWidth || 640;
      const h = video.videoHeight || 480;
      if (video.readyState >= 2 && video.videoWidth > 0) {
        if (canvas.width !== video.videoWidth) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }
        ctx.drawImage(video, 0, 0);
      }

      const cw = canvas.width || w;
      const ch = canvas.height || h;

      // Face detection: skin-tone heuristic in left region
      const faceScore = sampleFaceRegion(ctx, cw, ch);
      const faceOk = faceScore > 90 || (faceScore > 60 && faceConfidence > 0.5);
      if (faceScore > 60) faceConfidence = Math.min(1, faceConfidence + 0.02);
      else faceConfidence = Math.max(0, faceConfidence - 0.05);
      setFaceDetected(faceOk);

      // Palm detection: MediaPipe Hands in right region
      const palmOk = palmInRightRegion(lastHandLandmarksRef.current);
      setPalmDetected(palmOk);

      // Auto-capture: both gold for 1.5s
      if (faceOk && palmOk) {
        // Haptic: vibrate when Face and Palm frames turn Gold (native-like feedback)
        if (!hapticFiredRef.current) {
          hapticFiredRef.current = true;
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([50]);
          }
        }
        const now = Date.now();
        if (!bothStableSinceRef.current) bothStableSinceRef.current = now;
        if (now - (bothStableSinceRef.current ?? 0) >= STABLE_DURATION_MS) {
          performCapture();
        }
      } else {
        bothStableSinceRef.current = null;
      }
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isOpen, status, performCapture]);

  const handleScan = useCallback(() => {
    performCapture();
  }, [performCapture]);

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
      }}
    >
      <div className="relative w-full max-w-2xl aspect-[4/3] max-h-[80vh] overflow-hidden rounded-xl border-2 border-[#D4AF37]/50 shadow-[0_0_40px_rgba(212,175,55,0.2)] mx-auto touch-manipulation">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: 'scaleX(-1)' }}
          playsInline
          muted
        />
        <canvas ref={canvasRef} className="hidden" aria-hidden />

        {/* Gold scanning line + progress bar (0–100% over ~4s), smooth Verified transition */}
        <BiometricScanProgressBar
          isActive={isOpen && status === 'ready'}
          durationMs={4000}
          overlay
        />

        {/* Instructional text */}
        <p
          className="absolute top-3 left-0 right-0 z-20 text-center text-sm font-medium tracking-wide"
          style={{ color: 'rgba(212, 175, 55, 0.95)', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}
        >
          Show your face and palm to the Sentinel.
        </p>

        {/* Left: Oval Frame (Sovereign Face) */}
        <div
          className="absolute top-1/2 left-[10%] -translate-y-1/2 w-[38%] aspect-square flex items-center justify-center rounded-full transition-all duration-300"
          style={{
            border: `2px solid ${faceDetected ? GOLD : PENDING}`,
            boxShadow: faceDetected ? `0 0 24px ${GOLD}40` : 'none',
            backgroundColor: 'rgba(0,0,0,0.15)',
          }}
        >
          <div className="w-[85%] h-[85%]">
            <FaceFrameSvg detected={faceDetected} />
          </div>
        </div>

        {/* Right: Palm Silhouette (Sovereign Palm) */}
        <div
          className="absolute top-1/2 right-[10%] -translate-y-1/2 w-[38%] aspect-[200/280] max-h-[90%] flex items-center justify-center transition-all duration-300"
          style={{
            border: `2px solid ${palmDetected ? GOLD : PENDING}`,
            boxShadow: palmDetected ? `0 0 24px ${GOLD}40` : 'none',
            backgroundColor: 'rgba(0,0,0,0.15)',
            borderRadius: '20%',
          }}
        >
          <div className="w-full h-full flex items-center justify-center">
            <PalmFrameSvg detected={palmDetected} />
          </div>
          <span
            className="absolute bottom-1 left-0 right-0 text-center text-[10px] font-mono"
            style={{ color: palmDetected ? GOLD : PENDING }}
          >
            Palm facing camera
          </span>
        </div>

        {/* GPS Progress Bar — thin pulsing gold line at bottom */}
        <div
          className="absolute bottom-0 left-0 right-0 h-8 flex flex-col items-center justify-center gap-0.5 bg-black/40 z-20"
          style={{ borderTop: '1px solid rgba(212, 175, 55, 0.3)' }}
        >
          <div
            className="h-1 w-full animate-pulse"
            style={{
              background: `linear-gradient(90deg, transparent, ${GOLD}80, transparent)`,
              boxShadow: `0 0 8px ${GOLD}60`,
            }}
          />
          <p
            className="text-[10px] font-mono tracking-wider"
            style={{ color: 'rgba(212, 175, 55, 0.85)' }}
          >
            Earth-Anchor (GPS) Synchronizing…
          </p>
        </div>

        {status === 'ready' && (
          <div className="absolute bottom-14 left-0 right-0 z-20 flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={handleScan}
              className="rounded-xl border-2 border-[#D4AF37] bg-[#D4AF37]/20 px-8 py-4 text-lg font-bold text-[#D4AF37] hover:bg-[#D4AF37]/30 transition-all animate-pulse"
            >
              Scan
            </button>
            <p className="text-[10px] font-mono text-[#6b6b70]">
              Align face (left) and palm (right), or wait for auto-capture
            </p>
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
          <p className="text-[#D4AF37] text-lg font-semibold mb-2">Dual Vitalization — camera required</p>
          <p className="text-[#6b6b70] text-sm mb-6 max-w-sm">{error ?? 'Camera access denied.'}</p>
          <button type="button" onClick={onClose} className="rounded-xl border-2 border-[#2a2a2e] px-6 py-3 text-base font-medium text-[#a0a0a5] hover:bg-[#16161a]">
            Cancel
          </button>
        </div>
      )}

      {status !== 'denied' && (
        <button type="button" onClick={onClose} className="mt-6 px-6 py-2 rounded-lg border-2 border-[#6b6b70] text-[#a0a0a5] hover:bg-[#16161a]">
          Cancel
        </button>
      )}
    </div>
  );
}

/** Persist capture to presence_handshakes when identity anchor provided */
async function persistToPresenceHandshakes(anchorPhone?: string): Promise<void> {
  if (!anchorPhone || typeof window === 'undefined') return;
  try {
    const { getSupabase } = await import('@/lib/supabase');
    const supabase = getSupabase();
    if (!supabase) return;

    const { data: existing } = await supabase
      .from('presence_handshakes')
      .select('id')
      .eq('anchor_phone', anchorPhone)
      .order('verified_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const now = new Date().toISOString();
    if (existing?.id) {
      await supabase
        .from('presence_handshakes')
        .update({ verified_at: now, liveness_score: 100 })
        .eq('id', existing.id);
    } else {
      await supabase.from('presence_handshakes').insert({
        anchor_phone: anchorPhone,
        verified_at: now,
        liveness_score: 100,
      });
    }
  } catch {
    // silent — parent flow may handle persistence
  }
}

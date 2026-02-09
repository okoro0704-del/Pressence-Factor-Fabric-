'use client';

/**
 * Palm Pulse — Contactless palm verification (replaces fingerprint for Daily Ritual).
 * - Scanning UI aligned with face (progress bar, HUD-style labels).
 * - On success: freeze-frame "photo" of scanned palm, approval message, Proceed to next page.
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { getMediaPipeHands } from '@/lib/mediaPipeHandsLoader';
import { palmGeometryDescriptor } from '@/lib/palmGeometry';
import {
  extractVascularDescriptor,
  reflectanceCheck,
  pulseFromTimeSeries,
  vascularHash256,
} from '@/lib/nirPalmScan';
import { useSovereignCompanion } from '@/contexts/SovereignCompanionContext';
import { BiometricScanProgressBar } from '@/components/dashboard/QuadPillarShield';

interface NormalizedLandmark {
  x: number;
  y: number;
  z?: number;
}

const LIVENESS_DURATION_MS = 1500;
const STABLE_FRAMES_AFTER_LIVENESS = 48;
const PROGRESS_THROTTLE_MS = 80;
const INIT_TIMEOUT_MS = 20000;
const GOLD = '#D4AF37';
const GOLD_RING = 'rgba(212, 175, 55, 0.9)';
const GOLD_BG = 'rgba(212, 175, 55, 0.25)';

export interface PalmPulseCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (palmHash: string) => void;
  onError?: (message: string) => void;
}

function palmCenter(landmarks: NormalizedLandmark[]): { x: number; y: number } {
  if (landmarks.length < 10) return { x: 0.5, y: 0.5 };
  const w = landmarks[0];
  const m = landmarks[9];
  return { x: (w.x + m.x) / 2, y: (w.y + m.y) / 2 };
}

/** Palm radius (for ring) from center to middle fingertip. */
function palmRadius(landmarks: NormalizedLandmark[]): number {
  if (landmarks.length < 13) return 0.15;
  const c = palmCenter(landmarks);
  const mTip = landmarks[12];
  return Math.hypot(mTip.x - c.x, mTip.y - c.y);
}

export function PalmPulseCapture({ isOpen, onClose, onSuccess, onError }: PalmPulseCaptureProps) {
  const { setScanCue } = useSovereignCompanion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const handsRef = useRef<any>(null);
  const rafRef = useRef<number>(0);
  const [status, setStatus] = useState<'initializing' | 'loading_hands' | 'ready' | 'liveness' | 'scanning' | 'captured' | 'success' | 'denied'>('initializing');
  const [error, setError] = useState<string | null>(null);
  const [initRetry, setInitRetry] = useState(0);
  const [progressRing, setProgressRing] = useState(0);
  const [capturedImageDataUrl, setCapturedImageDataUrl] = useState<string | null>(null);
  const capturedHashRef = useRef<string | null>(null);
  const pendingCaptureHashRef = useRef<string | null>(null);
  const lastLandmarksRef = useRef<NormalizedLandmark[] | null>(null);
  const capturedRef = useRef(false);
  const stableCountRef = useRef(0);
  const livenessStartRef = useRef<number | null>(null);
  const livenessSamplesRef = useRef<number[]>([]);
  const livenessPassedRef = useRef(false);
  const reflectanceFailedRef = useRef(false);
  const frameCountRef = useRef(0);
  const progressRingRef = useRef(0);
  const lastProgressUpdateRef = useRef(0);
  const statusRef = useRef(status);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const isOpenRef = useRef(isOpen);
  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;
  statusRef.current = status;
  isOpenRef.current = isOpen;

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    handsRef.current = null;
  }, []);

  const setProgressThrottled = useCallback((value: number) => {
    progressRingRef.current = value;
    const now = Date.now();
    if (now - lastProgressUpdateRef.current >= PROGRESS_THROTTLE_MS || value === 0 || value === 100) {
      lastProgressUpdateRef.current = now;
      setProgressRing(value);
    }
  }, []);

  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return;

    setError(null);
    setStatus('initializing');
    setCapturedImageDataUrl(null);
    capturedHashRef.current = null;
    pendingCaptureHashRef.current = null;
    lastLandmarksRef.current = null;
    capturedRef.current = false;
    stableCountRef.current = 0;
    livenessStartRef.current = null;
    livenessSamplesRef.current = [];
    livenessPassedRef.current = false;
    reflectanceFailedRef.current = false;
    frameCountRef.current = 0;
    progressRingRef.current = 0;
    lastProgressUpdateRef.current = 0;

    const video = videoRef.current;
    if (!video) return;

    let cancelled = false;

    const timeoutId = setTimeout(() => {
      if (cancelled) return;
      stopCamera();
      setError('Camera or hand detection is taking too long. Please allow camera access and try again.');
      setStatus('denied');
      onErrorRef.current?.('Initialization timed out.');
    }, INIT_TIMEOUT_MS);

    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        video.srcObject = stream;
        await video.play();
        setStatus('loading_hands');

        if (cancelled) return;

        // Yield so the UI and draw loop can paint live video before we start loading Hands.
        await new Promise<void>((r) => requestAnimationFrame(() => r()));

        if (cancelled) return;

        // Defer to next macrotask so the current stack exits and the browser can paint; keeps video live.
        setTimeout(() => {
          if (cancelled) return;
          getMediaPipeHands()
            .then((hands) => {
            if (cancelled) {
              stream.getTracks().forEach((t) => t.stop());
              streamRef.current = null;
              return;
            }
            handsRef.current = hands;
            hands.onResults((results: { multiHandLandmarks: NormalizedLandmark[][] }) => {
              const list = results.multiHandLandmarks?.[0];
              lastLandmarksRef.current = list ?? null;
            });
            clearTimeout(timeoutId);
            setStatus('ready');
          })
          .catch((e) => {
            if (cancelled) return;
            clearTimeout(timeoutId);
            const msg = e instanceof Error ? e.message : String(e);
            setError(msg);
            setStatus('denied');
            onErrorRef.current?.(msg);
          });
        }, 0);
      } catch (e) {
        if (cancelled) return;
        clearTimeout(timeoutId);
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg);
        setStatus('denied');
        onErrorRef.current?.(msg);
      }
    };

    init();
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      stopCamera();
    };
  }, [isOpen, stopCamera, initRetry]);

  useEffect(() => {
    if (!isOpen) {
      setScanCue('');
      return;
    }
    if (status === 'loading_hands') setScanCue('Loading hand detection…');
    else if (status === 'liveness') setScanCue('Hold still — verifying liveness');
    else if (status === 'scanning') setScanCue('Identifying markers…');
    else if (status === 'ready') setScanCue('Show your palm');
    else if (status === 'captured') setScanCue('Palm captured — proceed when ready');
    else setScanCue('');
  }, [isOpen, status, setScanCue]);

  useEffect(() => {
    if (!isOpen) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);

      if (!isOpenRef.current) return;
      const s = statusRef.current;
      if (s !== 'loading_hands' && s !== 'ready' && s !== 'liveness' && s !== 'scanning') return;
      const loadingOnly = s === 'loading_hands';
      if (!loadingOnly && !handsRef.current) return;

      const ctx = canvas.getContext('2d');
      const landmarks = lastLandmarksRef.current;

      if (!ctx || video.readyState < 2 || video.videoWidth === 0) return;

      const vw = video.videoWidth;
      const vh = video.videoHeight;
      if (canvas.width !== vw || canvas.height !== vh) {
        canvas.width = vw;
        canvas.height = vh;
      }

      const w = canvas.width;
      const h = canvas.height;

      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(video, -vw, 0, vw, vh);
      ctx.restore();

      if (loadingOnly) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      const hasPalm = landmarks && landmarks.length >= 21;
      const c = hasPalm ? palmCenter(landmarks) : { x: 0.5, y: 0.5 };
      const cx = w * c.x;
      const cy = h * c.y;
      const radiusPx = hasPalm ? Math.min(w, h) * (palmRadius(landmarks) * 1.4) : Math.min(w, h) * 0.2;
      const pendingCapture = pendingCaptureHashRef.current;
      const currentProgress = pendingCapture ? 100 : progressRingRef.current;

      if (!hasPalm) {
        setProgressThrottled(0);
        stableCountRef.current = 0;
        if (statusRef.current === 'scanning') setStatus('liveness');
        return;
      }

      if (statusRef.current === 'ready') {
        setStatus('liveness');
        livenessStartRef.current = Date.now();
        livenessSamplesRef.current = [];
      }

      if (statusRef.current === 'liveness') {
        if (reflectanceFailedRef.current) return;

        const elapsed = Date.now() - (livenessStartRef.current ?? 0);
        const sampleRegion = 8;
        const reflectRegion = 32;
        const sx = Math.floor(Math.max(0, Math.min(w - sampleRegion, w - cx - sampleRegion / 2)));
        const sy = Math.floor(Math.max(0, Math.min(h - sampleRegion, cy - sampleRegion / 2)));
        const rx = Math.floor(Math.max(0, Math.min(w - reflectRegion, w - cx - reflectRegion / 2)));
        const ry = Math.floor(Math.max(0, Math.min(h - reflectRegion, cy - reflectRegion / 2)));

        if (sx >= 0 && sy >= 0 && sx + sampleRegion <= w && sy + sampleRegion <= h) {
          try {
            const imageData = ctx.getImageData(sx, sy, sampleRegion, sampleRegion);
            let sum = 0;
            const len = imageData.data.length;
            for (let i = 0; i < len; i += 4)
              sum += (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) / 3;
            livenessSamplesRef.current.push(sum / (len / 4));
          } catch {
            livenessSamplesRef.current.push(0);
          }
        }

        frameCountRef.current++;
        if (rx >= 0 && ry >= 0 && rx + reflectRegion <= w && ry + reflectRegion <= h && frameCountRef.current % 10 === 0) {
          try {
            const reflectData = ctx.getImageData(rx, ry, reflectRegion, reflectRegion);
            const result = reflectanceCheck(reflectData);
            if (!result.pass) {
              reflectanceFailedRef.current = true;
              setError(result.reason ?? 'Fake Material Detected');
              setStatus('denied');
              onErrorRef.current?.(result.reason ?? 'Fake Material Detected');
              return;
            }
          } catch {
            // ignore single-frame errors
          }
        }

        const pct = Math.min(100, (elapsed / LIVENESS_DURATION_MS) * 100);
        setProgressThrottled(Math.round(pct));

        if (elapsed >= LIVENESS_DURATION_MS && !livenessPassedRef.current) {
          const samples = livenessSamplesRef.current;
          if (samples.length >= 5) {
            const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
            const variance = samples.reduce((a, b) => a + (b - mean) ** 2, 0) / samples.length;
            livenessPassedRef.current = variance > 2;
          } else {
            livenessPassedRef.current = true;
          }
          setStatus('scanning');
          stableCountRef.current = 0;
        }
      }

      if (hasPalm) {
        ctx.strokeStyle = GOLD_BG;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(cx, cy, radiusPx, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = GOLD_RING;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(cx, cy, radiusPx, -Math.PI / 2, -Math.PI / 2 + (currentProgress / 100) * Math.PI * 2);
        ctx.stroke();
      }

      if (pendingCaptureHashRef.current) {
        const c = canvasRef.current;
        if (c) {
          try {
            setCapturedImageDataUrl(c.toDataURL('image/jpeg', 0.92));
          } catch {
            setCapturedImageDataUrl(null);
          }
        }
        capturedHashRef.current = pendingCaptureHashRef.current;
        pendingCaptureHashRef.current = null;
        setStatus('captured');
        stopCamera();
        return;
      }

      if (statusRef.current === 'scanning') {
        // Once capture is triggered, keep progress at 100% so bar and "Verified" stay in sync with capture/congratulations
        if (capturedRef.current) {
          setProgressThrottled(100);
        } else {
          const pct = 33 + Math.min(33, (stableCountRef.current / STABLE_FRAMES_AFTER_LIVENESS) * 33);
          setProgressThrottled(Math.round(pct));
          stableCountRef.current++;
        }

        if (
          !capturedRef.current &&
          livenessPassedRef.current &&
          stableCountRef.current >= STABLE_FRAMES_AFTER_LIVENESS &&
          landmarks &&
          landmarks.length >= 21
        ) {
          capturedRef.current = true;
          setProgressThrottled(100);
          setProgressRing(100);
          const geometryDesc = palmGeometryDescriptor(landmarks.map((l) => ({ x: l.x, y: l.y })));
          if (geometryDesc.length > 0) {
            const reflectRegion = 32;
            const rx = Math.floor(Math.max(0, Math.min(w - reflectRegion, w - cx - reflectRegion / 2)));
            const ry = Math.floor(Math.max(0, Math.min(h - reflectRegion, cy - reflectRegion / 2)));
            let vascularDesc;
            try {
              const imgData = ctx.getImageData(rx, ry, reflectRegion, reflectRegion);
              vascularDesc = extractVascularDescriptor(imgData, reflectRegion / 2, reflectRegion / 2, 24);
            } catch {
              vascularDesc = {
                meanRed: 0.5,
                meanCyan: 0.5,
                varianceRed: 0.01,
                varianceCyan: 0.01,
                redGrid: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5],
              };
            }
            const { pulseScore } = pulseFromTimeSeries(livenessSamplesRef.current, 60);
            vascularHash256(geometryDesc, vascularDesc, pulseScore)
              .then((hash) => {
                if (hash) pendingCaptureHashRef.current = hash;
              })
              .catch((err) => {
                capturedRef.current = false;
                onErrorRef.current?.(err instanceof Error ? err.message : String(err));
              });
          } else {
            capturedRef.current = false;
          }
          // Do not reset stableCountRef here so we keep progress at 100% while waiting for hash
        }
      }
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isOpen, setProgressThrottled, stopCamera]);

  useEffect(() => {
    if (!isOpen || (status !== 'ready' && status !== 'liveness' && status !== 'scanning') || !handsRef.current || !videoRef.current) return;
    const video = videoRef.current;
    const hands = handsRef.current;
    let cancelled = false;
    const sendFrame = () => {
      if (cancelled || !video || video.readyState < 2 || video.videoWidth === 0) return;
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
      className="fixed inset-0 z-[300] flex flex-col bg-black"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0)',
        paddingBottom: 'env(safe-area-inset-bottom, 0)',
        paddingLeft: 'env(safe-area-inset-left, 0)',
        paddingRight: 'env(safe-area-inset-right, 0)',
      }}
    >
      <div className="absolute inset-0 overflow-hidden" style={{ contain: 'layout paint' }}>
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: 'scaleX(-1) translateZ(0)', backfaceVisibility: 'hidden', willChange: 'transform' }}
          playsInline
          muted
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={{ transform: 'scaleX(-1) translateZ(0)', backfaceVisibility: 'hidden', willChange: 'transform' }}
          width={640}
          height={480}
        />

        {/* Progress bar driven by actual palm verification so it stays in sync with body/congratulations */}
        {(status === 'ready' || status === 'liveness' || status === 'scanning') && (
          <BiometricScanProgressBar
            isActive={true}
            durationMs={Math.max(4000, LIVENESS_DURATION_MS + 2500)}
            overlay
            controlledProgress={progressRing}
          />
        )}

        {/* HUD — same style as face (AI Confidence / Liveness / Hash Status) */}
        {(status === 'ready' || status === 'liveness' || status === 'scanning') && (
          <div
            className="absolute top-3 left-3 right-3 z-20 flex flex-wrap gap-3 text-xs font-mono"
            style={{ color: '#e8c547', textShadow: '0 0 8px rgba(0,0,0,0.9)' }}
          >
            <span>Scanning: {status === 'ready' ? 'Position palm' : status === 'liveness' ? 'Liveness…' : 'Markers…'}</span>
            <span>Progress: {progressRing}%</span>
          </div>
        )}

        {(status === 'liveness' || status === 'scanning') && (
          <div className="absolute bottom-16 left-0 right-0 z-20 px-4">
            <p className="text-center font-mono tracking-wider" style={{ color: GOLD, textShadow: `0 0 12px ${GOLD}80`, fontSize: '0.9rem', fontWeight: 600 }}>
              {status === 'liveness' ? 'Hold still — verifying liveness' : 'Identifying palm markers…'}
            </p>
          </div>
        )}

        {(status === 'ready' || status === 'liveness' || status === 'scanning') && (
          <div className="absolute top-14 left-0 right-0 z-20 flex flex-col items-center gap-2 px-4 text-center">
            <span className="text-sm font-bold text-[#22c55e]">Face verified. Now show your palm to complete vitalization.</span>
            <span className="text-xs font-mono uppercase tracking-widest opacity-90" style={{ color: GOLD }}>Sovereign Palm</span>
            <p className="text-sm max-w-md" style={{ color: '#6b6b70' }}>
              Hold your palm <strong style={{ color: GOLD }}>close to the camera</strong>. A gold ring will fill as the AI verifies liveness and identifies your palm markers.
            </p>
          </div>
        )}
      </div>

      {/* Captured: same page — keep image visible, congratulatory message and button at bottom */}
      {status === 'captured' && (
        <>
          {/* Dimmed background: captured palm image or placeholder */}
          <div className="absolute inset-0 z-[240] flex flex-col items-center justify-center p-4 bg-black/70">
            {capturedImageDataUrl ? (
              <div className="relative w-full max-w-xs rounded-2xl overflow-hidden border-2 shadow-2xl" style={{ borderColor: GOLD, boxShadow: `0 0 24px ${GOLD}40` }}>
                <img
                  src={capturedImageDataUrl}
                  alt="Your palm scan"
                  className="w-full h-auto block"
                  style={{ transform: 'scaleX(-1)' }}
                />
                <div className="absolute inset-0 pointer-events-none bg-[#D4AF37]/10" aria-hidden />
              </div>
            ) : (
              <div className="w-full max-w-xs aspect-video rounded-2xl border-2 flex items-center justify-center bg-[#1a1a1e]" style={{ borderColor: GOLD }}>
                <span className="font-mono text-sm" style={{ color: GOLD }}>Palm verified</span>
              </div>
            )}
          </div>
          {/* Bottom bar: congratulatory message + Go to Dashboard (same page) */}
          <div
            className="absolute bottom-0 left-0 right-0 z-[250] flex flex-col gap-3 p-4 rounded-t-2xl border-t border-[#2a2a2e]"
            style={{
              paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))',
              background: 'linear-gradient(to top, rgba(13,13,15,0.98), rgba(13,13,15,0.95))',
              boxShadow: `0 -4px 24px ${GOLD}20`,
            }}
          >
            <p className="text-center text-lg font-bold" style={{ color: GOLD }}>Congratulations</p>
            <p className="text-center text-base font-bold text-[#22c55e]">Vitalization is complete</p>
            <p className="text-center text-xs font-mono uppercase tracking-widest opacity-90" style={{ color: GOLD }}>Face and palm verified</p>
            <p className="text-center text-xs text-[#6b6b70]">Your identity is anchored. VIDA CAP minting is triggered.</p>
            <button
              type="button"
              onClick={() => {
                const hash = capturedHashRef.current;
                if (hash) {
                  capturedHashRef.current = null;
                  setCapturedImageDataUrl(null);
                  setStatus('success');
                  onSuccess(hash);
                }
              }}
              disabled={!capturedHashRef.current}
              className="w-full rounded-xl py-4 text-base font-bold text-[#0d0d0f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-1"
              style={{ background: GOLD }}
            >
              Go to Dashboard
            </button>
          </div>
        </>
      )}

      {status === 'initializing' && (
        <div className="absolute inset-0 z-[200] flex flex-col items-center justify-center bg-black/90">
          <div className="h-8 w-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin mb-4" />
          <p className="text-amber-400 font-mono text-sm tracking-wider">Initializing Palm Pulse…</p>
        </div>
      )}

      {status === 'loading_hands' && (
        <div className="absolute bottom-4 left-0 right-0 z-[200] text-center">
          <p className="text-amber-400 font-mono text-sm tracking-wider">Loading hand detection…</p>
        </div>
      )}

      {status === 'denied' && (
        <div className="absolute inset-0 z-[200] flex flex-col items-center justify-center bg-[#0d0d0f] px-6 text-center">
          <p className="text-amber-400 text-lg font-semibold mb-2">Camera required for Palm Pulse</p>
          <p className="text-[#6b6b70] text-sm mb-6 max-w-sm">{error ?? 'Camera access denied.'}</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => {
                setError(null);
                setStatus('initializing');
                setInitRetry((r) => r + 1);
              }}
              className="rounded-xl bg-amber-500/20 border border-amber-500/50 px-6 py-3 text-base font-medium text-amber-400 hover:bg-amber-500/30"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border-2 border-[#2a2a2e] px-6 py-3 text-base font-medium text-[#a0a0a5] hover:bg-[#16161a]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

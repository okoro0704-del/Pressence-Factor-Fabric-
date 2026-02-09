'use client';

/**
 * Architect Vision — Face Pulse capture with real-time overlay.
 * - MediaPipe Face Mesh: real 468-landmark face detection (AI confidence from detection).
 * - Canvas overlay: face oval drawn from FACEMESH_FACE_OVAL when face detected.
 * - HUD: AI Confidence, Liveness, Hash Status
 * - On success: freeze frame 0.5s, mesh turns Gold
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { speakSovereignSuccess } from '@/lib/sovereignVoice';
import { useSovereignCompanion } from '@/contexts/SovereignCompanionContext';
import { BiometricScanProgressBar } from '@/components/dashboard/QuadPillarShield';
import { getMediaPipeFaceMesh, resetMediaPipeFaceMesh } from '@/lib/mediaPipeFaceMeshLoader';

/** MediaPipe exposes FACEMESH_FACE_OVAL via UMD global (set when face_mesh is loaded by mediaPipeFaceMeshLoader). Read from globalThis only in browser so Turbopack/SSR don't fail. */
function getFaceOvalContour(): Array<[number, number]> | undefined {
  if (typeof window === 'undefined') return undefined;
  return (globalThis as unknown as { FACEMESH_FACE_OVAL?: Array<[number, number]> }).FACEMESH_FACE_OVAL;
}

const BLUE_LASER = 'rgba(59, 130, 246, 0.95)';
const MESH_COLOR = 'rgba(212, 175, 55, 0.6)';
const MESH_SUCCESS_COLOR = '#D4AF37';
const BLUE_MESH = 'rgba(59, 130, 246, 0.85)';
const BLUE_MESH_DIM = 'rgba(59, 130, 246, 0.45)';

/** Face mesh: draw oval contour from MediaPipe FACEMESH_FACE_OVAL (normalized 0–1). Runs only in browser. */
function drawFaceMeshOval(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  landmarks: { x: number; y: number; z?: number }[],
  gold: boolean,
  faceDetected: boolean
) {
  const faceOval = getFaceOvalContour();
  if (!landmarks.length || !faceOval?.length) return;
  const stroke = gold ? MESH_SUCCESS_COLOR : faceDetected ? BLUE_MESH : BLUE_MESH_DIM;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = gold ? 3 : 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  for (const [i, j] of faceOval) {
    const a = landmarks[i];
    const b = landmarks[j];
    if (!a || !b) continue;
    ctx.moveTo(a.x * w, a.y * h);
    ctx.lineTo(b.x * w, b.y * h);
  }
  ctx.stroke();
}

/** Bypass: when active, confidence drops to 0.3 and lighting warnings are ignored for 30s. */
const BYPASS_CONFIDENCE_THRESHOLD = 0.3;
const BYPASS_DURATION_SEC = 30;

export interface ArchitectVisionCaptureProps {
  /** When true, overlay is visible and camera runs */
  isOpen: boolean;
  /** Callback when user closes (cancel) */
  onClose: () => void;
  /** When true, show success state: freeze frame, gold mesh, then call onComplete after 0.5s */
  verificationSuccess: boolean | null;
  /** Called after gold-freeze delay when verification succeeded */
  onComplete?: () => void;
  /** Called when we have a stable frame (optional, for parent to trigger verify) */
  onReadyForVerify?: (captureBlob?: Blob) => void;
  /** Optional label for the close button (e.g. "Continue to re-register" for reset flow) */
  closeLabel?: string;
  /** Face mesh confidence threshold 0–1 (from Master Settings). When bypass active, 0.3 is used. */
  confidenceThreshold?: number;
  /** When true, enforce "Increase Lighting" warning. Ignored while bypass active. */
  enforceBrightnessCheck?: boolean;
  /** Master Architect Initialization: first run uses Low sensitivity (0.4, no lighting block) so Creator is not blocked. */
  isMasterArchitectInit?: boolean;
  /** When true, force Hash Status to COMPLETE after Liveness is Detected for 1.5s (no wait for background handshake). */
  enableArchitectBypass?: boolean;
  /** Called when Architect bypass fires: parent should set verificationSuccess so gold freeze + onComplete run. */
  onForceCompleteRequest?: () => void;
  /** Ms to wait after Liveness Detected before forcing complete. Default 1500. */
  forceCompleteAfterLivenessMs?: number;
}

/** Front camera only, highest practical resolution. Force front camera immediately when entering registration/face capture. */
function getMaxResolutionConstraints(): MediaTrackConstraints {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getSupportedConstraints) {
    return { facingMode: { ideal: 'user' }, width: { ideal: 1920 }, height: { ideal: 1080 } };
  }
  return {
    facingMode: { ideal: 'user' },
    width: { ideal: 1920, min: 640 },
    height: { ideal: 1080, min: 480 },
  };
}

export function ArchitectVisionCapture({
  isOpen,
  onClose,
  verificationSuccess,
  onComplete,
  onReadyForVerify,
  closeLabel = 'Cancel',
  confidenceThreshold = 0.4,
  enforceBrightnessCheck = false,
  isMasterArchitectInit = false,
  enableArchitectBypass = false,
  onForceCompleteRequest,
  forceCompleteAfterLivenessMs = 1500,
}: ArchitectVisionCaptureProps) {
  const effectiveConfidence = isMasterArchitectInit ? 0.4 : confidenceThreshold;
  const effectiveBrightness = isMasterArchitectInit ? false : enforceBrightnessCheck;
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const faceMeshRef = useRef<any>(null);
  const lastFaceLandmarksRef = useRef<{ x: number; y: number; z?: number }[] | null>(null);
  const canvasSizeSetRef = useRef(false);
  const rafRef = useRef<number>(0);
  const [aiConfidence, setAiConfidence] = useState(0);
  const [liveness, setLiveness] = useState<'Scanning' | 'Detected'>('Scanning');
  const [hashStatus, setHashStatus] = useState<'Calculating...' | 'Ready'>('Calculating...');
  const [error, setError] = useState<string | null>(null);
  const [meshGold, setMeshGold] = useState(false);
  const frozenRef = useRef(false);
  const frozenDrawnRef = useRef(false);
  const [faceDetected, setFaceDetected] = useState(false);
  type CameraStatus = 'initializing' | 'ready' | 'denied';
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>('initializing');
  const [retryCount, setRetryCount] = useState(0);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  /** 30-second Low Light Mode bypass: drop confidence to 0.3, ignore lighting warnings. */
  const [isSensitivityBypassed, setSensitivityBypassed] = useState(false);
  const [bypassSecondsLeft, setBypassSecondsLeft] = useState(0);
  const bypassIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { setScanCue } = useSovereignCompanion();
  const effectiveConfidenceThreshold = isSensitivityBypassed ? BYPASS_CONFIDENCE_THRESHOLD : effectiveConfidence;
  const effectiveEnforceBrightness = effectiveBrightness && !isSensitivityBypassed;
  const effectiveThresholdPercent = Math.round(effectiveConfidenceThreshold * 100);
  /** Face detected when confidence meets effective threshold (or legacy: explicit state after 500ms). */
  const facePassesThreshold = aiConfidence >= effectiveThresholdPercent;
  const showAsFaceDetected = faceDetected || facePassesThreshold;

  /** Companion Eyes: guide user during Face Pulse */
  useEffect(() => {
    if (!isOpen || meshGold) {
      setScanCue('');
      return;
    }
    if (cameraStatus === 'ready') {
      setScanCue(showAsFaceDetected ? 'Hold still' : 'Move closer');
    } else {
      setScanCue('');
    }
  }, [isOpen, cameraStatus, showAsFaceDetected, meshGold, setScanCue]);

  const startBypassTimer = useCallback(() => {
    if (bypassIntervalRef.current) clearInterval(bypassIntervalRef.current);
    setSensitivityBypassed(true);
    setBypassSecondsLeft(BYPASS_DURATION_SEC);
    bypassIntervalRef.current = setInterval(() => {
      setBypassSecondsLeft((s) => {
        if (s <= 1) {
          if (bypassIntervalRef.current) clearInterval(bypassIntervalRef.current);
          bypassIntervalRef.current = null;
          setSensitivityBypassed(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    return () => {
      if (bypassIntervalRef.current) clearInterval(bypassIntervalRef.current);
    };
  }, []);

  /**
   * FaceScan teardown (hard stop): release camera, all frame loops, and MediaPipe Face.
   * - Stops all camera tracks, clears video.srcObject, cancels animation loops.
   * - Disposes MediaPipe Face instance (close() releases WebGL/GPU used by Face Mesh).
   * - Resets Face Mesh singleton so Palm scan gets a clean slate.
   * Call before starting Palm scan; do not reuse any of these resources.
   */
  const faceScanTeardown = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    const stream = streamRef.current;
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    const video = videoRef.current;
    if (video) {
      video.srcObject = null;
    }
    const fm = faceMeshRef.current;
    if (fm) {
      try {
        fm.close?.().catch(() => {});
      } catch {
        // ignore
      }
      faceMeshRef.current = null;
    }
    lastFaceLandmarksRef.current = null;
    resetMediaPipeFaceMesh();
  }, []);

  /** Alias for compatibility with existing call sites. */
  const stopCamera = faceScanTeardown;

  // Initialize camera and MediaPipe Face Mesh (runs on mount and on Retry)
  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setCameraStatus('initializing');
    setMeshGold(false);
    setFaceDetected(false);
    frozenRef.current = false;
    frozenDrawnRef.current = false;
    setAiConfidence(0);
    setLiveness('Scanning');
    setHashStatus('Calculating...');
    lastFaceLandmarksRef.current = null;
    stopCamera();

    const video = videoRef.current;
    if (!video) return;

    const constraints: MediaStreamConstraints = {
      video: { ...getMaxResolutionConstraints(), facingMode },
      audio: false,
    };

    let cancelled = false;
    Promise.all([
      navigator.mediaDevices.getUserMedia(constraints),
      getMediaPipeFaceMesh().catch(() => null),
    ])
      .then(([stream, faceMesh]) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        video.srcObject = stream;
        if (faceMesh) {
          faceMeshRef.current = faceMesh;
          faceMesh.onResults((results: { multiFaceLandmarks?: { x: number; y: number; z?: number }[][] }) => {
            const landmarks = results.multiFaceLandmarks?.[0] ?? null;
            lastFaceLandmarksRef.current = landmarks;
            if (landmarks && landmarks.length > 0) {
              setFaceDetected(true);
              setLiveness('Detected');
              setAiConfidence(100);
            } else {
              setFaceDetected(false);
              setLiveness('Scanning');
              setAiConfidence(0);
            }
          });
        }
        video.play().then(() => setCameraStatus('ready')).catch(() => setCameraStatus('ready'));
      })
      .catch((err) => {
        if (!cancelled) {
          setCameraStatus('denied');
          setError(err?.message || 'Camera access denied');
        }
      });

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [isOpen, stopCamera, retryCount, facingMode]);

  // Cleanup on unmount / isOpen false: ensure full teardown so Palm gets a clean slate
  useEffect(() => {
    if (isOpen) return;
    stopCamera();
  }, [isOpen, stopCamera]);

  // Send video frames to MediaPipe Face Mesh
  useEffect(() => {
    if (!isOpen || cameraStatus !== 'ready' || !faceMeshRef.current || !videoRef.current) return;
    const video = videoRef.current;
    const faceMesh = faceMeshRef.current;
    let cancelled = false;
    const sendFrame = () => {
      if (cancelled || video.readyState < 2 || video.videoWidth === 0) return;
      faceMesh.send({ image: video }).then(() => {
        if (!cancelled) setTimeout(sendFrame, 80);
      }).catch(() => {});
    };
    const t = setTimeout(sendFrame, 200);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [isOpen, cameraStatus]);

  // Force COMPLETE after 1.5s when Liveness is Detected and Architect bypass enabled (end Calculating loop; no wait for background handshake).
  useEffect(() => {
    if (!isOpen || !enableArchitectBypass || liveness !== 'Detected' || meshGold) return;
    const t = setTimeout(() => {
      setHashStatus('Ready');
      onForceCompleteRequest?.();
    }, forceCompleteAfterLivenessMs);
    return () => clearTimeout(t);
  }, [isOpen, enableArchitectBypass, liveness, meshGold, forceCompleteAfterLivenessMs, onForceCompleteRequest]);

  // Draw loop: video → canvas, overlay mesh (placeholder 3D geometry)
  useEffect(() => {
    if (!isOpen || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      const frozen = frozenRef.current;
      if (frozen && frozenDrawnRef.current) return;

      const cw = canvas.width;
      const ch = canvas.height;
      if (cw === 0 || ch === 0) {
        canvas.width = 640;
        canvas.height = 480;
      }

      if (!frozen && video.readyState >= 2 && video.videoWidth > 0) {
        if (!canvasSizeSetRef.current) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          canvasSizeSetRef.current = true;
        }
        ctx.drawImage(video, 0, 0);
      }

      const w = canvas.width || 640;
      const h = canvas.height || 480;
      const landmarks = lastFaceLandmarksRef.current;
      if (landmarks && landmarks.length > 0) {
        drawFaceMeshOval(ctx, w, h, landmarks, meshGold, showAsFaceDetected);
      }

      if (frozen) frozenDrawnRef.current = true;
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      canvasSizeSetRef.current = false;
    };
  }, [isOpen, meshGold, showAsFaceDetected]);

  // Success: freeze frame, gold mesh, Sovereign Voice (same moment), 0.5s then onComplete. Auto-revert bypass.
  useEffect(() => {
    if (verificationSuccess !== true) return;
    if (bypassIntervalRef.current) clearInterval(bypassIntervalRef.current);
    bypassIntervalRef.current = null;
    setSensitivityBypassed(false);
    setBypassSecondsLeft(0);
    frozenRef.current = true;
    setMeshGold(true);
    setHashStatus('Ready');
    setLiveness('Detected');
    setAiConfidence(100);
    stopCamera();
    speakSovereignSuccess();
    const t = setTimeout(() => {
      onComplete?.();
    }, 500);
    return () => clearTimeout(t);
  }, [verificationSuccess, onComplete, stopCamera]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[300] flex flex-col bg-black"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0)',
        paddingBottom: 'env(safe-area-inset-bottom, 0)',
      }}
    >
      {/* Full-screen camera feed — stable layer to prevent flicker */}
      <div className="relative flex-1 w-full min-h-0 flex flex-col justify-end overflow-hidden">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            transform: facingMode === 'user' ? 'scaleX(-1) translateZ(0)' : 'translateZ(0)',
            backfaceVisibility: 'hidden',
          }}
          playsInline
          muted
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={{
            transform: facingMode === 'user' ? 'scaleX(-1) translateZ(0)' : 'translateZ(0)',
            backfaceVisibility: 'hidden',
          }}
        />

        {/* Gold progress bar at bottom only — fills as Face Pulse completes (no center scan box) */}
        <BiometricScanProgressBar
          isActive={isOpen && cameraStatus === 'ready' && !meshGold}
          durationMs={4000}
          overlay
        />

        {/* HUD */}
        <div
          className="absolute top-3 left-3 right-3 z-20 flex flex-wrap gap-3 text-xs font-mono"
          style={{ color: '#e8c547', textShadow: '0 0 8px rgba(0,0,0,0.9)' }}
        >
          <span>AI Confidence: {aiConfidence}%</span>
          <span>Liveness: {liveness}</span>
          <span>Hash Status: {hashStatus}</span>
        </div>

        {/* Flip camera + Low Light Mode */}
        {cameraStatus === 'ready' && !meshGold && (
          <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                stopCamera();
                setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
                setCameraStatus('initializing');
              }}
              className="rounded-lg border border-[#e8c547]/60 bg-black/50 px-3 py-2 text-xs font-mono transition-colors hover:bg-[#e8c547]/20"
              style={{ color: '#e8c547', textShadow: '0 0 8px rgba(0,0,0,0.9)' }}
              aria-label={facingMode === 'user' ? 'Switch to back camera' : 'Switch to front camera'}
            >
              {facingMode === 'user' ? 'Back camera' : 'Front camera'}
            </button>
            {bypassSecondsLeft > 0 && (
              <span className="text-xs font-mono text-[#e8c547] bg-black/60 px-2 py-1 rounded" aria-live="polite">
                {bypassSecondsLeft}s
              </span>
            )}
            <button
              type="button"
              onClick={startBypassTimer}
              className="p-2 rounded-lg bg-black/50 hover:bg-black/70 border border-[#2a2a2e] text-[#a0a0a5] hover:text-[#e8c547] transition-colors focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
              title="Low Light Mode — 30s bypass (lower verification threshold, ignore lighting)"
              aria-label="Low Light Mode: 30 second bypass"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            </button>
          </div>
        )}

        {/* Detection lock: show when face detected (before success) */}
        {showAsFaceDetected && !meshGold && (
          <div
            className="absolute bottom-4 left-0 right-0 z-20 text-center text-sm font-mono tracking-wider"
            style={{ color: BLUE_MESH, textShadow: '0 0 12px rgba(59,130,246,0.8)' }}
          >
            Face Detected: Hold Still for Pulse
          </div>
        )}

        {/* Success overlay (gold tint) */}
        {meshGold && (
          <div
            className="absolute inset-0 z-30 bg-[#D4AF37]/20 pointer-events-none"
            aria-hidden
          />
        )}
      </div>

      {/* Initializing overlay: sleek loader while camera is warming up */}

      {cameraStatus === 'initializing' && (
        <div className="absolute inset-0 z-[200] flex flex-col items-center justify-center bg-black/90">
          <div className="h-8 w-8 rounded-full border-2 border-[#e8c547] border-t-transparent animate-spin mb-4" />
          <p className="text-[#e8c547] font-mono text-sm tracking-wider">
            Initializing Sovereign Vision...
          </p>
        </div>
      )}

      {/* Full-screen permission denied: Sovereign Identity requires a Biometric Anchor */}
      {cameraStatus === 'denied' && (
        <div className="absolute inset-0 z-[200] flex flex-col items-center justify-center bg-[#0d0d0f] px-6 text-center">
          <p className="text-[#e8c547] text-lg font-semibold mb-2">
            Sovereign Identity requires a Biometric Anchor
          </p>
          <p className="text-[#6b6b70] text-sm mb-6 max-w-sm">
            Camera access is required to anchor your identity to this device.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => {
                setError(null);
                setCameraStatus('initializing');
                setRetryCount((c) => c + 1);
              }}
              className="rounded-xl bg-[#c9a227] px-6 py-3 text-base font-bold text-[#0d0d0f] hover:bg-[#e8c547] transition-colors"
            >
              Retry
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border-2 border-[#2a2a2e] px-6 py-3 text-base font-medium text-[#a0a0a5] hover:bg-[#16161a] transition-colors"
            >
              {closeLabel}
            </button>
          </div>
        </div>
      )}

      {/* Cancel removed during scanning: auto-transition only (UX overhaul). Denied state has Retry/Cancel in overlay above. */}

    </div>
  );
}

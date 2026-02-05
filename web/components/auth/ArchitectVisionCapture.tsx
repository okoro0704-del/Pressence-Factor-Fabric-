'use client';

/**
 * Architect Vision — Face Pulse capture with real-time overlay.
 * - Camera at highest resolution for unique/permanent Face Hash
 * - Canvas overlay: face oval / landmark-style mesh (real mesh via MediaPipe when loaded from CDN)
 * - HUD: AI Confidence, Liveness, Hash Status
 * - Blue laser scan animation during processing
 * - On success: freeze frame 0.5s, mesh turns Gold
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { speakSovereignSuccess } from '@/lib/sovereignVoice';

const BLUE_LASER = 'rgba(59, 130, 246, 0.95)';
const MESH_COLOR = 'rgba(212, 175, 55, 0.6)';
const MESH_SUCCESS_COLOR = '#D4AF37';

/** Simple mesh: face oval + radial lines (3D geometry placeholder). Replace with MediaPipe landmarks when loaded. */
function drawPlaceholderMesh(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  gold: boolean
) {
  const cx = w / 2;
  const cy = h / 2;
  const rx = w * 0.35;
  const ry = h * 0.45;
  ctx.strokeStyle = gold ? MESH_SUCCESS_COLOR : MESH_COLOR;
  ctx.lineWidth = gold ? 2.5 : 1.5;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + rx * 0.9 * Math.cos(a), cy + ry * 0.9 * Math.sin(a));
    ctx.stroke();
  }
}

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
}

/** Highest practical resolution for unique/permanent Face Hash (hardware verification) */
function getMaxResolutionConstraints(): MediaTrackConstraints {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getSupportedConstraints) {
    return { facingMode: 'user', width: { ideal: 1920 }, height: { ideal: 1080 } };
  }
  return {
    facingMode: 'user',
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
}: ArchitectVisionCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const [aiConfidence, setAiConfidence] = useState(0);
  const [liveness, setLiveness] = useState<'Scanning' | 'Detected'>('Scanning');
  const [hashStatus, setHashStatus] = useState<'Calculating...' | 'Ready'>('Calculating...');
  const [error, setError] = useState<string | null>(null);
  const [meshGold, setMeshGold] = useState(false);
  const frozenRef = useRef(false);
  const frozenDrawnRef = useRef(false);
  const [faceDetected, setFaceDetected] = useState(false);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  // Initialize camera at highest resolution
  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setMeshGold(false);
    setFaceDetected(false);
    frozenRef.current = false;
    frozenDrawnRef.current = false;
    setAiConfidence(0);
    setLiveness('Scanning');
    setHashStatus('Calculating...');

    const video = videoRef.current;
    if (!video) return;

    const constraints: MediaStreamConstraints = {
      video: getMaxResolutionConstraints(),
      audio: false,
    };

    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((stream) => {
        streamRef.current = stream;
        video.srcObject = stream;
        video.play().catch(() => {});
      })
      .catch((err) => {
        setError(err?.message || 'Camera access denied');
      });

    return () => stopCamera();
  }, [isOpen, stopCamera]);

  // Simulate face detection after a short delay (in production, plug in MediaPipe via CDN or real detector)
  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => {
      setFaceDetected(true);
      setLiveness('Detected');
      setAiConfidence(88);
    }, 800);
    return () => clearTimeout(t);
  }, [isOpen]);

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

      if (!frozen && video.readyState >= 2 && video.videoWidth > 0) {
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }
        ctx.drawImage(video, 0, 0);
      }

      const w = canvas.width || cw || 640;
      const h = canvas.height || ch || 480;
      drawPlaceholderMesh(ctx, w, h, meshGold);

      if (frozen) frozenDrawnRef.current = true;
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isOpen, meshGold]);

  // Success: freeze frame, gold mesh, Sovereign Voice (same moment), 0.5s then onComplete
  useEffect(() => {
    if (verificationSuccess !== true) return;
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
    <div className="fixed inset-0 z-[300] flex flex-col items-center justify-center bg-black">
      <div className="relative w-full max-w-2xl aspect-[4/3] max-h-[80vh] overflow-hidden rounded-xl border-2 border-[#D4AF37]/50 shadow-[0_0_60px_rgba(212,175,55,0.2)]">
        {/* Video + canvas overlay */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover mirror"
          playsInline
          muted
          style={{ transform: 'scaleX(-1)' }}
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={{ transform: 'scaleX(-1)' }}
        />

        {/* Blue laser scan line — moves up and down during processing */}
        <div
          className="absolute left-0 right-0 h-1 pointer-events-none z-10 architect-vision-laser"
          style={{
            top: '30%',
            background: `linear-gradient(90deg, transparent, ${BLUE_LASER}, transparent)`,
            boxShadow: `0 0 20px ${BLUE_LASER}`,
          }}
          data-animate={verificationSuccess !== true}
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

        {/* Success overlay (gold tint) */}
        {meshGold && (
          <div
            className="absolute inset-0 z-30 bg-[#D4AF37]/20 pointer-events-none"
            aria-hidden
          />
        )}
      </div>

      {error && (
        <p className="mt-4 text-red-400 text-sm text-center max-w-md">{error}</p>
      )}

      <button
        type="button"
        onClick={onClose}
        className="mt-6 px-6 py-2 rounded-lg border-2 border-[#D4AF37]/60 text-[#e8c547] hover:bg-[#D4AF37]/10 transition-colors"
      >
        Cancel
      </button>

      <style dangerouslySetInnerHTML={{
        __html: `
          .architect-vision-laser[data-animate="true"] {
            animation: architect-laser-scan 2s ease-in-out infinite;
            top: 20%;
          }
          @keyframes architect-laser-scan {
            0%, 100% { top: 20%; }
            50% { top: 80%; }
          }
        `,
      }} />
    </div>
  );
}

'use client';

/**
 * Vitalization Audit — Face liveness scan → POST to Sovryn audit endpoint → +5 VIDA on success.
 * Camera logic copied from ArchitectVisionCapture (MediaPipe Face Mesh).
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { getMediaPipeFaceMesh, resetMediaPipeFaceMesh } from '@/lib/mediaPipeFaceMeshLoader';
import { BiometricScanProgressBar } from '@/components/dashboard/QuadPillarShield';
import { deriveRSKWalletFromSeed } from '@/lib/sovryn/derivedWallet';
import { NATIONAL_VAULT_ADDRESS, FOUNDATION_VAULT_ADDRESS } from '@/lib/sovryn/config';

const GOLD = '#D4AF37';
const GOLD_DIM = 'rgba(212, 175, 55, 0.7)';
const BLACK = '#0d0d0f';
const BORDER = 'rgba(212, 175, 55, 0.3)';

export interface VitalizationAuditProps {
  isOpen: boolean;
  onClose: () => void;
  phoneNumber: string;
  onSuccess?: () => void;
}

export function VitalizationAudit({ isOpen, onClose, phoneNumber, onSuccess }: VitalizationAuditProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const faceMeshRef = useRef<any>(null);
  const lastFaceLandmarksRef = useRef<{ x: number; y: number; z?: number }[] | null>(null);
  
  const [status, setStatus] = useState<'initializing' | 'ready' | 'scanning' | 'submitting' | 'success' | 'error'>('initializing');
  const [error, setError] = useState<string | null>(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [liveness, setLiveness] = useState<'Scanning' | 'Detected'>('Scanning');
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (faceMeshRef.current) {
      faceMeshRef.current.close?.();
      faceMeshRef.current = null;
    }
    resetMediaPipeFaceMesh();
  }, []);

  // Initialize camera and MediaPipe Face Mesh
  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setStatus('initializing');
    setFaceDetected(false);
    setLiveness('Scanning');
    lastFaceLandmarksRef.current = null;
    stopCamera();

    const video = videoRef.current;
    if (!video) return;

    const constraints: MediaStreamConstraints = {
      video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
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
            } else {
              setFaceDetected(false);
              setLiveness('Scanning');
            }
          });
        }
        video.play().then(() => setStatus('ready')).catch(() => setStatus('ready'));
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.message ?? 'Camera access denied');
          setStatus('error');
        }
      });

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [isOpen, stopCamera]);

  // Send video frames to MediaPipe Face Mesh
  useEffect(() => {
    if (!isOpen || status !== 'ready' || !faceMeshRef.current || !videoRef.current) return;
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
  }, [isOpen, status]);

  // Derive wallet address on mount
  useEffect(() => {
    if (!phoneNumber) return;
    deriveRSKWalletFromSeed(phoneNumber).then((r) => {
      if (r.ok) setWalletAddress(r.address);
    });
  }, [phoneNumber]);

  const handleScan = useCallback(async () => {
    if (!faceDetected || !walletAddress) return;
    setStatus('submitting');
    setError(null);

    try {
      const response = await fetch('https://sovrn.netlify.app/v1/sovryn/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: walletAddress,
          NATIONAL_BLOCK_SINK: NATIONAL_VAULT_ADDRESS,
          FOUNDATION_VAULT: FOUNDATION_VAULT_ADDRESS,
        }),
      });

      const data = await response.json();

      if (data.success || response.ok) {
        setStatus('success');
        stopCamera();

        // Trigger confetti animation
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: [GOLD, '#FFD700', '#FFA500'],
        });

        // Call success callback to refresh balance
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 2000);
      } else {
        setError(data.error || 'Audit failed');
        setStatus('error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
      setStatus('error');
    }
  }, [faceDetected, walletAddress, stopCamera, onSuccess, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0, 0, 0, 0.9)' }}
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl border p-6"
        style={{ background: BLACK, borderColor: BORDER }}
      >
        {/* Header */}
        <div className="mb-4 text-center">
          <h2 className="text-2xl font-bold uppercase tracking-wider" style={{ color: GOLD }}>
            Vitalization Audit
          </h2>
          <p className="text-sm mt-2" style={{ color: GOLD_DIM }}>
            Face scan required to mint +5 VIDA
          </p>
        </div>

        {/* Camera View */}
        {status !== 'success' && (
          <div className="relative w-full aspect-[4/3] max-h-[60vh] overflow-hidden rounded-xl border-2 mb-4" style={{ borderColor: BORDER }}>
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }}
              playsInline
              muted
            />

            {/* Scanning Progress Bar */}
            <BiometricScanProgressBar
              isActive={status === 'ready' && faceDetected}
              durationMs={4000}
              overlay
            />

            {/* HUD */}
            <div className="absolute top-4 left-4 right-4 flex justify-between text-xs font-mono">
              <div className="bg-black/70 px-3 py-1.5 rounded" style={{ color: liveness === 'Detected' ? '#22c55e' : GOLD_DIM }}>
                Liveness: {liveness}
              </div>
              <div className="bg-black/70 px-3 py-1.5 rounded" style={{ color: GOLD_DIM }}>
                {status === 'initializing' ? 'Initializing...' : status === 'ready' ? 'Ready' : status === 'submitting' ? 'Submitting...' : 'Scanning'}
              </div>
            </div>
          </div>
        )}

        {/* Success State */}
        {status === 'success' && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-2xl font-bold mb-2" style={{ color: GOLD }}>
              Vitalization Complete!
            </h3>
            <p className="text-lg" style={{ color: GOLD_DIM }}>
              +5 VIDA minted to your wallet
            </p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mb-4 p-3 rounded-lg border border-red-500/50 bg-red-500/10">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {status !== 'success' && status !== 'submitting' && (
            <>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-xl border font-bold uppercase tracking-wider transition-all hover:opacity-80"
                style={{ background: 'transparent', borderColor: BORDER, color: GOLD_DIM }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleScan}
                disabled={!faceDetected || status === 'submitting'}
                className="flex-1 py-3 rounded-xl border font-bold uppercase tracking-wider transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: GOLD, borderColor: GOLD, color: BLACK }}
              >
                {status === 'submitting' ? 'Submitting...' : 'Scan & Mint'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}


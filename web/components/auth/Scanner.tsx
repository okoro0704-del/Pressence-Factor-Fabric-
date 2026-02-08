'use client';

/**
 * Face Hash Scanner — Auto-start when camera is active.
 * When scan is VERIFIED: save faceHash, auto-redirect to /dashboard (quiet, no manual button). Scanner shuts down immediately to save battery.
 * No Cancel button in success state. Redirect uses router.replace() for smooth transition without flicker.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  setPersistentFaceHash,
  setFaceHashInSession,
  deriveFaceHashFromCredential,
  sha256Hex,
} from '@/lib/biometricAnchorSync';
import { verifyBiometricSignature } from '@/lib/biometricAuth';
import { getIdentityAnchorPhone, setIdentityAnchorForSession } from '@/lib/sentinelActivation';
import { setVitalizationComplete } from '@/lib/vitalizationState';
import { ROUTES } from '@/lib/constants';

export type ScannerStatus = 'idle' | 'searching' | 'scanning' | 'VERIFIED' | 'error';

export interface ScannerProps {
  phoneNumber?: string | null;
  onAnchorSaved?: (step: number) => void;
  onStatusChange?: (status: ScannerStatus) => void;
  /** Delay in ms before auto-redirect after VERIFIED. Default 1000 for quiet, immediate transition. */
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
  /** Kill the watcher: when true, stop all polling, intervals, and state updates to prevent redirect loop/flicker */
  const isRedirectingRef = useRef(false);
  const [status, setStatus] = useState<ScannerStatus>('searching');
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const phone = phoneProp ?? (typeof window !== 'undefined' ? getIdentityAnchorPhone() : null);

  const saveHashAndNotify = useCallback(
    (faceHash: string) => {
      if (isRedirectingRef.current) return;
      setPersistentFaceHash(faceHash, phone ?? undefined);
      if (phone?.trim()) setFaceHashInSession(phone.trim(), faceHash);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      if (isRedirectingRef.current) return;
      setProgress(100);
      setStatus('VERIFIED');
      onStatusChange?.('VERIFIED');
      onAnchorSaved?.(1);
      setVitalizationComplete();
    },
    [phone, onAnchorSaved, onStatusChange]
  );

  const runScan = useCallback(async () => {
    if (isRedirectingRef.current) return;
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
      if (isRedirectingRef.current) {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
        return;
      }
      const elapsed = Date.now() - startTime;
      const pct = Math.min(99, Math.round((elapsed / SCAN_DURATION_MS) * 100));
      setProgress(pct);
    }, 150);

    try {
      const result = await verifyBiometricSignature(phone.trim(), { learningMode: false, useSovereignHashOnly: true });
      if (isRedirectingRef.current) return;
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      if (result.success && result.credential) {
        const hash = await deriveFaceHashFromCredential(result.credential);
        if (hash?.trim()) {
          const anchorRes = await fetch('/api/v1/anchor-citizen', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ face_hash: hash, phone_number: phone.trim() }),
          });
          const anchorJson = (await anchorRes.json().catch(() => ({}))) as { ok?: boolean; id?: string };
          if (anchorRes.ok && anchorJson.ok) {
            saveHashAndNotify(hash);
            return;
          }
        }
      }
      if (isRedirectingRef.current) return;
      setError(result.error ?? 'Verification failed');
      setStatus('error');
      onStatusChange?.('error');
    } catch (err) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      if (isRedirectingRef.current) return;
      const message = err instanceof Error ? err.message : String(err);
      if (NO_PASSKEYS_PATTERN.test(message)) {
        try {
          const fallbackHash = await sha256Hex(`${phone!.trim()}-${Date.now()}-anchor`);
          const anchorRes = await fetch('/api/v1/anchor-citizen', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ face_hash: fallbackHash, phone_number: phone!.trim() }),
          });
          const anchorJson = (await anchorRes.json().catch(() => ({}))) as { ok?: boolean; id?: string };
          if (anchorRes.ok && anchorJson.ok) {
            saveHashAndNotify(fallbackHash);
            return;
          }
          setError('Passkey unavailable. Could not save to Vault.');
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

  // Camera: request stream and auto-start scan when active. Cleanup: physically shut down camera on leave.
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
        if (isRedirectingRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        video.srcObject = stream;
        video.play().then(() => {
          if (!isRedirectingRef.current && !scanTriggeredRef.current) {
            scanTriggeredRef.current = true;
            runScan();
          }
        }).catch(() => {
          if (!isRedirectingRef.current && !scanTriggeredRef.current) {
            scanTriggeredRef.current = true;
            runScan();
          }
        });
      })
      .catch((err) => {
        if (!isRedirectingRef.current) {
          setError(err?.message ?? 'Camera access denied');
          setStatus('error');
          onStatusChange?.('error');
        }
      });

    return () => {
      isRedirectingRef.current = true;
      const stream = streamRef.current;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, []);

  // VERIFIED → hard redirect (router.replace). Kill watcher first so no more state updates; anchor confirmation before navigate.
  useEffect(() => {
    if (status !== 'VERIFIED' || !autoRedirect) return;
    const t = setTimeout(() => {
      if (isRedirectingRef.current) return;
      isRedirectingRef.current = true;
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      const stream = streamRef.current;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (phone?.trim()) {
        setIdentityAnchorForSession(phone.trim());
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem('pff_initial_release_phone', phone.trim());
        }
      }
      setVitalizationComplete();
      router.replace(`${ROUTES.DASHBOARD}?initial_release=1`);
    }, redirectDelayMs);
    return () => clearTimeout(t);
  }, [status, autoRedirect, redirectDelayMs, router, phone]);

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

  // Full-screen camera, 100% clear. Only a circular progress ring (2px Gold) around the feed.
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference * (1 - progress / 100);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black">
      <div className="absolute inset-0 flex items-center justify-center">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          style={{ transform: 'scaleX(-1)' }}
          playsInline
          muted
        />
      </div>
      {/* Progress ring: 2px Gold border around viewport, fills as scanningProgress increases */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <svg className="w-full h-full max-w-[min(100vw,100vh)] max-h-[min(100vw,100vh)]" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="rgba(212, 175, 55, 0.25)"
            strokeWidth="2"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={GOLD}
            strokeWidth="2"
            strokeDasharray={circumference}
            strokeDashoffset={strokeOffset}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
            style={{ transition: 'stroke-dashoffset 0.15s ease-out' }}
          />
        </svg>
      </div>
      {/* VERIFIED: auto-redirect only (no manual button); scanner already stopped in saveHashAndNotify for battery */}
      {status === 'VERIFIED' && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 text-center">
          <p className="text-sm font-semibold uppercase tracking-wider" style={{ color: GOLD }}>VERIFIED</p>
          <p className="text-xs text-[#a0a0a5] mt-1">Redirecting to dashboard…</p>
        </div>
      )}

      {/* Error: minimal retry only when failed */}
      {status === 'error' && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
          <button
            type="button"
            onClick={handleRetry}
            className="py-2.5 px-6 rounded-xl font-bold text-sm uppercase tracking-wider transition-opacity hover:opacity-90"
            style={{ background: GOLD, color: '#0d0d0f' }}
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}

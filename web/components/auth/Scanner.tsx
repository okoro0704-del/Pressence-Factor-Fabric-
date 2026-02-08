'use client';

/**
 * Face Hash Scanner — Persistent anchor and auto-flow.
 * When scan is VERIFIED: save faceHash to LocalStorage + secure cookie, then auto-redirect to /vitalization/master-key.
 * Passkey fallback: if "No passkeys available", save hash directly to Supabase Vault.
 * Header sync: onAnchorSaved(1) so Top Tab shows ANCHOR 1/4.
 */

import React, { useState, useEffect, useCallback } from 'react';
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

export type ScannerStatus = 'idle' | 'scanning' | 'VERIFIED' | 'error';

export interface ScannerProps {
  /** Identity anchor phone (optional; falls back to getIdentityAnchorPhone()). */
  phoneNumber?: string | null;
  /** Called when face hash is saved so header can show ANCHOR 1/4. */
  onAnchorSaved?: (step: number) => void;
  /** Called when status changes (e.g. VERIFIED). */
  onStatusChange?: (status: ScannerStatus) => void;
  /** Delay in ms before auto-redirect after VERIFIED. Default 1500. */
  redirectDelayMs?: number;
  /** If false, skip auto-redirect (caller handles navigation). */
  autoRedirect?: boolean;
}

const NO_PASSKEYS_PATTERN = /no passkeys|passkey.*available|not found|NotAllowedError|canceled/i;

export function Scanner({
  phoneNumber: phoneProp,
  onAnchorSaved,
  onStatusChange,
  redirectDelayMs = 1500,
  autoRedirect = true,
}: ScannerProps) {
  const router = useRouter();
  const [status, setStatus] = useState<ScannerStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const phone = phoneProp ?? (typeof window !== 'undefined' ? getIdentityAnchorPhone() : null);

  const saveHashAndNotify = useCallback(
    (faceHash: string) => {
      setPersistentFaceHash(faceHash, phone ?? undefined);
      if (phone?.trim()) setFaceHashInSession(phone.trim(), faceHash);
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
    onStatusChange?.('scanning');

    try {
      const result = await verifyBiometricSignature(phone.trim(), { learningMode: false });
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

  useEffect(() => {
    if (status !== 'VERIFIED' || !autoRedirect) return;
    const t = setTimeout(() => {
      router.push('/vitalization/master-key');
    }, redirectDelayMs);
    return () => clearTimeout(t);
  }, [status, autoRedirect, redirectDelayMs, router]);

  if (status === 'VERIFIED') {
    return (
      <div className="min-h-[200px] flex flex-col items-center justify-center p-6 rounded-xl border-2 border-[#D4AF37]/50 bg-[#0d0d0f]">
        <div className="text-4xl mb-2" aria-hidden>✓</div>
        <p className="text-lg font-bold text-[#D4AF37]">Face hash saved — ANCHOR 1/4</p>
        <p className="text-sm text-[#6b6b70] mt-1">Redirecting to Master Key…</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="rounded-xl border-2 border-red-500/40 bg-[#0d0d0f] p-6">
        <p className="text-red-400 text-sm mb-4">{error}</p>
        <button
          type="button"
          onClick={() => { setStatus('idle'); setError(null); runScan(); }}
          className="w-full py-3 rounded-xl bg-[#c9a227] text-black font-bold uppercase tracking-wider hover:opacity-90"
        >
          Try again
        </button>
      </div>
    );
  }

  if (status === 'scanning') {
    return (
      <div className="min-h-[200px] flex flex-col items-center justify-center p-6 rounded-xl border-2 border-[#2a2a2e] bg-[#0d0d0f]">
        <div className="w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-[#e8c547] font-medium">Verifying… Complete Face Pulse on this device.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border-2 border-[#2a2a2e] bg-[#0d0d0f] p-6">
      <p className="text-[#a0a0a5] text-sm mb-4">ANCHOR 1/4 — Face hash anchors your presence before Master Key.</p>
      <button
        type="button"
        onClick={runScan}
        disabled={!phone?.trim()}
        className="w-full py-4 rounded-xl bg-[#c9a227] text-black font-bold uppercase tracking-wider hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Start Face Pulse
      </button>
    </div>
  );
}

'use client';

/**
 * Quad-Pillar Shield (Ghost Economy Protocol)
 * Defines the four active sensors: Face (Biometric), Palm (Physical Pattern),
 * Phone (Hardware Anchor), GPS (Geofenced Work-Site).
 * 3/4 Priority Mesh: Pillars 1 (Face), 2 (Palm), 3 (Identity Anchor) = Core Mesh complete.
 * User may proceed when Core Mesh is verified; Pillar 4 (GPS) can remain Initializing or Self-Attested.
 * Lightweight for browser; native mobile GPS integration prepared for April 7th.
 *
 * Biometric Scan Progress Bar: gold scanning line over the video feed, 0-100% progress over 3-5s,
 * smooth green Verified transition; thumb-friendly and centered on mobile.
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { QUAD_PILLAR_DEFINITIONS } from '@/lib/constants';

const GOLD = '#D4AF37';
const GREEN = '#22c55e';
const PENDING = 'rgba(107, 107, 112, 0.4)';

/** Default duration for simulated deep analysis (ms) */
const DEFAULT_SCAN_DURATION_MS = 4000;

export interface BiometricScanProgressBarProps {
  /** When true, show scanning line and run progress 0→100 */
  isActive: boolean;
  /** Duration in ms for progress to reach 100% (3–5s typical) */
  durationMs?: number;
  /** Called when progress reaches 100%; then show Verified and optional hash send is handled by parent/auth flow */
  onComplete?: () => void;
  /** Optional: when true, overlay fills parent (absolute); otherwise standalone block for below grid */
  overlay?: boolean;
}

/**
 * Biometric Scan Progress Bar
 * - Gold horizontal scanning line moving up/down over the Face/Palm video feed
 * - Progress 0–100% over durationMs to simulate deep analysis
 * - On 100%: smooth green fade, "Verified", then onComplete
 * - Thumb-friendly, centered on mobile (max-width, safe area)
 */
export function BiometricScanProgressBar({
  isActive,
  durationMs = DEFAULT_SCAN_DURATION_MS,
  onComplete,
  overlay = true,
}: BiometricScanProgressBarProps) {
  const [progress, setProgress] = useState(0);
  const [verified, setVerified] = useState(false);
  const completedRef = useRef(false);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0);

  const tick = useCallback(() => {
    if (!isActive || completedRef.current) return;
    const start = startTimeRef.current ?? Date.now();
    startTimeRef.current = start;
    const elapsed = Date.now() - start;
    const pct = Math.min(100, (elapsed / durationMs) * 100);
    setProgress(pct);
    if (pct >= 100) {
      completedRef.current = true;
      setVerified(true);
      onComplete?.();
      return;
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [isActive, durationMs, onComplete]);

  useEffect(() => {
    if (!isActive) {
      startTimeRef.current = null;
      setProgress(0);
      setVerified(false);
      completedRef.current = false;
      return;
    }
    startTimeRef.current = null;
    completedRef.current = false;
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isActive, tick]);

  if (!isActive && !verified) return null;

  const content = (
    <>
      {/* Gold scanning line: moves up and down while scanning */}
      {!verified && (
        <div
          className="biometric-scan-line absolute left-0 right-0 h-1 pointer-events-none z-10"
          style={{
            background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`,
            boxShadow: `0 0 24px ${GOLD}, 0 0 12px ${GOLD}80`,
          }}
          aria-hidden
        />
      )}
      {/* Progress bar: horizontal fill 0–100% */}
      <div
        className="absolute left-0 right-0 bottom-0 h-2 sm:h-2.5 overflow-hidden rounded-b-xl pointer-events-none z-10"
        style={{ background: 'rgba(0,0,0,0.5)' }}
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Biometric scan progress"
      >
        <div
          className="h-full transition-all duration-300 ease-out rounded-b-xl"
          style={{
            width: `${progress}%`,
            background: verified
              ? `linear-gradient(90deg, ${GREEN}, ${GREEN}dd)`
              : `linear-gradient(90deg, ${GOLD}, ${GOLD}dd)`,
            boxShadow: verified ? `0 0 12px ${GREEN}80` : `0 0 12px ${GOLD}80`,
          }}
        />
      </div>
      {/* Verified overlay: smooth green fade */}
      {verified && (
        <div
          className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none rounded-xl bg-[#22c55e]/25 transition-opacity duration-500"
          style={{ boxShadow: `inset 0 0 60px ${GREEN}40` }}
          aria-live="polite"
        >
          <span className="text-2xl font-black uppercase tracking-wider text-[#22c55e]" style={{ textShadow: `0 0 20px ${GREEN}80` }}>
            Verified
          </span>
        </div>
      )}
      <style dangerouslySetInnerHTML={{
        __html: `
          .biometric-scan-line {
            animation: biometric-scan-line 2.2s ease-in-out infinite;
            top: 18%;
          }
          @keyframes biometric-scan-line {
            0%, 100% { top: 18%; }
            50% { top: 82%; }
          }
        `,
      }} />
    </>
  );

  if (overlay) {
    return (
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-end rounded-xl overflow-hidden z-[15]">
        {content}
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-4 flex flex-col items-center justify-center gap-3 touch-manipulation">
      <div className="relative w-full aspect-video max-h-[40vh] rounded-xl overflow-hidden border-2 border-[#2a2a2e] bg-black/80">
        {content}
      </div>
    </div>
  );
}

/** Pillar status for the four sensors */
export interface QuadPillarStatus {
  pillar1Face: boolean;
  pillar2Palm: boolean;
  pillar3Anchor: boolean;
  pillar4Gps: boolean;
}

export interface QuadPillarGridProps {
  faceVerified: boolean;
  palmVerified: boolean;
  phoneAnchorVerified: boolean;
  locationVerified: boolean;
  /** When location not verified, show this message for GPS pillar (e.g. "Manual Verification Required"). */
  gpsPillarMessage?: string;
  /** GPS stuck >5s — show "Grant Location" button in Pillar 4 box */
  gpsTakingLong?: boolean;
  /** Callback when user taps Grant Location (triggers browser location permission) */
  onGrantLocation?: () => void;
  /** When GPS fails (manual verification required), allow manual city/country entry */
  onManualLocation?: () => void;
}

/** Core Mesh = Pillars 1 (Face), 2 (Palm), 3 (Identity Anchor) verified. Proceed allowed without GPS. */
function coreMeshComplete(face: boolean, palm: boolean, phone: boolean): boolean {
  return face && palm && phone;
}

/** Four pillars in a compact 2x2 grid — no scrolling on mobile. 3/4 mesh: proceed when 1,2,3 done. */
export function QuadPillarGrid({
  faceVerified,
  palmVerified,
  phoneAnchorVerified,
  locationVerified,
  gpsPillarMessage,
  gpsTakingLong = false,
  onGrantLocation,
  onManualLocation,
}: QuadPillarGridProps) {
  const verified = [faceVerified, palmVerified, phoneAnchorVerified, locationVerified];
  const allVerified = verified.every(Boolean);
  const coreMesh = coreMeshComplete(faceVerified, palmVerified, phoneAnchorVerified);

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 gap-3">
        {QUAD_PILLAR_DEFINITIONS.map((pillar, i) => {
          const v = verified[i];
          const isGpsPillar = pillar.id === 4;
          const showGrantButton = isGpsPillar && !v && gpsTakingLong && onGrantLocation;
          const showManualEntry = isGpsPillar && !v && gpsPillarMessage && onManualLocation;
          const pendingMsg = !v && isGpsPillar && gpsPillarMessage ? gpsPillarMessage : gpsTakingLong ? 'Initializing Protocol…' : '…';
          return (
            <div
              key={pillar.id}
              className={`
                flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-200 min-h-[80px]
                ${v ? 'border-[#22c55e] bg-[#22c55e]/10' : 'border-[#2a2a2e] bg-[#1a1a1e]'}
              `}
            >
              <span className="text-lg" aria-hidden>
                {pillar.id === 1 && '👤'}
                {pillar.id === 2 && '🖐️'}
                {pillar.id === 3 && '📱'}
                {pillar.id === 4 && '📍'}
              </span>
              <p className={`text-xs font-bold mt-1 ${v ? 'text-[#22c55e]' : 'text-[#6b6b70]'}`}>
                {pillar.label}
              </p>
              <p className="text-[10px] text-[#6b6b70]">{pillar.sensor}</p>
              <p className={`text-[10px] mt-0.5 font-mono text-center ${v ? 'text-[#22c55e]' : 'text-[#4a4a4e]'}`}>
                {v ? pillar.confirm : isGpsPillar && coreMesh ? (pendingMsg || 'Self-Attested') : pendingMsg}
              </p>
              {showGrantButton && (
                <button
                  type="button"
                  onClick={onGrantLocation}
                  className="mt-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border-2 border-[#D4AF37] bg-[#D4AF37]/20 text-[#D4AF37] hover:bg-[#D4AF37]/30"
                >
                  Grant Location
                </button>
              )}
              {showManualEntry && (
                <button
                  type="button"
                  onClick={onManualLocation}
                  className="mt-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border-2 border-[#6b6b70] text-[#a0a0a5] hover:bg-[#D4AF37]/10 hover:border-[#D4AF37] hover:text-[#D4AF37]"
                >
                  Enter City/Country
                </button>
              )}
            </div>
          );
        })}
      </div>
      {/* Core Mesh (3/4): Sovereign Green — user may proceed; GPS can follow for full Quad. */}
      {coreMesh && !allVerified ? (
        <div
          className="mt-4 relative overflow-hidden rounded-xl border-2 border-[#22c55e] bg-[#22c55e]/10 p-4 transition-all duration-500"
          style={{ boxShadow: '0 0 12px rgba(34,197,94,0.4)' }}
        >
          <p className="relative z-10 text-center text-[#22c55e] text-sm font-bold uppercase tracking-wider">
            Core Mesh Active
          </p>
          <p className="relative z-10 text-center text-[#22c55e]/90 text-xs font-semibold mt-1">
            Face · Palm · Identity Anchor verified. You may proceed. GPS optional for full Quad.
          </p>
        </div>
      ) : null}
      {allVerified ? (
        <div
          className="mt-4 relative overflow-hidden rounded-xl border-2 border-[#22c55e] bg-[#22c55e]/10 p-4 transition-all duration-500"
          style={{ boxShadow: '0 0 15px rgba(255,215,0,0.5)' }}
        >
          <p className="relative z-10 text-center text-[#22c55e] text-sm font-bold uppercase tracking-wider">
            Vitalization Complete
          </p>
          <p className="relative z-10 text-center text-[#22c55e]/90 text-xs font-semibold mt-1">
            I see you. Your hand is true. The device is recognized. You are at your post.
          </p>
          {/* Golden pixel burst — subtle confetti */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden" aria-hidden>
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1.5 h-1.5 rounded-full bg-[#D4AF37] opacity-70 animate-pulse"
                style={{
                  left: '50%',
                  top: '50%',
                  marginLeft: -3,
                  marginTop: -3,
                  animationDelay: `${i * 80}ms`,
                  transform: `translate(${Math.cos((i / 8) * Math.PI * 2) * 50}px, ${Math.sin((i / 8) * Math.PI * 2) * 50}px)`,
                }}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}


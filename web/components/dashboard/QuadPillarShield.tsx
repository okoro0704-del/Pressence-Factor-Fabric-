'use client';

/**
 * Quad-Pillar Shield (Ghost Economy Protocol)
 * Defines the four active sensors: Face (Biometric), Palm (Physical Pattern),
 * Phone (Hardware Anchor), GPS (Geofenced Work-Site).
 * Simple, human confirmations only. Auto-transition to Dashboard when all 4 verified.
 */

import { QUAD_PILLAR_DEFINITIONS } from '@/lib/constants';

const GOLD = '#D4AF37';
const PENDING = 'rgba(107, 107, 112, 0.4)';

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
}

/** Four pillars in a compact 2x2 grid — no scrolling on mobile */
export function QuadPillarGrid({
  faceVerified,
  palmVerified,
  phoneAnchorVerified,
  locationVerified,
  gpsPillarMessage,
}: QuadPillarGridProps) {
  const verified = [faceVerified, palmVerified, phoneAnchorVerified, locationVerified];
  const allVerified = verified.every(Boolean);

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 gap-3">
        {QUAD_PILLAR_DEFINITIONS.map((pillar, i) => {
          const v = verified[i];
          const isGpsPillar = pillar.id === 4;
          const pendingMsg = !v && isGpsPillar && gpsPillarMessage ? gpsPillarMessage : '…';
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
              <p className={`text-[10px] mt-0.5 font-mono ${v ? 'text-[#22c55e]' : 'text-[#4a4a4e]'}`}>
                {v ? pillar.confirm : pendingMsg}
              </p>
            </div>
          );
        })}
      </div>
      {allVerified && (
        <p className="text-center text-[#22c55e] text-xs font-semibold mt-3">
          I see you. Your hand is true. The device is recognized. You are at your post.
        </p>
      )}
    </div>
  );
}


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
  /** GPS stuck >5s — show "Grant Location" button in Pillar 4 box */
  gpsTakingLong?: boolean;
  /** Callback when user taps Grant Location (triggers browser location permission) */
  onGrantLocation?: () => void;
}

/** Four pillars in a compact 2x2 grid — no scrolling on mobile */
export function QuadPillarGrid({
  faceVerified,
  palmVerified,
  phoneAnchorVerified,
  locationVerified,
  gpsPillarMessage,
  gpsTakingLong = false,
  onGrantLocation,
}: QuadPillarGridProps) {
  const verified = [faceVerified, palmVerified, phoneAnchorVerified, locationVerified];
  const allVerified = verified.every(Boolean);

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 gap-3">
        {QUAD_PILLAR_DEFINITIONS.map((pillar, i) => {
          const v = verified[i];
          const isGpsPillar = pillar.id === 4;
          const showGrantButton = isGpsPillar && !v && gpsTakingLong && onGrantLocation;
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
                {v ? pillar.confirm : pendingMsg}
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
            </div>
          );
        })}
      </div>
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


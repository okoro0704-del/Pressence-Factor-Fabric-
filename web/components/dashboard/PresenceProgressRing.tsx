'use client';

/**
 * Triple-Pillar Shield Progress Ring: Sovereign Face → Sovereign Palm → Identity Anchor.
 * Optional 4th segment when ENABLE_GPS_AS_FOURTH_PILLAR. Each segment turns gold when verified. 200ms transition.
 */

import { ENABLE_GPS_AS_FOURTH_PILLAR, PILLAR_LABEL_FACE, PILLAR_LABEL_PALM, PILLAR_LABEL_IDENTITY_ANCHOR, PILLAR_LABEL_GPS } from '@/lib/constants';

const GOLD = '#D4AF37';
const PENDING = 'rgba(107, 107, 112, 0.4)';
const SIZE = 120;
const STROKE = 8;
const R = (SIZE - STROKE) / 2;
const CX = SIZE / 2;
const CY = SIZE / 2;

function segmentPath(startAngle: number, endAngle: number): string {
  const start = (startAngle * Math.PI) / 180;
  const end = (endAngle * Math.PI) / 180;
  const x1 = CX + R * Math.cos(start);
  const y1 = CY + R * Math.sin(start);
  const x2 = CX + R * Math.cos(end);
  const y2 = CY + R * Math.sin(end);
  const large = (endAngle - startAngle) > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2}`;
}

export interface PresenceProgressRingProps {
  faceVerified: boolean;
  palmVerified: boolean;
  phoneAnchorVerified: boolean;
  /** Only used when ENABLE_GPS_AS_FOURTH_PILLAR is true */
  locationVerified?: boolean;
}

export function PresenceProgressRing({
  faceVerified,
  palmVerified,
  phoneAnchorVerified,
  locationVerified = false,
}: PresenceProgressRingProps) {
  const showGpsPillar = ENABLE_GPS_AS_FOURTH_PILLAR;
  const segments = showGpsPillar ? 4 : 3;
  const step = 360 / segments;
  const segmentAngles = Array.from({ length: segments }, (_, i) => ({
    start: i * step,
    end: (i + 1) * step,
    verified:
      (i === 0 && faceVerified) ||
      (i === 1 && palmVerified) ||
      (i === 2 && phoneAnchorVerified) ||
      (i === 3 && locationVerified),
  }));

  return (
    <div className="flex flex-col items-center gap-3">
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="transform -rotate-90"
        aria-hidden
      >
        {segmentAngles.map((seg, i) => (
          <path
            key={i}
            d={segmentPath(seg.start, seg.end)}
            fill="none"
            stroke={seg.verified ? GOLD : PENDING}
            strokeWidth={STROKE}
            strokeLinecap="round"
            className="transition-[stroke] duration-200"
            style={{ filter: seg.verified ? `drop-shadow(0 0 6px ${GOLD}80)` : undefined }}
          />
        ))}
      </svg>
      <div className="flex flex-wrap justify-center gap-2 text-xs">
        <span className={faceVerified ? 'text-[#D4AF37] font-semibold' : 'text-[#6b6b70]'}>
          {PILLAR_LABEL_FACE} {faceVerified ? '✓' : '…'}
        </span>
        <span className="text-[#4a4a4e]">·</span>
        <span className={palmVerified ? 'text-[#D4AF37] font-semibold' : 'text-[#6b6b70]'}>
          {PILLAR_LABEL_PALM} {palmVerified ? '✓' : '…'}
        </span>
        <span className="text-[#4a4a4e]">·</span>
        <span className={phoneAnchorVerified ? 'text-[#D4AF37] font-semibold' : 'text-[#6b6b70]'}>
          {PILLAR_LABEL_IDENTITY_ANCHOR} {phoneAnchorVerified ? '✓' : '…'}
        </span>
        {showGpsPillar && (
          <>
            <span className="text-[#4a4a4e]">·</span>
            <span className={locationVerified ? 'text-[#D4AF37] font-semibold' : 'text-[#6b6b70]'}>
              {PILLAR_LABEL_GPS} {locationVerified ? '✓' : '…'}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

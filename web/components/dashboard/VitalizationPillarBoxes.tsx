'use client';

/**
 * Four boxes at the top of the camera/vitalization page: Face, Palm, GPS, Mobile ID.
 * Vitalization bar turns green and progresses 0→100% as each pillar is verified.
 * At 75% (3/4) the app may save hash, mint, and update status to Vitalized.
 */

const PILLARS = [
  { key: 'face', label: 'Face', icon: '👤' },
  { key: 'palm', label: 'Palm', icon: '🖐️' },
  { key: 'gps', label: 'GPS', icon: '📍' },
  { key: 'mobileId', label: 'Mobile ID', icon: '📱' },
] as const;

const GRAY = '#6b6b70';
const GREEN = '#22c55e';

export interface VitalizationPillarBoxesProps {
  faceVerified: boolean;
  palmVerified: boolean;
  gpsVerified: boolean;
  mobileIdVerified: boolean;
  /** When true, show "Vitalized" state (100% complete) */
  vitalized?: boolean;
}

export function VitalizationPillarBoxes({
  faceVerified,
  palmVerified,
  gpsVerified,
  mobileIdVerified,
  vitalized = false,
}: VitalizationPillarBoxesProps) {
  const verified = [faceVerified, palmVerified, gpsVerified, mobileIdVerified];
  const count = verified.filter(Boolean).length;
  const progressPct = vitalized ? 100 : Math.round((count / 4) * 100);
  const isGreen = progressPct >= 75 || vitalized;

  return (
    <div className="w-full mb-6">
      {/* Four boxes in a row */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {PILLARS.map((pillar, i) => {
          const v = verified[i];
          return (
            <div
              key={pillar.key}
              className="flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-200 min-h-[72px]"
              style={{
                background: v ? `rgba(34, 197, 94, 0.12)` : 'rgba(26, 26, 30, 0.9)',
                borderColor: v ? GREEN : GRAY,
                boxShadow: v ? `0 0 12px ${GREEN}40` : 'none',
              }}
              role="status"
              aria-label={`${pillar.label}: ${v ? 'Verified' : 'Pending'}`}
            >
              <span className="text-2xl leading-none" aria-hidden>
                {pillar.icon}
              </span>
              <p className={`text-xs font-bold mt-1.5 ${v ? 'text-[#22c55e]' : ''}`} style={{ color: v ? GREEN : GRAY }}>
                {pillar.label}
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: GRAY }}>
                {v ? 'Verified' : '…'}
              </p>
            </div>
          );
        })}
      </div>

      {/* Vitalization progress bar — turns green and fills 0–100% */}
      <div className="flex items-center gap-3">
        <div
          className="flex-1 h-3 rounded-full overflow-hidden transition-all duration-500"
          style={{ background: 'rgba(107, 107, 112, 0.25)' }}
          role="progressbar"
          aria-valuenow={progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Vitalization ${progressPct}%`}
        >
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${progressPct}%`,
              background: isGreen
                ? `linear-gradient(90deg, ${GREEN} 0%, ${GREEN} 100%)`
                : `linear-gradient(90deg, #D4AF37 0%, #D4AF37 100%)`,
              boxShadow: isGreen ? `0 0 12px ${GREEN}60` : '0 0 8px rgba(212, 175, 55, 0.4)',
            }}
          />
        </div>
        <span
          className="text-sm font-bold tabular-nums shrink-0 w-10 text-right"
          style={{ color: isGreen ? GREEN : '#D4AF37' }}
        >
          {progressPct}%
        </span>
      </div>
      <p className="text-[10px] mt-1.5 text-center" style={{ color: GRAY }}>
        {progressPct >= 75
          ? vitalized
            ? 'Vitalized — hash saved, mint complete'
            : '75%+ — hash can be saved, minting enabled'
          : 'Complete all pillars to save hash and mint'}
      </p>
    </div>
  );
}

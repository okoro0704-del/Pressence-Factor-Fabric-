'use client';

import { useEffect, useState } from 'react';
import { JetBrains_Mono } from 'next/font/google';
import { ScanLine, Hand, Smartphone, MapPin } from 'lucide-react';
import { getSessionStatus, SessionStatus } from '@/lib/sessionManagement';
import { getTripleAnchorState } from '@/lib/tripleAnchor';
import { ENABLE_GPS_AS_FOURTH_PILLAR } from '@/lib/constants';

const jetbrains = JetBrains_Mono({ weight: ['400', '600', '700'], subsets: ['latin'] });

const GOLD = '#D4AF37';
const GRAY = '#6b6b70';
const GREEN = '#22c55e';
const RED = '#ef4444';

export interface LayerStatusBarProps {
  /** Real-time pillar state from QuadPillarShield — when provided, overrides polled triple anchor */
  faceVerified?: boolean;
  palmVerified?: boolean;
  deviceVerified?: boolean;
  locationVerified?: boolean;
}

/**
 * Quad-Pillar Security Status Bar
 * Face → Palm → Device → GPS. All four must turn Gold when ENABLE_GPS_AS_FOURTH_PILLAR.
 * Real-time sync with QuadPillarShield when pillar props provided.
 */
export function LayerStatusBar({
  faceVerified,
  palmVerified,
  deviceVerified,
  locationVerified = false,
}: LayerStatusBarProps = {}) {
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>(SessionStatus.NO_SESSION);
  const [tripleAnchor, setTripleAnchor] = useState({ face: false, fingerprint: false, device: false });

  useEffect(() => {
    const interval = setInterval(() => {
      const status = getSessionStatus();
      setSessionStatus(status);
      const anchor = getTripleAnchorState();
      const legacyAllVerified = status === SessionStatus.ALL_LAYERS_VERIFIED;
      setTripleAnchor(
        legacyAllVerified
          ? { face: true, fingerprint: true, device: true }
          : anchor
      );
    }, 500);
    return () => clearInterval(interval);
  }, []);

  if (sessionStatus === SessionStatus.NO_SESSION || sessionStatus === SessionStatus.SESSION_EXPIRED) {
    return null;
  }

  const useProps = faceVerified !== undefined || palmVerified !== undefined || deviceVerified !== undefined;
  const face = useProps ? (faceVerified ?? tripleAnchor.face) : tripleAnchor.face;
  const palm = useProps ? (palmVerified ?? tripleAnchor.fingerprint) : tripleAnchor.fingerprint;
  const device = useProps ? (deviceVerified ?? tripleAnchor.device) : tripleAnchor.device;
  const location = useProps ? locationVerified : false;

  const showGps = ENABLE_GPS_AS_FOURTH_PILLAR;
  const totalPillars = showGps ? 4 : 3;
  const verifiedList = showGps ? [face, palm, device, location] : [face, palm, device];
  const count = verifiedList.filter(Boolean).length;
  const allGold = verifiedList.every(Boolean);

  const borderColor = allGold ? GREEN : count >= 1 ? GOLD : RED;
  const statusText = allGold ? (showGps ? 'QUAD ANCHOR VERIFIED' : 'TRIPLE ANCHOR VERIFIED') : `ANCHOR ${count}/${totalPillars}`;
  const subText = allGold ? '1 VIDA Unlocked' : showGps ? 'Face → Palm → Device → GPS' : 'Face → Palm → Device';

  type IconProps = { size?: number; className?: string; 'aria-hidden'?: boolean };
  const icons: { key: string; verified: boolean; Icon: React.ComponentType<IconProps>; label: string }[] = [
    { key: 'face', verified: face, Icon: ScanLine as React.ComponentType<IconProps>, label: 'Face' },
    { key: 'palm', verified: palm, Icon: Hand as React.ComponentType<IconProps>, label: 'Palm' },
    { key: 'device', verified: device, Icon: Smartphone as React.ComponentType<IconProps>, label: 'Device' },
    ...(showGps ? [{ key: 'gps', verified: location, Icon: MapPin as React.ComponentType<IconProps>, label: 'GPS' }] : []),
  ];

  const sovereignGlow = allGold ? '0 0 15px rgba(255,215,0,0.5), 0 0 40px rgba(212,175,55,0.25)' : undefined;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 border-b transition-all duration-500"
      style={{
        background: 'linear-gradient(135deg, rgba(5, 5, 5, 0.95) 0%, rgba(0, 0, 0, 0.98) 100%)',
        borderColor,
        backdropFilter: 'blur(10px)',
        boxShadow: sovereignGlow ?? `0 4px 20px ${borderColor}40`,
      }}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="text-xl sm:text-2xl shrink-0">{allGold ? '✅' : '🔐'}</div>
            <div className="min-w-0">
              <p className={`text-xs sm:text-sm font-black tracking-wider truncate ${jetbrains.className}`} style={{ color: borderColor }}>
                {statusText}
              </p>
              <p className="text-[10px] sm:text-xs truncate" style={{ color: GRAY }}>
                {subText}
              </p>
            </div>
          </div>

          {/* Quad-Pillar icons: Face, Palm, Device, GPS — turn Gold when verified. Mobile: gap-x-2, subtle scaling */}
          <div
            className="flex items-center gap-x-1 sm:gap-x-2 shrink-0"
            role="status"
            aria-label={showGps ? 'Security: Face, Palm, Device, GPS' : 'Security: Face, Palm, Device'}
          >
            {icons.map(({ key, verified, Icon, label }) => (
              <div
                key={key}
                className="flex flex-col items-center justify-center w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg border-2 transition-all duration-200"
                style={{
                  background: verified ? `linear-gradient(135deg, ${GOLD}20 0%, ${GOLD}10 100%)` : 'rgba(0, 0, 0, 0.5)',
                  borderColor: verified ? GOLD : GRAY,
                  boxShadow: verified ? `0 0 15px ${GOLD}40` : 'none',
                }}
                title={`${label}: ${verified ? 'Verified' : 'Pending'}`}
              >
                <Icon size={20} className={`shrink-0 ${verified ? 'text-[#D4AF37]' : 'text-[#6b6b70]'}`} aria-hidden />
                <span className="text-[9px] sm:text-[10px] mt-0.5 truncate max-w-full" style={{ color: verified ? GOLD : GRAY }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-1.5 sm:mt-2 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(107, 107, 112, 0.2)' }}>
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${(count / totalPillars) * 100}%`,
              background: `linear-gradient(90deg, ${borderColor} 0%, ${borderColor}80 100%)`,
              boxShadow: `0 0 10px ${borderColor}60`,
            }}
          />
        </div>
      </div>
    </div>
  );
}


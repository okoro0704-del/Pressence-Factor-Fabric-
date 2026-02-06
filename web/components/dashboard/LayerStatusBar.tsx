'use client';

import { useEffect, useState } from 'react';
import { JetBrains_Mono } from 'next/font/google';
import { ScanLine, Hand, Smartphone } from 'lucide-react';
import { getSessionStatus, SessionStatus } from '@/lib/sessionManagement';
import { getTripleAnchorState } from '@/lib/tripleAnchor';

const jetbrains = JetBrains_Mono({ weight: ['400', '600', '700'], subsets: ['latin'] });

const GOLD = '#D4AF37';
const GRAY = '#6b6b70';
const GREEN = '#22c55e';
const RED = '#ef4444';

/**
 * Triple-Anchor Security Status Bar
 * Shows three icons: Face, Palm, Device. All three must turn Gold before 1 VIDA is unlocked.
 * Second pillar is Palm Pulse (contactless); state key remains "fingerprint" for backward compat.
 */
export function LayerStatusBar() {
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>(SessionStatus.NO_SESSION);
  const [tripleAnchor, setTripleAnchor] = useState({ face: false, fingerprint: false, device: false });

  useEffect(() => {
    const interval = setInterval(() => {
      const status = getSessionStatus();
      setSessionStatus(status);
      const anchor = getTripleAnchorState();
      // Legacy: when old 4-layer flow is fully verified, show all three anchors Gold
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

  const allGold = tripleAnchor.face && tripleAnchor.fingerprint && tripleAnchor.device;
  const count = [tripleAnchor.face, tripleAnchor.fingerprint, tripleAnchor.device].filter(Boolean).length;
  const borderColor = allGold ? GREEN : count >= 1 ? GOLD : RED;
  const statusText = allGold ? 'TRIPLE ANCHOR VERIFIED' : `ANCHOR ${count}/3`;
  const subText = allGold ? '1 VIDA Unlocked' : 'Face → Palm → Device';

  type IconProps = { size?: number; className?: string; 'aria-hidden'?: boolean };
  const icons: { key: 'face' | 'fingerprint' | 'device'; verified: boolean; Icon: React.ComponentType<IconProps>; label: string }[] = [
    { key: 'face', verified: tripleAnchor.face, Icon: ScanLine as React.ComponentType<IconProps>, label: 'Face' },
    { key: 'fingerprint', verified: tripleAnchor.fingerprint, Icon: Hand as React.ComponentType<IconProps>, label: 'Palm' },
    { key: 'device', verified: tripleAnchor.device, Icon: Smartphone as React.ComponentType<IconProps>, label: 'Device' },
  ];

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 border-b"
      style={{
        background: 'linear-gradient(135deg, rgba(5, 5, 5, 0.95) 0%, rgba(0, 0, 0, 0.98) 100%)',
        borderColor,
        backdropFilter: 'blur(10px)',
        boxShadow: `0 4px 20px ${borderColor}40`,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl">{allGold ? '✅' : '🔐'}</div>
            <div>
              <p className={`text-sm font-black tracking-wider ${jetbrains.className}`} style={{ color: borderColor }}>
                {statusText}
              </p>
              <p className="text-xs" style={{ color: GRAY }}>
                {subText}
              </p>
            </div>
          </div>

          {/* Triple-Anchor icons: Face, Palm, Device — turn Gold when verified */}
          <div className="flex items-center gap-2" role="status" aria-label="Security: Face, Palm, Device">
            {icons.map(({ key, verified, Icon, label }) => (
              <div
                key={key}
                className="flex flex-col items-center justify-center w-12 h-12 rounded-lg border-2 transition-all"
                style={{
                  background: verified ? `linear-gradient(135deg, ${GOLD}20 0%, ${GOLD}10 100%)` : 'rgba(0, 0, 0, 0.5)',
                  borderColor: verified ? GOLD : GRAY,
                  boxShadow: verified ? `0 0 15px ${GOLD}40` : 'none',
                }}
                title={`${label}: ${verified ? 'Verified' : 'Pending'}`}
              >
                <Icon size={22} className={verified ? 'text-[#D4AF37]' : 'text-[#6b6b70]'} aria-hidden />
                <span className="text-[10px] mt-0.5" style={{ color: verified ? GOLD : GRAY }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(107, 107, 112, 0.2)' }}>
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${(count / 3) * 100}%`,
              background: `linear-gradient(90deg, ${borderColor} 0%, ${borderColor}80 100%)`,
              boxShadow: `0 0 10px ${borderColor}60`,
            }}
          />
        </div>
      </div>
    </div>
  );
}


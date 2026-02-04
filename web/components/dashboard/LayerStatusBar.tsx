'use client';

import { useEffect, useState } from 'react';
import { JetBrains_Mono } from 'next/font/google';
import { getSessionStatus, SessionStatus } from '@/lib/sessionManagement';

const jetbrains = JetBrains_Mono({ weight: ['400', '600', '700'], subsets: ['latin'] });

/**
 * 4/4 LAYERS VERIFIED STATUS BAR
 * Displays security status at top of screen
 * Shows user that all 4 layers are active
 */
export function LayerStatusBar() {
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>(SessionStatus.NO_SESSION);
  const [layersVerified, setLayersVerified] = useState(0);

  useEffect(() => {
    // Update session status every second
    const interval = setInterval(() => {
      const status = getSessionStatus();
      setSessionStatus(status);

      // Calculate layers verified
      switch (status) {
        case SessionStatus.ALL_LAYERS_VERIFIED:
          setLayersVerified(4);
          break;
        case SessionStatus.LAYER_4_PENDING:
          setLayersVerified(3);
          break;
        case SessionStatus.LAYER_3_PENDING:
          setLayersVerified(2);
          break;
        case SessionStatus.LAYER_2_PENDING:
          setLayersVerified(1);
          break;
        default:
          setLayersVerified(0);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Only show status bar if session exists
  if (sessionStatus === SessionStatus.NO_SESSION || sessionStatus === SessionStatus.SESSION_EXPIRED) {
    return null;
  }

  const getStatusColor = () => {
    if (layersVerified === 4) return '#22c55e'; // Green
    if (layersVerified >= 2) return '#D4AF37'; // Gold
    return '#ef4444'; // Red
  };

  const getStatusText = () => {
    if (layersVerified === 4) return 'ALL LAYERS VERIFIED';
    return `LAYER ${layersVerified}/4 VERIFIED`;
  };

  const getStatusIcon = () => {
    if (layersVerified === 4) return '✅';
    return '🔐';
  };

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 border-b"
      style={{
        background: 'linear-gradient(135deg, rgba(5, 5, 5, 0.95) 0%, rgba(0, 0, 0, 0.98) 100%)',
        borderColor: getStatusColor(),
        backdropFilter: 'blur(10px)',
        boxShadow: `0 4px 20px ${getStatusColor()}40`,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left: Status Icon & Text */}
          <div className="flex items-center gap-3">
            <div className="text-2xl">{getStatusIcon()}</div>
            <div>
              <p
                className={`text-sm font-black tracking-wider ${jetbrains.className}`}
                style={{ color: getStatusColor() }}
              >
                {getStatusText()}
              </p>
              <p className="text-xs" style={{ color: '#6b6b70' }}>
                {layersVerified === 4
                  ? 'Sovereign Vault Unlocked'
                  : 'Authentication in progress...'}
              </p>
            </div>
          </div>

          {/* Right: Layer Indicators */}
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((layer) => (
              <div
                key={layer}
                className="flex items-center justify-center w-10 h-10 rounded-lg border-2 transition-all"
                style={{
                  background:
                    layersVerified >= layer
                      ? `linear-gradient(135deg, ${getStatusColor()}20 0%, ${getStatusColor()}10 100%)`
                      : 'rgba(0, 0, 0, 0.5)',
                  borderColor: layersVerified >= layer ? getStatusColor() : '#6b6b70',
                  boxShadow:
                    layersVerified >= layer ? `0 0 15px ${getStatusColor()}40` : 'none',
                }}
              >
                <span
                  className={`text-xs font-black ${jetbrains.className}`}
                  style={{
                    color: layersVerified >= layer ? getStatusColor() : '#6b6b70',
                  }}
                >
                  {layer}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Progress Bar */}
        <div
          className="mt-2 h-1 rounded-full overflow-hidden"
          style={{ background: 'rgba(107, 107, 112, 0.2)' }}
        >
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${(layersVerified / 4) * 100}%`,
              background: `linear-gradient(90deg, ${getStatusColor()} 0%, ${getStatusColor()}80 100%)`,
              boxShadow: `0 0 10px ${getStatusColor()}60`,
            }}
          />
        </div>
      </div>
    </div>
  );
}


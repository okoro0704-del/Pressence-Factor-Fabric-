'use client';

import { useState, useEffect } from 'react';

interface NationalScaleTickerProps {
  activeSovereignNodes?: number;
}

/**
 * NATIONAL SCALE TICKER
 * Bottom ticker showing active sovereign nodes — Presence Factor Fabric
 */
export function NationalScaleTicker({ activeSovereignNodes = 220_000_000 }: NationalScaleTickerProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [count, setCount] = useState(0);

  // Animate count on mount
  useEffect(() => {
    const duration = 2000; // 2 seconds
    const steps = 60;
    const increment = activeSovereignNodes / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      setCount(Math.floor(increment * currentStep));
      
      if (currentStep >= steps) {
        setCount(activeSovereignNodes);
        clearInterval(timer);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [activeSovereignNodes]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-r from-[#0d0d0f] via-[#16161a] to-[#0d0d0f] border-t-2 border-[#EE3124]/50 shadow-2xl shadow-[#EE3124]/20">
      {/* Animated Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#EE3124]/5 via-[#EE3124]/10 to-[#EE3124]/5 animate-pulse" />
      
      {/* Ticker Content */}
      <div className="relative z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Left: Active Nodes */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-3 h-3 bg-[#00ff41] rounded-full animate-pulse shadow-lg shadow-[#00ff41]/50" />
                <div className="absolute inset-0 w-3 h-3 bg-[#00ff41] rounded-full animate-ping" />
              </div>
              <span className="text-xs font-bold text-[#00ff41] uppercase tracking-wider">LIVE</span>
            </div>

            <div className="h-6 w-px bg-[#2a2a2e]" />

            <div className="flex items-center gap-3">
              <span className="text-2xl">🌍</span>
              <div>
                <p className="text-xs text-[#6b6b70] uppercase tracking-wide">Active Sovereign Nodes</p>
                <p className="text-2xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-[#e8c547] via-[#ffd700] to-[#e8c547]">
                  {count.toLocaleString('en-US')}
                </p>
              </div>
            </div>
          </div>

          {/* Center: UBA Liquidity Bridge */}
          <div className="hidden md:flex items-center gap-3 px-6 py-2 bg-[#EE3124]/10 border border-[#EE3124]/30 rounded-lg backdrop-blur-sm">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#EE3124]/30 to-[#EE3124]/10 backdrop-blur-md border border-[#EE3124]/50 flex items-center justify-center">
              <span className="text-sm font-black text-[#D4AF37]">PFF</span>
            </div>
            <div>
              <p className="text-xs font-bold text-[#EE3124] uppercase tracking-wider">Powered by</p>
              <p className="text-sm font-bold text-[#f5f5f5]">Presence Factor Fabric</p>
            </div>
          </div>

          {/* Right: Network Stats */}
          <div className="hidden lg:flex items-center gap-6">
            <div className="text-right">
              <p className="text-xs text-[#6b6b70] uppercase tracking-wide">Network Uptime</p>
              <p className="text-lg font-bold text-[#00ff41]">99.99%</p>
            </div>

            <div className="h-6 w-px bg-[#2a2a2e]" />

            <div className="text-right">
              <p className="text-xs text-[#6b6b70] uppercase tracking-wide">Transactions/Sec</p>
              <p className="text-lg font-bold text-[#e8c547]">12,847</p>
            </div>

            <div className="h-6 w-px bg-[#2a2a2e]" />

            <div className="text-right">
              <p className="text-xs text-[#6b6b70] uppercase tracking-wide">Total Volume (24h)</p>
              <p className="text-lg font-bold text-[#f5f5f5]">₦2.4B</p>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={() => setIsVisible(false)}
            className="ml-4 w-8 h-8 rounded-full bg-[#2a2a2e] hover:bg-[#3a3a3e] text-[#6b6b70] hover:text-[#f5f5f5] flex items-center justify-center transition-colors text-xs"
            title="Hide ticker"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Mobile View */}
      <div className="md:hidden relative z-10 px-4 py-3 border-t border-[#2a2a2e]">
        <div className="flex items-center justify-center gap-2 text-center">
          <span className="text-xs text-[#6b6b70]">Powered by</span>
          <span className="text-xs font-bold text-[#D4AF37]">Presence Factor Fabric</span>
          <span className="text-xs text-[#6b6b70]">•</span>
          <span className="text-xs text-[#00ff41]">99.99% Uptime</span>
        </div>
      </div>
    </div>
  );
}


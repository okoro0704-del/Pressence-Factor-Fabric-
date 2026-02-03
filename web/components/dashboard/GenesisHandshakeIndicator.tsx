'use client';

import { useEffect, useState } from 'react';
import { checkPresenceVerified } from '@/lib/withPresenceCheck';

interface GenesisHandshakeIndicatorProps {
  onTriggerScan?: () => void;
}

/**
 * Genesis Handshake Indicator
 * Shows interlocking hands icon that glows Gold when presence verified, Grey when not
 */
export function GenesisHandshakeIndicator({ onTriggerScan }: GenesisHandshakeIndicatorProps) {
  const [isVerified, setIsVerified] = useState(false);
  const [timestamp, setTimestamp] = useState<Date | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    checkStatus();
    
    // Check status every 30 seconds
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkStatus = async () => {
    const result = await checkPresenceVerified();
    setIsVerified(result.verified);
    setTimestamp(result.timestamp || null);
  };

  const handleClick = () => {
    if (!isVerified && onTriggerScan) {
      onTriggerScan();
    }
  };

  const getTimeRemaining = () => {
    if (!timestamp) return '';
    const now = new Date();
    const elapsed = now.getTime() - timestamp.getTime();
    const remaining = 24 * 60 * 60 * 1000 - elapsed; // 24 hours
    const hours = Math.floor(remaining / (60 * 60 * 1000));
    return `${hours}h remaining`;
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={handleClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`relative flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all duration-300 ${
          isVerified
            ? 'border-[#e8c547] bg-[#e8c547]/10 hover:bg-[#e8c547]/20'
            : 'border-[#6b6b70] bg-[#6b6b70]/10 hover:bg-[#6b6b70]/20 cursor-pointer'
        }`}
        style={{
          boxShadow: isVerified
            ? '0 0 60px rgba(232, 197, 71, 0.6)'
            : '0 0 20px rgba(107, 107, 112, 0.2)',
        }}
      >
        {/* Interlocking Hands Icon */}
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`transition-all duration-300 ${
            isVerified ? 'animate-pulse' : ''
          }`}
        >
          {/* Left Hand */}
          <path
            d="M8 11C8 11 6 11 6 13C6 15 8 15 8 15L10 15C10 15 12 15 12 13C12 11 10 11 10 11"
            stroke={isVerified ? '#e8c547' : '#6b6b70'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Right Hand */}
          <path
            d="M16 11C16 11 18 11 18 13C18 15 16 15 16 15L14 15C14 15 12 15 12 13C12 11 14 11 14 11"
            stroke={isVerified ? '#e8c547' : '#6b6b70'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Connection Point */}
          <circle
            cx="12"
            cy="13"
            r="2"
            fill={isVerified ? '#e8c547' : '#6b6b70'}
            className={isVerified ? 'animate-pulse' : ''}
          />
        </svg>

        {/* Status Text */}
        <div className="flex flex-col items-start">
          <span
            className={`text-xs font-bold uppercase tracking-wider ${
              isVerified ? 'text-[#e8c547]' : 'text-[#6b6b70]'
            }`}
          >
            {isVerified ? 'Genesis Verified' : 'Not Verified'}
          </span>
          {isVerified && timestamp && (
            <span className="text-[9px] text-[#e8c547]/70">
              {getTimeRemaining()}
            </span>
          )}
        </div>

        {/* Glow Effect (only when verified) */}
        {isVerified && (
          <div className="absolute inset-0 bg-gradient-to-r from-[#e8c547]/20 via-[#e8c547]/10 to-[#e8c547]/20 rounded-lg blur-xl animate-pulse" />
        )}
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 z-50 w-64 px-4 py-3 bg-[#1a1a1e] border border-[#2a2a2e] rounded-lg shadow-2xl">
          <p className="text-xs text-[#f5f5f5] font-semibold mb-1">
            {isVerified ? '✅ Genesis Handshake Complete' : '⚠️ Genesis Handshake Required'}
          </p>
          <p className="text-[10px] text-[#6b6b70] leading-relaxed">
            {isVerified
              ? `Presence verified at ${timestamp?.toLocaleString()}. All transactions enabled.`
              : 'Complete biometric scan to unlock Send, Swap, and Bank operations.'}
          </p>
          {!isVerified && (
            <p className="text-[10px] text-[#e8c547] mt-2 font-semibold">
              Click to start verification
            </p>
          )}
        </div>
      )}
    </div>
  );
}


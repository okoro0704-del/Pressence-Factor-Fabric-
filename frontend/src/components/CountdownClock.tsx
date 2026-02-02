/**
 * PFF Frontend — Countdown Clock Component
 * Massive center-aligned countdown to Feb 7, 2026 07:00:00 WAT
 * Architect: Isreal Okoro (mrfundzman)
 */

import React, { useState, useEffect } from 'react';
import { getTimeUntilUnveiling, getUnveilingDateFormatted, TimeRemaining } from '../utils/stasisLock';

interface CountdownClockProps {
  variant?: 'large' | 'compact';
  showTitle?: boolean;
}

export const CountdownClock: React.FC<CountdownClockProps> = ({ 
  variant = 'large',
  showTitle = true 
}) => {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>(getTimeUntilUnveiling());

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(getTimeUntilUnveiling());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!timeRemaining.isLocked) {
    return (
      <div className="countdown-clock unveiled">
        <div className="countdown-title">🏛️ THE SOVEREIGN UNVEILING</div>
        <div className="countdown-status">SYSTEM LIVE</div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="countdown-clock compact">
        <div className="countdown-compact-display">
          <span className="countdown-label">Unveiling in:</span>
          <span className="countdown-time">
            {String(timeRemaining.days).padStart(2, '0')}d{' '}
            {String(timeRemaining.hours).padStart(2, '0')}h{' '}
            {String(timeRemaining.minutes).padStart(2, '0')}m{' '}
            {String(timeRemaining.seconds).padStart(2, '0')}s
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="countdown-clock large">
      {showTitle && (
        <div className="countdown-title">
          🏛️ THE SOVEREIGN UNVEILING
        </div>
      )}
      
      <div className="countdown-subtitle">
        {getUnveilingDateFormatted()}
      </div>

      <div className="countdown-display">
        <div className="countdown-unit">
          <div className="countdown-value">{String(timeRemaining.days).padStart(2, '0')}</div>
          <div className="countdown-label">DAYS</div>
        </div>

        <div className="countdown-separator">:</div>

        <div className="countdown-unit">
          <div className="countdown-value">{String(timeRemaining.hours).padStart(2, '0')}</div>
          <div className="countdown-label">HOURS</div>
        </div>

        <div className="countdown-separator">:</div>

        <div className="countdown-unit">
          <div className="countdown-value">{String(timeRemaining.minutes).padStart(2, '0')}</div>
          <div className="countdown-label">MINUTES</div>
        </div>

        <div className="countdown-separator">:</div>

        <div className="countdown-unit">
          <div className="countdown-value">{String(timeRemaining.seconds).padStart(2, '0')}</div>
          <div className="countdown-label">SECONDS</div>
        </div>
      </div>

      <div className="countdown-message">
        ⏳ All MINT, SWAP, and ACTIVATE operations are locked until unveiling
      </div>
    </div>
  );
};

export default CountdownClock;


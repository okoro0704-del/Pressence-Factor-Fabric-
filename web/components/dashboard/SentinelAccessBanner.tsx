'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getSessionSecurityWarning } from '@/lib/sessionManagement';
import { getIdentityAnchorPhone, isSentinelActive } from '@/lib/sentinelActivation';

const BANNER_TEXT = '⚠️ FUND ACCESS LIMITED: Activate your Sentinel to enable full DLLR functionality.';

/**
 * Notification badge at top of screen when Sentinel is not active.
 * Shown on Dashboard so user sees fund access is limited until Sentinel is activated.
 */
export function SentinelAccessBanner() {
  const [show, setShow] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    const w = getSessionSecurityWarning();
    if (w) {
      setWarning(w);
      setShow(true);
      return;
    }
    const phone = getIdentityAnchorPhone();
    if (!phone) return;
    isSentinelActive(phone).then((active) => {
      setShow(!active);
      if (!active) setWarning(BANNER_TEXT);
    });
  }, []);

  if (!show || !warning) return null;

  return (
    <div
      className="w-full py-3 px-4 flex items-center justify-center gap-3 flex-wrap text-center border-b"
      style={{
        background: 'rgba(245, 158, 11, 0.15)',
        borderColor: 'rgba(245, 158, 11, 0.4)',
        color: '#f59e0b',
      }}
      role="alert"
    >
      <span className="font-semibold text-sm">{warning}</span>
      <Link
        href="/sentinel"
        className="text-sm font-bold underline hover:no-underline whitespace-nowrap"
        style={{ color: '#f59e0b' }}
      >
        Activate Sentinel →
      </Link>
    </div>
  );
}

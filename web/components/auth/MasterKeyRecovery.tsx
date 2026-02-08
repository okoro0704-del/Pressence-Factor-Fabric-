'use client';

/**
 * Master Key Recovery step — shows seed verification or "Complete Face Pulse first".
 * On mount: if face hash exists in LocalStorage (from Scanner), hide the "Complete Face Pulse first" error
 * so the Architect is not blocked.
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getPersistentFaceHash, syncPersistentFaceHashToSession } from '@/lib/biometricAnchorSync';
import { getIdentityAnchorPhone } from '@/lib/sentinelActivation';

export interface MasterKeyRecoveryProps {
  /** Content to show when hash is present (e.g. seed verification form). */
  children: React.ReactNode;
  /** Message when hash is missing and we would normally show "Complete Face Pulse first". */
  completeFacePulseMessage?: string;
  /** If true, always show children and use hasFaceHash only to clear error in parent. */
  alwaysShowChildren?: boolean;
}

/**
 * On mount, checks LocalStorage for persistent face hash.
 * If present: syncs to session for current phone and sets hasFaceHash so "Complete Face Pulse first" can be hidden.
 */
export function MasterKeyRecovery({
  children,
  completeFacePulseMessage = 'Complete Face Pulse first. Face hash is required before saving recovery seed.',
  alwaysShowChildren = false,
}: MasterKeyRecoveryProps) {
  const [hasFaceHash, setHasFaceHash] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const persistent = getPersistentFaceHash();
    if (persistent?.faceHash) {
      setHasFaceHash(true);
      const phone = getIdentityAnchorPhone();
      if (phone?.trim()) syncPersistentFaceHashToSession(phone.trim());
    }
    setChecked(true);
  }, []);

  if (!checked) {
    return (
      <div className="min-h-[120px] flex items-center justify-center p-6">
        <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!hasFaceHash && !alwaysShowChildren) {
    return (
      <div className="rounded-2xl border-2 border-amber-500/50 bg-[#0d0d0f] p-8 max-w-md mx-auto text-center">
        <p className="text-[#e8c547] font-medium mb-2">Master Key — Step 2/4</p>
        <p className="text-[#a0a0a5] text-sm mb-6">{completeFacePulseMessage}</p>
        <Link
          href="/vitalization"
          className="inline-block w-full py-3 rounded-xl bg-[#c9a227] text-black font-bold uppercase tracking-wider hover:opacity-95 text-center"
        >
          Complete Face Pulse first
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}

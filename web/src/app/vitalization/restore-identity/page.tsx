'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getVitalizationAnchor } from '@/lib/vitalizationAnchor';
import { getIdentityAnchorPhone } from '@/lib/sentinelActivation';
import { ROUTES } from '@/lib/constants';
import { useEffect, useState } from 'react';

/**
 * Restore Identity — Shown when citizen_record exists in Supabase (face_hash) but local_hash (vitalization anchor) is missing.
 * User can re-scan face to restore local anchor from Supabase, or continue to full vitalization flow.
 */
export default function RestoreIdentityPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getVitalizationAnchor().then((anchor) => {
      if (cancelled) return;
      if (anchor.isVitalized && anchor.citizenHash) {
        router.replace(ROUTES.DASHBOARD);
        return;
      }
      setChecking(false);
    });
    return () => { cancelled = true; };
  }, [router]);

  const phone = typeof window !== 'undefined' ? getIdentityAnchorPhone() : null;
  if (!phone && !checking) {
    router.replace(ROUTES.VITALIZATION);
    return null;
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]" style={{ color: '#6b6b70' }}>
        <p className="text-sm">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] p-4">
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 40%, rgba(212, 175, 55, 0.15) 0%, transparent 60%)' }}
        aria-hidden
      />
      <h1 className="relative z-10 text-xl font-bold text-[#D4AF37] mb-2 text-center">
        Restore Identity
      </h1>
      <p className="relative z-10 text-sm text-center max-w-sm text-[#a0a0a5] mb-8">
        Your identity exists on the Ledger but this device is not yet anchored. Complete the flow below to secure this device.
      </p>
      <div className="relative z-10 flex flex-col gap-4 w-full max-w-xs">
        <Link
          href="/"
          className="w-full py-3 rounded-xl font-semibold text-center transition-colors border-2 border-[#D4AF37] bg-[#D4AF37]/20 text-[#D4AF37] hover:bg-[#D4AF37]/30"
        >
          Scan face at Gate
        </Link>
        <Link
          href="/vitalization"
          className="w-full py-3 rounded-xl font-semibold text-center transition-colors border border-[#6b6b70] text-[#a0a0a5] hover:border-[#D4AF37] hover:text-[#D4AF37]"
        >
          Full Vitalization flow
        </Link>
      </div>
    </div>
  );
}

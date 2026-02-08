'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { VitalizationScreen } from '@/components/VitalizationScreen';
import { SovereignGuardRedirect } from '@/components/dashboard/SovereignGuardRedirect';
import { getVitalizationStatus } from '@/lib/vitalizationState';
import { ROUTES } from '@/lib/constants';

/**
 * Block re-vitalization: if user (phone) already has citizen_hash (face_hash) in Supabase,
 * do NOT show registration flow. Force Device Handshake (link-device) instead.
 */
export function VitalizationPageClient() {
  const router = useRouter();
  const [allowRegistration, setAllowRegistration] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    getVitalizationStatus().then((status) => {
      if (cancelled) return;
      if (status === 'vitalized') {
        router.replace(ROUTES.DASHBOARD ?? '/dashboard');
        return;
      }
      if (status === 'needs_restore') {
        router.replace('/link-device');
        return;
      }
      setAllowRegistration(status === 'no_citizen_record' || status === 'no_user');
    });
    return () => { cancelled = true; };
  }, [router]);

  if (allowRegistration === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]" style={{ color: '#6b6b70' }}>
        <p className="text-sm">Checking identity…</p>
      </div>
    );
  }

  if (!allowRegistration) {
    return null;
  }

  return (
    <SovereignGuardRedirect>
      <VitalizationScreen />
    </SovereignGuardRedirect>
  );
}

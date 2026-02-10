'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/dashboard/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { SovereignPulseBar } from '@/components/dashboard/SovereignPulseBar';
import { VitalizationRequestListener } from '@/components/dashboard/VitalizationRequestListener';
import { LoginRequestListener } from '@/components/dashboard/LoginRequestListener';
import { getIdentityAnchorPhone } from '@/lib/sentinelActivation';
import { setVitalizationComplete, shouldNeverRedirectBack } from '@/lib/vitalizationState';
import { isArchitect } from '@/lib/manifestoUnveiling';
import { getCitizenStatusForPhone } from '@/lib/supabaseTelemetry';
import { mintFoundationSeigniorage } from '@/lib/foundationSeigniorage';

/** Dashboard = overview: Pulse bar. Use bottom tab for Wallet, Treasury, Settings. */
export default function DashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [identityPhone, setIdentityPhone] = useState<string | null>(null);
  const [accessChecked, setAccessChecked] = useState(false);
  const [vitalizedOrArchitect, setVitalizedOrArchitect] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) setVitalizationComplete();
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    let cancelled = false;
    (async () => {
      if (isArchitect()) {
        if (!cancelled) {
          setVitalizedOrArchitect(true);
          setAccessChecked(true);
        }
        return;
      }
      const phone = getIdentityAnchorPhone();
      if (!phone && !shouldNeverRedirectBack()) {
        if (!cancelled) {
          setAccessChecked(true);
          router.replace('/');
        }
        return;
      }
      if (phone) {
        const status = await getCitizenStatusForPhone(phone);
        if (status === 'VITALIZED') {
          setVitalizationComplete();
          mintFoundationSeigniorage(phone).catch(() => {});
        }
      }
      if (!cancelled) {
        setVitalizedOrArchitect(true);
        setAccessChecked(true);
      }
    })();
    return () => { cancelled = true; };
  }, [mounted, router]);

  useEffect(() => {
    if (mounted) setIdentityPhone(getIdentityAnchorPhone());
  }, [mounted]);

  if (!mounted || !accessChecked) {
    return null;
  }

  if (!vitalizedOrArchitect) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]" style={{ color: '#6b6b70' }}>
        <p className="text-sm">Redirecting…</p>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <AppShell>
        <main className="min-h-screen bg-[#0d0d0f] pb-24 md:pb-8 flex flex-col">
          <header className="shrink-0 border-b border-[#2a2a2e] bg-[#16161a]/95 backdrop-blur px-4 py-3 safe-area-top">
            <h1 className="text-lg font-bold bg-gradient-to-r from-[#e8c547] to-[#c9a227] bg-clip-text text-transparent">
              PFF Dashboard
            </h1>
            <p className="text-xs text-[#6b6b70] mt-0.5">Use the tabs below for Wallet, Treasury, Settings</p>
          </header>
          <div className="flex-1 p-4 md:p-6 max-w-2xl mx-auto w-full">
            <SovereignPulseBar className="mb-6" />
          </div>
        </main>
        {identityPhone && <VitalizationRequestListener phoneNumber={identityPhone} />}
        {identityPhone && <LoginRequestListener phoneNumber={identityPhone} />}
      </AppShell>
    </ProtectedRoute>
  );
}

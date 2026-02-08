'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/dashboard/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { SovereignPulseBar } from '@/components/dashboard/SovereignPulseBar';
import { VitalizationRequestListener } from '@/components/dashboard/VitalizationRequestListener';
import { LoginRequestListener } from '@/components/dashboard/LoginRequestListener';
import { getIdentityAnchorPhone } from '@/lib/sentinelActivation';
import { setVitalizationComplete, shouldNeverRedirectBack } from '@/lib/vitalizationState';
import { isArchitect } from '@/lib/manifestoUnveiling';
import { Landmark, Wallet } from 'lucide-react';

const GOLD = '#D4AF37';

/** Dashboard = overview: Pulse bar + links to Wallet (citizen) and Treasury (country). */
export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
            <p className="text-xs text-[#6b6b70] mt-0.5">Overview · Wallet · National Treasury</p>
          </header>
          <div className="flex-1 p-4 md:p-6 max-w-2xl mx-auto w-full">
            <SovereignPulseBar className="mb-6" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link
                href="/wallet/"
                className="rounded-2xl border-2 p-6 flex flex-col items-center justify-center gap-3 transition-colors hover:border-[#D4AF37]/60"
                style={{ borderColor: 'rgba(212,175,55,0.4)', background: 'rgba(212,175,55,0.08)' }}
              >
                <Wallet className="w-12 h-12" style={{ color: GOLD }} />
                <span className="text-lg font-bold uppercase tracking-wider" style={{ color: GOLD }}>Your Wallet</span>
                <p className="text-xs text-[#6b6b70] text-center">Balance, VIDA, Merchant Mode, Family Vault</p>
              </Link>
              <Link
                href="/treasury/"
                className="rounded-2xl border-2 p-6 flex flex-col items-center justify-center gap-3 transition-colors hover:border-[#D4AF37]/60"
                style={{ borderColor: 'rgba(212,175,55,0.4)', background: 'rgba(212,175,55,0.08)' }}
              >
                <Landmark className="w-12 h-12" style={{ color: GOLD }} />
                <span className="text-lg font-bold uppercase tracking-wider" style={{ color: GOLD }}>National Treasury</span>
                <p className="text-xs text-[#6b6b70] text-center">Country reserve, elections, block command</p>
              </Link>
            </div>
          </div>
        </main>
        {identityPhone && <VitalizationRequestListener phoneNumber={identityPhone} />}
        {identityPhone && <LoginRequestListener phoneNumber={identityPhone} />}
      </AppShell>
    </ProtectedRoute>
  );
}

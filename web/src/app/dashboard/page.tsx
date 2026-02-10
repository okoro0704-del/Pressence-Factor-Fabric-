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
import { getIdCardProfile } from '@/lib/humanityScore';
import { getWelcomeToVitalieGreeting } from '@/lib/timeGreeting';
import { fetchLedgerStats } from '@/lib/ledgerStats';
import { subscribeToLedgerSync } from '@/lib/backendRealtimeSync';

/** Dashboard = overview: greeting, PFF Grand Total, Pulse bar. */
export default function DashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [identityPhone, setIdentityPhone] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [grandBalanceUsd, setGrandBalanceUsd] = useState<number | null>(null);
  const [accessChecked, setAccessChecked] = useState(false);
  const [vitalizedOrArchitect, setVitalizedOrArchitect] = useState(false);
  const [mintError, setMintError] = useState<string | null>(null);

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
          mintFoundationSeigniorage(phone, { citizenId: phone }).then((res) => {
            if (!res.ok && !cancelled) {
              console.error('[Dashboard] Mint not confirmed:', res.error);
              setMintError(res.error);
            }
          }).catch((err) => {
            if (!cancelled) {
              const msg = err?.message ?? String(err);
              console.error('[Dashboard] Mint failed:', msg);
              setMintError(msg);
            }
          });
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

  useEffect(() => {
    if (!identityPhone) return;
    getIdCardProfile(identityPhone).then((res) => {
      if (res.ok && res.profile.full_name) setDisplayName(res.profile.full_name);
    });
  }, [identityPhone]);

  useEffect(() => {
    if (!mounted || !vitalizedOrArchitect) return;
    const refresh = () => fetchLedgerStats().then((s) => setGrandBalanceUsd(s.nationalReserveUsd));
    refresh();
    const unsub = subscribeToLedgerSync(refresh);
    return () => unsub();
  }, [mounted, vitalizedOrArchitect]);


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
          <header className="shrink-0 border-b border-[#2a2a2e] bg-[#16161a]/95 backdrop-blur px-4 py-3 safe-area-top flex flex-wrap items-center justify-between gap-3">
            <p className="text-base font-bold text-[#e8c547]" aria-live="polite">
              {getWelcomeToVitalieGreeting(displayName)}
            </p>
            {grandBalanceUsd != null && (
              <div className="text-right shrink-0">
                <p className="text-[10px] uppercase tracking-widest text-[#6b6b70]">PFF Grand Total</p>
                <p className="text-lg font-bold font-mono" style={{ color: '#D4AF37' }}>
                  ${grandBalanceUsd.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
              </div>
            )}
          </header>
          <div className="flex-1 p-4 md:p-6 max-w-2xl mx-auto w-full">
            {mintError && (
              <div className="mb-4 p-3 rounded-lg border border-amber-500/50 bg-amber-500/10 flex items-start justify-between gap-2">
                <p className="text-sm text-amber-200">Mint not confirmed: {mintError}</p>
                <button type="button" onClick={() => setMintError(null)} className="text-amber-400 hover:text-amber-300 shrink-0" aria-label="Dismiss">×</button>
              </div>
            )}
            <SovereignPulseBar className="mb-6" />
          </div>
        </main>
        {identityPhone && <VitalizationRequestListener phoneNumber={identityPhone} />}
        {identityPhone && <LoginRequestListener phoneNumber={identityPhone} />}
      </AppShell>
    </ProtectedRoute>
  );
}

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
import { getVitalizationStatus } from '@/lib/vitalizationRitual';
import { fetchUserBalances } from '@/lib/userBalances';
import { VIDA_USD_VALUE } from '@/lib/economic';
import { vngnToUsdt } from '@/lib/sovryn/vngn';

/** Greeting by time of day. */
function getTimeBasedGreeting(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'Good morning';
  if (h >= 12 && h < 17) return 'Good afternoon';
  if (h >= 17 && h < 21) return 'Good evening';
  return 'Good evening';
}

const GOLD = '#D4AF37';

/** PFF Grand Wallet — total worth: locked + spendable VIDA, other wallets, linked bank. */
function PFFGrandWalletCard({ phone }: { phone: string | null }) {
  const [lockedVida, setLockedVida] = useState<number | null>(null);
  const [spendableVida, setSpendableVida] = useState<number | null>(null);
  const [balances, setBalances] = useState<{ vida: number; dllr: number; usdt: number; vngn: number } | null>(null);
  const [linkedBankUsd, setLinkedBankUsd] = useState<number | null>(null);

  useEffect(() => {
    if (!phone) return;
    getVitalizationStatus(phone).then((s) => {
      if (s) {
        setLockedVida(s.lockedVida);
        setSpendableVida(s.spendableVida);
      }
    });
    fetchUserBalances(phone).then((row) => {
      if (row) {
        setBalances({
          vida: row.vida_balance,
          dllr: row.dllr_balance,
          usdt: row.usdt_balance,
          vngn: row.vngn_balance,
        });
      }
    });
    // Linked bank balance: no Supabase source yet — show as — or 0
    setLinkedBankUsd(null);
  }, [phone]);

  const lockedUsd = (lockedVida ?? 0) * VIDA_USD_VALUE;
  const spendableUsd = (spendableVida ?? 0) * VIDA_USD_VALUE;
  const otherUsd = balances
    ? (balances.dllr ?? 0) + (balances.usdt ?? 0) + vngnToUsdt(balances.vngn ?? 0)
    : 0;
  const bankUsd = linkedBankUsd ?? 0;
  const totalUsd = lockedUsd + spendableUsd + otherUsd + bankUsd;
  const hasAnyBank = linkedBankUsd !== null && linkedBankUsd > 0;

  if (!phone) return null;

  return (
    <section
      className="rounded-2xl border-2 p-5"
      style={{ borderColor: 'rgba(212,175,55,0.4)', background: 'rgba(212,175,55,0.06)' }}
    >
      <h2 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: GOLD }}>
        PFF Grand Wallet
      </h2>
      <p className="text-[10px] text-[#6b6b70] mb-3">Total worth of all wallets (locked, spendable, other) and linked bank</p>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-[#a0a0a5]">Locked VIDA CAP</span>
          <span className="font-mono font-semibold" style={{ color: GOLD }}>
            ${lockedUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#a0a0a5]">Spendable VIDA CAP</span>
          <span className="font-mono font-semibold" style={{ color: GOLD }}>
            ${spendableUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#a0a0a5]">Other wallets (DLLR, USDT, vNGN)</span>
          <span className="font-mono font-semibold" style={{ color: GOLD }}>
            ${otherUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#a0a0a5]">Linked bank</span>
          <span className="font-mono font-semibold" style={{ color: GOLD }}>
            {hasAnyBank ? `$${bankUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
          </span>
        </div>
      </div>
      <div className="mt-4 pt-3 border-t border-[#2a2a2e] flex justify-between items-baseline">
        <span className="text-xs font-bold uppercase tracking-wider text-[#6b6b70]">Total worth</span>
        <span className="text-xl font-bold font-mono" style={{ color: GOLD }}>
          ${totalUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>
    </section>
  );
}

/** Dashboard = overview: greeting, PFF Grand Wallet, Pulse bar. Use bottom tab for Wallet, Treasury, Settings. */
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
          <header className="shrink-0 border-b border-[#2a2a2e] bg-[#16161a]/95 backdrop-blur px-4 py-4 safe-area-top">
            <p className="text-sm font-semibold text-[#a0a0a5]">{getTimeBasedGreeting()}</p>
            <h1 className="text-xl font-bold bg-gradient-to-r from-[#e8c547] to-[#c9a227] bg-clip-text text-transparent mt-0.5">
              Welcome to Vitalie
            </h1>
          </header>
          <div className="flex-1 p-4 md:p-6 max-w-2xl mx-auto w-full space-y-6">
            <PFFGrandWalletCard phone={identityPhone} />
            <SovereignPulseBar className="mb-6" />
          </div>
        </main>
        {identityPhone && <VitalizationRequestListener phoneNumber={identityPhone} />}
        {identityPhone && <LoginRequestListener phoneNumber={identityPhone} />}
      </AppShell>
    </ProtectedRoute>
  );
}

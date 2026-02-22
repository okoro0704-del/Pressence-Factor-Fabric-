'use client';

/**
 * Family Vault — Guardian's dashboard view.
 * Lists all linked Dependent accounts and their current VIDA balances.
 * Dependent Account & Guardian Handshake protocol.
 */

import { useState, useEffect } from 'react';
import { JetBrains_Mono } from 'next/font/google';
import { getIdentityAnchorPhone } from '@/lib/sentinelActivation';
import { getGuardianDependents } from '@/lib/phoneIdentity';
import { getDependentsForGuardian } from '@/lib/sentinelActivation';
import { maskPhoneForDisplay } from '@/lib/phoneMask';
import type { GlobalIdentity } from '@/lib/phoneIdentity';

const jetbrains = JetBrains_Mono({ weight: ['400', '600', '700'], subsets: ['latin'] });

interface DependentRow {
  phone_number: string;
  full_name: string;
  vida_balance: number;
}

export function FamilyVault() {
  const [dependents, setDependents] = useState<DependentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [guardianPhone, setGuardianPhone] = useState<string | null>(null);

  useEffect(() => {
    const phone = getIdentityAnchorPhone();
    setGuardianPhone(phone);
    if (!phone) {
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      try {
        const fromGlobal = await getGuardianDependents(phone);
        if (fromGlobal.length > 0) {
          const rows: DependentRow[] = fromGlobal.map((d: GlobalIdentity) => ({
            phone_number: d.phone_number,
            full_name: d.full_name,
            vida_balance: Number(d.vida_balance ?? d.spendable_vida ?? 0) || 0,
          }));
          setDependents(rows);
          setLoading(false);
          return;
        }
        const fromSentinel = await getDependentsForGuardian(phone);
        const rows: DependentRow[] = fromSentinel.map((d) => ({
          phone_number: d.phone_number,
          full_name: d.full_name,
          vida_balance: 0,
        }));
        setDependents(rows);
      } catch (e) {
        console.error('FamilyVault fetch error:', e);
        setDependents([]);
      }
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="bg-[#16161a] rounded-xl p-6 border border-[#2a2a2e] animate-pulse">
        <div className="h-6 bg-[#2a2a2e] rounded w-1/3 mb-4" />
        <div className="h-4 bg-[#2a2a2e] rounded w-2/3" />
      </div>
    );
  }

  if (!guardianPhone) {
    return (
      <div className="bg-[#16161a] rounded-xl p-6 border border-[#2a2a2e]">
        <h3 className="text-sm font-semibold text-[#6b6b70] uppercase tracking-wider mb-2">Family Vault</h3>
        <p className="text-sm text-[#a0a0a5]">Sign in to see linked dependent accounts.</p>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl border p-6"
      style={{
        background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.06) 0%, rgba(22, 22, 26, 1) 50%)',
        borderColor: 'rgba(212, 175, 55, 0.3)',
        boxShadow: '0 0 40px rgba(212, 175, 55, 0.08)',
      }}
    >
      <div className="flex items-center justify-center gap-2 mb-6">
        <span className="text-2xl">👨‍👩‍👧‍👦</span>
        <h3 className={`text-sm font-bold text-[#e8c547] uppercase tracking-wider ${jetbrains.className}`}>
          Family Vault
        </h3>
      </div>
      <p className="text-xs text-[#6b6b70] mb-4">
        Linked dependent accounts and their current VIDA balances. Sentinel access is inherited from you.
      </p>
      {dependents.length === 0 ? (
        <div className="py-8 text-center rounded-lg border border-dashed border-[#2a2a2e]">
          <p className="text-sm text-[#6b6b70]">No linked dependents yet.</p>
          <p className="text-xs text-[#6b6b70] mt-1">Minors or Elders can link you as Guardian during sign-in.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {dependents.map((d) => (
            <li
              key={d.phone_number}
              className="flex items-center justify-between p-4 rounded-lg border bg-[#0d0d0f]/80"
              style={{ borderColor: 'rgba(212, 175, 55, 0.2)' }}
            >
              <div>
                <p className="font-semibold text-[#f5f5f5]">{d.full_name}</p>
                <p className={`text-xs font-mono text-[#6b6b70] ${jetbrains.className}`} title={d.phone_number}>
                  {maskPhoneForDisplay(d.phone_number)}
                </p>
              </div>
              <div className="text-right">
                <p className={`text-lg font-bold text-[#e8c547] ${jetbrains.className}`}>
                  {d.vida_balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-[10px] text-[#6b6b70] uppercase">VIDA</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

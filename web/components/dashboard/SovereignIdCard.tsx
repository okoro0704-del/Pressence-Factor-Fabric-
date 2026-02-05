'use client';

import { useState, useEffect } from 'react';
import { JetBrains_Mono } from 'next/font/google';
import { getIdentityAnchorPhone } from '@/lib/sentinelActivation';
import { getIdCardProfile, HUMANITY_SCORE_VERIFIED } from '@/lib/humanityScore';
import { maskPhoneForDisplay } from '@/lib/phoneMask';

const jetbrains = JetBrains_Mono({ weight: ['400', '600'], subsets: ['latin'] });

/**
 * Sovereign ID Card — Proof of Personhood (Verified Human).
 * WorldID-style high-tech aesthetics, branded as Sovereign Mesh.
 * Shows Verified Human badge when humanity_score is 1.0.
 */
export function SovereignIdCard() {
  const [profile, setProfile] = useState<{ full_name: string | null; humanity_score: number | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState<string | null>(null);

  useEffect(() => {
    const p = getIdentityAnchorPhone();
    setPhone(p);
    if (!p) {
      setLoading(false);
      return;
    }
    getIdCardProfile(p)
      .then((res) => {
        if (res.ok) setProfile(res.profile);
        else setProfile({ full_name: null, humanity_score: null });
      })
      .catch(() => setProfile({ full_name: null, humanity_score: null }))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !phone) {
    return (
      <div
        className="rounded-2xl border border-[#2a2a2e] bg-gradient-to-br from-[#0d0d0f] via-[#16161a] to-[#0d0d0f] p-5 min-h-[180px] flex items-center justify-center"
        style={{
          boxShadow: '0 0 0 1px rgba(212, 175, 55, 0.1), 0 8px 32px rgba(0,0,0,0.4)',
        }}
      >
        <p className="text-sm text-[#6b6b70]">Loading Sovereign ID…</p>
      </div>
    );
  }

  const verifiedHuman = profile?.humanity_score === HUMANITY_SCORE_VERIFIED;
  const displayName = profile?.full_name?.trim() || 'Sovereign Citizen';
  const maskedPhone = maskPhoneForDisplay(phone);

  return (
    <div
      className="relative rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0d0d0f 0%, #16161a 50%, #0d0d0f 100%)',
        boxShadow: '0 0 0 1px rgba(212, 175, 55, 0.15), 0 0 40px rgba(212, 175, 55, 0.08), 0 8px 32px rgba(0,0,0,0.4)',
        border: '1px solid rgba(212, 175, 55, 0.25)',
      }}
    >
      {/* Top accent line */}
      <div
        className="h-1 w-full"
        style={{ background: 'linear-gradient(90deg, transparent, #D4AF37, #e8c547, #D4AF37, transparent)' }}
      />

      <div className="p-5">
        {/* Header: Sovereign Mesh branding */}
        <div className="flex items-center justify-between mb-4">
          <span className={`text-xs font-semibold uppercase tracking-[0.2em] text-[#D4AF37]/90 ${jetbrains.className}`}>
            Sovereign Mesh
          </span>
          {verifiedHuman && (
            <span
              className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
              style={{
                background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(34, 197, 94, 0.08))',
                border: '1px solid rgba(34, 197, 94, 0.4)',
                color: '#22c55e',
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
              Proof of Personhood
            </span>
          )}
        </div>

        {/* Orb / Identity icon — WorldID-style */}
        <div className="flex items-center gap-4 mb-4">
          <div
            className="w-14 h-14 rounded-full flex-shrink-0 flex items-center justify-center text-2xl"
            style={{
              background: verifiedHuman
                ? 'radial-gradient(circle at 30% 30%, #e8c547, #D4AF37 40%, #0d0d0f 70%)'
                : 'radial-gradient(circle at 30% 30%, #3b3b40, #2a2a2e 50%, #16161a 80%)',
              boxShadow: verifiedHuman
                ? 'inset 0 -2px 8px rgba(0,0,0,0.4), 0 0 20px rgba(212, 175, 55, 0.3)'
                : 'inset 0 -2px 8px rgba(0,0,0,0.4)',
              border: `2px solid ${verifiedHuman ? 'rgba(212, 175, 55, 0.5)' : 'rgba(255,255,255,0.08)'}`,
            }}
          >
            {verifiedHuman ? (
              <span className="text-[#0d0d0f]" aria-hidden>◇</span>
            ) : (
              <span className="text-[#6b6b70]" aria-hidden>◇</span>
            )}
          </div>
          <div>
            <p className={`text-lg font-semibold text-white ${jetbrains.className}`}>{displayName}</p>
            <p className={`text-xs text-[#6b6b70] ${jetbrains.className}`}>Sovereign ID · {maskedPhone}</p>
          </div>
        </div>

        {/* Footer: Verified Human / Elite Status */}
        <div className="pt-3 border-t border-[#2a2a2e]/80 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider text-[#6b6b70]">Digital Identity</span>
          {verifiedHuman ? (
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#D4AF37]">
              Verified Human · Elite Status
            </span>
          ) : (
            <span className="text-[10px] text-[#6b6b70]">Complete Triple-Pillar with external device</span>
          )}
        </div>
      </div>
    </div>
  );
}

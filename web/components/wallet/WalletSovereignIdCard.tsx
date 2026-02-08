'use client';

import { useState, useEffect } from 'react';
import { getIdentityAnchorPhone } from '@/lib/sentinelActivation';
import { getIdCardProfile } from '@/lib/humanityScore';
import { getCitizenStatusForPhone } from '@/lib/supabaseTelemetry';
import { getCurrentDeviceInfo } from '@/lib/multiDeviceVitalization';

const GOLD = '#D4AF37';

/** Derive a short numeric ID from phone (last 8 digits as number, or hash). */
function toNumericId(phone: string | null): string {
  if (!phone || typeof phone !== 'string') return '—';
  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 8) return digits.slice(-8);
  return digits.padStart(8, '0') || '—';
}

/**
 * Sovereign ID for Wallet — ID (number), Name, Vitalization status, Device name.
 */
export function WalletSovereignIdCard() {
  const [phone, setPhone] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [vitalizationStatus, setVitalizationStatus] = useState<'VITALIZED' | 'PENDING' | null>(null);
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const p = getIdentityAnchorPhone();
    setPhone(p);
    if (!p) {
      setLoading(false);
      return;
    }
    Promise.all([
      getIdCardProfile(p),
      getCitizenStatusForPhone(p),
      typeof navigator !== 'undefined' ? Promise.resolve(getCurrentDeviceInfo()) : Promise.resolve(null),
    ]).then(([profileRes, status, deviceInfo]) => {
      setName(profileRes?.ok && profileRes.profile?.full_name ? profileRes.profile.full_name.trim() : null);
      setVitalizationStatus(status);
      setDeviceName(deviceInfo?.deviceName ?? null);
    }).finally(() => setLoading(false));
  }, []);

  if (loading || !phone) {
    return (
      <div className="rounded-2xl border border-[#2a2a2e] bg-[#16161a]/80 p-5 min-h-[200px] flex items-center justify-center">
        <p className="text-sm text-[#6b6b70]">Loading Sovereign ID…</p>
      </div>
    );
  }

  const numericId = toNumericId(phone);
  const displayName = name || 'Sovereign Citizen';

  return (
    <div
      className="rounded-2xl border-2 p-5"
      style={{
        borderColor: 'rgba(212,175,55,0.35)',
        background: 'rgba(22,22,26,0.95)',
        boxShadow: '0 0 0 1px rgba(212, 175, 55, 0.1)',
      }}
    >
      <div className="grid grid-cols-1 gap-4">
        <div>
          <span className="text-[10px] font-bold text-[#6b6b70] uppercase tracking-wider">ID</span>
          <p className="text-xl font-bold font-mono mt-0.5" style={{ color: GOLD }}>{numericId}</p>
        </div>
        <div>
          <span className="text-[10px] font-bold text-[#6b6b70] uppercase tracking-wider">Name</span>
          <p className="text-lg font-semibold text-[#f5f5f5] mt-0.5">{displayName}</p>
        </div>
        <div>
          <span className="text-[10px] font-bold text-[#6b6b70] uppercase tracking-wider">Vitalization status</span>
          <p className="mt-0.5">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold uppercase ${
                vitalizationStatus === 'VITALIZED'
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}
            >
              {vitalizationStatus === 'VITALIZED' ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  Vitalized
                </>
              ) : (
                <>Pending</>
              )}
            </span>
          </p>
        </div>
        <div>
          <span className="text-[10px] font-bold text-[#6b6b70] uppercase tracking-wider">Device</span>
          <p className="text-sm font-mono text-[#a0a0a5] mt-0.5">{deviceName || 'This device'}</p>
        </div>
      </div>
    </div>
  );
}

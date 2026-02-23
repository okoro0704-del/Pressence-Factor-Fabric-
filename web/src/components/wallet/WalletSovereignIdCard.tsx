'use client';

import { useState, useEffect, useCallback } from 'react';
import { getIdentityAnchorPhone } from '@/lib/sentinelActivation';
import { getIdCardProfile } from '@/lib/humanityScore';
import { getCitizenStatusForPhone } from '@/lib/supabaseTelemetry';
import { getCurrentDeviceInfo } from '@/lib/multiDeviceVitalization';
import { toSovereignIdE164 } from '@/lib/phoneMask';
import { subscribeToBackendSync } from '@/lib/backendRealtimeSync';

const GOLD = '#D4AF37';

/**
 * Sovereign ID for Wallet — ID (full E.164), Name, Vitalization status, Device name.
 * Subscribes to backend Realtime so profile/wallet changes from server push to the UI.
 */
export function WalletSovereignIdCard() {
  const [phone, setPhone] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [vitalizationStatus, setVitalizationStatus] = useState<'VITALIZED' | 'PENDING' | null>(null);
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshTick, setRefreshTick] = useState(0);

  const fetchProfile = useCallback((p: string) => {
    const deviceInfoPromise =
      typeof navigator !== 'undefined'
        ? Promise.resolve().then(() => getCurrentDeviceInfo()).catch(() => null)
        : Promise.resolve(null);
    Promise.all([
      getIdCardProfile(p).catch(() => ({ ok: false })),
      getCitizenStatusForPhone(p).catch(() => 'PENDING' as const),
      deviceInfoPromise,
    ])
      .then(([profileRes, status, deviceInfo]) => {
        const profile = profileRes && typeof profileRes === 'object' && 'profile' in profileRes ? (profileRes as { profile?: { full_name?: string } }).profile : undefined;
        setName(profile?.full_name ? String(profile.full_name).trim() : null);
        setVitalizationStatus(status);
        setDeviceName(deviceInfo?.deviceName ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const p = getIdentityAnchorPhone();
    setPhone(p);
    if (!p) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchProfile(p);
  }, [fetchProfile, refreshTick]);

  useEffect(() => {
    if (!phone) return;
    const unsub = subscribeToBackendSync(phone, {
      onProfileChange: () => setRefreshTick((t) => t + 1),
      onWalletChange: () => setRefreshTick((t) => t + 1),
    });
    return unsub;
  }, [phone]);

  if (loading || !phone) {
    return (
      <div className="rounded-2xl border border-[#2a2a2e] bg-[#16161a]/80 p-5 min-h-[200px] flex items-center justify-center">
        <p className="text-sm text-[#6b6b70]">Loading Sovereign ID…</p>
      </div>
    );
  }

  const sovereignId = toSovereignIdE164(phone);
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
          <span className="text-[10px] font-bold text-[#6b6b70] uppercase tracking-wider">Sovereign ID</span>
          <p className="text-lg font-bold font-mono mt-0.5 break-all" style={{ color: GOLD }} title="Full E.164 (unique across networks)">{sovereignId}</p>
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

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BiometricStrictnessSlider } from '@/components/settings/BiometricStrictnessSlider';
import { AppShell } from '@/components/layout/AppShell';
import { SentinelDevicesManager } from '@/components/dashboard/SentinelDevicesManager';
import { getIdentityAnchorPhone, clearIdentityAnchorForSession } from '@/lib/sentinelActivation';
import { clearPresenceVerification } from '@/lib/withPresenceCheck';
import { getCompositeDeviceFingerprint } from '@/lib/biometricAuth';
import { getTrustLevel, shouldSuggestSovereignShield } from '@/lib/trustLevel';
import { requestTerminateSession } from '@/lib/deviceTerminateSession';

const GOLD = '#D4AF37';

export default function SettingsPage() {
  const router = useRouter();
  const [phone, setPhone] = useState<string | null>(null);
  const [currentDeviceId, setCurrentDeviceId] = useState<string | null>(null);
  const [trustLevel, setTrustLevel] = useState<number>(0);

  useEffect(() => {
    setPhone(getIdentityAnchorPhone());
  }, []);

  useEffect(() => {
    if (!phone) return;
    getTrustLevel(phone).then(setTrustLevel);
  }, [phone]);

  useEffect(() => {
    getCompositeDeviceFingerprint().then(setCurrentDeviceId);
  }, []);

  const handleSignOut = () => {
    clearPresenceVerification();
    clearIdentityAnchorForSession();
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    } else {
      router.replace('/');
    }
  };

  const handleTerminateSession = async (deviceId: string) => {
    if (!confirm('Terminate this device\'s session? It will be signed out and sent to the login screen.')) return;
    const result = await requestTerminateSession(deviceId);
    if (!result.ok) alert(result.error ?? 'Failed to send terminate signal.');
  };

  return (
    <AppShell>
      <main className="p-4 md:p-6 sovereign-card w-full">
        <h1 className="text-xl font-bold uppercase tracking-wider mb-2" style={{ color: GOLD }}>
          Settings
        </h1>
        <p className="text-sm text-[#6b6b70] mb-6">
          Your preferences are saved to your profile and apply on all devices.
        </p>

        <div className="space-y-6">
          <BiometricStrictnessSlider />

          {shouldSuggestSovereignShield(trustLevel) && (
            <div className="rounded-xl border p-4 bg-[#D4AF37]/5" style={{ borderColor: 'rgba(212, 175, 55, 0.4)' }}>
              <h2 className="text-sm font-semibold uppercase tracking-wider mb-2" style={{ color: GOLD }}>
                Sovereign Shield
              </h2>
              <p className="text-sm text-[#a0a0a5] mb-0">
                You have a strong trust level. Consider switching to <strong style={{ color: GOLD }}>High Security</strong> above for stricter biometric checks (Sovereign Shield mode).
              </p>
            </div>
          )}

          <div className="rounded-xl border p-4" style={{ borderColor: 'rgba(212, 175, 55, 0.3)' }}>
            <h2 className="text-sm font-semibold uppercase tracking-wider mb-2" style={{ color: GOLD }}>
              Link Device
            </h2>
            <p className="text-sm text-[#a0a0a5] mb-3">
              Scan the QR code on your laptop login screen with your phone to approve login and add the laptop as a trusted device.
            </p>
            <Link
              href="/link-device"
              className="inline-block px-4 py-2 rounded-lg font-medium text-sm transition-colors"
              style={{ background: 'rgba(212, 175, 55, 0.15)', color: GOLD }}
            >
              Open Link Device
            </Link>
          </div>

          {phone && (
            <div className="rounded-xl border p-4" style={{ borderColor: 'rgba(212, 175, 55, 0.3)' }}>
              <h2 className="text-sm font-semibold uppercase tracking-wider mb-2" style={{ color: GOLD }}>
                Linked Devices
              </h2>
              <p className="text-sm text-[#a0a0a5] mb-4">
                Manage devices that can access your vault. Use &quot;Terminate Session&quot; to sign out that device remotely (it will reload to the login screen).
              </p>
              <SentinelDevicesManager
                phoneNumber={phone}
                currentDeviceId={currentDeviceId}
                onTerminateSession={handleTerminateSession}
              />
            </div>
          )}

          <div className="rounded-xl border p-4" style={{ borderColor: 'rgba(212, 175, 55, 0.3)' }}>
            <h2 className="text-sm font-semibold uppercase tracking-wider mb-2" style={{ color: GOLD }}>
              Sign Out
            </h2>
            <p className="text-sm text-[#a0a0a5] mb-4">
              Sign out on this device. Your local session will be cleared and you will be returned to the language screen.
            </p>
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full py-3 rounded-lg font-bold uppercase tracking-wider border-2 transition-colors"
              style={{ borderColor: GOLD, color: GOLD, background: 'rgba(212, 175, 55, 0.1)' }}
            >
              Sign Out
            </button>
          </div>
        </div>

        <div className="mt-8">
          <Link
            href="/dashboard"
            className="text-sm text-[#6b6b70] hover:text-[#e8c547] transition-colors"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </main>
    </AppShell>
  );
}

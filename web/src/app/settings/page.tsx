'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/dashboard/ProtectedRoute';
import { BiometricStrictnessSlider } from '@/components/settings/BiometricStrictnessSlider';
import { AppShell } from '@/components/layout/AppShell';
import { SentinelDevicesManager } from '@/components/dashboard/SentinelDevicesManager';
import { getIdentityAnchorPhone, clearIdentityAnchorForSession, clearSessionForLogout } from '@/lib/sentinelActivation';
import { clearPresenceVerification } from '@/lib/withPresenceCheck';
import { getCompositeDeviceFingerprint } from '@/lib/biometricAuth';
import { getTrustLevel, shouldSuggestSovereignShield } from '@/lib/trustLevel';
import { requestTerminateSession } from '@/lib/deviceTerminateSession';
import { clearVitalizationComplete } from '@/lib/vitalizationState';
import { resetBiometrics } from '@/lib/resetBiometrics';
import { getSupabase } from '@/lib/supabase';
import { isArchitect } from '@/lib/publicRevealAccess';
import { generateAccessCode, isBeforeAccessCutoff } from '@/lib/accessCodeGate';

const GOLD = '#D4AF37';

export default function SettingsPage() {
  const router = useRouter();
  const [phone, setPhone] = useState<string | null>(null);
  const [currentDeviceId, setCurrentDeviceId] = useState<string | null>(null);
  const [trustLevel, setTrustLevel] = useState<number>(0);
  const [resettingBiometrics, setResettingBiometrics] = useState(false);
  const [resetBiometricsMessage, setResetBiometricsMessage] = useState<string | null>(null);

  const [accessCodePhone, setAccessCodePhone] = useState('');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [generateCodeError, setGenerateCodeError] = useState<string | null>(null);
  const [generatingCode, setGeneratingCode] = useState(false);

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

  const handleSignOut = async () => {
    clearPresenceVerification();
    clearVitalizationComplete();
    clearIdentityAnchorForSession();
    clearSessionForLogout();
    try {
      const supabase = getSupabase();
      if (supabase?.auth?.signOut) await (supabase.auth as { signOut: () => Promise<{ error: unknown }> }).signOut();
    } catch {
      // ignore
    }
    if (typeof window !== 'undefined') {
      window.location.assign('/language');
    } else {
      router.replace('/language');
    }
  };

  const handleTerminateSession = async (deviceId: string) => {
    if (!confirm('Terminate this device\'s session? It will be signed out and sent to the login screen.')) return;
    const result = await requestTerminateSession(deviceId);
    if (!result.ok) alert(result.error ?? 'Failed to send terminate signal.');
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <main className="min-h-screen bg-[#0d0d0f] pb-20 md:pb-8 p-4 md:p-6 max-w-2xl mx-auto w-full">
          <h1 className="text-xl font-bold uppercase tracking-wider mb-2" style={{ color: GOLD }}>
            Settings
          </h1>
          <p className="text-sm text-[#6b6b70] mb-6">
            Your preferences are saved to your profile and apply on all devices.
          </p>

          <div className="space-y-6">
            {isArchitect() && isBeforeAccessCutoff() && (
              <div className="rounded-xl border p-4" style={{ borderColor: 'rgba(212, 175, 55, 0.4)', background: 'rgba(212, 175, 55, 0.06)' }}>
                <h2 className="text-sm font-semibold uppercase tracking-wider mb-2" style={{ color: GOLD }}>
                  Generate access code (until April 7)
                </h2>
                <p className="text-sm text-[#a0a0a5] mb-3">
                  Enter a user&apos;s phone number and generate a code. When they enter their number and this code on the landing page, they can access the site.
                </p>
                <div className="flex flex-wrap items-end gap-3 mb-3">
                  <input
                    type="tel"
                    value={accessCodePhone}
                    onChange={(e) => { setAccessCodePhone(e.target.value); setGeneratedCode(null); setGenerateCodeError(null); }}
                    placeholder="User phone number"
                    className="flex-1 min-w-[160px] px-4 py-2.5 rounded-lg border-2 bg-[#0d0d0f] text-white placeholder-[#6b6b70]"
                    style={{ borderColor: 'rgba(212, 175, 55, 0.3)' }}
                  />
                  <button
                    type="button"
                    disabled={generatingCode || !accessCodePhone.trim()}
                    onClick={async () => {
                      setGenerateCodeError(null);
                      setGeneratedCode(null);
                      setGeneratingCode(true);
                      const result = await generateAccessCode(accessCodePhone.trim(), phone ?? undefined);
                      setGeneratingCode(false);
                      if (result.ok) {
                        setGeneratedCode(result.code);
                      } else {
                        setGenerateCodeError(result.error ?? 'Failed to generate');
                      }
                    }}
                    className="px-5 py-2.5 rounded-lg font-bold uppercase tracking-wider border-2 transition-colors disabled:opacity-50"
                    style={{ borderColor: GOLD, color: GOLD }}
                  >
                    {generatingCode ? 'Generating…' : 'Generate code'}
                  </button>
                </div>
                {generatedCode && (
                  <div className="p-3 rounded-lg border" style={{ borderColor: GOLD, background: 'rgba(212, 175, 55, 0.1)' }}>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: GOLD }}>Code for {accessCodePhone.trim()}</p>
                    <p className="text-2xl font-mono font-bold tracking-widest" style={{ color: GOLD }}>{generatedCode}</p>
                    <p className="text-xs text-[#6b6b70] mt-2">Share this code with the user. They enter their phone number and this code on the first page to log in.</p>
                  </div>
                )}
                {generateCodeError && (
                  <p className="text-sm mt-2" style={{ color: '#f87171' }}>{generateCodeError}</p>
                )}
              </div>
            )}

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
                Sovereign Device Links
              </h2>
              <p className="text-sm text-[#a0a0a5] mb-3">
                Link your laptop or another device by scanning its QR code with your phone. The phone securely shares your identity anchor so the new device can access your vault.
              </p>
              <Link
                href="/link-device/scan"
                className="inline-block px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                style={{ background: 'rgba(212, 175, 55, 0.15)', color: GOLD }}
              >
                Link New Device
              </Link>
              <p className="text-xs text-[#6b6b70] mt-2">
                Opens the camera to scan the QR code on your laptop. Or <Link href="/link-device" className="underline hover:text-[#e8c547]">open Link Device</Link> and enter the URL from the laptop screen.
              </p>
            </div>

            <div className="rounded-xl border p-4" style={{ borderColor: 'rgba(212, 175, 55, 0.3)' }}>
              <h2 className="text-sm font-semibold uppercase tracking-wider mb-2" style={{ color: GOLD }}>
                Reset Biometrics
              </h2>
              <p className="text-sm text-[#a0a0a5] mb-3">
                Clear primary sentinel device and stored face hashes so you can re-enroll (e.g. new device or re-scan).
              </p>
              {resetBiometricsMessage && (
                <p className={`text-sm mb-3 ${resetBiometricsMessage.startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>
                  {resetBiometricsMessage}
                </p>
              )}
              <button
                type="button"
                disabled={resettingBiometrics}
                onClick={async () => {
                  const anchor = getIdentityAnchorPhone();
                  if (!anchor) {
                    setResetBiometricsMessage('No identity anchor in session. Complete the gate first.');
                    return;
                  }
                  if (!confirm('Reset My Biometrics will clear your primary device and face hashes. You will need to complete verification again. Continue?')) return;
                  setResettingBiometrics(true);
                  setResetBiometricsMessage(null);
                  const result = await resetBiometrics(anchor);
                  setResettingBiometrics(false);
                  if (result.ok) {
                    localStorage.clear();
                    sessionStorage.clear();
                    window.location.href = '/vitalization?reset=1';
                    return;
                  }
                  setResetBiometricsMessage(result.error ?? 'Reset failed.');
                }}
                className="px-4 py-2 rounded-lg border border-amber-500/50 text-amber-400 hover:bg-amber-500/10 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {resettingBiometrics ? 'Resetting…' : 'Reset My Biometrics'}
              </button>
            </div>

            {phone && (
              <div className="rounded-xl border p-4" style={{ borderColor: 'rgba(212, 175, 55, 0.3)' }}>
                <h2 className="text-sm font-semibold uppercase tracking-wider mb-2" style={{ color: GOLD }}>
                  Linked Devices
                </h2>
                <p className="text-sm text-[#a0a0a5] mb-4">
                  Manage devices that can access your vault. &quot;Revoke Access&quot; instantly kills the remote session and purges the anchor on that device. &quot;Terminate Session&quot; signs out that device remotely.
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
              href="/wallet"
              className="text-sm text-[#6b6b70] hover:text-[#e8c547] transition-colors"
            >
              ← Back to Wallet
            </Link>
          </div>
        </main>
      </AppShell>
    </ProtectedRoute>
  );
}

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
import { isArchitect, isDesktop, getArchitectMasterPhone, ARCHITECT_MASTER_DISPLAY_NAME } from '@/lib/publicRevealAccess';
import { generateAccessCode, isBeforeAccessCutoff, changeMasterPassword } from '@/lib/accessCodeGate';

const GOLD = '#D4AF37';

export default function SettingsPage() {
  const router = useRouter();
  const [phone, setPhone] = useState<string | null>(null);
  const [profileName, setProfileName] = useState<string>('');
  const [profileNameSaving, setProfileNameSaving] = useState(false);
  const [profileNameMessage, setProfileNameMessage] = useState<string | null>(null);
  const [currentDeviceId, setCurrentDeviceId] = useState<string | null>(null);
  const [trustLevel, setTrustLevel] = useState<number>(0);
  const [resettingBiometrics, setResettingBiometrics] = useState(false);
  const [resetBiometricsMessage, setResetBiometricsMessage] = useState<string | null>(null);

  const [accessCodePhone, setAccessCodePhone] = useState('');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [generateCodeError, setGenerateCodeError] = useState<string | null>(null);
  const [generatingCode, setGeneratingCode] = useState(false);

  const [masterCurrent, setMasterCurrent] = useState('');
  const [masterNew, setMasterNew] = useState('');
  const [masterConfirm, setMasterConfirm] = useState('');
  const [masterChangeMessage, setMasterChangeMessage] = useState<string | null>(null);
  const [masterChangeError, setMasterChangeError] = useState<string | null>(null);
  const [changingMaster, setChangingMaster] = useState(false);

  useEffect(() => {
    setPhone(getIdentityAnchorPhone());
  }, []);

  useEffect(() => {
    if (!phone) return;
    getTrustLevel(phone).then(setTrustLevel);
  }, [phone]);

  useEffect(() => {
    if (!phone) return;
    const supabase = getSupabase();
    if (!supabase) return;
    (supabase as any)
      .from('user_profiles')
      .select('full_name')
      .eq('phone_number', phone)
      .maybeSingle()
      .then(({ data }: { data: { full_name?: string | null } | null }) => {
        const name = data?.full_name?.trim() ?? '';
        const masterPhone = getArchitectMasterPhone();
        setProfileName(name || (phone === masterPhone ? ARCHITECT_MASTER_DISPLAY_NAME : ''));
      });
  }, [phone]);

  const saveProfileName = async () => {
    if (!phone?.trim()) return;
    setProfileNameMessage(null);
    setProfileNameSaving(true);
    try {
      const supabase = getSupabase();
      if (!supabase) {
        setProfileNameMessage('Not connected');
        return;
      }
      const { error } = await (supabase as any)
        .from('user_profiles')
        .update({ full_name: profileName.trim() || null, updated_at: new Date().toISOString() })
        .eq('phone_number', phone.trim());
      if (error) {
        setProfileNameMessage(error.message ?? 'Failed to save');
        return;
      }
      setProfileNameMessage('Saved');
    } finally {
      setProfileNameSaving(false);
    }
  };

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
      window.location.assign('/vitalization');
    } else {
      router.replace('/vitalization');
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
            <div className="rounded-xl border p-4" style={{ borderColor: 'rgba(212, 175, 55, 0.3)', background: 'rgba(15,15,15,0.8)' }}>
              <h2 className="text-sm font-semibold uppercase tracking-wider mb-2" style={{ color: GOLD }}>
                Your name
              </h2>
              <p className="text-sm text-[#a0a0a5] mb-3">
                Display name on your profile. Shown across the Protocol where your identity is displayed.
              </p>
              <div className="flex flex-wrap items-end gap-3">
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => { setProfileName(e.target.value); setProfileNameMessage(null); }}
                  onBlur={() => { if (profileName.trim()) saveProfileName(); }}
                  placeholder="e.g. ISREAL OKORO"
                  className="flex-1 min-w-[180px] px-4 py-2.5 rounded-lg border-2 bg-[#0d0d0f] text-white placeholder-[#6b6b70]"
                  style={{ borderColor: 'rgba(212, 175, 55, 0.3)' }}
                />
                <button
                  type="button"
                  disabled={profileNameSaving}
                  onClick={saveProfileName}
                  className="px-5 py-2.5 rounded-lg font-medium border-2 transition-colors disabled:opacity-50"
                  style={{ borderColor: GOLD, color: GOLD }}
                >
                  {profileNameSaving ? 'Saving…' : 'Save'}
                </button>
              </div>
              {profileNameMessage && (
                <p className={`text-sm mt-2 ${profileNameMessage === 'Saved' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {profileNameMessage}
                </p>
              )}
            </div>

            {isArchitect() && isBeforeAccessCutoff() && isDesktop() && (
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

            {isArchitect() && isBeforeAccessCutoff() && isDesktop() && (
              <div className="rounded-xl border p-4" style={{ borderColor: 'rgba(212, 175, 55, 0.4)', background: 'rgba(212, 175, 55, 0.06)' }}>
                <h2 className="text-sm font-semibold uppercase tracking-wider mb-2" style={{ color: GOLD }}>
                  Change master password
                </h2>
                <p className="text-sm text-[#a0a0a5] mb-3">
                  Choose a stronger numeric password (at least 8 digits). You will use it to log in from the bottom of the site. Save it somewhere safe.
                </p>
                <div className="space-y-3 mb-3">
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={64}
                    value={masterCurrent}
                    onChange={(e) => { setMasterCurrent(e.target.value.replace(/\D/g, '')); setMasterChangeError(null); setMasterChangeMessage(null); }}
                    placeholder="Current master password"
                    className="w-full px-4 py-2.5 rounded-lg border-2 bg-[#0d0d0f] text-white placeholder-[#6b6b70]"
                    style={{ borderColor: 'rgba(212, 175, 55, 0.3)' }}
                  />
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={64}
                    value={masterNew}
                    onChange={(e) => { setMasterNew(e.target.value.replace(/\D/g, '')); setMasterChangeError(null); setMasterChangeMessage(null); }}
                    placeholder="New password (numbers only, min 8 digits)"
                    className="w-full px-4 py-2.5 rounded-lg border-2 bg-[#0d0d0f] text-white placeholder-[#6b6b70]"
                    style={{ borderColor: 'rgba(212, 175, 55, 0.3)' }}
                  />
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={64}
                    value={masterConfirm}
                    onChange={(e) => { setMasterConfirm(e.target.value.replace(/\D/g, '')); setMasterChangeError(null); setMasterChangeMessage(null); }}
                    placeholder="Confirm new password"
                    className="w-full px-4 py-2.5 rounded-lg border-2 bg-[#0d0d0f] text-white placeholder-[#6b6b70]"
                    style={{ borderColor: 'rgba(212, 175, 55, 0.3)' }}
                  />
                </div>
                <button
                  type="button"
                  disabled={changingMaster || !masterCurrent || masterNew.length < 8 || masterNew !== masterConfirm}
                  onClick={async () => {
                    setMasterChangeError(null);
                    setMasterChangeMessage(null);
                    setChangingMaster(true);
                    const result = await changeMasterPassword(masterCurrent, masterNew);
                    setChangingMaster(false);
                    if (result.ok) {
                      setMasterChangeMessage(result.message ?? 'Password updated. Use your new password at the bottom of the site.');
                      setMasterCurrent('');
                      setMasterNew('');
                      setMasterConfirm('');
                    } else {
                      setMasterChangeError(result.error ?? 'Failed to change password');
                    }
                  }}
                  className="px-5 py-2.5 rounded-lg font-bold uppercase tracking-wider border-2 transition-colors disabled:opacity-50"
                  style={{ borderColor: GOLD, color: GOLD }}
                >
                  {changingMaster ? 'Updating…' : 'Change master password'}
                </button>
                {masterChangeMessage && (
                  <p className="text-sm mt-2" style={{ color: '#22c55e' }}>{masterChangeMessage}</p>
                )}
                {masterChangeError && (
                  <p className="text-sm mt-2" style={{ color: '#f87171' }}>{masterChangeError}</p>
                )}
              </div>
            )}

            <BiometricStrictnessSlider />

            <div className="rounded-xl border p-4" style={{ borderColor: 'rgba(212, 175, 55, 0.3)' }}>
              <h2 className="text-sm font-semibold uppercase tracking-wider mb-2" style={{ color: GOLD }}>
                Sovereign Constitution
              </h2>
              <p className="text-sm text-[#a0a0a5] mb-3">
                Attest to the Articles of the Protocol with your biometric. Required once before your 10 VIDA CAP (5 to you, 5 to Nation) can be minted. If you were already vitalized and have not signed, do this to unlock minting.
              </p>
              <Link
                href="/settings/sign-constitution"
                className="inline-block px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                style={{ background: 'rgba(212, 175, 55, 0.15)', color: GOLD }}
              >
                Sign Sovereign Constitution
              </Link>
            </div>

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
                Sign out on this device. Your local session will be cleared and you will be returned to Vitalization to start the process again.
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

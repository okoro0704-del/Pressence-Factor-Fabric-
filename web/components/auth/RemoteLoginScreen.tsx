'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { JetBrains_Mono } from 'next/font/google';
import { verifyBiometricSignature } from '@/lib/biometricAuth';
import { deriveFaceHashFromCredential, matchFaceTemplate } from '@/lib/biometricAnchorSync';
import { getProfileWithPrimarySentinel } from '@/lib/roleAuth';
import { getCompositeDeviceFingerprint } from '@/lib/biometricAuth';
import { updatePrimarySentinelDeviceForMigration, sendNewDeviceAccessAlert } from '@/lib/deviceMigration';
import { setIdentityAnchorForSession } from '@/lib/sentinelActivation';
import { useGlobalPresenceGateway } from '@/contexts/GlobalPresenceGateway';
import { setSessionIdentity } from '@/lib/sessionIsolation';
import { logGuestAccessIfNeeded } from '@/lib/guestMode';
import { getLinkedMobileDeviceId } from '@/lib/phoneIdBridge';
import { Loader2, Smartphone, ShieldCheck } from 'lucide-react';

const jetbrains = JetBrains_Mono({ weight: ['400', '600', '700'], subsets: ['latin'] });
const GOLD = '#D4AF37';

export interface RemoteLoginScreenProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * Remote Device Handshake — Identity-First Login.
 * Only requires Sovereign ID; upon ID entry triggers Face Pulse and matchFaceTemplate against Supabase face_hash.
 * If face matches but device is new: shows Bind New Device; updates primary_sentinel_device_id on confirm.
 * Grants access to dashboard (5 VIDA CAP) and sends security notification on new device.
 */
export function RemoteLoginScreen({ onSuccess, onCancel }: RemoteLoginScreenProps) {
  const router = useRouter();
  const { setPresenceVerified } = useGlobalPresenceGateway();
  const [sovereignId, setSovereignId] = useState('');
  const [step, setStep] = useState<'id' | 'face' | 'bind' | 'success'>('id');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showBindNewDevice, setShowBindNewDevice] = useState(false);
  const [linkedDevice, setLinkedDevice] = useState<{ maskedId: string; deviceName: string | null } | null>(null);
  const pendingPhoneRef = useRef<string | null>(null);
  const isPc = typeof navigator !== 'undefined' && !/Android|iPhone|iPad|iPod|webOS|Mobile/i.test(navigator.userAgent);

  const handleSubmitId = async () => {
    const trimmed = sovereignId.trim().replace(/\D/g, '');
    if (!trimmed || trimmed.length < 10) {
      setError('Enter a valid Sovereign ID (phone number).');
      return;
    }
    const phone = trimmed.startsWith('+') ? trimmed : `+${trimmed}`;
    setError(null);
    setLoading(true);
    if (isPc) {
      const info = await getLinkedMobileDeviceId(phone);
      if (info) setLinkedDevice({ maskedId: info.maskedId, deviceName: info.deviceName });
      else setLinkedDevice(null);
    }
    setStep('face');
    try {
      const bioResult = await verifyBiometricSignature(phone);
      if (!bioResult.success || !bioResult.credential) {
        setError(bioResult.error ?? 'Face verification failed. Try again.');
        setStep('id');
        return;
      }
      const liveFaceHash = await deriveFaceHashFromCredential(bioResult.credential);
      const matchResult = await matchFaceTemplate(phone, liveFaceHash);
      if (!matchResult.ok) {
        setError(matchResult.error ?? 'Face template does not match.');
        setStep('id');
        return;
      }
      const compositeDeviceId = await getCompositeDeviceFingerprint();
      const profile = await getProfileWithPrimarySentinel(phone);
      const storedPrimaryId = profile?.primary_sentinel_device_id?.trim() ?? '';
      const isNewDevice = !storedPrimaryId || compositeDeviceId !== storedPrimaryId;
      if (isNewDevice) {
        pendingPhoneRef.current = phone;
        setShowBindNewDevice(true);
        setStep('bind');
      } else {
        await grantAccess(phone);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login failed.');
      setStep('id');
    } finally {
      setLoading(false);
    }
  };

  const handleBindNewDevice = async () => {
    const phone = pendingPhoneRef.current;
    if (!phone) {
      setError('Session lost. Start again.');
      setStep('id');
      setShowBindNewDevice(false);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const compositeDeviceId = await getCompositeDeviceFingerprint();
      const updateResult = await updatePrimarySentinelDeviceForMigration(phone, compositeDeviceId);
      if (!updateResult.ok) {
        setError(updateResult.error ?? 'Failed to bind device.');
        return;
      }
      await sendNewDeviceAccessAlert(phone);
      await grantAccess(phone);
      setShowBindNewDevice(false);
      pendingPhoneRef.current = null;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Bind failed.');
    } finally {
      setLoading(false);
    }
  };

  async function grantAccess(phone: string) {
    setIdentityAnchorForSession(phone);
    setPresenceVerified(true);
    setSessionIdentity(phone);
    await logGuestAccessIfNeeded();
    setStep('success');
    if (onSuccess) {
      onSuccess();
    } else {
      router.push('/dashboard?minted=1');
    }
  }

  const handleCancelBind = () => {
    setShowBindNewDevice(false);
    pendingPhoneRef.current = null;
    setStep('id');
  };

  if (step === 'success') {
    return (
      <div className="w-full max-w-md mx-auto text-center">
        <div className="rounded-2xl border-2 p-8" style={{ borderColor: 'rgba(212, 175, 55, 0.6)', background: 'linear-gradient(180deg, rgba(30, 28, 22, 0.98) 0%, rgba(15, 14, 10, 0.99) 100%)' }}>
          <div className="text-5xl mb-4">✓</div>
          <h2 className={`text-xl font-bold uppercase tracking-wider mb-2 ${jetbrains.className}`} style={{ color: GOLD }}>
            5 VIDA CAP SUCCESSFULLY MINTED
          </h2>
          <p className="text-sm text-[#a0a0a5] mb-6">Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  if (step === 'bind' && showBindNewDevice) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="rounded-2xl border-2 p-8" style={{ borderColor: 'rgba(212, 175, 55, 0.6)', background: 'linear-gradient(180deg, rgba(30, 28, 22, 0.98) 0%, rgba(15, 14, 10, 0.99) 100%)' }}>
          <div className="flex justify-center mb-6">
            <Smartphone className="w-12 h-12" style={{ color: GOLD }} />
          </div>
          <h2 className={`text-xl font-bold uppercase tracking-wider mb-2 ${jetbrains.className}`} style={{ color: GOLD }}>
            Bind New Device
          </h2>
          <p className="text-sm text-[#a0a0a5] mb-6">
            Your face matched. This device is not yet bound to your account. Bind it to continue.
          </p>
          {error && (
            <div className="mb-4 py-2 px-4 rounded text-sm text-red-400 bg-red-500/10" role="alert">
              {error}
            </div>
          )}
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={handleBindNewDevice}
              disabled={loading}
              className="w-full py-4 rounded-xl font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all disabled:opacity-70"
              style={{ background: `linear-gradient(135deg, ${GOLD}, #C9A227)`, color: '#1a1510' }}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
              Confirm bind device
            </button>
            <button
              type="button"
              onClick={handleCancelBind}
              disabled={loading}
              className="w-full py-3 rounded-xl border-2 text-[#a0a0a5] hover:text-white transition-colors"
              style={{ borderColor: 'rgba(212, 175, 55, 0.4)' }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="rounded-2xl border-2 p-8" style={{ borderColor: 'rgba(212, 175, 55, 0.6)', background: 'linear-gradient(180deg, rgba(30, 28, 22, 0.98) 0%, rgba(15, 14, 10, 0.99) 100%)' }}>
        <h1 className={`text-xl font-bold uppercase tracking-wider mb-2 ${jetbrains.className}`} style={{ color: GOLD }}>
          Remote Device Handshake
        </h1>
        <p className="text-sm text-[#a0a0a5] mb-6">
          Enter your Sovereign ID. Face Pulse will verify you against your stored face template.
        </p>
        <label className="block text-sm font-medium text-[#a0a0a5] mb-2">Sovereign ID (phone)</label>
        <input
          type="tel"
          value={sovereignId}
          onChange={(e) => setSovereignId(e.target.value)}
          placeholder="+1 202 555 0123"
          className="w-full px-4 py-3 rounded-xl bg-black/40 border text-white placeholder-[#6b6b70] mb-4"
          style={{ borderColor: 'rgba(212, 175, 55, 0.4)' }}
          disabled={loading}
        />
        {error && (
          <div className="mb-4 py-2 px-4 rounded text-sm text-red-400 bg-red-500/10" role="alert">
            {error}
          </div>
        )}
        {step === 'face' && linkedDevice && (
          <p className="text-xs font-mono mb-3 px-3 py-2 rounded-lg border" style={{ color: '#6b6b70', borderColor: 'rgba(212,175,55,0.3)' }}>
            Phone ID (linked device): {linkedDevice.maskedId}
            {linkedDevice.deviceName ? ` · ${linkedDevice.deviceName}` : ''}
          </p>
        )}
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={handleSubmitId}
            disabled={loading}
            className="w-full py-4 rounded-xl font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all disabled:opacity-70"
            style={{ background: `linear-gradient(135deg, ${GOLD}, #C9A227)`, color: '#1a1510' }}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {step === 'face' ? 'Verifying face…' : 'Continue'}
              </>
            ) : (
              'Continue with Face Pulse'
            )}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="w-full py-3 rounded-xl border-2 text-[#a0a0a5] hover:text-white transition-colors"
              style={{ borderColor: 'rgba(212, 175, 55, 0.4)' }}
            >
              Cancel
            </button>
          )}
          <Link
            href="/link-device"
            className="text-center text-sm py-2 text-[#6b6b70] hover:text-[#e8c547] transition-colors"
          >
            Link Device — scan laptop QR to approve login
          </Link>
        </div>
      </div>
    </div>
  );
}

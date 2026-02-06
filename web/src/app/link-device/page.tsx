'use client';

import { useSearchParams } from 'next/navigation';
import { useCallback, useState } from 'react';
import Link from 'next/link';
import { Hand, Smartphone, Loader2 } from 'lucide-react';
import { approveLoginRequestWithDeviceToken } from '@/lib/loginRequest';
import { getAssertion, isWebAuthnSupported } from '@/lib/webauthn';
import { getCompositeDeviceFingerprint } from '@/lib/biometricAuth';

const GOLD = '#D4AF37';

/**
 * Link Device — Mobile side of Laptop-Mobile Pairing Bridge.
 * - With requestId (from scanning laptop's QR): confirm login and send Device ID + device-signed token to login_requests.
 * - Without requestId: show instructions to scan the QR on the laptop.
 */
export default function LinkDevicePage() {
  const searchParams = useSearchParams();
  const requestId = searchParams.get('requestId');
  const [status, setStatus] = useState<'idle' | 'prompting' | 'sending' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleApproveWithPalm = useCallback(async () => {
    if (!requestId?.trim()) return;
    if (!isWebAuthnSupported()) {
      setErrorMessage('Palm scan not supported in this browser.');
      setStatus('error');
      return;
    }
    setStatus('prompting');
    setErrorMessage(null);
    try {
      const assertion = await getAssertion();
      if (!assertion) {
        setErrorMessage('Palm scan cancelled or failed.');
        setStatus('error');
        return;
      }
      setStatus('sending');
      const deviceId = await getCompositeDeviceFingerprint();
      const sig = assertion.response.signature;
      const token = typeof sig === 'string'
        ? sig
        : (() => {
            const bytes = new Uint8Array(sig);
            let binary = '';
            for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
            return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
          })();
      const result = await approveLoginRequestWithDeviceToken(requestId.trim(), deviceId, token);
      if (result.ok) {
        setStatus('success');
      } else {
        setErrorMessage(result.error ?? 'Approval failed.');
        setStatus('error');
      }
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : 'Approval failed.');
      setStatus('error');
    }
  }, [requestId]);

  if (!requestId?.trim()) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border-2" style={{ borderColor: GOLD, background: 'rgba(212,175,55,0.1)' }}>
            <Smartphone className="w-10 h-10" style={{ color: GOLD }} />
          </div>
          <h1 className="text-2xl font-bold uppercase tracking-wider mb-4" style={{ color: GOLD }}>
            Link Device
          </h1>
          <p className="text-[#a0a0a5] text-sm mb-8">
            On your laptop, open the PFF login screen and tap &quot;Log in via my phone&quot;. Then scan the QR code with your phone camera. You’ll be taken here to approve the login.
          </p>
          <p className="text-xs text-[#6b6b70] mb-8">
            Or open this page from the QR code on your laptop to confirm login.
          </p>
          <Link
            href="/dashboard"
            className="inline-block px-6 py-3 rounded-xl font-bold uppercase tracking-wider"
            style={{ background: GOLD, color: '#0d0d0f' }}
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="text-6xl mb-4">✓</div>
          <h1 className="text-xl font-bold uppercase tracking-wider mb-2" style={{ color: GOLD }}>
            Login approved
          </h1>
          <p className="text-[#a0a0a5] text-sm mb-8">
            Your laptop will unlock shortly. You can close this tab.
          </p>
          <Link
            href="/dashboard"
            className="inline-block px-6 py-3 rounded-xl font-bold uppercase tracking-wider"
            style={{ background: GOLD, color: '#0d0d0f' }}
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="rounded-2xl border-2 p-8 text-center" style={{ borderColor: GOLD, background: 'rgba(212,175,55,0.05)' }}>
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border-2" style={{ borderColor: GOLD, background: 'rgba(212,175,55,0.1)' }}>
            <Hand className="w-10 h-10" style={{ color: GOLD }} />
          </div>
          <h1 className="text-xl font-bold uppercase tracking-wider mb-2" style={{ color: GOLD }}>
            Confirm login on this device
          </h1>
          <p className="text-[#a0a0a5] text-sm mb-6">
            A laptop is requesting to log in as you. Hold your palm to the camera to approve and add this device as trusted.
          </p>
          {errorMessage && (
            <p className="text-red-400 text-sm mb-4" role="alert">{errorMessage}</p>
          )}
          <button
            type="button"
            onClick={handleApproveWithPalm}
            disabled={status === 'prompting' || status === 'sending'}
            className="w-full py-4 rounded-xl font-bold uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-70"
            style={{ background: GOLD, color: '#0d0d0f' }}
          >
            {status === 'prompting' && <Loader2 className="w-5 h-5 animate-spin" />}
            {status === 'sending' && <Loader2 className="w-5 h-5 animate-spin" />}
            {status === 'prompting' ? 'Hold your palm to the camera…' : status === 'sending' ? 'Sending…' : 'Approve with Sovereign Palm'}
          </button>
          <Link href="/dashboard" className="block mt-4 text-sm text-[#6b6b70] hover:text-[#a0a0a5]">
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import {
  generatePresenceProof,
  fetchChallenge,
  isWebAuthnSupported,
  isSecureContext,
} from '@/lib/handshake';
import { submitSingleProof } from '@/lib/sync';
import { notifySyncStatus } from '@/lib/sync-status';
import { BiometricScanningHUD } from './BiometricScanningHUD';

export function ProvePresenceButton() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  const handleClick = async () => {
    if (!isSecureContext()) {
      setStatus('error');
      setMessage('PFF requires HTTPS or localhost.');
      return;
    }
    if (!isWebAuthnSupported()) {
      setStatus('error');
      setMessage('WebAuthn not supported. Use HTTPS and a supported browser (Chrome, Safari, Edge).');
      return;
    }
    setStatus('loading');
    setMessage(null);
    const challenge = await fetchChallenge();
    if (!challenge) {
      setStatus('error');
      setMessage('Could not fetch challenge. Connect to the internet and try again.');
      return;
    }
    const result = await generatePresenceProof(undefined, challenge);
    if (!result.success || !result.proof) {
      setStatus('error');
      setMessage(result.error ?? 'Verification failed.');
      return;
    }
    const { handshakeId, ...proof } = result.proof;
    const synced = await submitSingleProof(handshakeId, { ...proof, handshakeId });
    notifySyncStatus();
    setStatus('success');
    setMessage(
      synced
        ? 'Presence Proof generated and synced.'
        : 'Presence logged offline. Will sync when connection is restored.'
    );
  };

  return (
    <>
      <BiometricScanningHUD active={status === 'loading'} />
      <div className="mt-8 flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={handleClick}
          disabled={status === 'loading'}
          className="rounded-xl bg-[#c9a227] px-6 py-3 text-sm font-bold text-[#0d0d0f] hover:bg-[#e8c547] disabled:opacity-60 transition-colors"
        >
          {status === 'loading' ? 'Verifying…' : 'Prove Presence'}
        </button>
        {message && (
          <p
            className={`text-center text-sm ${
              status === 'success' ? 'text-[#c9a227]' : 'text-[#6b6b70]'
            }`}
          >
            {message}
          </p>
        )}
      </div>
    </>
  );
}

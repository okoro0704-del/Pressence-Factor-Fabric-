'use client';

import { useState } from 'react';
import { registerBiometric } from '@/lib/register';
import { isWebAuthnSupported, isSecureContext } from '@/lib/webauthn';
import { BiometricScanningHUD } from './BiometricScanningHUD';
import Link from 'next/link';

export function RegisterForm() {
  const [userName, setUserName] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [pffId, setPffId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) return;
    if (!isSecureContext()) {
      setStatus('error');
      setMessage('PFF requires HTTPS or localhost.');
      return;
    }
    if (!isWebAuthnSupported()) {
      setStatus('error');
      setMessage('WebAuthn not supported. Use HTTPS and a supported browser.');
      return;
    }
    setStatus('loading');
    setMessage(null);
    const userId = `pff_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const result = await registerBiometric(userId, userName.trim());
    setStatus(result.success ? 'success' : 'error');
    setMessage(result.error ?? (result.success ? 'Device registered.' : 'Registration failed.'));
    if (result.pffId) setPffId(result.pffId);
  };

  return (
    <>
      <BiometricScanningHUD active={status === 'loading'} />
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="userName" className="block text-sm font-medium text-[#6b6b70] mb-1">
            Display name
          </label>
          <input
            id="userName"
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="e.g. mrfundzman"
            disabled={status === 'loading'}
            className="w-full rounded-lg border border-[#2a2a2e] bg-[#16161a] px-4 py-3 text-[#f5f5f5] placeholder-[#6b6b70] focus:border-[#c9a227] focus:outline-none focus:ring-1 focus:ring-[#c9a227] disabled:opacity-60"
          />
        </div>
        <button
          type="submit"
          disabled={status === 'loading' || !userName.trim()}
          className="w-full rounded-xl bg-[#c9a227] px-6 py-3 text-sm font-bold text-[#0d0d0f] hover:bg-[#e8c547] disabled:opacity-60 transition-colors"
        >
          {status === 'loading' ? 'Registering…' : 'Register with biometrics'}
        </button>
      </form>
      {message && (
        <p
          className={`mt-4 text-center text-sm ${
            status === 'success' ? 'text-[#c9a227]' : status === 'error' ? 'text-red-400' : 'text-[#6b6b70]'
          }`}
        >
          {message}
          {pffId && (
            <span className="block mt-1 text-[#6b6b70] font-mono text-xs">{pffId}</span>
          )}
        </p>
      )}
      <p className="mt-8 text-center text-sm text-[#6b6b70]">
        <Link href="/manifesto" className="text-[#c9a227] hover:text-[#e8c547] underline">
          ← Back to Manifesto
        </Link>
      </p>
    </>
  );
}

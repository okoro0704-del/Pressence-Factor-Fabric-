'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { JetBrains_Mono } from 'next/font/google';
import { getIdentityAnchorPhone } from '@/lib/sentinelActivation';

const jetbrains = JetBrains_Mono({ weight: ['400', '600'], subsets: ['latin'] });

/**
 * EVG Consent — "Connect with Sovereign".
 * Partner redirects here with client_id, redirect_uri, state.
 * User sees consent; on Allow we create code and redirect back to partner (ZKP: only YES/NO).
 */
export default function EvgAuthorizePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientId = searchParams.get('client_id')?.trim() ?? '';
  const redirectUri = searchParams.get('redirect_uri')?.trim() ?? '';
  const state = searchParams.get('state') ?? '';

  const [partnerName, setPartnerName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buildReturnTo = useCallback(() => {
    const params = new URLSearchParams();
    if (clientId) params.set('client_id', clientId);
    if (redirectUri) params.set('redirect_uri', redirectUri);
    if (state) params.set('state', state);
    return `/evg/authorize?${params.toString()}`;
  }, [clientId, redirectUri, state]);

  useEffect(() => {
    if (!clientId || !redirectUri) {
      setError('Missing client_id or redirect_uri');
      setLoading(false);
      return;
    }
    fetch(`/api/evg/partner-info?client_id=${encodeURIComponent(clientId)}`)
      .then((res) => {
        if (!res.ok) return res.json().then((d) => Promise.reject(new Error(d.error || 'Invalid partner')));
        return res.json();
      })
      .then((data: { name?: string }) => setPartnerName(data.name ?? 'Partner'))
      .catch((e) => setError(e.message ?? 'Invalid partner'))
      .finally(() => setLoading(false));
  }, [clientId, redirectUri]);

  useEffect(() => {
    const phone = getIdentityAnchorPhone();
    if (!loading && !error && !phone) {
      router.replace(`/login?returnTo=${encodeURIComponent(buildReturnTo())}`);
    }
  }, [loading, error, router, buildReturnTo]);

  const handleAllow = async () => {
    const phone = getIdentityAnchorPhone();
    if (!phone || !clientId || !redirectUri) {
      setError('Session or parameters missing. Please log in and try again.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/evg/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          redirect_uri: redirectUri,
          state,
          identity_anchor: phone,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Authorization failed');
        return;
      }
      if (data.redirect_url) {
        window.location.href = data.redirect_url;
        return;
      }
      setError('No redirect URL returned');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeny = () => {
    if (redirectUri) {
      const sep = redirectUri.includes('?') ? '&' : '?';
      const url = `${redirectUri}${sep}error=access_denied&state=${encodeURIComponent(state)}`;
      window.location.href = url;
    } else {
      router.push('/dashboard');
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0d0d0f] flex items-center justify-center p-4">
        <p className="text-[#6b6b70] text-sm">Loading…</p>
      </main>
    );
  }

  if (error && !partnerName) {
    return (
      <main className="min-h-screen bg-[#0d0d0f] flex items-center justify-center p-4">
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 max-w-md text-center">
          <p className="text-red-400 text-sm">{error}</p>
          <a href="/dashboard" className="mt-4 inline-block text-sm text-[#D4AF37] hover:underline">
            ← Dashboard
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0d0d0f] text-white flex items-center justify-center p-4">
      <div
        className="rounded-2xl border border-[#2a2a2e] p-8 max-w-md w-full text-center"
        style={{
          background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.06) 0%, rgba(0, 0, 0, 0.4) 100%)',
          boxShadow: '0 0 0 1px rgba(212, 175, 55, 0.1), 0 8px 32px rgba(0,0,0,0.3)',
        }}
      >
        <h1 className={`text-xl font-bold text-[#D4AF37] uppercase tracking-wider mb-2 ${jetbrains.className}`}>
          Connect with Sovereign
        </h1>
        <p className="text-[#a0a0a5] text-sm mb-6">
          <strong className="text-white">{partnerName ?? 'A partner'}</strong> wants to verify that you are a{' '}
          <strong className="text-[#D4AF37]">Verified Human</strong>.
        </p>
        <p className="text-xs text-[#6b6b70] mb-6">
          Only a <strong>YES</strong> or <strong>NO</strong> is shared. No fingerprint, no face data, no identity.
        </p>
        {error && (
          <p className="text-red-400 text-sm mb-4" role="alert">
            {error}
          </p>
        )}
        <div className="flex gap-3 justify-center">
          <button
            type="button"
            onClick={handleDeny}
            disabled={submitting}
            className="px-6 py-3 rounded-lg border border-[#2a2a2e] text-[#a0a0a5] hover:bg-[#16161a] text-sm font-medium disabled:opacity-50 transition-colors"
          >
            Deny
          </button>
          <button
            type="button"
            onClick={handleAllow}
            disabled={submitting}
            className="px-6 py-3 rounded-lg bg-[#D4AF37] text-[#0d0d0f] font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Connecting…' : 'Allow'}
          </button>
        </div>
        <p className="text-[10px] text-[#6b6b70] mt-6">
          Sovereign Mesh · Enterprise Verification Gateway (EVG)
        </p>
      </div>
    </main>
  );
}

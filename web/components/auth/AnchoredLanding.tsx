'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getVitalizationAnchor, clearVitalizationAnchor, type VitalizationAnchor } from '@/lib/vitalizationAnchor';
import { getAssertion } from '@/lib/webauthn';
import { deriveFaceHashFromCredential } from '@/lib/biometricAnchorSync';
import { setIdentityAnchorForSession } from '@/lib/sentinelActivation';
import { setSessionIdentity } from '@/lib/sessionIsolation';
import { useGlobalPresenceGateway } from '@/contexts/GlobalPresenceGateway';
import { getIdentityAnchorPhone } from '@/lib/sentinelActivation';
import { getTimeBasedGreeting } from '@/lib/timeBasedGreeting';

/**
 * Pre-flight anchored landing: single elegant Face Scan circle.
 * On success: overlay "Identity Verified. Welcome Home to Vitalie, Architect." + time greeting, then router.replace('/dashboard').
 */
export function AnchoredLanding() {
  const router = useRouter();
  const { setPresenceVerified } = useGlobalPresenceGateway();
  const [anchor, setAnchor] = useState<VitalizationAnchor | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    let cancelled = false;
    getVitalizationAnchor().then((a) => {
      if (cancelled) return;
      if (a.isVitalized && a.citizenHash) {
        setAnchor(a);
      }
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const handleFaceScan = useCallback(async () => {
    const phone = anchor?.phone ?? getIdentityAnchorPhone();
    if (!anchor?.citizenHash || !phone) return;
    setError(null);
    setScanning(true);
    try {
      const assertion = await getAssertion();
      if (!assertion?.credential) {
        setError('Face scan cancelled or unavailable. Try again.');
        return;
      }
      const cred = assertion.credential;
      const credentialForHash = {
        id: cred.id,
        rawId: cred.rawId,
        response: {
          clientDataJSON: cred.response.clientDataJSON,
          authenticatorData: cred.response.authenticatorData,
        },
      };
      const liveHash = await deriveFaceHashFromCredential(credentialForHash);
      const stored = (anchor.citizenHash ?? '').trim();
      if (liveHash.trim() !== stored) {
        setError('Face did not match. Try again.');
        return;
      }
      setIdentityAnchorForSession(phone);
      setPresenceVerified(true);
      setSessionIdentity(phone);
      setGreeting(getTimeBasedGreeting());
      setShowOverlay(true);
      setTimeout(() => router.replace('/dashboard'), 2600);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Face scan failed. Try again.');
    } finally {
      setScanning(false);
    }
  }, [anchor, setPresenceVerified, router]);

  const handleVitalizeNewSoul = useCallback(() => {
    clearVitalizationAnchor();
    window.location.reload();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]" style={{ color: '#6b6b70' }} aria-busy="true">
        <p className="text-sm">Loading…</p>
      </div>
    );
  }

  // No saved identity (e.g. cleared or race): offer fallback to full registration
  if (!anchor?.citizenHash) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] p-4">
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 40%, rgba(212, 175, 55, 0.15) 0%, transparent 60%)' }}
          aria-hidden
        />
        <p className="relative z-10 text-sm text-center max-w-xs mb-6" style={{ color: '#a0a0a5' }}>
          No saved identity found.
        </p>
        <button
          type="button"
          onClick={() => {
            clearVitalizationAnchor();
            router.replace('/');
          }}
          className="relative z-10 px-6 py-3 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
          style={{
            background: 'linear-gradient(145deg, rgba(212, 175, 55, 0.15) 0%, rgba(212, 175, 55, 0.08) 100%)',
            border: '1px solid rgba(212, 175, 55, 0.4)',
            color: '#D4AF37',
          }}
        >
          Continue to registration
        </button>
      </div>
    );
  }

  if (showOverlay) {
    return (
      <div
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#050505]/95 backdrop-blur-sm p-6"
        role="status"
        aria-live="polite"
      >
        <div
          className="rounded-2xl border-2 p-8 max-w-md w-full text-center shadow-2xl"
          style={{
            background: 'linear-gradient(180deg, rgba(20, 20, 18, 0.98) 0%, rgba(10, 10, 8, 0.99) 100%)',
            borderColor: 'rgba(34, 197, 94, 0.6)',
            boxShadow: '0 0 60px rgba(34, 197, 94, 0.25), inset 0 1px 0 rgba(34, 197, 94, 0.15)',
          }}
        >
          <p className="text-xl font-bold mb-2" style={{ color: '#22c55e' }}>
            Identity Verified. Welcome Home to Vitalie, Architect.
          </p>
          <p className="text-sm mt-4" style={{ color: '#a0a0a5' }}>
            {greeting}
          </p>
          <p className="text-xs mt-6" style={{ color: '#6b6b70' }}>
            Taking you to the Dashboard…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] p-4">
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 40%, rgba(212, 175, 55, 0.15) 0%, transparent 60%)' }}
        aria-hidden
      />

      <div className="relative z-10 flex flex-col items-center">
        <p className="text-sm uppercase tracking-widest mb-8" style={{ color: '#6b6b70' }}>
          Verify your presence
        </p>

        <button
          type="button"
          onClick={handleFaceScan}
          disabled={scanning}
          className="relative w-48 h-48 rounded-full flex items-center justify-center transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-[#D4AF37]/40 disabled:opacity-70 disabled:cursor-not-allowed"
          style={{
            background: 'linear-gradient(145deg, rgba(30, 28, 22, 0.98) 0%, rgba(15, 14, 10, 0.99) 100%)',
            border: '2px solid rgba(212, 175, 55, 0.5)',
            boxShadow: scanning
              ? '0 0 40px rgba(212, 175, 55, 0.4), inset 0 0 30px rgba(212, 175, 55, 0.08)'
              : '0 0 30px rgba(212, 175, 55, 0.2), inset 0 0 20px rgba(0,0,0,0.3)',
          }}
          aria-label="Scan face to enter"
        >
          {scanning ? (
            <span className="w-10 h-10 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
          ) : (
            <span className="text-5xl" aria-hidden>👤</span>
          )}
        </button>

        <p className="mt-6 text-sm max-w-xs text-center" style={{ color: '#a0a0a5' }}>
          {scanning ? 'Scanning…' : 'Tap the circle to scan your face'}
        </p>

        {error && (
          <p className="mt-4 text-sm text-red-400 text-center max-w-xs" role="alert">
            {error}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={handleVitalizeNewSoul}
        className="absolute bottom-8 left-0 right-0 mx-auto w-fit text-xs uppercase tracking-wider transition-colors hover:underline"
        style={{ color: '#6b6b70' }}
      >
        Vitalize New Soul
      </button>
    </div>
  );
}

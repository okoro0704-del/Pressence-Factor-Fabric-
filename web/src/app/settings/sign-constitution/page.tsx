'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/dashboard/ProtectedRoute';
import { SovereignConstitution } from '@/components/auth/SovereignConstitution';
import { getIdentityAnchorPhone } from '@/lib/sentinelActivation';
import { hasSignedConstitution } from '@/lib/legalApprovals';

const GOLD = '#D4AF37';

/**
 * Settings → Sign Sovereign Constitution.
 * Lets already-vitalized users sign the Constitution so the 10 VIDA CAP mint can run (on next dashboard load).
 */
export default function SignConstitutionPage() {
  const router = useRouter();
  const [phone, setPhone] = useState<string | null>(null);
  const [alreadySigned, setAlreadySigned] = useState<boolean | null>(null);

  useEffect(() => {
    const p = getIdentityAnchorPhone();
    setPhone(p?.trim() ?? null);
  }, []);

  useEffect(() => {
    if (!phone) return;
    hasSignedConstitution(phone).then(setAlreadySigned);
  }, [phone]);

  const handleAccept = async () => {
    router.replace('/dashboard');
  };

  if (phone === null) {
    return (
      <ProtectedRoute>
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#0d0d0f]">
        <p className="text-sm text-[#6b6b70] mb-4">Loading…</p>
        <Link href="/settings" className="text-sm" style={{ color: GOLD }}>Back to Settings</Link>
      </div>
      </ProtectedRoute>
    );
  }

  if (!phone) {
    return (
      <ProtectedRoute>
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#0d0d0f]">
        <p className="text-sm text-[#a0a0a5] mb-4">You need to be signed in to sign the Constitution.</p>
        <Link href="/" className="text-sm" style={{ color: GOLD }}>Go to home</Link>
      </div>
      </ProtectedRoute>
    );
  }

  if (alreadySigned === true) {
    return (
      <ProtectedRoute>
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#0d0d0f]">
        <p className="text-sm text-[#a0a0a5] mb-2">You have already signed the Sovereign Constitution.</p>
        <p className="text-xs text-[#6b6b70] mb-6">You can sign again below if the version has changed, or go to the dashboard.</p>
        <div className="flex gap-3">
          <Link href="/dashboard" className="px-4 py-2 rounded-lg font-medium text-sm" style={{ background: 'rgba(212, 175, 55, 0.2)', color: GOLD }}>
            Go to Dashboard
          </Link>
          <button
            type="button"
            onClick={() => setAlreadySigned(false)}
            className="px-4 py-2 rounded-lg border text-sm"
            style={{ borderColor: 'rgba(212, 175, 55, 0.5)', color: GOLD }}
          >
            Sign again / new version
          </button>
        </div>
        <Link href="/settings" className="text-xs mt-6 text-[#6b6b70] hover:text-[#e8c547]">Back to Settings</Link>
      </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
    <div className="min-h-screen flex flex-col bg-[#0d0d0f]">
      <div className="p-4 flex items-center justify-between border-b border-[#2a2a2e]">
        <Link href="/settings" className="text-sm" style={{ color: GOLD }}>← Back to Settings</Link>
      </div>
      <SovereignConstitution
        identityAnchorPhone={phone}
        onAccept={handleAccept}
      />
    </div>
    </ProtectedRoute>
  );
}

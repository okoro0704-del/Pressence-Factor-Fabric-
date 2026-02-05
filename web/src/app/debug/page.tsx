'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { executeHardIdentityReset } from '@/lib/identityReset';

/**
 * Temporary debug page: Hard Identity Reset for the current device.
 * Clears local state, purges Supabase profile binding for this device_id,
 * redirects to /vitalization?reset=1 (camera + blue mesh + re-register).
 */
export default function DebugPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleReset = async () => {
    setStatus('loading');
    setErrorMessage(null);
    const result = await executeHardIdentityReset();
    if (result.ok) {
      return; // redirect happens inside executeHardIdentityReset
    }
    setStatus('error');
    setErrorMessage(result.error ?? 'Reset failed');
  };

  return (
    <div className="min-h-screen bg-[#050505] p-6 max-w-lg mx-auto flex flex-col items-center justify-center">
      <h1 className="text-xl font-bold text-[#e8c547] uppercase tracking-wider mb-2">Debug</h1>
      <p className="text-sm text-[#6b6b70] mb-6 text-center">
        Temporary: Reset Device Identity. Clears local state, purges profile binding, then opens camera and re-registration.
      </p>

      <section className="rounded-xl border border-[#2a2a2e] bg-[#0d0d0f] p-6 mb-6 w-full">
        <h2 className="text-sm font-semibold text-[#a0a0a5] uppercase tracking-wider mb-2">Hard Identity Reset</h2>
        <p className="text-xs text-[#6b6b70] mb-4">
          Clears localStorage, sessionStorage, and cached biometric hashes; removes this device from the profile in Supabase; redirects to vitalization with camera and AI mesh, then first-time registration.
        </p>
        <button
          type="button"
          onClick={handleReset}
          disabled={status === 'loading'}
          className="w-full py-3 rounded-lg bg-[#D4AF37] text-black font-bold uppercase tracking-wider disabled:opacity-50 hover:bg-[#e8c547] transition-colors"
        >
          {status === 'loading' ? 'Resetting…' : 'Reset Device Identity'}
        </button>
        {errorMessage && (
          <p className="mt-3 text-sm text-amber-400">{errorMessage}</p>
        )}
      </section>

      <button
        type="button"
        onClick={() => router.push('/')}
        className="text-sm text-[#6b6b70] hover:text-[#e8c547]"
      >
        ← Back to app
      </button>
    </div>
  );
}

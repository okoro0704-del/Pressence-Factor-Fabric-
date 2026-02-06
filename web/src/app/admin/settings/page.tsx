'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getIdentityAnchorPhone } from '@/lib/sentinelActivation';
import { executeHardIdentityReset } from '@/lib/identityReset';

const ADMIN_PHONE = process.env.NEXT_PUBLIC_ADMIN_PHONE?.trim() ?? '';

/**
 * Hidden Admin Settings — only visible when current session phone matches NEXT_PUBLIC_ADMIN_PHONE.
 * Force Global Schema Refresh: calls API that runs NOTIFY pgrst, 'reload schema' to fix Schema Cache errors.
 */
export default function AdminSettingsPage() {
  const router = useRouter();
  const [phone, setPhone] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshStatus, setRefreshStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [refreshMessage, setRefreshMessage] = useState('');
  const [resetStatus, setResetStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [resetMessage, setResetMessage] = useState('');

  useEffect(() => {
    setPhone(getIdentityAnchorPhone());
    setLoading(false);
  }, []);

  const isAdmin = !!ADMIN_PHONE && !!phone && phone.replace(/\s/g, '') === ADMIN_PHONE.replace(/\s/g, '');

  const handleHardIdentityReset = async () => {
    setResetStatus('loading');
    setResetMessage('');
    const result = await executeHardIdentityReset();
    if (result.ok) return;
    setResetStatus('error');
    setResetMessage(result.error ?? 'Reset failed');
  };

  const handleForceSchemaRefresh = async () => {
    if (!phone) return;
    setRefreshStatus('loading');
    setRefreshMessage('');
    try {
      const res = await fetch('/api/admin/refresh-schema', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setRefreshStatus('ok');
        setRefreshMessage('Schema cache reload requested. PostgREST will pick up new columns (e.g. recovery_seed_encrypted).');
      } else {
        setRefreshStatus('error');
        setRefreshMessage(data.error || data.hint || `HTTP ${res.status}`);
      }
    } catch (e) {
      setRefreshStatus('error');
      setRefreshMessage(e instanceof Error ? e.message : 'Request failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center text-[#6b6b70]">
        Loading…
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
        <div className="text-center text-[#6b6b70]">
          <p className="mb-4">You do not have access to this page.</p>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="px-4 py-2 rounded bg-[#2a2a2e] text-[#e8c547] hover:bg-[#3d3d45]"
          >
            Go to home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] p-6 max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-[#e8c547] uppercase tracking-wider mb-2">Admin Settings</h1>
      <p className="text-sm text-[#6b6b70] mb-6">Hidden page — only your account. Use sparingly.</p>

      <section className="rounded-xl border border-[#2a2a2e] bg-[#0d0d0f] p-6 mb-6">
        <h2 className="text-sm font-semibold text-[#a0a0a5] uppercase tracking-wider mb-2">Schema cache</h2>
        <p className="text-xs text-[#6b6b70] mb-4">
          If the app shows a &quot;Schema Cache&quot; error for recovery_seed_encrypted (or other new columns), this tells PostgREST to reload its schema.
        </p>
        <button
          type="button"
          onClick={handleForceSchemaRefresh}
          disabled={refreshStatus === 'loading'}
          className="w-full py-3 rounded-lg bg-[#D4AF37] text-black font-bold uppercase tracking-wider disabled:opacity-50 hover:bg-[#e8c547] transition-colors"
        >
          {refreshStatus === 'loading' ? 'Refreshing…' : 'Force Global Schema Refresh'}
        </button>
        {refreshMessage && (
          <p className={`mt-3 text-sm ${refreshStatus === 'ok' ? 'text-emerald-400' : 'text-amber-400'}`}>
            {refreshMessage}
          </p>
        )}
      </section>

      <section className="rounded-xl border border-[#2a2a2e] bg-[#0d0d0f] p-6 mb-6">
        <h2 className="text-sm font-semibold text-[#a0a0a5] uppercase tracking-wider mb-2">Device identity</h2>
        <p className="text-xs text-[#6b6b70] mb-4">
          Hard Identity Reset: clear local state and Supabase profile binding for this device, then open camera and re-registration flow.
        </p>
        <button
          type="button"
          onClick={handleHardIdentityReset}
          disabled={resetStatus === 'loading'}
          className="w-full py-3 rounded-lg bg-[#2a2a2e] text-[#e8c547] font-bold uppercase tracking-wider disabled:opacity-50 hover:bg-[#3d3d45] transition-colors border border-[#D4AF37]/30"
        >
          {resetStatus === 'loading' ? 'Resetting…' : 'Reset Device Identity'}
        </button>
        {resetMessage && (
          <p className="mt-3 text-sm text-amber-400">{resetMessage}</p>
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

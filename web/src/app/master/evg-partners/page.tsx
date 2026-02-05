'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MasterArchitectGuard } from '@/components/admin/MasterArchitectGuard';
import { JetBrains_Mono } from 'next/font/google';

const jetbrains = JetBrains_Mono({ weight: ['400', '600'], subsets: ['latin'] });

interface EvgPartnerRow {
  id: string;
  client_id: string;
  name: string;
  redirect_uris: string[];
  data_integrity_fee_cents: number;
  revenue_share_user_pct: number;
  status: string;
  created_at: string;
  updated_at: string;
}

/**
 * EVG Authorized Partners — Transparency Log.
 * Manage who has access to verify your humans (Connect with Sovereign).
 */
function EvgPartnersContent() {
  const [partners, setPartners] = useState<EvgPartnerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRedirectUris, setNewRedirectUris] = useState('');
  const [newFeeCents, setNewFeeCents] = useState(100);
  const [newSharePct, setNewSharePct] = useState(50);
  const [creating, setCreating] = useState(false);
  const [createdSecret, setCreatedSecret] = useState<{ client_id: string; client_secret: string } | null>(null);

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/evg/admin/partners');
      if (!res.ok) throw new Error('Failed to load partners');
      const data = await res.json();
      setPartners(data.partners ?? []);
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to load partners' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const handleCreate = async () => {
    const name = newName.trim();
    const uris = newRedirectUris
      .split(/[\n,]/)
      .map((u) => u.trim())
      .filter(Boolean);
    if (!name || uris.length === 0) {
      setMessage({ type: 'error', text: 'Name and at least one redirect_uri required.' });
      return;
    }
    setCreating(true);
    setMessage(null);
    try {
      const res = await fetch('/api/evg/admin/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          redirect_uris: uris,
          data_integrity_fee_cents: newFeeCents,
          revenue_share_user_pct: newSharePct,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Create failed');
      setCreatedSecret({ client_id: data.partner.client_id, client_secret: data.client_secret });
      setShowAdd(false);
      setNewName('');
      setNewRedirectUris('');
      setMessage({ type: 'success', text: 'Partner created. Store client_secret — it will not be shown again.' });
      fetchPartners();
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Create failed' });
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm('Revoke this partner? They will no longer be able to verify humans.')) return;
    try {
      const res = await fetch(`/api/evg/admin/partners/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'revoked' }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Update failed');
      setMessage({ type: 'success', text: 'Partner revoked.' });
      fetchPartners();
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Update failed' });
    }
  };

  const handleReactivate = async (id: string) => {
    try {
      const res = await fetch(`/api/evg/admin/partners/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Update failed');
      setMessage({ type: 'success', text: 'Partner reactivated.' });
      fetchPartners();
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Update failed' });
    }
  };

  return (
    <main className="min-h-screen bg-[#050505] text-[#f5f5f5] relative">
      <header className="border-b border-[#2a2a2e] bg-[#0d0d0f]/95 backdrop-blur px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-[#D4AF37] to-[#e8c547] bg-clip-text text-transparent tracking-tight">
              Authorized Partners (EVG)
            </h1>
            <p className="text-xs text-[#6b6b70] mt-0.5">
              Transparency Log — who can verify your humans via Connect with Sovereign. ZKP: partners receive YES/NO only.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/master/dashboard" className="text-sm font-medium text-[#D4AF37] hover:text-[#e8c547] transition-colors">
              ← Master Dashboard
            </Link>
            <button
              type="button"
              onClick={() => { setShowAdd(true); setCreatedSecret(null); setMessage(null); }}
              className="px-4 py-2 rounded-lg bg-[#D4AF37] text-[#050505] font-semibold text-sm hover:opacity-90"
            >
              Add Partner
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        {message && (
          <div
            className={`p-4 rounded-lg border text-sm ${
              message.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}
          >
            {message.text}
          </div>
        )}

        {createdSecret && (
          <div className="rounded-xl border-2 border-amber-500/50 bg-amber-500/10 p-6">
            <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-2">Store these — client_secret will not be shown again</h3>
            <p className="text-xs text-[#6b6b70] mb-2">client_id:</p>
            <p className={`font-mono text-sm text-[#e8c547] break-all ${jetbrains.className}`}>{createdSecret.client_id}</p>
            <p className="text-xs text-[#6b6b70] mt-3 mb-2">client_secret:</p>
            <p className={`font-mono text-sm text-[#e8c547] break-all ${jetbrains.className}`}>{createdSecret.client_secret}</p>
            <button type="button" onClick={() => setCreatedSecret(null)} className="mt-4 text-sm text-[#6b6b70] hover:text-[#a0a0a5]">
              Dismiss
            </button>
          </div>
        )}

        {showAdd && (
          <section className="bg-[#0d0d0f] rounded-xl p-6 border-2 border-[#D4AF37]/30">
            <h2 className="text-sm font-bold text-[#D4AF37] uppercase tracking-wider mb-4">New Authorized Partner</h2>
            <div className="grid gap-4">
              <div>
                <label className="block text-xs text-[#6b6b70] uppercase tracking-wider mb-1">Partner name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Acme Corp"
                  className="w-full px-4 py-2 rounded-lg bg-[#16161a] border border-[#2a2a2e] text-[#f5f5f5] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-[#6b6b70] uppercase tracking-wider mb-1">Redirect URIs (one per line)</label>
                <textarea
                  value={newRedirectUris}
                  onChange={(e) => setNewRedirectUris(e.target.value)}
                  placeholder="https://partner.com/callback&#10;https://partner.com/evg-callback"
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg bg-[#16161a] border border-[#2a2a2e] text-[#f5f5f5] text-sm font-mono"
                />
              </div>
              <div className="flex gap-4 flex-wrap">
                <div>
                  <label className="block text-xs text-[#6b6b70] uppercase tracking-wider mb-1">Data Integrity Fee (cents)</label>
                  <input
                    type="number"
                    min={0}
                    value={newFeeCents}
                    onChange={(e) => setNewFeeCents(parseInt(e.target.value, 10) || 0)}
                    className="w-28 px-4 py-2 rounded-lg bg-[#16161a] border border-[#2a2a2e] text-[#f5f5f5] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#6b6b70] uppercase tracking-wider mb-1">Revenue share to user (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.01}
                    value={newSharePct}
                    onChange={(e) => setNewSharePct(parseFloat(e.target.value) || 50)}
                    className="w-28 px-4 py-2 rounded-lg bg-[#16161a] border border-[#2a2a2e] text-[#f5f5f5] text-sm"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={creating}
                  className="px-6 py-2 rounded-lg bg-[#D4AF37] text-[#050505] font-semibold text-sm disabled:opacity-50"
                >
                  {creating ? 'Creating…' : 'Create Partner'}
                </button>
                <button type="button" onClick={() => setShowAdd(false)} className="px-6 py-2 rounded-lg border border-[#2a2a2e] text-[#a0a0a5] text-sm">
                  Cancel
                </button>
              </div>
            </div>
          </section>
        )}

        <section className="bg-[#0d0d0f] rounded-xl p-6 border-2 border-[#D4AF37]/30">
          <h2 className="text-sm font-bold text-[#D4AF37] uppercase tracking-wider mb-4">Authorized Partners List</h2>
          {loading ? (
            <p className="text-sm text-[#6b6b70]">Loading…</p>
          ) : partners.length === 0 ? (
            <p className="text-sm text-[#6b6b70]">No partners yet. Add one to allow third-party apps to verify humans (Connect with Sovereign).</p>
          ) : (
            <ul className="space-y-4">
              {partners.map((p) => (
                <li key={p.id} className="border border-[#2a2a2e] rounded-lg p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-[#e8c547]">{p.name}</p>
                      <p className={`text-xs font-mono text-[#6b6b70] ${jetbrains.className}`}>{p.client_id}</p>
                      <p className="text-xs text-[#6b6b70] mt-1">
                        Fee: {p.data_integrity_fee_cents}¢ · User share: {p.revenue_share_user_pct}% · Status: {p.status}
                      </p>
                      {Array.isArray(p.redirect_uris) && p.redirect_uris.length > 0 && (
                        <p className="text-xs text-[#6b6b70] mt-1">Redirect URIs: {p.redirect_uris.join(', ')}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {p.status === 'active' ? (
                        <button
                          type="button"
                          onClick={() => handleRevoke(p.id)}
                          className="px-3 py-1.5 rounded border border-red-500/50 text-red-400 text-xs hover:bg-red-500/10"
                        >
                          Revoke
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleReactivate(p.id)}
                          className="px-3 py-1.5 rounded border border-green-500/50 text-green-400 text-xs hover:bg-green-500/10"
                        >
                          Reactivate
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="text-xs text-[#6b6b70]">
          Partner flow: Redirect user to <code className="text-[#6b6b70] bg-[#16161a] px-1 rounded">/evg/authorize?client_id=...&amp;redirect_uri=...&amp;state=...</code>.
          User consents → callback with <code className="text-[#6b6b70] bg-[#16161a] px-1 rounded">code</code> → exchange for <code className="text-[#6b6b70] bg-[#16161a] px-1 rounded">access_token</code> (POST /api/evg/token) → GET /api/evg/verify with Bearer token returns <code className="text-[#6b6b70] bg-[#16161a] px-1 rounded">{"{ \"verified\": true|false }"}</code> only (ZKP).
        </p>
      </div>
    </main>
  );
}

export default function EvgPartnersPage() {
  return (
    <MasterArchitectGuard>
      <EvgPartnersContent />
    </MasterArchitectGuard>
  );
}

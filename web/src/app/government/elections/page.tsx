'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { GovernmentAdminGuard } from '@/components/government/GovernmentAdminGuard';
import {
  listElections,
  createElection,
  openElection,
  closeElection,
} from '@/lib/votingEngine';
import { Vote, Plus, Loader2, Play, Square } from 'lucide-react';

interface ElectionRow {
  id: string;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
}

/**
 * Election Dashboard — state can launch National Referendum using the PFF network.
 * GOVERNMENT_ADMIN only. Route: web/app/government/elections
 */
function ElectionsContent() {
  const [elections, setElections] = useState<ElectionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [actingId, setActingId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    listElections().then((list) => {
      setElections(list);
      setLoading(false);
    });
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleCreate = async () => {
    const title = newTitle.trim();
    if (!title) {
      setMessage({ type: 'error', text: 'Enter a title for the referendum.' });
      return;
    }
    setCreating(true);
    setMessage(null);
    const result = await createElection(title, newDescription.trim() || undefined);
    setCreating(false);
    if (result.ok) {
      setMessage({ type: 'success', text: 'National Referendum created. You can open it to start voting.' });
      setShowCreate(false);
      setNewTitle('');
      setNewDescription('');
      load();
    } else {
      setMessage({ type: 'error', text: result.error ?? 'Failed to create.' });
    }
  };

  const handleOpen = async (id: string) => {
    setActingId(id);
    setMessage(null);
    const result = await openElection(id);
    setActingId(null);
    if (result.ok) {
      setMessage({ type: 'success', text: 'Referendum is now open. Citizens can vote via 3-of-4 Presence Gate.' });
      load();
    } else {
      setMessage({ type: 'error', text: result.error ?? 'Failed to open.' });
    }
  };

  const handleClose = async (id: string) => {
    setActingId(id);
    setMessage(null);
    const result = await closeElection(id);
    setActingId(null);
    if (result.ok) {
      setMessage({ type: 'success', text: 'Referendum closed. Votes are sealed in the national ballot box.' });
      load();
    } else {
      setMessage({ type: 'error', text: result.error ?? 'Failed to close.' });
    }
  };

  const formatDate = (s: string) => {
    try {
      return new Date(s).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
    } catch {
      return s;
    }
  };

  return (
    <main className="min-h-screen bg-[#050505] text-[#f5f5f5] relative">
      <header className="relative z-10 border-b border-[#2a2a2e] bg-[#0d0d0f]/95 backdrop-blur px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-[#D4AF37] to-[#e8c547] bg-clip-text text-transparent tracking-tight">
              Election Dashboard
            </h1>
            <p className="text-xs text-[#6b6b70] mt-0.5">
              Launch National Referendum using the PFF network · One person, one vote
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/government/treasury"
              className="text-sm font-medium text-[#D4AF37] hover:text-[#e8c547] transition-colors"
            >
              Treasury →
            </Link>
            <Link
              href="/dashboard"
              className="text-sm font-medium text-[#D4AF37] hover:text-[#e8c547] transition-colors"
            >
              ← Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="relative z-10 max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        {message && (
          <div
            className={`p-4 rounded-lg border text-sm ${
              message.type === 'success'
                ? 'bg-green-500/10 border-green-500/30 text-green-400'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Launch National Referendum */}
        <section className="bg-[#0d0d0f] rounded-xl p-6 border-2 border-[#D4AF37]/30">
          <h2 className="text-sm font-bold text-[#D4AF37] uppercase tracking-wider mb-4 flex items-center gap-2">
            <Vote className="w-4 h-4" />
            National Referendum
          </h2>
          {!showCreate ? (
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-3 rounded-lg font-medium bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/50 hover:bg-[#D4AF37]/30 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Launch National Referendum
            </button>
          ) : (
            <div className="space-y-4">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Referendum title"
                className="w-full px-4 py-3 rounded-lg bg-[#16161a] border border-[#2a2a2e] text-[#f5f5f5] placeholder:text-[#6b6b70] focus:border-[#D4AF37]/50 focus:outline-none"
              />
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Description (optional)"
                rows={3}
                className="w-full px-4 py-3 rounded-lg bg-[#16161a] border border-[#2a2a2e] text-[#f5f5f5] placeholder:text-[#6b6b70] focus:border-[#D4AF37]/50 focus:outline-none resize-none"
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={creating}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-[#D4AF37] text-[#050505] hover:opacity-90 disabled:opacity-50"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Create Referendum
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreate(false);
                    setNewTitle('');
                    setNewDescription('');
                  }}
                  className="px-4 py-2 rounded-lg font-medium border border-[#2a2a2e] text-[#a0a0a5] hover:bg-[#16161a]"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Elections list */}
        <section className="bg-[#0d0d0f] rounded-xl p-6 border-2 border-[#D4AF37]/30">
          <h2 className="text-sm font-bold text-[#D4AF37] uppercase tracking-wider mb-4">
            Elections & Referendums
          </h2>
          {loading && elections.length === 0 ? (
            <div className="flex items-center gap-2 text-[#6b6b70]">
              <Loader2 className="w-5 h-5 animate-spin" />
              Loading…
            </div>
          ) : elections.length === 0 ? (
            <p className="text-[#6b6b70]">No elections yet. Launch a National Referendum above.</p>
          ) : (
            <div className="space-y-4">
              {elections.map((e) => (
                <div
                  key={e.id}
                  className="p-4 rounded-lg border border-[#2a2a2e] bg-[#16161a]/50 flex flex-wrap items-center justify-between gap-3"
                >
                  <div>
                    <p className="font-medium text-[#f5f5f5]">{e.title}</p>
                    {e.description && (
                      <p className="text-xs text-[#6b6b70] mt-1 line-clamp-2">{e.description}</p>
                    )}
                    <p className="text-xs text-[#6b6b70] mt-1">{formatDate(e.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium uppercase ${
                        e.status === 'open'
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : e.status === 'closed'
                            ? 'bg-[#2a2a2e] text-[#a0a0a5] border border-[#2a2a2e]'
                            : 'bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30'
                      }`}
                    >
                      {e.status}
                    </span>
                    {e.status === 'draft' && (
                      <button
                        type="button"
                        onClick={() => handleOpen(e.id)}
                        disabled={actingId !== null}
                        className="flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 disabled:opacity-50"
                      >
                        {actingId === e.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                        Open
                      </button>
                    )}
                    {e.status === 'open' && (
                      <button
                        type="button"
                        onClick={() => handleClose(e.id)}
                        disabled={actingId !== null}
                        className="flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 disabled:opacity-50"
                      >
                        {actingId === e.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Square className="w-4 h-4" />}
                        Close
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default function GovernmentElectionsPage() {
  return (
    <GovernmentAdminGuard>
      <ElectionsContent />
    </GovernmentAdminGuard>
  );
}

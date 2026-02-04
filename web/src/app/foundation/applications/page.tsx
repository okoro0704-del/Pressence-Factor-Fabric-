'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/dashboard/ProtectedRoute';
import {
  listPartnerApplications,
  approvePartnerApplication,
  rejectPartnerApplication,
  type PartnerApplicationRow,
  type PartnerApplicationStatus,
} from '@/lib/partnerApplication';

const GOLD = '#D4AF37';
const GOLD_DIM = 'rgba(212, 175, 55, 0.7)';
const BG = '#0d0d0f';
const BORDER = 'rgba(212, 175, 55, 0.25)';

const STATUS_COLOR: Record<PartnerApplicationStatus, string> = {
  PENDING_REVIEW: '#f59e0b',
  APPROVED: '#22c55e',
  REJECTED: '#ef4444',
};

/**
 * Foundation Applications — secure route for Foundation to view, approve, or reject partner applications.
 * Approving automatically generates PFF_API_KEY for the partner.
 */
function FoundationApplicationsContent() {
  const [applications, setApplications] = useState<PartnerApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [revealedKey, setRevealedKey] = useState<{ id: string; key: string } | null>(null);
  const [rejectReason, setRejectReason] = useState<{ id: string; value: string } | null>(null);

  const load = async () => {
    setLoading(true);
    const list = await listPartnerApplications();
    setApplications(list);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleApprove = async (id: string) => {
    setActionId(id);
    const result = await approvePartnerApplication(id);
    setActionId(null);
    if (result.ok) {
      setRevealedKey({ id, key: result.pff_api_key });
      load();
    }
  };

  const handleReject = async (id: string) => {
    const reason = rejectReason?.id === id ? rejectReason.value : undefined;
    setActionId(id);
    await rejectPartnerApplication(id, reason);
    setActionId(null);
    setRejectReason(null);
    load();
  };

  return (
    <main className="min-h-screen py-8 px-4" style={{ background: BG, color: GOLD_DIM }}>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-semibold mb-2" style={{ color: GOLD }}>
          Partner Applications
        </h1>
        <p className="text-sm mb-8 opacity-80">
          View, approve, or reject applications. Approving generates a PFF_API_KEY for the partner.
        </p>

        {loading ? (
          <p className="text-sm opacity-70">Loading…</p>
        ) : applications.length === 0 ? (
          <p className="text-sm opacity-70">No applications yet.</p>
        ) : (
          <div className="space-y-6">
            {applications.map((app) => (
              <div
                key={app.id}
                className="rounded-xl border p-5"
                style={{ borderColor: BORDER, background: 'rgba(212,175,55,0.04)' }}
              >
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <h2 className="font-semibold" style={{ color: GOLD }}>
                    {app.company_name}
                  </h2>
                  <span
                    className="text-xs font-medium px-2 py-1 rounded"
                    style={{ background: STATUS_COLOR[app.status] + '22', color: STATUS_COLOR[app.status] }}
                  >
                    {app.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-sm space-y-1 mb-4 opacity-90">
                  <div><strong>Industry:</strong> {app.industry}</div>
                  <div><strong>Integration intent:</strong> {app.integration_intent}</div>
                  <div className="text-xs opacity-70">
                    Applied {new Date(app.created_at).toLocaleString()}
                  </div>
                </div>
                {app.status === 'APPROVED' && app.pff_api_key && (
                  <div className="mb-4 rounded border p-3 text-sm font-mono break-all" style={{ borderColor: BORDER }}>
                    {revealedKey?.id === app.id ? (
                      <span>PFF_API_KEY: <strong style={{ color: GOLD }}>{revealedKey.key}</strong></span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setRevealedKey({ id: app.id, key: app.pff_api_key! })}
                        className="text-amber-400 hover:underline"
                      >
                        Show API key
                      </button>
                    )}
                  </div>
                )}
                {app.status === 'PENDING_REVIEW' && (
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      type="text"
                      placeholder="Rejection reason (optional)"
                      value={rejectReason?.id === app.id ? rejectReason.value : ''}
                      onChange={(e) => setRejectReason({ id: app.id, value: e.target.value })}
                      className="flex-1 min-w-[160px] px-3 py-2 rounded border bg-black/40 text-white placeholder:opacity-50 text-sm"
                      style={{ borderColor: BORDER }}
                    />
                    <button
                      type="button"
                      onClick={() => handleReject(app.id)}
                      disabled={actionId === app.id}
                      className="px-3 py-2 rounded text-sm font-medium border disabled:opacity-50"
                      style={{ borderColor: 'rgba(239,68,68,0.5)', color: '#ef4444' }}
                    >
                      {actionId === app.id ? 'Rejecting…' : 'Reject'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApprove(app.id)}
                      disabled={actionId === app.id}
                      className="px-3 py-2 rounded text-sm font-medium disabled:opacity-50"
                      style={{ background: GOLD, color: '#0d0d0f' }}
                    >
                      {actionId === app.id ? 'Approving…' : 'Approve'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export default function FoundationApplicationsPage() {
  return (
    <ProtectedRoute>
      <FoundationApplicationsContent />
    </ProtectedRoute>
  );
}

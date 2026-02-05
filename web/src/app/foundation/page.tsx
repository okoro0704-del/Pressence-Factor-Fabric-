'use client';

import { useState, useEffect } from 'react';
import {
  getNationalBlockContributions,
  type NationalBlockContributionRow,
} from '@/lib/financialEngine';
import { getTotalFoundationReserve as getFoundationReserveVida } from '@/lib/foundationSeigniorage';

const GOLD = '#D4AF37';
const GOLD_DIM = 'rgba(212, 175, 55, 0.6)';
const BG = '#0d0d0f';
const BORDER = 'rgba(212, 175, 55, 0.25)';

/**
 * Foundation Dashboard — Transparency view.
 * Real-time National Block Contribution chart: which blocks generate the most royalty for the Foundation.
 */
export default function FoundationDashboardPage() {
  const [contributions, setContributions] = useState<NationalBlockContributionRow[]>([]);
  const [totalReserveVida, setTotalReserveVida] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [blocks, reserve] = await Promise.all([
        getNationalBlockContributions(),
        getFoundationReserveVida(),
      ]);
      if (!cancelled) {
        setContributions(blocks);
        setTotalReserveVida(reserve);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const maxRoyalty = Math.max(
    ...contributions.map((c) => c.total_foundation_deduction_5),
    1
  );

  return (
    <main className="min-h-screen" style={{ background: BG, color: GOLD_DIM }}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold mb-1" style={{ color: GOLD }}>
          Foundation Dashboard
        </h1>
        <p className="text-sm mb-6 opacity-80">
          Transparency: 5% Corporate Royalty and 2% conversion levy fund the PFF Foundation Vault for future Protocol projects.
        </p>
        <a
          href="/foundation/applications"
          className="inline-block text-sm font-medium mb-8 px-4 py-2 rounded border hover:opacity-90"
          style={{ borderColor: BORDER, color: GOLD }}
        >
          Partner Applications →
        </a>

        <section className="mb-10">
          <h2 className="text-lg font-medium mb-4" style={{ color: GOLD }}>
            Total Foundation Reserve (VIDA)
          </h2>
          <div
            className="rounded-lg border px-6 py-4 text-2xl font-mono"
            style={{ borderColor: BORDER, background: 'rgba(212,175,55,0.06)' }}
          >
            {loading ? '…' : `${totalReserveVida.toFixed(2)} VIDA`}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-medium mb-4" style={{ color: GOLD }}>
            National Block Contribution
          </h2>
          <p className="text-sm mb-6 opacity-80">
            Which blocks are generating the most royalty for the Foundation (real-time).
          </p>

          {loading ? (
            <p className="text-sm opacity-70">Loading…</p>
          ) : contributions.length === 0 ? (
            <p className="text-sm opacity-70">
              No National Block revenue entries yet. Revenue will appear here once recorded.
            </p>
          ) : (
            <div className="space-y-4">
              {contributions.map((row) => (
                <div
                  key={row.block_id}
                  className="rounded-lg border px-4 py-3"
                  style={{ borderColor: BORDER, background: 'rgba(212,175,55,0.04)' }}
                >
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <span className="font-mono font-medium" style={{ color: GOLD }}>
                      {row.block_id || 'Unknown block'}
                    </span>
                    <span className="text-sm">
                      {row.total_foundation_deduction_5.toFixed(4)} {row.currency} royalty
                    </span>
                  </div>
                  <div
                    className="h-3 rounded-full overflow-hidden"
                    style={{ background: 'rgba(0,0,0,0.3)' }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(row.total_foundation_deduction_5 / maxRoyalty) * 100}%`,
                        background: GOLD_DIM,
                      }}
                    />
                  </div>
                  <div className="mt-2 flex gap-6 text-xs opacity-80">
                    <span>Gross: {row.total_gross_revenue.toFixed(4)}</span>
                    <span>Net distributable: {row.total_net_distributable.toFixed(4)}</span>
                    <span>{row.entry_count} entries</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mt-10 pt-8 border-t" style={{ borderColor: BORDER }}>
          <h2 className="text-lg font-medium mb-2" style={{ color: GOLD }}>
            Audit trail
          </h2>
          <p className="text-sm opacity-80">
            The 5% Corporate Royalty is recorded in <code className="opacity-90">foundation_royalty_audit</code> before any 10 VIDA/1 VIDA minting or other splits, providing an immutable proof of priority deduction.
          </p>
        </section>
      </div>
    </main>
  );
}

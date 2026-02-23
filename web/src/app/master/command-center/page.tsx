'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MasterArchitectGuard } from '@/components/admin/MasterArchitectGuard';
import { CommandCenterTicker } from '@/components/commandCenter/CommandCenterTicker';
import {
  BarChart3,
  Globe,
  Shield,
  Power,
  Loader2,
  RefreshCw,
  Lock,
  Unlock,
} from 'lucide-react';

/** Global metrics from API */
interface GlobalMetrics {
  nationalLevyInflow: number;
  corporateRoyaltyInflow: number;
  sentinelRevenue: number;
  totalFoundationInflow: number;
}

/** National block row from API */
interface NationalBlockRow {
  blockId: string;
  blockName: string;
  governmentReservesVida: number;
  governmentReservesUsd?: number;
  rank: number;
}

const CYBER_GOLD = '#D4AF37';
const DEEP_BLACK = '#050505';
const CARD_BG = '#0a0a0c';
const BORDER = 'rgba(212, 175, 55, 0.25)';

function CommandCenterContent() {
  const [metrics, setMetrics] = useState<GlobalMetrics | null>(null);
  const [blocks, setBlocks] = useState<NationalBlockRow[]>([]);
  const [partnerEnabled, setPartnerEnabled] = useState<boolean>(true);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [loadingBlocks, setLoadingBlocks] = useState(true);
  const [loadingSwitch, setLoadingSwitch] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    setLoadingMetrics(true);
    try {
      const res = await fetch('/api/master/global-metrics');
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      }
    } catch {
      setError('Failed to load global metrics');
    } finally {
      setLoadingMetrics(false);
    }
  };

  const fetchLeaderboard = async () => {
    setLoadingBlocks(true);
    try {
      const res = await fetch('/api/master/leaderboard');
      if (res.ok) {
        const data = await res.json();
        setBlocks(Array.isArray(data?.blocks) ? data.blocks : []);
      }
    } catch {
      setError('Failed to load leaderboard');
    } finally {
      setLoadingBlocks(false);
    }
  };

  const fetchPartnerSwitch = async () => {
    setLoadingSwitch(true);
    try {
      const res = await fetch('/api/master/partner-applications-enabled');
      if (res.ok) {
        const data = await res.json();
        setPartnerEnabled(data?.enabled === true);
      }
    } catch {
      // non-blocking
    } finally {
      setLoadingSwitch(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    fetchLeaderboard();
    fetchPartnerSwitch();
    const interval = setInterval(() => {
      fetchMetrics();
      fetchLeaderboard();
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  const handleTogglePartner = async () => {
    setToggling(true);
    setError(null);
    try {
      const res = await fetch('/api/master/partner-applications-enabled', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !partnerEnabled }),
      });
      if (res.ok) {
        const data = await res.json();
        setPartnerEnabled(data?.enabled === true);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data?.error ?? 'Failed to update');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update');
    } finally {
      setToggling(false);
    }
  };

  const formatNum = (n: number, decimals = 2) =>
    Number.isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: decimals }) : '—';

  return (
    <main
      className="min-h-screen text-[#e8e8ec] relative flex flex-col"
      style={{ background: DEEP_BLACK }}
    >
      {/* Header — Cyber-Gold / Deep Black */}
      <header
        className="border-b px-4 py-4 sticky top-0 z-10 backdrop-blur-md"
        style={{ borderColor: BORDER, background: 'rgba(5,5,5,0.92)' }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1
              className="text-xl font-bold tracking-tight bg-clip-text text-transparent"
              style={{
                backgroundImage: `linear-gradient(90deg, ${CYBER_GOLD}, #e8c547)`,
              }}
            >
              Master Architect — Global Command Center
            </h1>
            <p className="text-xs text-[#6b6b70] mt-0.5">
              Mission control: global metrics, National Block leaderboard, partner applications switch
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                fetchMetrics();
                fetchLeaderboard();
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors hover:opacity-90 disabled:opacity-50"
              style={{ borderColor: BORDER, color: CYBER_GOLD }}
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <Link
              href="/master/dashboard"
              className="text-sm font-medium transition-colors hover:opacity-90"
              style={{ color: CYBER_GOLD }}
            >
              ← Role Dashboard
            </Link>
          </div>
        </div>
      </header>

      {error && (
        <div
          className="mx-4 mt-4 p-3 rounded-lg border text-sm"
          style={{ background: 'rgba(220,38,38,0.1)', borderColor: 'rgba(220,38,38,0.3)', color: '#fca5a5' }}
        >
          {error}
        </div>
      )}

      <div className="max-w-6xl mx-auto w-full flex-1 px-4 py-6 space-y-8">
        {/* Global Metrics */}
        <section
          className="rounded-xl p-6 border-2"
          style={{ background: CARD_BG, borderColor: BORDER }}
        >
          <h2 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: CYBER_GOLD }}>
            <BarChart3 className="w-4 h-4" />
            Global Aggregator
          </h2>
          {loadingMetrics ? (
            <div className="flex items-center gap-2 text-[#6b6b70]">
              <Loader2 className="w-5 h-5 animate-spin" />
              Loading metrics…
            </div>
          ) : metrics ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg border" style={{ borderColor: 'rgba(212,175,55,0.15)', background: 'rgba(0,0,0,0.3)' }}>
                <p className="text-xs text-[#6b6b70] uppercase tracking-wider">National Levy Inflow</p>
                <p className="text-lg font-mono font-bold mt-1" style={{ color: CYBER_GOLD }}>
                  {formatNum(metrics.nationalLevyInflow, 4)} VIDA
                </p>
              </div>
              <div className="p-4 rounded-lg border" style={{ borderColor: 'rgba(212,175,55,0.15)', background: 'rgba(0,0,0,0.3)' }}>
                <p className="text-xs text-[#6b6b70] uppercase tracking-wider">Corporate Royalty Inflow</p>
                <p className="text-lg font-mono font-bold mt-1" style={{ color: CYBER_GOLD }}>
                  {formatNum(metrics.corporateRoyaltyInflow, 4)} VIDA
                </p>
              </div>
              <div className="p-4 rounded-lg border" style={{ borderColor: 'rgba(212,175,55,0.15)', background: 'rgba(0,0,0,0.3)' }}>
                <p className="text-xs text-[#6b6b70] uppercase tracking-wider">Sentinel Revenue</p>
                <p className="text-lg font-mono font-bold mt-1" style={{ color: CYBER_GOLD }}>
                  ${formatNum(metrics.sentinelRevenue, 2)}
                </p>
              </div>
              <div className="p-4 rounded-lg border" style={{ borderColor: 'rgba(212,175,55,0.2)', background: 'rgba(0,0,0,0.4)' }}>
                <p className="text-xs text-[#6b6b70] uppercase tracking-wider">Total Foundation Inflow</p>
                <p className="text-lg font-mono font-bold mt-1" style={{ color: '#e8c547' }}>
                  {formatNum(metrics.totalFoundationInflow, 4)}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-[#6b6b70]">No metrics available.</p>
          )}
        </section>

        {/* Master Switch */}
        <section
          className="rounded-xl p-6 border-2"
          style={{ background: CARD_BG, borderColor: BORDER }}
        >
          <h2 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: CYBER_GOLD }}>
            <Power className="w-4 h-4" />
            Master Switch — Partner Applications
          </h2>
          {loadingSwitch ? (
            <div className="flex items-center gap-2 text-[#6b6b70]">
              <Loader2 className="w-5 h-5 animate-spin" />
              Loading…
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={handleTogglePartner}
                disabled={toggling}
                className="flex items-center gap-3 px-5 py-3 rounded-xl border-2 font-semibold transition-all disabled:opacity-50"
                style={{
                  borderColor: partnerEnabled ? 'rgba(34,197,94,0.5)' : 'rgba(239,68,68,0.5)',
                  background: partnerEnabled ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                  color: partnerEnabled ? '#86efac' : '#fca5a5',
                }}
              >
                {toggling ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : partnerEnabled ? (
                  <Unlock className="w-5 h-5" />
                ) : (
                  <Lock className="w-5 h-5" />
                )}
                {partnerEnabled ? 'New Partner Applications Enabled' : 'New Partner Applications Disabled'}
              </button>
              <p className="text-xs text-[#6b6b70] max-w-md">
                Toggle to disable new partner applications globally during maintenance. Existing partners are unaffected.
              </p>
            </div>
          )}
        </section>

        {/* National Block Leaderboard */}
        <section
          className="rounded-xl p-6 border-2 overflow-hidden"
          style={{ background: CARD_BG, borderColor: BORDER }}
        >
          <h2 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: CYBER_GOLD }}>
            <Globe className="w-4 h-4" />
            National Block Leaderboard
          </h2>
          <p className="text-xs text-[#6b6b70] mb-4">
            Active National Blocks sorted by 50% Government Reserves (VIDA) accumulated.
          </p>
          {loadingBlocks ? (
            <div className="flex items-center gap-2 text-[#6b6b70]">
              <Loader2 className="w-5 h-5 animate-spin" />
              Loading leaderboard…
            </div>
          ) : blocks.length > 0 ? (
            <div className="overflow-x-auto -mx-2">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="border-b" style={{ borderColor: BORDER }}>
                    <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-[#6b6b70]">Rank</th>
                    <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-[#6b6b70]">Block</th>
                    <th className="text-right py-3 px-4 text-xs font-bold uppercase tracking-wider text-[#6b6b70]">Gov. Reserves (VIDA)</th>
                    <th className="text-right py-3 px-4 text-xs font-bold uppercase tracking-wider text-[#6b6b70]">Gov. Reserves (USD)</th>
                  </tr>
                </thead>
                <tbody>
                  {blocks.map((row) => (
                    <tr key={row.blockId} className="border-b border-[#1a1a1e] hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold" style={{ color: CYBER_GOLD }}>
                        #{row.rank}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-[#e8e8ec]">{row.blockName}</span>
                        <span className="text-xs text-[#6b6b70] ml-2 font-mono">{row.blockId}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono" style={{ color: CYBER_GOLD }}>
                        {formatNum(row.governmentReservesVida, 4)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[#a8a8ae]">
                        {row.governmentReservesUsd != null ? `$${formatNum(row.governmentReservesUsd, 2)}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-[#6b6b70]">No National Block data yet. Leaderboard uses national_liquidity_vaults or national_revenue_ledger.</p>
          )}
        </section>
      </div>

      {/* Real-Time Ticker */}
      <div className="mt-auto shrink-0">
        <CommandCenterTicker refreshMs={15000} limit={30} />
      </div>
    </main>
  );
}

export default function MasterCommandCenterPage() {
  return (
    <MasterArchitectGuard>
      <CommandCenterContent />
    </MasterArchitectGuard>
  );
}

'use client';

import {
  NATIONAL_RESERVE_VAULT_USD,
  SOVEREIGN_LOCK_USD,
  LIQUID_TIER_USD,
  GLOBAL_UNLOCK_COUNT,
  getTripleVaultSummary,
  type TripleVaultSummary,
} from '@/lib/economic';

export interface TripleVaultDisplayProps {
  /** Sentinel fee already paid (0, 50, or 100 USD). Determines Vault C available amount. */
  sentinelFeePaidUsd: number;
  /** Current global user count (for progress bar). */
  globalUserCount?: number;
  /** Optional custom summary; if not provided, derived from sentinelFeePaidUsd. */
  summary?: TripleVaultSummary;
}

export function TripleVaultDisplay({
  sentinelFeePaidUsd,
  globalUserCount = 0,
  summary: summaryProp,
}: TripleVaultDisplayProps) {
  const summary = summaryProp ?? getTripleVaultSummary(sentinelFeePaidUsd);
  const progressPercent = Math.min(100, (globalUserCount / GLOBAL_UNLOCK_COUNT) * 100);

  const formatUsd = (n: number) =>
    n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-3 mb-4">
        <svg className="w-5 h-5 text-[#e8c547]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <h3 className="text-sm font-semibold text-[#e8c547] uppercase tracking-wider">
          Triple Vault — 50/50 National Handshake
        </h3>
        <svg className="w-5 h-5 text-[#e8c547]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>

      {/* Vault A — Gold: National Reserve */}
      <div className="relative bg-gradient-to-br from-amber-600/25 via-[#c9a227]/20 to-amber-800/15 rounded-xl p-5 border-2 border-amber-500/50 overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-400/20 rounded-full blur-3xl" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">Vault A — National Reserve</h4>
            <p className="text-[10px] text-amber-200/80 uppercase tracking-wide">Contribution to the Nation</p>
          </div>
          <span className="text-2xl font-bold font-mono text-amber-300 tracking-tight">
            {formatUsd(summary.nationalReserveUsd)}
          </span>
        </div>
        <p className="text-[10px] text-[#6b6b70] mt-2 uppercase tracking-wide">Not spendable; visible as your contribution</p>
      </div>

      {/* Vault B — Obsidian: Future Wealth (Locked) */}
      <div className="relative bg-gradient-to-br from-[#1a1a1f] via-[#0d0d12] to-[#2a2a30] rounded-xl p-5 border-2 border-[#3d3d45] overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-[#8b8b95] uppercase tracking-wider mb-1">Vault B — Future Wealth</h4>
            <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#6b6b70] bg-[#2a2a2e] px-2 py-1 rounded uppercase tracking-wide">
              <svg className="w-3 h-3 text-[#6b6b70]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Locked
            </span>
          </div>
          <span className="text-2xl font-bold font-mono text-[#a0a0a8] tracking-tight">
            {formatUsd(summary.futureWealthUsd)}
          </span>
        </div>
        <p className="text-[10px] text-[#6b6b70] mt-2 uppercase tracking-wide">Unlocks at 1 billion PFF users</p>
      </div>

      {/* Vault C — Green: Available Cash */}
      <div className="relative bg-gradient-to-br from-emerald-600/20 via-green-700/15 to-emerald-800/10 rounded-xl p-5 border-2 border-emerald-500/50 overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-400/20 rounded-full blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Vault C — Available Cash</h4>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/20 px-2 py-1 rounded">AVAILABLE NOW</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-300 tracking-tight">
              {formatUsd(summary.availableCashUsd)}
            </span>
            {summary.sentinelFeeUsd > 0 && (
              <span className="text-xs text-[#6b6b70]">
                ({formatUsd(LIQUID_TIER_USD)} − {formatUsd(summary.sentinelFeeUsd)} Sentinel)
              </span>
            )}
          </div>
          <p className="text-[10px] text-[#6b6b70] mt-2 uppercase tracking-wide">
            Liquid $1,000 minus Sentinel Activation fee
          </p>
        </div>
      </div>

      {/* Progress to global unlock */}
      <div className="bg-[#0d0d0f] rounded-xl p-4 border border-[#2a2a2e]">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-bold text-[#e8c547] uppercase tracking-wider">Progress to Global Release</h4>
          <span className="text-xs font-mono text-[#6b6b70]">
            {globalUserCount.toLocaleString()} / {GLOBAL_UNLOCK_COUNT.toLocaleString()} users
          </span>
        </div>
        <div className="relative w-full h-5 bg-[#16161a] rounded-full overflow-hidden border border-[#2a2a2e]">
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#c9a227] to-[#e8c547] rounded-full transition-all duration-1000"
            style={{ width: `${Math.max(progressPercent, 0.5)}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[10px] font-bold text-[#f5f5f5] drop-shadow-lg">
              {progressPercent.toFixed(6)}%
            </span>
          </div>
        </div>
        <p className="text-[10px] text-[#6b6b70] mt-2 text-center uppercase tracking-wide">
          Vault B unlocks at 1 billion PFF users
        </p>
      </div>
    </div>
  );
}

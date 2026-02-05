'use client';

import {
  TOTAL_WEALTH_VIDA,
  FUTURE_VALUE_LOCKED_VIDA,
  CURRENT_POWER_SPENDABLE_USD,
  FULL_SPENDABLE_USD,
  VESTING_DAYS,
} from '@/lib/sovereignTreasurySplit';

export interface TripleVaultDisplayProps {
  /** Sentinel fee already paid (for display; Current Power is fixed at $900 after 0.1 VIDA Sentinel). */
  sentinelFeePaidUsd?: number;
  /** Current global user count (for progress bar). */
  globalUserCount?: number;
  /** Face-First Security: when false, vault amounts are hidden until face match >= 95%. */
  faceVerified?: boolean;
  /** BETA: show full $1,000 spendable (no Sentinel fee). */
  betaLiquidityTest?: boolean;
}

const BALANCE_MASK = '••••••';

export function TripleVaultDisplay({
  sentinelFeePaidUsd = 100,
  globalUserCount = 0,
  faceVerified = true,
  betaLiquidityTest = false,
}: TripleVaultDisplayProps) {
  const currentPowerUsd = betaLiquidityTest ? FULL_SPENDABLE_USD : CURRENT_POWER_SPENDABLE_USD;
  /** 1 VIDA liquid = $1,000.00 USD (exact display). */
  const formatUsd = (n: number) =>
    n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formatVida = (n: number) =>
    `${n.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} VIDA`;
  const showVida = (n: number) => (faceVerified ? formatVida(n) : BALANCE_MASK);
  const showUsd = (n: number) => (faceVerified ? formatUsd(n) : BALANCE_MASK);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-3 mb-4">
        <svg className="w-5 h-5 text-[#e8c547]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <h3 className="text-sm font-semibold text-[#e8c547] uppercase tracking-wider">
          Sovereign Treasury Split — 5 VIDA
        </h3>
        <svg className="w-5 h-5 text-[#e8c547]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      {faceVerified && (
        <>
          <div className="mb-2 p-2 bg-[#1a1a1e] border border-[#2a2a2e] rounded-lg flex items-center justify-between">
            <span className="text-xs font-bold text-[#6b6b70] uppercase tracking-wider">Total Vitalized Citizens</span>
            <span className="text-sm font-bold font-mono text-[#e8c547]">{globalUserCount.toLocaleString('en-US')}</span>
          </div>
          <div className="mb-4 p-3 bg-[#c9a227]/10 border border-[#c9a227]/40 rounded-lg flex items-center justify-between">
            <span className="text-xs font-bold text-[#e8c547] uppercase tracking-wider">Total Wealth</span>
            <span className="text-lg font-bold font-mono text-[#e8c547]">{formatVida(TOTAL_WEALTH_VIDA)}</span>
          </div>
        </>
      )}

      {/* Balance 1 — Total Wealth: 5 VIDA */}
      <div className="relative bg-gradient-to-br from-amber-600/25 via-[#c9a227]/20 to-amber-800/15 rounded-xl p-5 border-2 border-amber-500/50 overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-400/20 rounded-full blur-3xl" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">Total Wealth</h4>
            <p className="text-[10px] text-amber-200/80 uppercase tracking-wide">Citizen allocation (5 VIDA minted)</p>
          </div>
          <span className="text-2xl font-bold font-mono text-amber-300 tracking-tight" title={!faceVerified ? 'Verify face to view' : undefined}>
            {showVida(TOTAL_WEALTH_VIDA)}
          </span>
        </div>
        <p className="text-[10px] text-[#6b6b70] mt-2 uppercase tracking-wide">4/1 vesting: 4 locked 365 days, 1 spendable (minus Sentinel)</p>
      </div>

      {/* Balance 2 — Future Value (Locked): 4 VIDA */}
      <div className="relative bg-gradient-to-br from-[#1a1a1f] via-[#0d0d12] to-[#2a2a30] rounded-xl p-5 border-2 border-[#3d3d45] overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-[#8b8b95] uppercase tracking-wider mb-1">Future Value (Locked)</h4>
            <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#6b6b70] bg-[#2a2a2e] px-2 py-1 rounded uppercase tracking-wide">
              <svg className="w-3 h-3 text-[#6b6b70]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Untransferable
            </span>
          </div>
          <span className="text-2xl font-bold font-mono text-[#a0a0a8] tracking-tight" title={!faceVerified ? 'Verify face to view' : undefined}>
            {showVida(FUTURE_VALUE_LOCKED_VIDA)}
          </span>
        </div>
        <p className="text-[10px] text-[#6b6b70] mt-2 uppercase tracking-wide">VestingContract: unlocks in {VESTING_DAYS} days</p>
      </div>

      {/* Balance 3 — Current Power (Spendable): $900 */}
      <div className="relative bg-gradient-to-br from-emerald-600/20 via-green-700/15 to-emerald-800/10 rounded-xl p-5 border-2 border-emerald-500/50 overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-400/20 rounded-full blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Current Power (Spendable)</h4>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/20 px-2 py-1 rounded">AVAILABLE NOW</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-300 tracking-tight" title={!faceVerified ? 'Verify face to view' : undefined}>
              {showUsd(currentPowerUsd)}
            </span>
            {faceVerified && (
              <span className="text-xs text-[#6b6b70]">worth of VIDA</span>
            )}
          </div>
          <p className="text-[10px] text-[#6b6b70] mt-2 uppercase tracking-wide">
            {betaLiquidityTest ? 'BETA: Full 1 VIDA spendable (no fees). Spendable from Vault C.' : 'After Sentinel fee (0.1 VIDA → Sentinel). Spendable from Vault C.'}
          </p>
        </div>
      </div>

      {/* Vesting info */}
      <div className="bg-[#0d0d0f] rounded-xl p-4 border border-[#2a2a2e]">
        <h4 className="text-xs font-bold text-[#e8c547] uppercase tracking-wider mb-2">4/1 Vesting</h4>
        <p className="text-[10px] text-[#6b6b70] uppercase tracking-wide">
          {FUTURE_VALUE_LOCKED_VIDA} VIDA locked (untransferable) for {VESTING_DAYS} days. 1 VIDA spendable{betaLiquidityTest ? ' (BETA: no fee)' : '; $100 (0.1 VIDA) Sentinel fee'} → Current Power ${currentPowerUsd.toLocaleString()}.
        </p>
      </div>
    </div>
  );
}

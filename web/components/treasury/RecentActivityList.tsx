'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchRecentSovereignLedger, RSK_EXPLORER_TX_URL, isExplorerTxHash, type SovereignLedgerEntry } from '@/lib/sovereignLedger';
import { VIDA_USD_DISPLAY } from '@/lib/economic';

const GOLD = '#D4AF37';
const GOLD_BORDER = 'rgba(212, 175, 55, 0.3)';

type ActivityType = 'in' | 'out' | 'swap';

function getActivityType(entry: SovereignLedgerEntry): ActivityType {
  const label = (entry.transaction_label ?? '').toLowerCase();
  if (label.includes('conversion') || label.includes('swap')) return 'swap';
  if (entry.to_vault === 'PERSONAL_VAULT' || entry.from_vault === 'NATIONAL_BLOCK') return 'in';
  return 'out';
}

function formatAmount(entry: SovereignLedgerEntry): { value: string; unit: string } {
  if (entry.vida_cap_deducted > 0 && entry.dllr_credited > 0) {
    return { value: entry.vida_cap_deducted.toFixed(4), unit: 'VIDA' };
  }
  if (entry.vida_cap_deducted > 0) {
    return { value: entry.vida_cap_deducted.toFixed(4), unit: 'VIDA' };
  }
  if (entry.dllr_credited > 0) {
    return { value: entry.dllr_credited.toFixed(2), unit: 'USDT' };
  }
  return { value: '0', unit: 'VIDA' };
}

function IconIn() {
  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-green-500/20 text-green-400" aria-hidden>
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
      </svg>
    </div>
  );
}

function IconOut() {
  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-amber-500/20 text-amber-400" aria-hidden>
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
      </svg>
    </div>
  );
}

function IconSwap() {
  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[#D4AF37]/20" style={{ color: GOLD }} aria-hidden>
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    </div>
  );
}

function ActivityIcon({ type }: { type: ActivityType }) {
  if (type === 'in') return <IconIn />;
  if (type === 'out') return <IconOut />;
  return <IconSwap />;
}

function ActivityRow({
  entry,
  explorerTxUrl,
}: {
  entry: SovereignLedgerEntry;
  explorerTxUrl: string;
}) {
  const type = getActivityType(entry);
  const { value, unit } = formatAmount(entry);
  const label = entry.transaction_label || 'Transaction';
  const status = entry.status === 'CONFIRMED' ? 'Confirmed' : entry.status === 'PENDING' ? 'Pending' : 'Failed';
  const showExplorer = isExplorerTxHash(entry.tx_hash);

  return (
    <div
      className="flex items-center gap-3 py-3 border-b border-[#2a2a2e] last:border-0"
    >
      <ActivityIcon type={type} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{label}</p>
        <p className="text-xs text-[#6b6b70]">
          {value} {unit}
          {unit === 'VIDA' && (
            <span className="ml-1 text-[#6b6b70]">({VIDA_USD_DISPLAY} anchor)</span>
          )}
          {' · '}
          <span className={entry.status === 'CONFIRMED' ? 'text-green-400' : entry.status === 'PENDING' ? 'text-amber-400' : 'text-red-400'}>
            {status}
          </span>
        </p>
      </div>
      {showExplorer && (
        <a
          href={`${explorerTxUrl}/${entry.tx_hash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium shrink-0 px-2 py-1.5 rounded border transition-colors hover:opacity-90"
          style={{ color: GOLD, borderColor: GOLD_BORDER }}
        >
          View on Explorer
        </a>
      )}
    </div>
  );
}

interface RecentActivityListProps {
  phoneNumber: string | null;
}

export function RecentActivityList({ phoneNumber }: RecentActivityListProps) {
  const [entries, setEntries] = useState<SovereignLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!phoneNumber?.trim()) {
      setEntries([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const list = await fetchRecentSovereignLedger(phoneNumber.trim());
      setEntries(list);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [phoneNumber]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onActivity = () => load();
    window.addEventListener('world-vault-conversion-complete', onActivity);
    return () => window.removeEventListener('world-vault-conversion-complete', onActivity);
  }, [load]);

  const empty = !loading && entries.length === 0;

  return (
    <section
      className="rounded-2xl border-2 overflow-hidden"
      style={{ background: 'rgba(42,42,46,0.4)', borderColor: GOLD_BORDER }}
    >
      <div
        className="px-5 py-4 border-b"
        style={{ borderColor: GOLD_BORDER }}
      >
        <h2 className="text-xl font-bold uppercase tracking-wider" style={{ color: GOLD }}>
          Recent Activity
        </h2>
        <p className="text-xs text-[#6b6b70] mt-0.5">
          Sovereign ledger · 1 VIDA = {VIDA_USD_DISPLAY}
        </p>
      </div>
      <div className="p-4 max-h-80 overflow-y-auto">
        {loading && (
          <div className="py-8 text-center text-[#6b6b70] text-sm">Loading…</div>
        )}
        {empty && !loading && (
          <p className="py-8 text-center text-[#a0a0a5] text-sm">
            Your Sovereign journey begins here. No transactions yet.
          </p>
        )}
        {!loading && entries.length > 0 && (
          <div className="space-y-0">
            {entries.map((entry) => (
              <ActivityRow key={entry.id} entry={entry} explorerTxUrl={RSK_EXPLORER_TX_URL} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useNativeBalances } from '@/lib/sovryn/useNativeBalances';
import { getVidaBalanceOnChain } from '@/lib/sovryn/vidaBalance';
import { getIdentityAnchorPhone } from '@/lib/sentinelActivation';
import { NGN_PER_USD } from '@/lib/sovryn/vngn';
import { TreasurySwapModal } from './TreasurySwapModal';
import { ReceiveModal } from './ReceiveModal';

const BORDER = 'rgba(212, 175, 55, 0.3)';
const GOLD = '#D4AF37';
const GOLD_BG = 'rgba(212, 175, 55, 0.08)';

function BalanceCard({
  label,
  value,
  suffix,
  subLabel,
}: {
  label: string;
  value: string;
  suffix: string;
  subLabel?: string;
}) {
  return (
    <div
      className="rounded-xl border p-4"
      style={{ background: GOLD_BG, borderColor: BORDER }}
    >
      <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: GOLD }}>
        {label}
      </p>
      <p className="text-xl font-bold font-mono" style={{ color: GOLD }}>
        {value} {suffix}
      </p>
      {subLabel && <p className="text-[10px] text-[#6b6b70] mt-1">{subLabel}</p>}
    </div>
  );
}

export function UnifiedSovereignTreasury() {
  const phoneNumber = getIdentityAnchorPhone();
  const native = useNativeBalances(phoneNumber);
  const [vidaBalance, setVidaBalance] = useState<string>('—');
  const [showSwap, setShowSwap] = useState(false);
  const [showReceive, setShowReceive] = useState(false);

  useEffect(() => {
    if (!native.address) return;
    getVidaBalanceOnChain(native.address)
      .then((r) => {
        if (r.ok) setVidaBalance(r.balanceFormatted);
        else setVidaBalance('—');
      })
      .catch(() => setVidaBalance('—'));
  }, [native.address]);

  const vngnPlaceholder = '0';
  const ngnRateLabel = `1 USD = ₦${NGN_PER_USD.toLocaleString()} (vNGN rate)`;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold uppercase tracking-wider" style={{ color: GOLD }}>
          Unified Sovereign Treasury
        </h2>
      </div>

      {/* Multi-Wallet View: Spendable VIDA, DLLR, USDT, vNGN */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <BalanceCard
          label="Spendable VIDA"
          value={native.loading && !native.address ? '…' : vidaBalance}
          suffix="VIDA"
          subLabel="On-chain (RSK)"
        />
        <BalanceCard
          label="DLLR"
          value={native.address ? native.dllr : '—'}
          suffix="DLLR"
          subLabel="From chain (10s)"
        />
        <BalanceCard
          label="USDT"
          value={native.address ? native.usdt : '—'}
          suffix="USDT"
          subLabel="From chain (10s)"
        />
        <BalanceCard
          label="vNGN (VIDA Naira)"
          value={vngnPlaceholder}
          suffix="vNGN"
          subLabel={ngnRateLabel}
        />
      </div>

      {/* Unified Send/Receive: single Receive button = RSK Address QR */}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setShowSwap(true)}
          className="px-6 py-3 rounded-xl font-bold uppercase tracking-wider border transition-all hover:opacity-90"
          style={{ background: GOLD, color: '#0d0d0f', borderColor: BORDER }}
        >
          Swap
        </button>
        <button
          type="button"
          onClick={() => setShowReceive(true)}
          className="px-6 py-3 rounded-xl font-bold uppercase tracking-wider border transition-all hover:opacity-90"
          style={{ background: GOLD_BG, color: GOLD, borderColor: BORDER }}
        >
          Receive
        </button>
      </div>

      {/* vNGN: Withdraw to Bank placeholder */}
      <div
        className="rounded-xl border p-4"
        style={{ background: GOLD_BG, borderColor: BORDER }}
      >
        <h3 className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: GOLD }}>
          vNGN → Bank
        </h3>
        <button
          type="button"
          disabled
          className="w-full py-3 rounded-lg font-bold uppercase tracking-wider border opacity-80 cursor-not-allowed"
          style={{ background: 'rgba(42,42,46,0.5)', color: '#8b8b95', borderColor: BORDER }}
        >
          Withdraw to Bank
        </button>
        <p className="text-xs text-[#6b6b70] mt-2 text-center">
          Waiting for Banking Integration
        </p>
        <p className="text-[10px] text-[#6b6b70] mt-1 text-center">
          The Protocol is ready for the banks, not the other way around.
        </p>
      </div>

      <TreasurySwapModal
        isOpen={showSwap}
        onClose={() => setShowSwap(false)}
      />
      {phoneNumber && (
        <ReceiveModal
          isOpen={showReceive}
          onClose={() => setShowReceive(false)}
          phoneNumber={phoneNumber}
        />
      )}
    </div>
  );
}

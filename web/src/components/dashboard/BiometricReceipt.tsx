'use client';

import { useEffect, useRef } from 'react';

interface BiometricReceiptProps {
  amountVida: number;
  merchantLabel?: string;
  date?: string;
  transactionId?: string;
  onClose?: () => void;
}

/** Rotating security hologram to deter screenshots/fraud. */
function SecurityHologram() {
  return (
    <div
      className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none"
      aria-hidden
    >
      <div
        className="absolute inset-0 opacity-30 animate-hologram-spin"
        style={{
          background: `conic-gradient(from 0deg, transparent 0deg 90deg, rgba(232,197,71,0.4) 90deg 180deg, transparent 180deg 270deg, rgba(201,162,39,0.3) 270deg 360deg)`,
        }}
      />
      <div
        className="absolute inset-0 opacity-20 animate-hologram-spin-reverse"
        style={{
          background: `repeating-conic-gradient(from 0deg at 50% 50%, transparent 0deg 15deg, rgba(0,255,65,0.15) 15deg 30deg)`,
        }}
      />
      <div className="absolute inset-2 rounded border border-[#e8c547]/40 bg-black/20" />
    </div>
  );
}

export function BiometricReceipt({
  amountVida,
  merchantLabel = 'Merchant',
  date = new Date().toISOString(),
  transactionId,
  onClose,
}: BiometricReceiptProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const displayDate = date.slice(0, 19).replace('T', ' ');
  const shortId = transactionId ? transactionId.slice(-8).toUpperCase() : null;

  return (
    <div
      ref={containerRef}
      className="relative rounded-xl border-2 border-[#e8c547]/50 bg-[#0d0d0f] p-6 max-w-sm mx-auto overflow-hidden"
    >
      <SecurityHologram />
      <div className="relative z-10">
        <div className="text-center mb-4">
          <p className="text-xs text-[#6b6b70] uppercase tracking-wider mb-1">Digital receipt</p>
          <p className="text-3xl font-bold text-[#e8c547]">{amountVida.toFixed(4)} VIDA</p>
          <p className="text-sm text-[#a0a0a5] mt-1">Paid to {merchantLabel}</p>
        </div>
        <div className="space-y-1 text-sm text-[#6b6b70]">
          <p>Date: {displayDate}</p>
          {shortId && <p className="font-mono">Ref: {shortId}</p>}
        </div>
        <p className="text-[10px] text-[#3d3d45] mt-4 text-center">
          Secured by Presence · Show this to the merchant
        </p>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="mt-4 w-full py-2 rounded-lg border border-[#2a2a2e] text-[#a0a0a5] hover:bg-[#1a1a1f] text-sm"
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
}

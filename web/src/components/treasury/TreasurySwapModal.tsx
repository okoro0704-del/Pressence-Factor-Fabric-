'use client';

import { useState, useEffect } from 'react';
import { VIDA_TO_DLLR_RATE } from '@/lib/sovereignInternalWallet';
import { NGN_PER_USD } from '@/lib/sovryn/vngn';

const TOKENS = ['VIDA', 'DLLR', 'USDT', 'vNGN'] as const;
type Token = (typeof TOKENS)[number];

interface TreasurySwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwap?: (from: Token, to: Token, amount: number) => Promise<boolean>;
}

function getRate(from: Token, to: Token): number {
  if (from === to) return 1;
  if (from === 'VIDA' && to === 'DLLR') return VIDA_TO_DLLR_RATE;
  if (from === 'DLLR' && to === 'VIDA') return 1 / VIDA_TO_DLLR_RATE;
  if (from === 'DLLR' && to === 'USDT') return 1;
  if (from === 'USDT' && to === 'DLLR') return 1;
  if (from === 'USDT' && to === 'vNGN') return NGN_PER_USD;
  if (from === 'vNGN' && to === 'USDT') return 1 / NGN_PER_USD;
  if (from === 'VIDA' && to === 'USDT') return VIDA_TO_DLLR_RATE; // 1 VIDA = 1000 DLLR ≈ 1000 USDT
  if (from === 'USDT' && to === 'VIDA') return 1 / VIDA_TO_DLLR_RATE;
  if (from === 'VIDA' && to === 'vNGN') return VIDA_TO_DLLR_RATE * NGN_PER_USD; // 1 VIDA → 1000 DLLR → 1000*NGN vNGN
  if (from === 'vNGN' && to === 'VIDA') return 1 / (VIDA_TO_DLLR_RATE * NGN_PER_USD);
  if (from === 'DLLR' && to === 'vNGN') return NGN_PER_USD;
  if (from === 'vNGN' && to === 'DLLR') return 1 / NGN_PER_USD;
  return 0;
}

export function TreasurySwapModal({ isOpen, onClose, onSwap }: TreasurySwapModalProps) {
  const [fromToken, setFromToken] = useState<Token>('VIDA');
  const [toToken, setToToken] = useState<Token>('DLLR');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amountNum = parseFloat(amount) || 0;
  const rate = getRate(fromToken, toToken);
  const estimated = amountNum * rate;

  useEffect(() => {
    if (fromToken === toToken) {
      const other = TOKENS.find((t) => t !== fromToken);
      if (other) setToToken(other);
    }
  }, [fromToken, toToken]);

  const handleSwapDirection = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setAmount(estimated > 0 ? String(estimated) : '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (amountNum <= 0) {
      setError('Enter a valid amount');
      return;
    }
    if (rate <= 0) {
      setError('This pair is not supported');
      return;
    }
    setSubmitting(true);
    try {
      const ok = onSwap ? await onSwap(fromToken, toToken, amountNum) : true;
      if (ok) {
        setAmount('');
        onClose();
      } else {
        setError('Swap failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Swap failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <div
        className="rounded-2xl border-2 border-[#D4AF37]/50 bg-[#16161a] p-6 max-w-md w-full shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[#e8c547] uppercase tracking-wider">Swap</h3>
          <button type="button" onClick={onClose} className="text-[#6b6b70] hover:text-white p-1" aria-label="Close">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-[#6b6b70] mb-4">
          VIDA ↔ DLLR ↔ USDT ↔ vNGN. Same Protocol layer.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#e8c547] mb-1">From</label>
            <div className="flex gap-2">
              <select
                value={fromToken}
                onChange={(e) => setFromToken(e.target.value as Token)}
                className="flex-1 rounded-lg border border-[#2a2a2e] bg-[#0d0d0f] px-3 py-2 text-[#e8c547] text-sm"
              >
                {TOKENS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <input
                type="number"
                min="0"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-32 rounded-lg border border-[#2a2a2e] bg-[#0d0d0f] px-3 py-2 text-right text-[#e8c547] font-mono"
              />
            </div>
          </div>
          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleSwapDirection}
              className="rounded-full p-2 border border-[#D4AF37]/50 bg-[#16161a] text-[#e8c547] hover:bg-[#D4AF37]/10"
              aria-label="Swap direction"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </button>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#e8c547] mb-1">To</label>
            <div className="flex gap-2">
              <select
                value={toToken}
                onChange={(e) => setToToken(e.target.value as Token)}
                className="flex-1 rounded-lg border border-[#2a2a2e] bg-[#0d0d0f] px-3 py-2 text-[#e8c547] text-sm"
              >
                {TOKENS.filter((t) => t !== fromToken).map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <div className="w-32 rounded-lg border border-[#2a2a2e] bg-[#0d0d0f] px-3 py-2 text-right text-[#e8c547] font-mono text-sm flex items-center justify-end">
                {estimated > 0 ? estimated.toLocaleString(undefined, { maximumFractionDigits: 6 }) : '0'}
              </div>
            </div>
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={submitting || amountNum <= 0 || rate <= 0}
            className="w-full py-3 rounded-lg font-bold uppercase tracking-wider bg-[#D4AF37] text-[#0d0d0f] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Swapping…' : 'Swap'}
          </button>
        </form>
      </div>
    </div>
  );
}

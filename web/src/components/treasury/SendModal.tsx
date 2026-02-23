'use client';

import { useState } from 'react';
import { sendToken, isValidEthAddress, type SendTokenType } from '@/lib/sovryn/sendToken';

const SEND_TOKENS: SendTokenType[] = ['VIDA', 'DLLR', 'USDT'];

interface SendModalProps {
  isOpen: boolean;
  onClose: () => void;
  phoneNumber: string | null;
  onSuccess?: () => void;
  /** Optional encrypted seed from context for signer */
  encryptedSeed?: { recovery_seed_encrypted: string; recovery_seed_iv: string; recovery_seed_salt: string } | null;
}

export function SendModal({
  isOpen,
  onClose,
  phoneNumber,
  onSuccess,
  encryptedSeed,
}: SendModalProps) {
  const [token, setToken] = useState<SendTokenType>('VIDA');
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setTxHash(null);
    const amountNum = parseFloat(amount);
    if (amountNum <= 0) {
      setError('Enter a valid amount');
      return;
    }
    if (!toAddress.trim()) {
      setError('Enter recipient address');
      return;
    }
    if (!isValidEthAddress(toAddress.trim())) {
      setError('Invalid address (must be 0x + 40 hex characters)');
      return;
    }
    if (!phoneNumber?.trim()) {
      setError('Identity anchor required. Sign in first.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await sendToken(
        { token, toAddress: toAddress.trim(), amount: amount.trim() },
        { phoneNumber: phoneNumber.trim(), encryptedSeed: encryptedSeed ?? undefined }
      );
      if (result.success) {
        setTxHash(result.txHash ?? null);
        onSuccess?.();
        setToAddress('');
        setAmount('');
        setTimeout(() => {
          onClose();
          setTxHash(null);
        }, 2500);
      } else {
        setError(result.error ?? 'Send failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Send failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const GOLD = '#D4AF37';
  const GOLD_BORDER = 'rgba(212, 175, 55, 0.5)';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <div
        className="rounded-2xl border-2 border-[#D4AF37]/50 bg-[#16161a] p-6 max-w-md w-full shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[#e8c547] uppercase tracking-wider">Send</h3>
          <button type="button" onClick={onClose} className="text-[#6b6b70] hover:text-white p-1" aria-label="Close">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-[#6b6b70] mb-4">
          Send VIDA, DLLR, or USDT to any RSK address. Uses your sovereign wallet (recovery seed).
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#e8c547] mb-1 uppercase tracking-wider">Token</label>
            <select
              value={token}
              onChange={(e) => setToken(e.target.value as SendTokenType)}
              className="w-full rounded-lg border border-[#2a2a2e] bg-[#0d0d0f] px-3 py-2 text-[#e8c547] text-sm"
            >
              {SEND_TOKENS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#e8c547] mb-1 uppercase tracking-wider">
              Recipient address (RSK)
            </label>
            <input
              type="text"
              value={toAddress}
              onChange={(e) => setToAddress(e.target.value)}
              placeholder="0x..."
              className="w-full rounded-lg border border-[#2a2a2e] bg-[#0d0d0f] px-3 py-2 text-[#e8c547] font-mono text-sm placeholder-[#6b6b70]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#e8c547] mb-1 uppercase tracking-wider">Amount</label>
            <input
              type="number"
              min="0"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-full rounded-lg border border-[#2a2a2e] bg-[#0d0d0f] px-3 py-2 text-right text-[#e8c547] font-mono"
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          {txHash && (
            <p className="text-sm text-green-400">
              Sent! Tx: <span className="font-mono text-xs break-all">{txHash}</span>
            </p>
          )}
          <button
            type="submit"
            disabled={submitting || !amount.trim() || !toAddress.trim()}
            className="w-full py-3 rounded-lg font-bold uppercase tracking-wider border transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: GOLD, color: '#0d0d0f', borderColor: GOLD_BORDER }}
          >
            {submitting ? 'Sending…' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { sendVidaToPhone, validatePhoneNumber, resolvePhoneToIdentity } from '@/lib/phoneIdentity';
import { BiometricReceipt } from './BiometricReceipt';

interface SendVidaModalProps {
  isOpen: boolean;
  onClose: () => void;
  senderPhone: string;
  maxAmount: number; // 1.00 VIDA CAP (liquid vault limit)
}

export function SendVidaModal({ isOpen, onClose, senderPhone, maxAmount }: SendVidaModalProps) {
  const [recipientPhone, setRecipientPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [successAmount, setSuccessAmount] = useState(0);
  const [recipientName, setRecipientName] = useState('');

  if (!isOpen) return null;

  const handleResolvePhone = async () => {
    if (!validatePhoneNumber(recipientPhone)) {
      setError('Invalid phone number format');
      return;
    }

    setResolving(true);
    setError('');
    const identity = await resolvePhoneToIdentity(recipientPhone);
    
    if (identity) {
      setRecipientName(identity.full_name);
    } else {
      setError('Recipient not found. Please check the phone number.');
    }
    setResolving(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const amountNum = parseFloat(amount);

    // Validate amount
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount');
      setLoading(false);
      return;
    }

    if (amountNum > maxAmount) {
      setError(`Asset Locked: Requires 1B User Milestone for Release. Maximum transfer: ${maxAmount.toFixed(2)} VIDA CAP`);
      setLoading(false);
      return;
    }

    // Send VIDA
    const result = await sendVidaToPhone(senderPhone, recipientPhone, amountNum);

    if (result.success) {
      setSuccess(true);
      setSuccessAmount(amountNum);
      setShowReceipt(true);
      // In production, backend would notify merchant (push + voice) when recording the payment
    } else {
      setError(result.message);
    }

    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative bg-[#16161a] rounded-2xl p-8 border-2 border-[#e8c547]/50 max-w-md w-full mx-4 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#6b6b70] hover:text-[#f5f5f5] transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">📤</div>
          <h2 className="text-2xl font-bold text-[#e8c547] mb-2">Send VIDA</h2>
          <p className="text-sm text-[#6b6b70]">
            Transfer from your Liquid Vault (1.00 VIDA CAP max)
          </p>
        </div>

        {/* Success: show biometric receipt for customer to show merchant */}
        {success && showReceipt && (
          <div className="mb-6">
            <p className="text-sm text-green-400 text-center font-semibold mb-3">✓ VIDA sent successfully!</p>
            <BiometricReceipt
              amountVida={successAmount}
              merchantLabel={recipientName || recipientPhone}
              transactionId={`tx-${Date.now()}`}
              onClose={() => {
                setShowReceipt(false);
                onClose();
                setSuccess(false);
                setRecipientPhone('');
                setAmount('');
                setRecipientName('');
              }}
            />
          </div>
        )}
        {success && !showReceipt && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
            <p className="text-sm text-green-400 text-center font-semibold">✓ VIDA sent successfully!</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
            <p className="text-sm text-red-400 text-center">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Recipient Phone */}
          <div>
            <label className="block text-sm font-semibold text-[#6b6b70] mb-2 uppercase tracking-wider">
              Recipient Phone Number
            </label>
            <div className="flex gap-2">
              <input
                type="tel"
                value={recipientPhone}
                onChange={(e) => {
                  setRecipientPhone(e.target.value);
                  setRecipientName('');
                }}
                required
                className="flex-1 px-4 py-4 bg-[#0d0d0f] border border-[#2a2a2e] rounded-lg text-[#f5f5f5] text-lg font-mono focus:border-[#e8c547] focus:outline-none transition-colors"
                placeholder="+2348012345678"
              />
              <button
                type="button"
                onClick={handleResolvePhone}
                disabled={resolving}
                className="px-4 py-2 bg-[#e8c547]/20 border border-[#e8c547]/50 rounded-lg text-[#e8c547] font-semibold hover:bg-[#e8c547]/30 transition-colors disabled:opacity-50"
              >
                {resolving ? '...' : '🔍'}
              </button>
            </div>
            {recipientName && (
              <p className="text-sm text-green-400 mt-2">
                ✓ Resolved to: <span className="font-bold">{recipientName}</span>
              </p>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-semibold text-[#6b6b70] mb-2 uppercase tracking-wider">
              Amount (VIDA CAP)
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={maxAmount}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="w-full px-4 py-4 bg-[#0d0d0f] border border-[#2a2a2e] rounded-lg text-[#e8c547] text-2xl font-bold font-mono focus:border-[#e8c547] focus:outline-none transition-colors"
              placeholder="0.00"
            />
            <p className="text-xs text-[#6b6b70] mt-2">
              Maximum: {maxAmount.toFixed(2)} VIDA CAP (Liquid Vault limit)
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-[#e8c547]/10 border border-[#e8c547]/30 rounded-lg p-4">
            <p className="text-xs text-[#6b6b70] leading-relaxed">
              <span className="font-bold text-[#e8c547]">Phone = Identity:</span> The system instantly 
              resolves the phone number to the recipient's Global Identity Hash. No wallet addresses needed.
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !recipientName}
            className="w-full py-5 bg-gradient-to-r from-[#c9a227] to-[#e8c547] hover:from-[#e8c547] hover:to-[#c9a227] text-black font-bold text-lg rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#e8c547]/20"
          >
            {loading ? 'Sending...' : '📤 Send VIDA'}
          </button>
        </form>
      </div>
    </div>
  );
}


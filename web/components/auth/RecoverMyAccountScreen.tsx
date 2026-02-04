'use client';

import { useState } from 'react';
import { normalizeMnemonic, validateMnemonic } from '@/lib/recoverySeed';
import { verifyRecoveryPhrase, unbindAccountFromDevice } from '@/lib/recoverySeedStorage';

interface RecoverMyAccountScreenProps {
  onComplete: () => void;
  onCancel: () => void;
}

/**
 * Recover My Account — user enters phone + 12 words to unbind account from lost device.
 */
export function RecoverMyAccountScreen({ onComplete, onCancel }: RecoverMyAccountScreenProps) {
  const [step, setStep] = useState<'phone' | 'words' | 'success'>('phone');
  const [phone, setPhone] = useState('');
  const [phrase, setPhrase] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePhoneNext = () => {
    const trimmed = phone.trim();
    if (!trimmed) {
      setError('Enter your phone number (identity anchor).');
      return;
    }
    setError(null);
    setStep('words');
  };

  const handleRecover = async () => {
    const trimmedPhrase = normalizeMnemonic(phrase);
    if (!validateMnemonic(trimmedPhrase)) {
      setError('Invalid recovery phrase. Check that you entered all 12 words correctly.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const verifyResult = await verifyRecoveryPhrase(phone.trim(), trimmedPhrase);
      if (!verifyResult.ok) {
        setError(verifyResult.error ?? 'Verification failed.');
        setLoading(false);
        return;
      }
      const unbindResult = await unbindAccountFromDevice(phone.trim());
      if (!unbindResult.ok) {
        setError(unbindResult.error ?? 'Failed to unbind device.');
        setLoading(false);
        return;
      }
      setStep('success');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Recovery failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="rounded-2xl border-2 border-emerald-500/50 bg-[#0d0d0f] p-8 max-w-md mx-auto text-center">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-xl font-bold text-emerald-400 uppercase tracking-wider mb-2">
          Account unbound
        </h2>
        <p className="text-sm text-[#a0a0a5] mb-6">
          Your account has been unbound from the lost device. You can now log in on a new device — your 12-word Master Key will remain the same.
        </p>
        <button
          type="button"
          onClick={onComplete}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-[#c9a227] to-[#e8c547] text-black font-bold text-sm uppercase tracking-wider"
        >
          Continue to login
        </button>
      </div>
    );
  }

  if (step === 'words') {
    return (
      <div className="rounded-2xl border-2 border-amber-500/50 bg-[#0d0d0f] p-8 max-w-md mx-auto">
        <div className="text-center mb-6">
          <div className="text-4xl mb-3" aria-hidden>🔑</div>
          <h2 className="text-xl font-bold text-[#e8c547] uppercase tracking-wider">
            Recover My Account
          </h2>
          <p className="text-sm text-[#6b6b70] mt-2">
            Enter your 12-word Master Key to unbind your account from the lost device.
          </p>
        </div>
        <textarea
          value={phrase}
          onChange={(e) => setPhrase(e.target.value)}
          placeholder="word1 word2 word3 ... word12"
          rows={4}
          className="w-full px-4 py-3 rounded-lg bg-[#16161a] border border-[#2a2a2e] text-[#f5f5f5] font-mono text-sm focus:border-[#e8c547] focus:outline-none resize-none"
          autoComplete="off"
        />
        {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={() => { setStep('phone'); setError(null); setPhrase(''); }}
            className="flex-1 py-3 rounded-xl border border-[#2a2a2e] text-[#a0a0a5] text-sm hover:bg-[#2a2a2e]"
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleRecover}
            disabled={loading}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#c9a227] to-[#e8c547] text-black font-bold text-sm uppercase tracking-wider disabled:opacity-50"
          >
            {loading ? 'Verifying…' : 'Unbind device'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-amber-500/50 bg-[#0d0d0f] p-8 max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="text-4xl mb-3" aria-hidden>🔑</div>
        <h2 className="text-xl font-bold text-[#e8c547] uppercase tracking-wider">
          Recover My Account
        </h2>
        <p className="text-sm text-[#6b6b70] mt-2">
          Enter your phone number (identity anchor), then your 12-word Master Key to unbind your account from a lost device and link it to a new one.
        </p>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#a0a0a5] mb-1">Phone number (identity anchor)</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+2348012345678"
            className="w-full px-4 py-3 rounded-lg bg-[#16161a] border border-[#2a2a2e] text-[#f5f5f5] font-mono focus:border-[#e8c547] focus:outline-none"
          />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl border border-[#2a2a2e] text-[#a0a0a5] text-sm hover:bg-[#2a2a2e]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handlePhoneNext}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#c9a227] to-[#e8c547] text-black font-bold text-sm uppercase tracking-wider"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

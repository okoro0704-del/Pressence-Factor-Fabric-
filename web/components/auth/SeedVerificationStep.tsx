'use client';

import { useState } from 'react';

interface SeedVerificationStepProps {
  indices: number[];
  onVerify: (answers: string[]) => void;
  onBack?: () => void;
  error?: string | null;
  loading?: boolean;
}

/**
 * Verification Test — user must re-enter 3 random words from their seed to prove they wrote it down.
 */
export function SeedVerificationStep({ indices, onVerify, onBack, error, loading = false }: SeedVerificationStepProps) {
  const [answers, setAnswers] = useState<string[]>(['', '', '']);

  const handleChange = (i: number, value: string) => {
    const next = [...answers];
    next[i] = value;
    setAnswers(next);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onVerify(answers);
  };

  const allFilled = answers.every((a) => a.trim().length > 0);

  return (
    <div className="rounded-2xl border-2 border-amber-500/50 bg-[#0d0d0f] p-8 max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="text-4xl mb-3" aria-hidden>✍️</div>
        <h2 className="text-xl font-bold text-[#e8c547] uppercase tracking-wider">
          Verification — Prove you wrote it down
        </h2>
        <p className="text-sm text-[#6b6b70] mt-2">
          Enter the following 3 words from your Master Key (in order):
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {indices.map((wordNum, i) => (
          <div key={i}>
            <label className="block text-sm font-medium text-[#a0a0a5] mb-1">
              Word #{wordNum}
            </label>
            <input
              type="text"
              value={answers[i]}
              onChange={(e) => handleChange(i, e.target.value)}
              placeholder={`Word ${wordNum}`}
              autoComplete="off"
              className="w-full px-4 py-3 rounded-lg bg-[#16161a] border border-[#2a2a2e] text-[#f5f5f5] font-mono focus:border-[#e8c547] focus:outline-none"
            />
          </div>
        ))}

        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}

        <div className="flex gap-3 pt-2">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex-1 py-3 rounded-xl border border-[#2a2a2e] text-[#a0a0a5] text-sm hover:bg-[#2a2a2e] transition-colors"
            >
              Back
            </button>
          )}
          <button
            type="submit"
            disabled={!allFilled || loading}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#c9a227] to-[#e8c547] text-black font-bold text-sm uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
          >
            {loading ? 'Saving…' : 'Verify'}
          </button>
        </div>
      </form>
    </div>
  );
}

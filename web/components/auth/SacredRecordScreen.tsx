'use client';

import { useState } from 'react';

const WARNING_TEXT =
  "This is your Master Key. If you lose these 12 words, you lose access to your $10,000 forever. Never share this with anyone, including Hub owners.";

interface SacredRecordScreenProps {
  words: string[];
  onAcknowledged: () => void;
}

/**
 * Sacred Record — displays the 12-word recovery phrase with high-visibility warning.
 * User must acknowledge before proceeding to the 3-word verification test.
 */
export function SacredRecordScreen({ words, onAcknowledged }: SacredRecordScreenProps) {
  const [confirmed, setConfirmed] = useState(false);

  return (
    <div className="rounded-2xl border-2 border-amber-500/60 bg-[#0d0d0f] p-8 max-w-lg mx-auto">
      <div className="text-center mb-6">
        <div className="text-4xl mb-3" aria-hidden>🔐</div>
        <h2 className="text-xl font-bold text-[#e8c547] uppercase tracking-wider">
          Your Master Key — Sacred Record
        </h2>
      </div>

      {/* High-visibility warning */}
      <div
        className="mb-6 p-4 rounded-xl border-2 border-red-500/70 bg-red-950/40"
        role="alert"
      >
        <p className="text-sm font-semibold text-red-200 text-center leading-relaxed">
          {WARNING_TEXT}
        </p>
      </div>

      {/* 12 words in a grid */}
      <div className="grid grid-cols-2 gap-2 mb-6">
        {words.map((word, i) => (
          <div
            key={i}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#16161a] border border-[#2a2a2e]"
          >
            <span className="text-xs font-mono text-[#6b6b70] w-6">{i + 1}.</span>
            <span className="font-mono text-[#f5f5f5]">{word}</span>
          </div>
        ))}
      </div>

      <label className="flex items-start gap-3 mb-6 cursor-pointer">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="mt-1 rounded border-[#2a2a2e] text-[#e8c547] focus:ring-[#e8c547]"
        />
        <span className="text-sm text-[#a0a0a5]">
          I have written these 12 words down in a safe place. I understand that losing them means losing access to my $10,000 forever and I will never share them with anyone.
        </span>
      </label>

      <button
        type="button"
        onClick={onAcknowledged}
        disabled={!confirmed}
        className="w-full py-4 rounded-xl bg-gradient-to-r from-[#c9a227] to-[#e8c547] text-black font-bold text-sm uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
      >
        I&apos;ve written it down — continue to verification
      </button>
    </div>
  );
}

'use client';

import { useState, useCallback } from 'react';

const WARNING_TEXT =
  "These 12 words are the only way to recover your 5 VIDA Minted Cap if your device is lost. Never share this with anyone, including Hub owners.";

const COPY_SECURITY_TOAST = 'Do not share your Master Key with anyone. Never paste it into websites or send it by message.';

interface SacredRecordScreenProps {
  words: string[];
  onAcknowledged: () => void;
}

/**
 * Sacred Record — displays the 12-word recovery phrase with high-visibility warning.
 * Copy to Clipboard with security toast. User must acknowledge before 3-word verification.
 */
export function SacredRecordScreen({ words, onAcknowledged }: SacredRecordScreenProps) {
  const [confirmed, setConfirmed] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [copyDone, setCopyDone] = useState(false);

  const copyToClipboard = useCallback(async () => {
    const phrase = words.join(' ');
    try {
      await navigator.clipboard.writeText(phrase);
      setCopyDone(true);
      setToast(COPY_SECURITY_TOAST);
      setTimeout(() => setToast(null), 6000);
    } catch {
      setToast('Clipboard not available. Write the words down by hand.');
      setTimeout(() => setToast(null), 4000);
    }
  }, [words]);

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
      <div className="grid grid-cols-2 gap-2 mb-4">
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

      {/* Copy to Clipboard + security toast */}
      <div className="mb-6 flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={copyToClipboard}
          className="px-4 py-2 rounded-lg border-2 border-amber-500/50 bg-amber-500/10 text-[#e8c547] font-semibold text-sm uppercase tracking-wider hover:bg-amber-500/20 transition-colors"
        >
          {copyDone ? 'Copied — keep it secret' : 'Copy to clipboard'}
        </button>
        {toast && (
          <div
            role="alert"
            className="w-full p-3 rounded-lg border border-amber-500/50 bg-amber-950/60 text-amber-200 text-sm text-center"
          >
            {toast}
          </div>
        )}
      </div>

      <label className="flex items-start gap-3 mb-6 cursor-pointer">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="mt-1 rounded border-[#2a2a2e] text-[#e8c547] focus:ring-[#e8c547]"
        />
        <span className="text-sm text-[#a0a0a5]">
          I have written these 12 words down in a safe place. I understand that losing them means losing access to my 5 VIDA Minted Cap and I will never share them with anyone.
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

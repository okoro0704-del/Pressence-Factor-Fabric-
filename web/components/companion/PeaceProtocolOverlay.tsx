'use client';

import { useState } from 'react';

/** Peace Protocol — breathing exercise or reassurance when anxiety detected. */
const STEPS = [
  'Find a comfortable position. You’re safe here.',
  'Breathe in slowly for 4 counts.',
  'Hold for 2 counts.',
  'Breathe out slowly for 6 counts.',
  'Repeat 3 times. The SOVRYN hears you. Your data stays on your device.',
];

export function PeaceProtocolOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState(0);
  if (!open) return null;
  const isLast = step >= STEPS.length - 1;
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="peace-protocol-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-sovereign-gold/40 bg-obsidian-surface p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="peace-protocol-title" className="mb-4 text-lg font-bold text-sovereign-gold">
          Peace Protocol
        </h2>
        <p className="mb-6 text-[18px] leading-relaxed text-[#f5f5f5]">
          {STEPS[step]}
        </p>
        <div className="flex justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#2a2a2e] px-4 py-2 text-sm font-medium text-[#a0a0a5] hover:bg-white/5"
          >
            Close
          </button>
          {isLast ? (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-sovereign-gold/30 px-4 py-2 text-sm font-medium text-sovereign-gold hover:bg-sovereign-gold/40"
            >
              Done
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="rounded-lg bg-vitalie-blue/30 px-4 py-2 text-sm font-medium text-vitalie-blue hover:bg-vitalie-blue/40"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

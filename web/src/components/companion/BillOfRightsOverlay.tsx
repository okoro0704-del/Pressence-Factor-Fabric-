'use client';

const BILL_OF_RIGHTS = [
  'Your identity belongs to you. No one can take it without your consent.',
  'Your data stays on your bonded device. Encrypted. Never sold.',
  'You can prove who you are without revealing who you are.',
  'You choose when to share. You choose when to stay private.',
  'The system must work for the 8 billion. Simple words. No gatekeeping.',
  'You have the right to understand. Ask "Simplify" anytime.',
  'You have the right to peace. The Companion can offer calm when you need it.',
  'You have the right to opt out. Your body, your device, your choice.',
];

export function BillOfRightsOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bill-of-rights-title"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-sovereign-gold/40 bg-obsidian-surface p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id="bill-of-rights-title" className="text-xl font-bold text-sovereign-gold">
            VITALIE Bill of Rights
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-[#6b6b70] hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <ul className="space-y-4 text-lg leading-relaxed text-[#f5f5f5]">
          {BILL_OF_RIGHTS.map((item, i) => (
            <li key={i} className="flex gap-3">
              <span className="text-sovereign-gold" aria-hidden>▸</span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

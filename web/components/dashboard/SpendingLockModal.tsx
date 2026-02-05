'use client';

/**
 * Spending Lock Modal — shown when user tries Send/Swap without Industrial Fingerprint at Hub.
 * Message: Industrial Fingerprint Required at Hub to Unlock Spending Power.
 */

interface SpendingLockModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SpendingLockModal({ isOpen, onClose }: SpendingLockModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80"
      role="dialog"
      aria-modal="true"
      aria-labelledby="spending-lock-title"
      onClick={onClose}
    >
      <div
        className="bg-[#16161a] border-2 border-[#C0C0C0]/50 rounded-xl p-6 max-w-md w-full shadow-2xl"
        style={{ boxShadow: '0 0 40px rgba(192, 192, 192, 0.15)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center mb-4">
          <span className="text-5xl" aria-hidden>🔒</span>
        </div>
        <h2
          id="spending-lock-title"
          className="text-xl font-bold text-center text-[#e8c547] uppercase tracking-wider mb-3"
        >
          5 VIDA SECURED
        </h2>
        <p className="text-center text-[#a0a0a5] text-sm leading-relaxed mb-6">
          Industrial Fingerprint Required at Hub to Unlock Spending Power.
        </p>
        <div className="flex justify-center">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 rounded-lg bg-[#2a2a2e] hover:bg-[#3a3a3e] text-[#e8c547] font-semibold text-sm uppercase tracking-wider transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

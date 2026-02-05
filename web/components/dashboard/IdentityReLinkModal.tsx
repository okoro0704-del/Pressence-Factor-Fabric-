'use client';

/**
 * Identity Re-Link modal — shown when swap fails due to missing recovery seed.
 * Prominent "Perform Face Pulse" button redirects to gate with ?redirect=/dashboard?openSwap=1.
 * Shield icon explains this is a protection measure for their 1 VIDA.
 */

import { useRouter } from 'next/navigation';

const PENDING_SWAP_KEY = 'pff_pending_swap_after_relink';

export interface IdentityReLinkModalProps {
  isOpen: boolean;
  /** Called when user clicks Cancel (close this modal only). */
  onClose: () => void;
  /** Amount user had entered (stored so we can auto-resume swap after Face Pulse). */
  pendingAmount?: string;
  /** Called after redirect (e.g. close parent swap modal). */
  onPerformFacePulse?: () => void;
}

/** Store pending swap so dashboard can auto-open modal and trigger swap after Face Pulse. */
export function setPendingSwapAfterRelink(amount: string): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(PENDING_SWAP_KEY, amount);
  } catch {
    // ignore
  }
}

export function getPendingSwapAfterRelink(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const v = sessionStorage.getItem(PENDING_SWAP_KEY);
    sessionStorage.removeItem(PENDING_SWAP_KEY);
    return v;
  } catch {
    return null;
  }
}

export function IdentityReLinkModal({
  isOpen,
  onClose,
  pendingAmount = '',
}: IdentityReLinkModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const handlePerformFacePulse = () => {
    setPendingSwapAfterRelink(pendingAmount);
    const next = encodeURIComponent('/dashboard?openSwap=1');
    router.push(`/?forceGate=1&next=${next}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-[#050505] to-[#0B0B0B] rounded-2xl border-2 border-[#D4AF37]/40 shadow-[0_0_60px_rgba(212,175,55,0.25)] max-w-md w-full p-6">
        {/* Security icon */}
        <div className="flex justify-center mb-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center border-2 border-[#D4AF37]/60"
            style={{ background: 'rgba(212, 175, 55, 0.12)' }}
            aria-hidden
          >
            <svg
              className="w-8 h-8 text-[#D4AF37]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
        </div>

        <h2 className="text-xl font-bold text-[#D4AF37] uppercase tracking-wider text-center mb-2">
          Identity Re-Link Required
        </h2>
        <p className="text-sm text-[#a0a0a5] text-center mb-4">
          This is a protection measure for your 1 VIDA. Re-authorize your wallet with Face Pulse to continue the swap.
        </p>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={handlePerformFacePulse}
            className="w-full py-4 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#C9A227] hover:from-[#FFD700] hover:to-[#D4AF37] text-[#050505] font-bold text-lg uppercase tracking-wider shadow-[0_0_24px_rgba(212,175,55,0.4)] transition-all duration-300"
          >
            Perform Face Pulse
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-lg border-2 border-[#2a2a2e] text-[#6b6b70] font-semibold hover:border-[#D4AF37]/40 hover:text-[#D4AF37] transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

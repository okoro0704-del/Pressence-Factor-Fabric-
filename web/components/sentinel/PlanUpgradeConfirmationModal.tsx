'use client';

import { VIDA_USD_VALUE } from '@/lib/economic';

export interface PlanUpgradeConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  /** Amount in USD (e.g. 200). Shown as VIDA using VIDA_USD_VALUE ($1,000 = 1 VIDA). */
  amountUsd: number;
  deviceLimit: number;
}

export function PlanUpgradeConfirmationModal({
  open,
  onClose,
  amountUsd,
  deviceLimit,
}: PlanUpgradeConfirmationModalProps) {
  if (!open) return null;
  const amountVida = amountUsd / VIDA_USD_VALUE;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div
        className="rounded-2xl border-2 p-6 sm:p-8 max-w-md w-full text-center shadow-2xl"
        style={{
          background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
          borderColor: '#D4AF37',
          boxShadow: '0 0 40px rgba(212, 175, 55, 0.2)',
        }}
      >
        <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl bg-[#D4AF37]/20 border-2 border-[#D4AF37]">
          ✓
        </div>
        <h3 className="text-xl font-bold text-[#D4AF37] uppercase tracking-wider mb-2">
          Plan Upgraded
        </h3>
        <p className="text-[#e8c547]/90 text-sm mb-4">
          {amountVida.toFixed(1)} VIDA debited from Spendable Vault.
        </p>
        <p className="text-white font-mono text-sm mb-6">
          Your device limit is now <span className="text-[#D4AF37] font-bold">{deviceLimit}</span>.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 rounded-xl font-bold uppercase tracking-wider transition-all hover:opacity-90"
          style={{ background: '#D4AF37', color: '#020617' }}
        >
          Done
        </button>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import {
  isMerchantMode,
  setMerchantMode,
  getMerchantWalletAddress,
  setMerchantWalletAddress,
} from '@/lib/merchantMode';
import { getIdentityAnchorPhone } from '@/lib/sentinelActivation';
import { MerchantQRCode } from './MerchantQRCode';
import { MerchantStoreSign } from './MerchantStoreSign';
import { requestNotificationPermission } from '@/lib/merchantNotifications';

export interface MerchantModeSectionProps {
  onMerchantModeChange?: (enabled: boolean, walletAddress: string | null) => void;
  /** When true, hide wallet address and QR until face scan (Personal Vault privacy). */
  obfuscate?: boolean;
  /** Call when user requests face scan to reveal Merchant QR. */
  onRequestFaceScan?: () => void;
}

export function MerchantModeSection({ onMerchantModeChange, obfuscate = false, onRequestFaceScan }: MerchantModeSectionProps) {
  const [enabled, setEnabled] = useState(false);
  const [walletAddress, setWalletAddressState] = useState<string | null>(null);

  useEffect(() => {
    setEnabled(isMerchantMode());
    setWalletAddressState(getMerchantWalletAddress());
  }, []);

  useEffect(() => {
    const phone = getIdentityAnchorPhone();
    if (enabled && phone && !getMerchantWalletAddress()) {
      setMerchantWalletAddress(phone);
      setWalletAddressState(phone);
    }
    if (enabled) {
      requestNotificationPermission();
    }
    const w = walletAddress ?? (enabled ? getIdentityAnchorPhone() : null);
    onMerchantModeChange?.(enabled, w);
  }, [enabled, walletAddress]);

  const handleToggle = () => {
    const next = !enabled;
    setMerchantMode(next);
    setEnabled(next);
    if (next) {
      const phone = getIdentityAnchorPhone();
      if (phone) {
        setMerchantWalletAddress(phone);
        setWalletAddressState(phone);
      }
    } else {
      setWalletAddressState(null);
    }
    onMerchantModeChange?.(next, next ? getIdentityAnchorPhone() : null);
  };

  const displayWallet = walletAddress ?? getIdentityAnchorPhone();
  const showQR = enabled && displayWallet && !obfuscate;
  const showObfuscated = enabled && obfuscate;

  return (
    <section className="rounded-xl border border-[#2a2a2e] bg-[#16161a] p-4 mt-6">
      <h2 className="text-sm font-semibold text-[#c9a227] mb-2">Merchant Mode</h2>
      <p className="text-xs text-[#6b6b70] mb-3">
        Accept VIDA payments from citizens. When on, your Personal Wallet Address is shown as a high-contrast QR code for instant P2P payments.
      </p>
      <div className="flex items-center gap-3 mb-3">
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={handleToggle}
          className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-[#e8c547] focus:ring-offset-2 focus:ring-offset-[#16161a] ${
            enabled ? 'bg-[#e8c547]' : 'bg-[#2a2a2e]'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-[#0d0d0f] shadow ring-0 transition ${
              enabled ? 'translate-x-5' : 'translate-x-1'
            }`}
          />
        </button>
        <span className="text-sm text-[#a0a0a5]">{enabled ? 'On' : 'Off'}</span>
      </div>
      {showObfuscated && (
        <div className="mt-4 pt-4 border-t border-[#2a2a2e] rounded-xl border-2 border-amber-500/40 bg-amber-500/10 p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <span className="text-2xl" aria-hidden>🔒</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-200/95">Merchant QR is private</p>
            <p className="text-xs text-amber-200/80 mt-0.5">Wallet: ****</p>
          </div>
          <button
            type="button"
            onClick={() => onRequestFaceScan?.()}
            className="px-4 py-2 rounded-lg bg-amber-500/30 border border-amber-500/50 text-amber-200 font-semibold text-sm hover:bg-amber-500/40 transition-colors cursor-pointer"
          >
            Reveal with Face Scan
          </button>
        </div>
      )}
      {showQR && displayWallet && (
        <div className="mt-4 pt-4 border-t border-[#2a2a2e]">
          <p className="text-xs text-[#6b6b70] mb-2">Payment QR — Personal Wallet Address (P2P):</p>
          <div className="inline-block p-4 rounded-lg bg-white border-2 border-[#0d0d0f]" style={{ boxShadow: '0 0 0 4px rgba(212,175,55,0.3)' }}>
            <MerchantQRCode walletAddress={displayWallet} size={220} highContrast />
          </div>
          <p className="text-xs font-mono text-[#a0a0a5] mt-2 break-all">{displayWallet}</p>
          <div className="mt-4">
            <MerchantStoreSign walletAddress={displayWallet} />
          </div>
        </div>
      )}
    </section>
  );
}

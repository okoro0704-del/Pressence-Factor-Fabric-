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
}

export function MerchantModeSection({ onMerchantModeChange }: MerchantModeSectionProps) {
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
  const showQR = enabled && displayWallet;

  return (
    <section className="rounded-xl border border-[#2a2a2e] bg-[#16161a] p-4 mt-6">
      <h2 className="text-sm font-semibold text-[#c9a227] mb-2">Merchant Mode</h2>
      <p className="text-xs text-[#6b6b70] mb-3">
        Accept VIDA payments from citizens. When on, a permanent QR linked to your wallet is shown; customers scan to pay from their $1,000 Liquid grant.
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
      {showQR && displayWallet && (
        <div className="mt-4 pt-4 border-t border-[#2a2a2e]">
          <p className="text-xs text-[#6b6b70] mb-2">Payment QR — link to wallet: {displayWallet}</p>
          <div className="inline-block p-3 bg-white rounded-lg">
            <MerchantQRCode walletAddress={displayWallet} size={200} />
          </div>
          <div className="mt-4">
            <MerchantStoreSign walletAddress={displayWallet} />
          </div>
        </div>
      )}
    </section>
  );
}

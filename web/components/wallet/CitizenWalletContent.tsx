'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { SovereignIdCard } from '@/components/dashboard/SovereignIdCard';
import { UserProfileBalance } from '@/components/dashboard/UserProfileBalance';
import { MultiCurrencyBalanceCards } from '@/components/sovryn/MultiCurrencyBalanceCards';
import { MerchantModeSection } from '@/components/dashboard/MerchantModeSection';
import { FamilyVault } from '@/components/dashboard/FamilyVault';
import { getIdentityAnchorPhone } from '@/lib/sentinelActivation';
import { fetchUserBalances } from '@/lib/userBalances';
import { TreasuryFacePulseModal } from '@/components/dashboard/TreasuryFacePulseModal';

const GOLD = '#D4AF37';

/** Wallet = everything related to the citizen: ID, balance, currencies, merchant mode, family vault. */
export function CitizenWalletContent({
  vaultStable = false,
  mintTxHash = null,
  openSwapFromUrl = false,
}: {
  vaultStable?: boolean;
  mintTxHash?: string | null;
  openSwapFromUrl?: boolean;
} = {}) {
  const [userBalances, setUserBalances] = useState<{
    vida_balance: number;
    dllr_balance: number;
    usdt_balance: number;
    vngn_balance: number;
  } | null>(null);
  const [personalVaultRevealed] = useState(true);
  const [showFacePulseModal, setShowFacePulseModal] = useState(false);
  const [merchantWallet, setMerchantWallet] = useState<string | null>(null);

  useEffect(() => {
    fetchUserBalances(getIdentityAnchorPhone()).then((row) => {
      if (row) {
        setUserBalances({
          vida_balance: row.vida_balance,
          dllr_balance: row.dllr_balance,
          usdt_balance: row.usdt_balance,
          vngn_balance: row.vngn_balance,
        });
      }
    });
  }, []);

  return (
    <div className="space-y-6">
      <section className="hidden lg:flex lg:items-center lg:gap-4 rounded-xl border p-4 max-w-2xl" style={{ borderColor: 'rgba(212,175,55,0.4)', background: 'rgba(15,14,10,0.6)' }}>
        <span className="text-sm font-bold uppercase tracking-wider" style={{ color: GOLD }}>Sync to Mobile</span>
        <Link href="/link-device/" className="text-sm font-semibold" style={{ color: GOLD }}>Link Device / QR →</Link>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-xs font-bold text-[#6b6b70] uppercase tracking-wider mb-2">Sovereign ID</h3>
          <SovereignIdCard />
        </div>
        <div>
          <h3 className="text-xs font-bold text-[#6b6b70] uppercase tracking-wider mb-2">VIDA</h3>
          <UserProfileBalance
            vaultStable={vaultStable}
            mintTxHash={mintTxHash}
            openSwapFromUrl={openSwapFromUrl}
            obfuscate={!personalVaultRevealed}
          />
        </div>
      </div>

      <div>
        <h3 className="text-xs font-bold text-[#6b6b70] uppercase tracking-wider mb-3">Wallets · VIDA · DLLR · USDT · vNGN</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border-2 p-4" style={{ borderColor: 'rgba(212,175,55,0.4)', background: 'rgba(212,175,55,0.08)' }}>
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: GOLD }}>VIDA</span>
            <p className="text-lg font-bold font-mono mt-1" style={{ color: GOLD }}>
              {!personalVaultRevealed ? '****' : userBalances != null ? `${userBalances.vida_balance.toFixed(2)} VIDA` : 'See above'}
            </p>
          </div>
          <MultiCurrencyBalanceCards variant="cardsOnly" obfuscate={!personalVaultRevealed} />
          <div className="rounded-xl border-2 p-4" style={{ borderColor: 'rgba(180,180,180,0.4)', background: 'rgba(180,180,180,0.06)' }}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#a0a0a5]">vNGN</span>
            <p className="text-lg font-bold font-mono mt-1 text-[#a0a0a5]">
              {!personalVaultRevealed ? '****' : userBalances != null ? `${userBalances.vngn_balance.toFixed(2)} vNGN` : '— vNGN'}
            </p>
            <p className="text-[10px] text-[#6b6b70] mt-1">Naira stable · RSK</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-bold text-[#6b6b70] uppercase tracking-wider mb-2">Swap / Convert</h3>
        <p className="text-xs text-[#6b6b70] mb-2">Convert VIDA → DLLR or USDT in the VIDA card above.</p>
      </div>

      <MerchantModeSection
        onMerchantModeChange={(_, w) => setMerchantWallet(w ?? null)}
        obfuscate={!personalVaultRevealed}
        onRequestFaceScan={() => setShowFacePulseModal(true)}
      />

      <div className="lg:col-span-2">
        <FamilyVault />
      </div>

      <div className="flex flex-wrap gap-3 pt-4">
        <Link href="/humanity/" className="text-sm font-medium text-[#c9a227] hover:text-[#e8c547] transition-colors">Humanity Ledger →</Link>
        <Link href="/pulse/" className="text-sm font-medium text-[#c9a227] hover:text-[#e8c547] transition-colors">National Pulse →</Link>
        <Link href="/treasury/" className="text-sm font-medium text-[#c9a227] hover:text-[#e8c547] transition-colors">National Treasury →</Link>
        <Link href="/companion/" className="text-sm font-medium text-[#c9a227] hover:text-[#e8c547] transition-colors">SOVRYN Companion →</Link>
      </div>

      <TreasuryFacePulseModal
        isOpen={showFacePulseModal}
        onClose={() => setShowFacePulseModal(false)}
        onVerified={() => setShowFacePulseModal(false)}
      />
    </div>
  );
}

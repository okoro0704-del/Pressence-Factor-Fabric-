'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { WalletSovereignIdCard } from '@/components/wallet/WalletSovereignIdCard';
import { MerchantModeSection } from '@/components/dashboard/MerchantModeSection';
import { FamilyVault } from '@/components/dashboard/FamilyVault';
import { getIdentityAnchorPhone } from '@/lib/sentinelActivation';
import { fetchUserBalances } from '@/lib/userBalances';
import { getVitalizationStatus } from '@/lib/vitalizationRitual';
import { TreasuryFacePulseModal } from '@/components/dashboard/TreasuryFacePulseModal';
import { SendVidaModal } from '@/components/dashboard/SendVidaModal';
import { VIDASwapModal } from '@/components/dashboard/VIDASwapModal';
import { ReceiveModal } from '@/components/treasury/ReceiveModal';

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
  const [lockedVida, setLockedVida] = useState<number | null>(null);
  const [spendableVida, setSpendableVida] = useState<number | null>(null);
  const [personalVaultRevealed] = useState(true);
  const [showFacePulseModal, setShowFacePulseModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [merchantWallet, setMerchantWallet] = useState<string | null>(null);
  const [hasIdentity, setHasIdentity] = useState<boolean | null>(null);
  const [phone, setPhone] = useState<string | null>(null);

  useEffect(() => {
    const p = getIdentityAnchorPhone();
    setPhone(p);
    setHasIdentity(!!p);
    if (!p) return;
    fetchUserBalances(p).then((row) => {
      if (row) {
        setUserBalances({
          vida_balance: row.vida_balance,
          dllr_balance: row.dllr_balance,
          usdt_balance: row.usdt_balance,
          vngn_balance: row.vngn_balance,
        });
      }
    });
    getVitalizationStatus(p).then((status) => {
      if (status) {
        setLockedVida(status.lockedVida);
        setSpendableVida(status.spendableVida);
      }
    });
  }, []);

  // Open swap modal when URL has ?openSwap=1
  useEffect(() => {
    if (openSwapFromUrl && phone) setShowSwapModal(true);
  }, [openSwapFromUrl, phone]);

  if (hasIdentity === null) {
    return (
      <div className="rounded-2xl border border-[#2a2a2e] bg-[#16161a]/80 p-8 flex items-center justify-center min-h-[200px]">
        <p className="text-sm text-[#6b6b70]">Loading your wallet…</p>
      </div>
    );
  }

  if (hasIdentity === false) {
    return (
      <div className="rounded-2xl border border-[#2a2a2e] bg-[#16161a]/80 p-8 text-center">
        <p className="text-[#a0a0a5] mb-2">Your wallet is tied to your sovereign identity.</p>
        <p className="text-sm text-[#6b6b70]">Complete vitalization to see your balance, VIDA, and merchant mode.</p>
      </div>
    );
  }

  const obfuscate = !personalVaultRevealed;
  const formatBal = (v: number | null | undefined) =>
    obfuscate ? '****' : v != null ? v.toFixed(2) : '—';

  /** Action row: Swap, Send, Receive — used on Spendable VIDA and other wallets. */
  const ActionRow = ({
    onSwap,
    onSend,
    onReceive,
  }: {
    onSwap: () => void;
    onSend: () => void;
    onReceive: () => void;
  }) => (
    <div className="flex flex-wrap gap-2 mt-3">
      <button
        type="button"
        onClick={onSwap}
        className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#2a2a2e] bg-[#2a2a2e] text-[#e8c547] hover:bg-[#3a3a3e]"
      >
        Swap
      </button>
      <button
        type="button"
        onClick={onSend}
        className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#2a2a2e] bg-[#2a2a2e] text-[#e8c547] hover:bg-[#3a3a3e]"
      >
        Send
      </button>
      <button
        type="button"
        onClick={onReceive}
        className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#2a2a2e] bg-[#2a2a2e] text-[#e8c547] hover:bg-[#3a3a3e]"
      >
        Receive
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <section className="hidden lg:flex lg:items-center lg:gap-4 rounded-xl border p-4 max-w-2xl" style={{ borderColor: 'rgba(212,175,55,0.4)', background: 'rgba(15,14,10,0.6)' }}>
        <span className="text-sm font-bold uppercase tracking-wider" style={{ color: GOLD }}>Sync to Mobile</span>
        <Link href="/link-device/" className="text-sm font-semibold" style={{ color: GOLD }}>Link Device / QR →</Link>
      </section>

      {/* Sovereign ID — ID number, name, vitalization status, device */}
      <div>
        <h3 className="text-xs font-bold text-[#6b6b70] uppercase tracking-wider mb-2">Sovereign ID</h3>
        <WalletSovereignIdCard />
      </div>

      {/* Two major wallets: Locked VIDA CAP, Spendable VIDA CAP */}
      <div>
        <h3 className="text-xs font-bold text-[#6b6b70] uppercase tracking-wider mb-3">Major wallets</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div
            className="rounded-xl border-2 p-5"
            style={{ borderColor: 'rgba(212,175,55,0.35)', background: 'rgba(212,175,55,0.06)' }}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: GOLD }}>Locked VIDA CAP</span>
            <p className="text-xl font-bold font-mono mt-1" style={{ color: GOLD }}>
              {formatBal(lockedVida ?? undefined)} VIDA
            </p>
            <p className="text-[10px] text-[#6b6b70] mt-1">National lock · Protocol reserve</p>
          </div>
          <div
            className="rounded-xl border-2 p-5"
            style={{ borderColor: 'rgba(212,175,55,0.45)', background: 'rgba(212,175,55,0.1)' }}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: GOLD }}>Spendable VIDA CAP</span>
            <p className="text-xl font-bold font-mono mt-1" style={{ color: GOLD }}>
              {formatBal(spendableVida ?? undefined)} VIDA
            </p>
            <p className="text-[10px] text-[#6b6b70] mt-1">Ready to swap, send or receive</p>
            <ActionRow
              onSwap={() => setShowSwapModal(true)}
              onSend={() => setShowSendModal(true)}
              onReceive={() => setShowReceiveModal(true)}
            />
          </div>
        </div>
      </div>

      {/* Other wallets: DLLR, USDT, VIDA Naira — with Swap, Send, Receive */}
      <div>
        <h3 className="text-xs font-bold text-[#6b6b70] uppercase tracking-wider mb-3">Other wallets</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div
            className="rounded-xl border-2 p-5 flex flex-col"
            style={{
              background: 'linear-gradient(135deg, rgba(212,175,55,0.12) 0%, rgba(192,192,192,0.08) 100%)',
              borderColor: 'rgba(255, 215, 0, 0.45)',
            }}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#FFD700' }}>DLLR</span>
            <p className="text-lg font-bold font-mono mt-1" style={{ color: '#FFD700' }}>
              {formatBal(userBalances?.dllr_balance)} DLLR
            </p>
            <p className="text-[10px] text-[#6b6b70] mt-1">Sovryn Dollar · RSK</p>
            <ActionRow onSwap={() => setShowSwapModal(true)} onSend={() => setShowSendModal(true)} onReceive={() => setShowReceiveModal(true)} />
          </div>
          <div
            className="rounded-xl border-2 p-5 flex flex-col"
            style={{
              background: 'linear-gradient(135deg, rgba(0,163,104,0.15) 0%, rgba(0,163,104,0.06) 100%)',
              borderColor: 'rgba(0, 163, 104, 0.5)',
            }}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#00A368' }}>USDT</span>
            <p className="text-lg font-bold font-mono mt-1" style={{ color: '#00A368' }}>
              {formatBal(userBalances?.usdt_balance)} USDT
            </p>
            <p className="text-[10px] text-[#6b6b70] mt-1">Tether · RSK</p>
            <ActionRow onSwap={() => setShowSwapModal(true)} onSend={() => setShowSendModal(true)} onReceive={() => setShowReceiveModal(true)} />
          </div>
          <div
            className="rounded-xl border-2 p-5 flex flex-col"
            style={{ borderColor: 'rgba(180,180,180,0.4)', background: 'rgba(180,180,180,0.06)' }}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#a0a0a5]">VIDA Naira (vNGN)</span>
            <p className="text-lg font-bold font-mono mt-1 text-[#a0a0a5]">
              {formatBal(userBalances?.vngn_balance)} vNGN
            </p>
            <p className="text-[10px] text-[#6b6b70] mt-1">Naira stable · RSK</p>
            <ActionRow onSwap={() => setShowSwapModal(true)} onSend={() => setShowSendModal(true)} onReceive={() => setShowReceiveModal(true)} />
          </div>
        </div>
      </div>

      <MerchantModeSection
        onMerchantModeChange={(_, w) => setMerchantWallet(w ?? null)}
        obfuscate={!personalVaultRevealed}
        onRequestFaceScan={() => setShowFacePulseModal(true)}
      />

      <div className="lg:col-span-2">
        <FamilyVault />
      </div>

      <TreasuryFacePulseModal
        isOpen={showFacePulseModal}
        onClose={() => setShowFacePulseModal(false)}
        onVerified={() => setShowFacePulseModal(false)}
      />

      {phone && (
        <>
          <SendVidaModal
            isOpen={showSendModal}
            onClose={() => setShowSendModal(false)}
            senderPhone={phone}
            maxAmount={spendableVida ?? 0}
          />
          <VIDASwapModal
            isOpen={showSwapModal}
            onClose={() => setShowSwapModal(false)}
            maxAmount={spendableVida ?? 0}
            phoneNumber={phone}
          />
          <ReceiveModal
            isOpen={showReceiveModal}
            onClose={() => setShowReceiveModal(false)}
            phoneNumber={phone}
          />
        </>
      )}
    </div>
  );
}

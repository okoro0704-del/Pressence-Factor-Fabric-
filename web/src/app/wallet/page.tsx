'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/dashboard/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { CitizenWalletContent } from '@/components/wallet/CitizenWalletContent';
import { getIdentityAnchorPhone } from '@/lib/sentinelActivation';
import { getProfileFaceAndSeed } from '@/lib/recoverySeedStorage';

/** Wallet = everything related to the citizen: ID, balance, VIDA, currencies, merchant mode, family vault. */
export default function WalletPage() {
  const searchParams = useSearchParams();
  const [vaultStable, setVaultStable] = useState(false);
  const [mintTxHash, setMintTxHash] = useState<string | null>(null);

  useEffect(() => {
    const phone = getIdentityAnchorPhone();
    if (!phone) return;
    getProfileFaceAndSeed(phone).then((profile) => {
      if (profile.ok && profile.face_hash && profile.recovery_seed_hash) setVaultStable(true);
      if (profile.ok && profile.vida_mint_tx_hash) setMintTxHash(profile.vida_mint_tx_hash);
    });
  }, []);

  return (
    <ProtectedRoute>
      <AppShell>
        <main className="min-h-screen bg-[#0d0d0f] pb-24 md:pb-8 flex flex-col">
          <header className="shrink-0 border-b border-[#2a2a2e] bg-[#16161a]/95 backdrop-blur px-4 py-3 safe-area-top">
            <div className="flex items-center justify-between max-w-6xl mx-auto w-full">
              <h1 className="text-lg font-bold bg-gradient-to-r from-[#e8c547] to-[#c9a227] bg-clip-text text-transparent">
                Your Wallet
              </h1>
              <div className="flex items-center gap-3">
                <Link href="/treasury/" className="text-sm font-medium text-[#c9a227] hover:text-[#e8c547] transition-colors">
                  Treasury
                </Link>
                <Link href="/settings/" className="text-sm font-medium text-[#c9a227] hover:text-[#e8c547] transition-colors">
                  Settings
                </Link>
              </div>
            </div>
          </header>
          <div className="flex-1 p-4 md:p-6 max-w-6xl mx-auto w-full">
            <CitizenWalletContent
              vaultStable={vaultStable}
              mintTxHash={mintTxHash}
              openSwapFromUrl={searchParams.get('openSwap') === '1'}
            />
          </div>
        </main>
      </AppShell>
    </ProtectedRoute>
  );
}

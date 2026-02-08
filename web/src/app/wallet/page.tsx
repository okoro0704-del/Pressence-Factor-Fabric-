'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/dashboard/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { CitizenWalletContent } from '@/components/wallet/CitizenWalletContent';
import { getIdentityAnchorPhone } from '@/lib/sentinelActivation';
import { getProfileFaceAndSeed } from '@/lib/recoverySeedStorage';

function WalletContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [vaultStable, setVaultStable] = useState(false);
  const [mintTxHash, setMintTxHash] = useState<string | null>(null);

  useEffect(() => {
    const phone = getIdentityAnchorPhone();
    if (!phone) return;
    getProfileFaceAndSeed(phone).then((profile) => {
      if (profile?.ok && profile.face_hash && profile.recovery_seed_hash) setVaultStable(true);
      if (profile?.ok && profile.vida_mint_tx_hash) setMintTxHash(profile.vida_mint_tx_hash);
    });
  }, []);

  return (
    <main className="min-h-screen bg-[#0d0d0f] pb-24 md:pb-8 flex flex-col">
      <header className="shrink-0 border-b border-[#2a2a2e] bg-[#16161a]/95 backdrop-blur px-4 py-3 safe-area-top">
        <div className="relative flex items-center justify-center min-h-[2.5rem] max-w-6xl mx-auto w-full">
          <button
            type="button"
            onClick={() => router.back()}
            className="absolute left-0 flex items-center justify-center w-10 h-10 -ml-2 rounded-lg text-[#c9a227] hover:text-[#e8c547] hover:bg-[#2a2a2e] transition-colors"
            aria-label="Go back"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-bold bg-gradient-to-r from-[#e8c547] to-[#c9a227] bg-clip-text text-transparent">
            Your Wallet
          </h1>
        </div>
      </header>
      <div className="flex-1 p-4 md:p-6 max-w-6xl mx-auto w-full">
        <CitizenWalletContent
          vaultStable={vaultStable}
          mintTxHash={mintTxHash ?? undefined}
          openSwapFromUrl={searchParams.get('openSwap') === '1'}
        />
      </div>
    </main>
  );
}

/** Wallet = everything related to the citizen: ID, balance, VIDA, currencies, merchant mode, family vault. */
export default function WalletPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <Suspense fallback={
          <main className="min-h-screen bg-[#0d0d0f] pb-24 md:pb-8 flex items-center justify-center">
            <p className="text-sm text-[#6b6b70]">Loading your wallet…</p>
          </main>
        }>
          <WalletContent />
        </Suspense>
      </AppShell>
    </ProtectedRoute>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { DashboardContent } from '@/components/sovryn/DashboardContent';
import { ProtectedRoute } from '@/components/dashboard/ProtectedRoute';
import { InstallSmartBanner } from '@/components/InstallSmartBanner';
import { VitalizationRequestListener } from '@/components/dashboard/VitalizationRequestListener';
import { LoginRequestListener } from '@/components/dashboard/LoginRequestListener';
import { getMintStatus, MINT_STATUS_PENDING_HARDWARE } from '@/lib/mintStatus';
import { getIdentityAnchorPhone } from '@/lib/sentinelActivation';
import { getProfileFaceAndSeed } from '@/lib/recoverySeedStorage';
import { startVerifiedMintListener } from '@/lib/sovryn/verifiedMintListener';

/**
 * DASHBOARD PAGE - PROTECTED (VAULT)
 * Reads face_hash and recovery_seed_hash on entry. If both present: show 5 VIDA, stop back/bounce.
 * Success trigger: navigation.reset to Vault only when both confirmed in Supabase.
 */
export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [identityPhone, setIdentityPhone] = useState<string | null>(null);
  const [pendingHardware, setPendingHardware] = useState(false);
  const [vaultStable, setVaultStable] = useState(false);
  /** When gasless mint completes, tx hash is set; UI shows "5 VIDA MINTED ON BITCOIN LAYER 2" with golden checkmark. */
  const [mintTxHash, setMintTxHash] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const unauthorized = searchParams.get('unauthorized') === '1';
  const showMintedBanner = searchParams.get('minted') === '1';

  useEffect(() => {
    setMounted(true);
    console.log('Interaction Layer Active', '(dashboard)');
  }, []);

  useEffect(() => {
    if (mounted) setIdentityPhone(getIdentityAnchorPhone());
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    const phone = getIdentityAnchorPhone();
    if (!phone) return;
    getMintStatus(phone).then((res) => {
      if (res.ok && res.mint_status === MINT_STATUS_PENDING_HARDWARE) {
        setPendingHardware(true);
      }
    });
  }, [mounted]);

  /** Vault stability: on entry read face_hash, recovery_seed_hash, vida_mint_tx_hash. If both anchors present, set vaultStable; if tx hash present, show confirmation UI. */
  useEffect(() => {
    if (!mounted) return;
    let cancelled = false;
    (async () => {
      const phone = getIdentityAnchorPhone();
      if (!phone) return;
      const profile = await getProfileFaceAndSeed(phone);
      if (cancelled || !profile.ok) return;
      const bothPresent = !!(profile.face_hash && profile.recovery_seed_hash);
      if (bothPresent) setVaultStable(true);
      if (profile.ok && profile.vida_mint_tx_hash) setMintTxHash(profile.vida_mint_tx_hash);
    })();
    return () => { cancelled = true; };
  }, [mounted]);

  /** When is_fully_verified becomes TRUE, trigger mintVidaToken (5 VIDA to derived RSK wallet); receipt saved to Supabase. */
  useEffect(() => {
    if (!mounted || !vaultStable) return;
    const phone = getIdentityAnchorPhone();
    if (!phone) return;
    const cleanup = startVerifiedMintListener(phone, (result) => {
      if (result.txHash) {
        console.log('[VidaMint] Receipt:', result.txHash);
        setMintTxHash(result.txHash);
      }
      if (result.error) {
        console.warn('[VidaMint]', result.error);
      }
    }, { pollIntervalMs: 20000 });
    return cleanup;
  }, [mounted, vaultStable]);

  /** When both anchors present: disable back navigation (no going back / bouncing). */
  useEffect(() => {
    if (!mounted || typeof window === 'undefined' || !vaultStable) return;
    let removePopState: (() => void) | null = null;
    window.history.replaceState({ vaultLocked: true }, '', window.location.pathname + window.location.search);
    const onPopState = () => router.replace('/dashboard');
    window.addEventListener('popstate', onPopState);
    removePopState = () => window.removeEventListener('popstate', onPopState);
    return () => removePopState?.();
  }, [mounted, vaultStable, router]);

  if (!mounted) {
    return null;
  }

  return (
    <ProtectedRoute>
      <main
        className="min-h-screen bg-[#0d0d0f] pb-36 md:pb-0"
        data-vault-stable={vaultStable ? 'true' : undefined}
      >
        {pendingHardware && (
          <div
            className="bg-[#C0C0C0]/25 border-b border-[#C0C0C0]/60 px-4 py-4 text-center text-[#a0a0a8] text-sm font-semibold uppercase tracking-wider"
            role="status"
          >
            Vitalization Incomplete. Visit a Sentinel Hub with an Industrial Scanner to mint your 5 VIDA CAP.
          </div>
        )}
        {showMintedBanner && (
          <div
            className="bg-[#D4AF37]/20 border-b border-[#D4AF37]/50 px-4 py-3 text-center text-[#D4AF37] text-sm font-bold uppercase tracking-wider"
            role="status"
          >
            5 VIDA CAP SUCCESSFULLY MINTED
          </div>
        )}
        {unauthorized && (
          <div
            className="bg-red-500/20 border-b border-red-500/50 px-4 py-3 text-center text-red-400 text-sm font-medium"
            role="alert"
          >
            Unauthorized Access. You do not have the required role for that page.
          </div>
        )}
        <DashboardContent
          vaultStable={vaultStable}
          mintTxHash={mintTxHash}
          openSwapFromUrl={searchParams.get('openSwap') === '1'}
        />
        <InstallSmartBanner />
        {identityPhone && <VitalizationRequestListener phoneNumber={identityPhone} />}
        {identityPhone && <LoginRequestListener phoneNumber={identityPhone} />}
      </main>
    </ProtectedRoute>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { vitalizationService, type MockPresenceProof, type MockVidaCapResult, type MockVidaBalance } from '@/lib/mockService';
import { BiometricScanningHUD } from './BiometricScanningHUD';
import { ArchitectVisionCapture } from './auth/ArchitectVisionCapture';
import { getVitalizationPhone } from '@/lib/deviceId';
import { isFirstRegistration } from '@/lib/masterArchitectInit';
// To switch to real API, change the import above to:
// import { vitalizationService } from '@/lib/realVitalizationService';

/**
 * Vitalization Screen — Optimized for Redmi 15 View
 * 
 * Features:
 * - PFF Triple-Lock Scan (Phone UUID + Face + Sovereign Palm)
 * - 50/50 VIDA CAP Minting Split Display
 * - $VIDA Balance Updates
 * - Hard reset flow (?reset=1): camera diagnostic (mirror + blue mesh), then re-register
 */
export function VitalizationScreen() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isResetFlow = searchParams.get('reset') === '1';
  const phoneFromQuery = searchParams.get('phone');
  const [handoffPhone, setHandoffPhone] = useState<string | null>(null);

  useEffect(() => {
    const fromStorage = getVitalizationPhone();
    const phone = phoneFromQuery ?? fromStorage ?? null;
    setHandoffPhone(phone);
  }, [phoneFromQuery]);

  const [step, setStep] = useState<'idle' | 'scanning' | 'minting' | 'success' | 'error'>('idle');
  const [presenceProof, setPresenceProof] = useState<MockPresenceProof | null>(null);
  const [vidaCapResult, setVidaCapResult] = useState<MockVidaCapResult | null>(null);
  const [vidaBalance, setVidaBalance] = useState<MockVidaBalance | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** Zero-click camera: show Architect Vision full-screen on mount for new registrations */
  const [showVision, setShowVision] = useState(true);
  /** Master Architect Initialization: first run uses Low sensitivity so Creator is not blocked by lighting. */
  const [isFirstRun, setIsFirstRun] = useState(false);

  useEffect(() => {
    isFirstRegistration().then((r) => {
      if (r.isFirst) setIsFirstRun(true);
    });
  }, []);

  // Load initial balance on mount
  useEffect(() => {
    loadInitialBalance();
  }, []);

  const loadInitialBalance = async () => {
    try {
      // Mock initial balance (before vitalization)
      setVidaBalance({
        citizenVault: { vidaCapBalance: 0, pffId: '' },
        nationalReserve: { totalVidaCap: 1000.0 },
        vidaCurrency: { balance: 0 },
      });
    } catch (err) {
      console.error('Failed to load initial balance:', err);
    }
  };

  const handlePFFScan = async () => {
    setStep('scanning');
    setError(null);

    try {
      // Step 1: PFF Scan (Triple-Lock)
      const proof = await vitalizationService.performPFFScan();
      setPresenceProof(proof);

      if (!proof.success) {
        setStep('error');
        setError('Presence verification failed');
        return;
      }

      // Step 2: Mint VIDA CAP
      setStep('minting');
      const vidaCap = await vitalizationService.mintVidaCap(proof.pffId);
      setVidaCapResult(vidaCap);

      if (!vidaCap.success) {
        setStep('error');
        setError('VIDA CAP minting failed');
        return;
      }

      // Step 3: Update balance
      const updatedBalance = await vitalizationService.getVidaBalance(proof.pffId);
      setVidaBalance(updatedBalance);

      // Step 4: Update $VIDA balance from mockData and dispatch event
      const { getCitizenVaultData, updateCitizenVaultBalance } = await import('@/lib/mockDataService');
      const citizenVault = getCitizenVaultData();
      
      // Calculate new balance (add minted amount to existing)
      const newVidaBalance = citizenVault.spendable_balance_vida + vidaCap.vidaCap.citizenShare;
      
      // Update mock data
      updateCitizenVaultBalance(newVidaBalance);
      
      // Dispatch custom event to update UserProfileBalance component
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('vidaBalanceUpdate', {
          detail: { balance: newVidaBalance },
        });
        window.dispatchEvent(event);
      }

      // Success
      setStep('success');
    } catch (err) {
      setStep('error');
      setError(err instanceof Error ? err.message : 'Vitalization failed');
    }
  };

  const handleReset = () => {
    setStep('idle');
    setPresenceProof(null);
    setVidaCapResult(null);
    setError(null);
  };

  // Hard Identity Reset: greeting banner + camera wakes up immediately with AI Mesh
  if (isResetFlow) {
    return (
      <>
        <div
          className="fixed top-0 left-0 right-0 z-[310] px-4 py-3 text-center text-sm font-medium text-[#e8c547] bg-[#0d0d0f]/95 border-b border-[#D4AF37]/30"
          role="status"
        >
          Identity Reset Successful. Please perform a fresh Face Pulse to anchor your 1 VIDA.
        </div>
        <ArchitectVisionCapture
          isOpen={true}
          verificationSuccess={null}
          onClose={() => router.push('/')}
          closeLabel="Continue to re-register"
          isMasterArchitectInit={isFirstRun}
        />
      </>
    );
  }

  // Zero-click camera: new registration — show Architect Vision full-screen on mount (no Start Camera button)
  if (showVision) {
    return (
      <ArchitectVisionCapture
        isOpen={true}
        verificationSuccess={null}
        onClose={() => setShowVision(false)}
        closeLabel="Cancel"
        isMasterArchitectInit={isFirstRun}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0f] text-[#f5f5f5]">
      <BiometricScanningHUD 
        active={step === 'scanning' || step === 'minting'} 
        message={step === 'minting' ? 'minting' : 'scanning'}
      />

      {/* Header */}
      <header className="px-6 pt-12 pb-8 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-[#e8c547] mb-2">
          Vitalization
        </h1>
        <p className="text-[#6b6b70] text-sm">
          Prove your presence. Mint your VIDA CAP.
        </p>
        {handoffPhone && (
          <p className="text-xs font-mono mt-2 px-3 py-2 rounded-lg bg-[#16161a] border border-[#2a2a2e] text-[#a0a0a5] inline-block">
            Identity anchor: {handoffPhone}
          </p>
        )}
      </header>

      {/* Main Content */}
      <main className="px-6 pb-12 max-w-md mx-auto">
        {/* Status Card */}
        <div className="bg-[#16161a] rounded-xl p-6 mb-6 border border-[#2a2a2e]">
          <div className="space-y-4">
            {/* PFF Scan Status */}
            <div className="flex items-center justify-between">
              <span className="text-[#6b6b70] text-sm">PFF Triple-Lock</span>
              <div className="flex items-center gap-2">
                {step === 'idle' && (
                  <span className="text-[#6b6b70] text-xs">Pending</span>
                )}
                {(step === 'scanning' || step === 'minting') && (
                  <span className="text-[#e8c547] text-xs animate-pulse">Verifying...</span>
                )}
                {step === 'success' && presenceProof && (
                  <span className="text-green-400 text-xs">✓ Verified</span>
                )}
                {step === 'error' && (
                  <span className="text-red-400 text-xs">✗ Failed</span>
                )}
              </div>
            </div>

            {/* VIDA CAP Minting Status */}
            {step !== 'idle' && (
              <div className="flex items-center justify-between pt-2 border-t border-[#2a2a2e]">
                <span className="text-[#6b6b70] text-sm">VIDA CAP Minting</span>
                <div className="flex items-center gap-2">
                  {step === 'minting' && (
                    <span className="text-[#e8c547] text-xs animate-pulse">Minting...</span>
                  )}
                  {step === 'success' && vidaCapResult && (
                    <span className="text-green-400 text-xs">✓ Minted</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* PFF Scan Button */}
        {step === 'idle' && (
          <button
            onClick={handlePFFScan}
            className="w-full rounded-xl bg-[#c9a227] px-6 py-4 text-base font-bold text-[#0d0d0f] hover:bg-[#e8c547] active:scale-[0.98] transition-all shadow-lg shadow-[#c9a227]/20"
          >
            Start PFF Scan
          </button>
        )}

        {/* Success State - 50/50 Split Display */}
        {step === 'success' && vidaCapResult && (
          <div className="space-y-6">
            {/* Success Message */}
            <div className="bg-gradient-to-br from-[#c9a227]/20 to-[#e8c547]/10 rounded-xl p-6 border border-[#c9a227]/30">
              <div className="text-center">
                <div className="text-4xl mb-2">✓</div>
                <h2 className="text-xl font-bold text-[#e8c547] mb-2">
                  Vitalization Complete
                </h2>
                <p className="text-[#6b6b70] text-sm">
                  Your VIDA CAP has been minted with a 50/50 split
                </p>
              </div>
            </div>

            {/* 50/50 Split Breakdown */}
            <div className="bg-[#16161a] rounded-xl p-6 border border-[#2a2a2e]">
              <h3 className="text-sm font-semibold text-[#e8c547] mb-4">
                50/50 Minting Split
              </h3>
              <div className="space-y-4">
                {/* Citizen Vault */}
                <div className="flex items-center justify-between p-4 bg-[#0d0d0f] rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-[#f5f5f5]">Citizen Vault</p>
                    <p className="text-xs text-[#6b6b70] mt-1">Your 50% share</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-[#e8c547]">
                      {vidaCapResult.vidaCap.citizenShare.toFixed(2)}
                    </p>
                    <p className="text-xs text-[#6b6b70]">VIDA CAP</p>
                  </div>
                </div>

                {/* National Reserve */}
                <div className="flex items-center justify-between p-4 bg-[#0d0d0f] rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-[#f5f5f5]">National Reserve</p>
                    <p className="text-xs text-[#6b6b70] mt-1">State's 50% share</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-[#e8c547]">
                      {vidaCapResult.vidaCap.nationalReserveShare.toFixed(2)}
                    </p>
                    <p className="text-xs text-[#6b6b70]">VIDA CAP</p>
                  </div>
                </div>

                {/* Total */}
                <div className="flex items-center justify-between pt-3 border-t border-[#2a2a2e]">
                  <p className="text-sm font-semibold text-[#f5f5f5]">Total Minted</p>
                  <p className="text-lg font-bold text-[#e8c547]">
                    {vidaCapResult.vidaCap.totalMinted.toFixed(2)} VIDA CAP
                  </p>
                </div>
              </div>
            </div>

            {/* Updated $VIDA Balance */}
            {vidaBalance && (
              <div className="bg-[#16161a] rounded-xl p-6 border border-[#2a2a2e]">
                <h3 className="text-sm font-semibold text-[#e8c547] mb-4">
                  Your Balance
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#6b6b70]">VIDA CAP</span>
                    <span className="text-base font-bold text-[#f5f5f5]">
                      {vidaBalance.citizenVault.vidaCapBalance.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gradient-to-br from-[#c9a227]/20 to-[#e8c547]/10 rounded-lg border border-[#c9a227]/30">
                    <span className="text-sm text-[#6b6b70]">$VIDA</span>
                    <span className="text-xl font-bold text-[#e8c547] animate-pulse">
                      {(() => {
                        // Get updated balance from mockData
                        const { getCitizenVaultData } = require('@/lib/mockDataService');
                        const citizenVault = getCitizenVaultData();
                        const newBalance = citizenVault.spendable_balance_vida + vidaCapResult.vidaCap.citizenShare;
                        return newBalance.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        });
                      })()}
                    </span>
                  </div>
                  <div className="pt-3 border-t border-[#2a2a2e]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#6b6b70]">National Reserve</span>
                      <span className="text-xs text-[#6b6b70]">
                        {vidaBalance.nationalReserve.totalVidaCap.toFixed(2)} VIDA CAP
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Transaction Hash */}
            {vidaCapResult.vidaCap.transactionHash && (
              <div className="bg-[#0d0d0f] rounded-lg p-4 border border-[#2a2a2e]">
                <p className="text-xs text-[#6b6b70] mb-1">Transaction Hash</p>
                <p className="text-xs font-mono text-[#6b6b70] break-all">
                  {vidaCapResult.vidaCap.transactionHash}
                </p>
              </div>
            )}

            {/* Go to Dashboard — primary action after success (no page-not-found) */}
            <Link
              href="/dashboard/"
              className="block w-full rounded-xl bg-[#c9a227] px-6 py-4 text-center text-base font-bold text-[#0d0d0f] hover:bg-[#e8c547] active:scale-[0.98] transition-all shadow-lg"
            >
              Go to Dashboard
            </Link>
            {/* Reset Button */}
            <button
              onClick={handleReset}
              className="w-full rounded-xl bg-[#2a2a2e] px-6 py-3 text-sm font-medium text-[#f5f5f5] hover:bg-[#3a3a3e] transition-colors mt-3"
            >
              Start New Vitalization
            </button>
          </div>
        )}

        {/* Error State */}
        {step === 'error' && error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
            <p className="text-red-400 text-sm text-center mb-4">{error}</p>
            <button
              onClick={handleReset}
              className="w-full rounded-xl bg-[#2a2a2e] px-6 py-3 text-sm font-medium text-[#f5f5f5] hover:bg-[#3a3a3e] transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Info Footer */}
        <div className="mt-8 text-center space-y-2">
          <p className="text-xs text-[#6b6b70]">
            Optimized for Redmi 15 • 7,000mAh Battery
          </p>
          <p className="text-xs text-[#6b6b70]">
            Mock Service Active • Localized Testing
          </p>
          <Link 
            href="/manifesto" 
            className="text-xs text-[#c9a227] hover:text-[#e8c547] underline inline-block mt-4"
          >
            ← Back to Manifesto
          </Link>
        </div>
      </main>
    </div>
  );
}

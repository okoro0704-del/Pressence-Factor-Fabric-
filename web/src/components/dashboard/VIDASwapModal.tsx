'use client';

import { useState, useEffect, useRef } from 'react';
import { executeSovereignSwap, calculateDLLROutput } from '@/lib/sovryn/sovereignSwap';
import { useSovereignSeed } from '@/contexts/SovereignSeedContext';
import { VIDA_USD_VALUE } from '@/lib/economic';
import { getAssertion, isUserVerifyingPlatformAuthenticatorAvailable } from '@/lib/webauthn';
import { IdentityReLinkModal } from './IdentityReLinkModal';

interface VIDASwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  maxAmount: number; // 20% spendable balance
  citizenId?: string;
  /** When set, swap uses getSovereignSigner (internal) — no external wallet. */
  phoneNumber?: string;
  onSwapSuccess?: () => void;
  /** After Identity Re-Link return: pre-fill amount and auto-trigger swap. */
  initialAmount?: string;
  autoSwap?: boolean;
}

export function VIDASwapModal({
  isOpen,
  onClose,
  maxAmount,
  citizenId,
  phoneNumber,
  onSwapSuccess,
  initialAmount = '',
  autoSwap = false,
}: VIDASwapModalProps) {
  const sovereignSeed = useSovereignSeed();
  const [vidaAmount, setVidaAmount] = useState('');
  const [swapping, setSwapping] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [showRelinkModal, setShowRelinkModal] = useState(false);
  const autoSwapDoneRef = useRef(false);

  const NAIRA_RATE = 1400;

  // After return from Face Pulse: pre-fill amount and auto-trigger swap
  useEffect(() => {
    if (!isOpen || !initialAmount || !autoSwap) return;
    if (autoSwapDoneRef.current) return;
    setVidaAmount(initialAmount);
    autoSwapDoneRef.current = true;
    const amt = parseFloat(initialAmount);
    if (amt <= 0 || amt > maxAmount) return;
    const t = setTimeout(() => {
      setSwapping(true);
      setError('');
      executeSovereignSwap({
        vidaCapAmount: amt,
        citizenId,
        phoneNumber,
        refreshUserSession: sovereignSeed?.refreshUserSession,
        encryptedSeed: sovereignSeed?.encryptedSeed ?? undefined,
      }).then((result) => {
        if (result.success) {
          setSuccess(true);
          setTxHash(result.txHash || '');
          onSwapSuccess?.();
          setTimeout(() => { onClose(); setSuccess(false); setTxHash(''); setVidaAmount(''); }, 3000);
        } else if (result.missingSeed) {
          setShowRelinkModal(true);
        } else {
          setError(result.error || 'Swap failed');
        }
      }).catch((err) => {
        setError(err instanceof Error ? err.message : 'Swap failed');
      }).finally(() => setSwapping(false));
    }, 600);
    return () => clearTimeout(t);
  }, [isOpen, initialAmount, autoSwap, maxAmount, citizenId, phoneNumber, sovereignSeed?.refreshUserSession, sovereignSeed?.encryptedSeed, onSwapSuccess, onClose]);

  if (!isOpen) return null;

  const vidaNum = parseFloat(vidaAmount) || 0;
  const dllrOutput = calculateDLLROutput(vidaNum);
  const usdValue = vidaNum * VIDA_USD_VALUE;
  const nairaValue = usdValue * NAIRA_RATE;

  const handleSwap = async () => {
    setError('');
    setSwapping(true);

    try {
      // Validate amount
      if (vidaNum <= 0) {
        setError('Please enter a valid amount');
        setSwapping(false);
        return;
      }

      if (vidaNum > maxAmount) {
        setError(`Insufficient spendable balance. Max: ${maxAmount.toFixed(4)} VIDA CAP`);
        setSwapping(false);
        return;
      }

      // Transaction Shield: require native biometric before Convert/Swap
      const hasNative = await isUserVerifyingPlatformAuthenticatorAvailable();
      if (hasNative) {
        try {
          const assertion = await getAssertion();
          if (!assertion?.credential) {
            setError('Verification cancelled or failed. Complete Face ID or Fingerprint to convert.');
            setSwapping(false);
            return;
          }
        } catch {
          setError('Verification required. Complete Face ID or Fingerprint to convert VIDA.');
          setSwapping(false);
          return;
        }
      }

      // Execute swap (internal signer when phoneNumber set — no window.ethereum)
      const result = await executeSovereignSwap({
        vidaCapAmount: vidaNum,
        citizenId,
        phoneNumber,
        refreshUserSession: sovereignSeed?.refreshUserSession,
        encryptedSeed: sovereignSeed?.encryptedSeed ?? undefined,
      });

      if (!result.success) {
        if (result.missingSeed) {
          setShowRelinkModal(true);
        } else {
          setError(result.error || 'Swap failed');
        }
        setSwapping(false);
        return;
      }

      // Success
      setSuccess(true);
      setTxHash(result.txHash || '');

      // Call success callback
      if (onSwapSuccess) {
        onSwapSuccess();
      }

      // Auto-close after 3 seconds
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setVidaAmount('');
        setTxHash('');
      }, 3000);
    } catch (err) {
      console.error('[VIDASwapModal] Swap error:', err);
      setError(err instanceof Error ? err.message : 'Swap failed');
    } finally {
      setSwapping(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-[#050505] to-[#0B0B0B] rounded-2xl border border-[#D4AF37]/30 shadow-[0_0_60px_rgba(212,175,55,0.2)] max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[#D4AF37] uppercase tracking-wider">
            Sovereign Swap
          </h2>
          <button
            onClick={onClose}
            className="text-[#6b6b70] hover:text-[#D4AF37] transition-colors"
          >
            ✕
          </button>
        </div>

        {success ? (
          // Success State
          <div className="text-center py-8">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-2xl font-bold text-[#D4AF37] mb-2">Swap Successful!</h3>
            <p className="text-sm text-[#6b6b70] mb-4">
              {vidaNum.toFixed(4)} VIDA CAP → {dllrOutput.toLocaleString('en-US', { minimumFractionDigits: 2 })} DLLR
            </p>
            {txHash && (
              <div className="bg-[#16161a]/50 rounded-lg p-3 border border-[#D4AF37]/20">
                <p className="text-xs text-[#6b6b70] mb-1">Transaction Hash:</p>
                <p className="text-xs text-[#D4AF37] font-mono break-all">{txHash}</p>
              </div>
            )}
            <p className="text-xs text-[#6b6b70] mt-4">Closing in 3 seconds...</p>
          </div>
        ) : (
          // Swap Form
          <>
            {/* Amount Input */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-[#D4AF37] mb-2 uppercase tracking-wider">
                VIDA CAP Amount
              </label>
              <input
                type="number"
                value={vidaAmount}
                onChange={(e) => setVidaAmount(e.target.value)}
                placeholder="0.0000"
                step="0.0001"
                min="0"
                max={maxAmount}
                className="w-full bg-[#16161a]/50 border border-[#D4AF37]/30 rounded-lg px-4 py-3 text-[#D4AF37] font-mono text-lg focus:outline-none focus:border-[#D4AF37] transition-colors"
                disabled={swapping}
              />
              <p className="text-xs text-[#6b6b70] mt-2">
                Available: {maxAmount.toFixed(4)} VIDA CAP (20% Spendable)
              </p>
            </div>

            {/* Conversion Preview */}
            {vidaNum > 0 && (
              <div className="mb-6 bg-gradient-to-br from-[#16161a] to-[#1a1a1e] rounded-xl p-4 border border-[#D4AF37]/20">
                <div className="flex items-center justify-center mb-3">
                  <div className="text-center">
                    <p className="text-xs text-[#6b6b70] mb-1">You Swap</p>
                    <p className="text-lg font-bold text-[#D4AF37]">
                      {vidaNum.toFixed(4)} VIDA CAP
                    </p>
                  </div>
                  <div className="mx-4 text-2xl text-[#D4AF37]">→</div>
                  <div className="text-center">
                    <p className="text-xs text-[#6b6b70] mb-1">You Receive</p>
                    <p className="text-lg font-bold text-[#FFD700]">
                      {dllrOutput.toLocaleString('en-US', { minimumFractionDigits: 2 })} DLLR
                    </p>
                  </div>
                </div>

                <div className="border-t border-[#2a2a2e] pt-3 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#6b6b70]">Exchange Rate:</span>
                    <span className="text-[#D4AF37] font-mono">1 VIDA CAP = 1,000 DLLR</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#6b6b70]">USD Value:</span>
                    <span className="text-[#D4AF37] font-mono">
                      ${usdValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#6b6b70]">Naira Value:</span>
                    <span className="text-[#D4AF37] font-mono">
                      ₦{nairaValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Transaction Flow */}
            <div className="mb-6 bg-[#16161a]/30 rounded-lg p-4 border border-[#D4AF37]/10">
              <p className="text-xs text-[#6b6b70] mb-3 uppercase tracking-wider font-bold">
                Transaction Flow:
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-[#D4AF37]">1.</span>
                  <span className="text-[#6b6b70]">Deduct from National Block (Supabase)</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-[#D4AF37]">2.</span>
                  <span className="text-[#6b6b70]">Credit to Global Block (Rootstock)</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-[#D4AF37]">3.</span>
                  <span className="text-[#6b6b70]">Log to Sovereign Ledger (VLT)</span>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={swapping}
                className="flex-1 bg-[#16161a] hover:bg-[#1a1a1e] text-[#6b6b70] font-bold py-3 px-4 rounded-lg border border-[#2a2a2e] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleSwap}
                disabled={swapping || vidaNum <= 0 || vidaNum > maxAmount}
                className="flex-1 bg-gradient-to-br from-[#D4AF37] to-[#C9A227] hover:from-[#FFD700] hover:to-[#D4AF37] text-[#050505] font-bold py-3 px-4 rounded-lg shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
              >
                {swapping ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⚡</span>
                    Swapping...
                  </span>
                ) : (
                  '⚡ Execute Swap'
                )}
              </button>
            </div>

            {/* Security Notice */}
            <div className="mt-4 text-center">
              <p className="text-xs text-[#6b6b70]">
                🔒 Secured by 4-Layer Presence Verification
              </p>
            </div>
          </>
        )}
      </div>

      {/* Identity Re-Link: modal when recovery seed missing — Perform Face Pulse → redirect then auto-resume swap */}
      <IdentityReLinkModal
        isOpen={showRelinkModal}
        onClose={() => setShowRelinkModal(false)}
        pendingAmount={vidaAmount}
      />
    </div>
  );
}


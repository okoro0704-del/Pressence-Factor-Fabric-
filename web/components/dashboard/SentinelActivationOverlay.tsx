'use client';

import { useState, useEffect } from 'react';
import { JetBrains_Mono } from 'next/font/google';
import {
  getSentinelVaultUrl,
  getSentinelTokenVerified,
  setSentinelTokenVerified,
  verifySecurityToken,
} from '@/lib/sentinelSecurityToken';
import { hasActiveSentinelLicense } from '@/lib/sentinelLicensing';
import { getIdentityAnchorPhone } from '@/lib/sentinelActivation';

const jetbrains = JetBrains_Mono({ weight: ['400', '600', '700'], subsets: ['latin'] });

const GOLD = '#D4AF37';
const BORDER = 'rgba(212, 175, 55, 0.3)';

interface SentinelActivationOverlayProps {
  /** When true, overlay is shown (wallet area blurred and blocked). */
  show: boolean;
  /** Optional custom title. */
  title?: string;
  /** Optional custom subtitle. */
  subtitle?: string;
  /** Callback when user becomes verified (e.g. after entering token). */
  onVerified?: () => void;
}

/**
 * High-security overlay when user is not Sentinel Verified.
 * Shows "Sentinel Activation Required" and "Go to Sentinel Vault" (external URL).
 * When user has license but no token, also shows "Enter Security Token" to unlock funds.
 */
export function SentinelActivationOverlay({
  show,
  title = 'Sentinel Activation Required',
  subtitle = 'Activate your Sentinel at the Sentinel Vault to unlock wallet access.',
  onVerified,
}: SentinelActivationOverlayProps) {
  const [hasLicense, setHasLicense] = useState(false);
  const [tokenVerified, setTokenVerified] = useState(false);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [tokenInput, setTokenInput] = useState('');
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    const phone = getIdentityAnchorPhone();
    setOwnerId(phone);
    setTokenVerified(getSentinelTokenVerified());
    if (phone) hasActiveSentinelLicense(phone).then(setHasLicense);
  }, [show]);

  const handleVerifyToken = async () => {
    if (!tokenInput.trim()) return;
    setTokenError(null);
    setVerifying(true);
    const result = await verifySecurityToken(tokenInput.trim());
    setVerifying(false);
    if (result.ok) {
      setSentinelTokenVerified();
      setTokenVerified(true);
      setTokenInput('');
      onVerified?.();
    } else {
      setTokenError(result.error ?? 'Invalid token');
    }
  };

  if (!show) return null;

  const vaultUrl = getSentinelVaultUrl();

  return (
    <div
      className="absolute inset-0 z-30 flex flex-col items-center justify-center rounded-xl bg-[#0d0d0f]/95 backdrop-blur-md border-2 p-6 pointer-events-auto"
      style={{ borderColor: BORDER, boxShadow: '0 0 60px rgba(212, 175, 55, 0.15)' }}
    >
      <div
        className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl animate-pulse"
        style={{ background: 'rgba(212, 175, 55, 0.15)', border: `2px solid ${BORDER}` }}
      >
        ◐
      </div>
      <h3
        className={`text-lg font-bold uppercase tracking-wider text-center mb-2 ${jetbrains.className}`}
        style={{ color: GOLD }}
      >
        {title}
      </h3>
      <p className="text-sm text-[#a0a0a5] text-center mb-6 max-w-sm">
        {subtitle}
      </p>

      {hasLicense && !tokenVerified && (
        <div className="w-full max-w-xs mb-6">
          <p className="text-xs text-[#e8c547] uppercase tracking-wider mb-2 text-center">
            Enter your Sentinel Security Token to unlock funds
          </p>
          <input
            type="text"
            value={tokenInput}
            onChange={(e) => {
              setTokenInput(e.target.value);
              setTokenError(null);
            }}
            placeholder="SST_..."
            className={`w-full px-4 py-3 rounded-lg bg-black/50 border font-mono text-sm mb-2 ${jetbrains.className}`}
            style={{ borderColor: BORDER, color: GOLD }}
          />
          {tokenError && (
            <p className="text-xs text-red-400 mb-2 text-center">{tokenError}</p>
          )}
          <button
            onClick={handleVerifyToken}
            disabled={verifying || !tokenInput.trim()}
            className="w-full py-2 rounded-lg font-bold text-sm uppercase tracking-wider disabled:opacity-50"
            style={{ background: GOLD, color: '#000' }}
          >
            {verifying ? 'Verifying...' : 'Unlock with Token'}
          </button>
        </div>
      )}

      <a
        href={vaultUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center px-6 py-3 rounded-lg font-bold text-sm uppercase tracking-wider transition-all hover:opacity-90"
        style={{
          background: 'rgba(212, 175, 55, 0.2)',
          border: `2px solid ${BORDER}`,
          color: GOLD,
        }}
      >
        Go to Sentinel Vault
      </a>
      <p className="text-[10px] text-[#6b6b70] mt-4 text-center">
        You will be redirected to the Sentinel Business portal to activate or purchase a license.
      </p>
    </div>
  );
}

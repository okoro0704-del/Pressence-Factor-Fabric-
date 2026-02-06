'use client';

import { useState, useEffect } from 'react';
import { JetBrains_Mono } from 'next/font/google';
import Link from 'next/link';
import {
  SENTINEL_TIERS,
  processSentinelPayment,
  type SentinelTierType,
} from '@/lib/sentinelLicensing';
import { createSecurityToken } from '@/lib/sentinelSecurityToken';
import { getIdentityAnchorPhone } from '@/lib/sentinelActivation';

const jetbrains = JetBrains_Mono({ weight: ['400', '600', '700'], subsets: ['latin'] });

const GOLD = '#D4AF37';
const SLATE_BG = '#020617';
const BORDER = 'rgba(212, 175, 55, 0.25)';

const TIER_ORDER: SentinelTierType[] = ['TIER_20', 'TIER_50', 'TIER_400', 'TIER_1000'];

/**
 * Sentinel Store — four pricing tiers: $20, $50, $400, $1000.
 * Mandatory for Wallet and Partner API access.
 */
export default function SentinelPurchasePage() {
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState<SentinelTierType | null>(null);
  const [success, setSuccess] = useState<{ tier: SentinelTierType; pffApiKey?: string; securityToken?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setOwnerId(getIdentityAnchorPhone());
  }, []);

  const handlePurchase = async (tierType: SentinelTierType) => {
    const owner = ownerId ?? getIdentityAnchorPhone();
    if (!owner) {
      setError('Sign in first (complete 4-layer gate) to purchase a Sentinel license.');
      return;
    }
    setError(null);
    setPurchasing(tierType);
    const tier = SENTINEL_TIERS[tierType];
    const result = await processSentinelPayment(
      owner,
      tierType,
      tier.priceUsd,
      undefined,
      `Sentinel ${tier.label}`
    );
    if (!result.ok) {
      setPurchasing(null);
      setError(result.error ?? 'Purchase failed');
      return;
    }
    const tokenResult = await createSecurityToken(owner);
    setPurchasing(null);
    setSuccess({
      tier: tierType,
      pffApiKey: result.pffApiKey,
      securityToken: tokenResult.ok ? tokenResult.token : undefined,
    });
  };

  if (success) {
    const tier = SENTINEL_TIERS[success.tier];
    return (
      <main
        className="min-h-screen py-12 px-4"
        style={{ background: SLATE_BG, color: GOLD }}
      >
        <div className="max-w-lg mx-auto text-center">
          <div className="rounded-2xl border p-8 mb-6" style={{ borderColor: BORDER, background: 'rgba(0,0,0,0.4)' }}>
            <h1 className="text-2xl font-bold mb-4" style={{ color: GOLD }}>License Activated</h1>
            <p className="text-neutral-300 mb-4">
              {tier.label} — ${tier.priceUsd} — up to {tier.maxDevices} device(s).
            </p>
            {success.securityToken && (
              <div className="mb-4 p-4 rounded-lg bg-black/40 border" style={{ borderColor: BORDER }}>
                <p className="text-xs text-[#e8c547] uppercase mb-2">Sentinel Security Token — enter in Main PFF App to unlock funds</p>
                <p className={`font-mono text-sm break-all ${jetbrains.className} select-all`} style={{ color: GOLD }}>{success.securityToken}</p>
                <button type="button" onClick={() => navigator.clipboard?.writeText(success.securityToken!)} className="mt-2 text-xs font-semibold uppercase" style={{ color: GOLD }}>Copy Token</button>
                <div className="mt-3 inline-block p-2 rounded-lg bg-white">
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(success.securityToken)}`} alt="QR" width={140} height={140} />
                </div>
              </div>
            )}
            {success.pffApiKey && (
              <div className="mb-4 p-4 rounded-lg bg-black/40 border" style={{ borderColor: BORDER }}>
                <p className="text-xs text-neutral-400 uppercase mb-2">PFF API Key (Business Integration)</p>
                <p className={`font-mono text-sm break-all ${jetbrains.className}`} style={{ color: GOLD }}>
                  {success.pffApiKey}
                </p>
                <p className="text-xs text-neutral-500 mt-2">Store this key securely. It unlocks Partner API access.</p>
              </div>
            )}
            <Link
              href="/dashboard"
              className="inline-block px-6 py-3 rounded-lg font-bold transition-all"
              style={{ background: GOLD, color: '#000' }}
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen py-12 px-4"
      style={{ background: SLATE_BG, color: GOLD }}
    >
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-2" style={{ color: GOLD }}>
            Sentinel Store
          </h1>
          <p className="text-neutral-400">
            A Sentinel license is required to access your Wallet or the Partner API. Choose a tier below.
          </p>
          <Link href="/sentinel" className="text-sm mt-4 inline-block" style={{ color: GOLD }}>
            ← Back to Sentinel
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {TIER_ORDER.map((tierType) => {
            const tier = SENTINEL_TIERS[tierType];
            const isBusiness = tier.businessApi;
            return (
              <div
                key={tierType}
                className="rounded-2xl border p-6 flex flex-col"
                style={{
                  borderColor: isBusiness ? 'rgba(212, 175, 55, 0.5)' : BORDER,
                  background: 'linear-gradient(180deg, rgba(15,23,42,0.9) 0%, rgba(2,6,23,0.95) 100%)',
                  boxShadow: isBusiness ? '0 0 30px rgba(212, 175, 55, 0.15)' : 'none',
                }}
              >
                <div className="mb-4">
                  {isBusiness && (
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400/90">
                      Business API
                    </span>
                  )}
                  <h2 className="text-xl font-bold mt-1" style={{ color: GOLD }}>
                    {tier.label}
                  </h2>
                  <p className={`text-3xl font-bold mt-2 ${jetbrains.className}`} style={{ color: GOLD }}>
                    ${tier.priceUsd}
                  </p>
                  <p className="text-sm text-neutral-400 mt-1">
                    up to {tier.maxDevices} device{tier.maxDevices > 1 ? 's' : ''}
                  </p>
                </div>
                <ul className="text-sm text-neutral-400 space-y-1 flex-1 mb-6">
                  <li>• Device identification</li>
                  <li>• License linked to Identity Anchor</li>
                  {isBusiness && <li>• PFF_API_KEY for Partner API</li>}
                </ul>
                <button
                  onClick={() => handlePurchase(tierType)}
                  disabled={!!purchasing || !ownerId}
                  className="w-full py-3 rounded-lg font-bold text-sm uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: purchasing === tierType ? '#4a4a4e' : GOLD,
                    color: purchasing === tierType ? '#fff' : '#000',
                  }}
                >
                  {purchasing === tierType ? 'Processing...' : `Purchase $${tier.priceUsd}`}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}

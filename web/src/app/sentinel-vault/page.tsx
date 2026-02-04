'use client';

import { useState, useEffect } from 'react';
import { JetBrains_Mono } from 'next/font/google';
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

const VAULT_TIERS: { type: SentinelTierType; label: string }[] = [
  { type: 'TIER_20', label: 'Core' },
  { type: 'TIER_50', label: 'Family' },
  { type: 'TIER_400', label: 'Small Biz' },
  { type: 'TIER_1000', label: 'Enterprise' },
];

const DOWNLOAD_LINKS = [
  { name: 'Windows', href: '#', icon: '🪟' },
  { name: 'Mac', href: '#', icon: '🍎' },
  { name: 'iOS', href: '#', icon: '📱' },
  { name: 'Android', href: '#', icon: '🤖' },
];

/**
 * Sentinel Vault Landing — External Sentinel Business portal.
 * Guardian animation, Store (Core/Family/Small Biz/Enterprise), Download Hub.
 * Cross-app handshake: license + security token (Supabase). User copies token into Main PFF App to unlock funds.
 */
export default function SentinelVaultPage() {
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [ownerInput, setOwnerInput] = useState('');
  const [purchasing, setPurchasing] = useState<SentinelTierType | null>(null);
  const [activated, setActivated] = useState<{ token: string; tier: SentinelTierType; pffApiKey?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setOwnerId(getIdentityAnchorPhone());
  }, []);

  const handlePurchase = async (tierType: SentinelTierType) => {
    const owner = ownerId ?? (ownerInput.trim() || getIdentityAnchorPhone());
    if (!owner) {
      setError('Enter your Identity Anchor (phone) above, or sign in on the Main PFF App first.');
      return;
    }
    setError(null);
    setPurchasing(tierType);
    const tier = SENTINEL_TIERS[tierType];
    const payResult = await processSentinelPayment(
      owner,
      tierType,
      tier.priceUsd,
      undefined,
      `Sentinel Vault ${tier.label}`
    );
    if (!payResult.ok) {
      setPurchasing(null);
      setError(payResult.error ?? 'Purchase failed');
      return;
    }
    const tokenResult = await createSecurityToken(owner);
    setPurchasing(null);
    if (tokenResult.ok) {
      setActivated({
        token: tokenResult.token,
        tier: tierType,
        pffApiKey: payResult.pffApiKey,
      });
    } else {
      setError(tokenResult.error ?? 'License created but token generation failed. Contact support.');
    }
  };

  const copyToken = () => {
    if (activated?.token && typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(activated.token);
    }
  };

  const qrUrl = activated?.token
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(activated.token)}`
    : null;

  return (
    <main
      className="min-h-screen py-12 px-4"
      style={{ background: SLATE_BG, color: GOLD }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Sentinel Guardian — high-tech scanning animation */}
        <section className="text-center mb-12">
          <div
            className="inline-flex items-center justify-center w-32 h-32 rounded-full border-4 mb-6 animate-pulse"
            style={{
              borderColor: BORDER,
              background: 'radial-gradient(circle, rgba(212,175,55,0.2) 0%, transparent 70%)',
              boxShadow: '0 0 60px rgba(212, 175, 55, 0.3)',
            }}
          >
            <span className="text-5xl">◐</span>
          </div>
          <h1 className={`text-3xl font-bold uppercase tracking-wider mb-2 ${jetbrains.className}`} style={{ color: GOLD }}>
            Sentinel Guardian
          </h1>
          <p className="text-neutral-400 text-sm">High-security Sentinel Business portal · Cross-app handshake via Supabase</p>
        </section>

        {/* Identity Anchor (for users not signed in via Main PFF) */}
        {!ownerId && (
          <section className="mb-8 rounded-xl border p-4" style={{ borderColor: BORDER, background: 'rgba(0,0,0,0.3)' }}>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: GOLD }}>
              Identity Anchor (E.164 phone)
            </label>
            <input
              type="tel"
              value={ownerInput}
              onChange={(e) => setOwnerInput(e.target.value)}
              placeholder="+234 801 234 5678"
              className={`w-full px-4 py-3 rounded-lg bg-black/50 border font-mono text-sm ${jetbrains.className}`}
              style={{ borderColor: BORDER, color: GOLD }}
            />
            <p className="text-xs text-neutral-500 mt-2">Required to link your license. Use the same phone as in the Main PFF App.</p>
          </section>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Activated: Security Token + QR */}
        {activated && (
          <section className="mb-10 rounded-2xl border-2 p-8 text-center" style={{ borderColor: GOLD, background: 'rgba(212,175,55,0.08)' }}>
            <h2 className="text-xl font-bold uppercase tracking-wider mb-4" style={{ color: GOLD }}>
              Sentinel Security Token
            </h2>
            <p className="text-sm text-neutral-400 mb-4">
              Copy this token or scan the QR code in the Main PFF App to unlock your funds.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-4">
              <div
                className={`px-6 py-4 rounded-xl font-mono text-lg break-all select-all ${jetbrains.className}`}
                style={{ background: 'rgba(0,0,0,0.5)', border: `2px solid ${BORDER}`, color: GOLD }}
              >
                {activated.token}
              </div>
              <button
                onClick={copyToken}
                className="px-6 py-3 rounded-lg font-bold uppercase tracking-wider transition-all hover:opacity-90"
                style={{ background: GOLD, color: '#000' }}
              >
                Copy Token
              </button>
            </div>
            {qrUrl && (
              <div className="inline-block p-4 rounded-xl bg-white">
                <img src={qrUrl} alt="QR code for Security Token" width={200} height={200} />
              </div>
            )}
            {activated.pffApiKey && (
              <div className="mt-6 p-4 rounded-lg bg-black/40 border text-left max-w-md mx-auto" style={{ borderColor: BORDER }}>
                <p className="text-xs text-neutral-400 uppercase mb-2">PFF API Key (Business)</p>
                <p className={`font-mono text-sm break-all ${jetbrains.className}`} style={{ color: GOLD }}>
                  {activated.pffApiKey}
                </p>
              </div>
            )}
          </section>
        )}

        {/* The Store — Core, Family, Small Biz, Enterprise */}
        <section className="mb-12">
          <h2 className="text-xl font-bold uppercase tracking-wider mb-6 text-center" style={{ color: GOLD }}>
            The Store
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {VAULT_TIERS.map(({ type, label }) => {
              const tier = SENTINEL_TIERS[type];
              const isBiz = tier.businessApi;
              return (
                <div
                  key={type}
                  className="rounded-xl border p-5 flex flex-col"
                  style={{
                    borderColor: isBiz ? GOLD : BORDER,
                    background: 'rgba(15,23,42,0.8)',
                    boxShadow: isBiz ? '0 0 20px rgba(212,175,55,0.2)' : 'none',
                  }}
                >
                  <h3 className="font-bold text-lg" style={{ color: GOLD }}>{label}</h3>
                  <p className={`text-2xl font-bold mt-1 ${jetbrains.className}`} style={{ color: GOLD }}>
                    ${tier.priceUsd}
                  </p>
                  <p className="text-xs text-neutral-400 mt-1">up to {tier.maxDevices} device(s)</p>
                  {isBiz && <p className="text-xs text-amber-400/90 mt-1">+ PFF API Key</p>}
                  <button
                    onClick={() => handlePurchase(type)}
                    disabled={!!purchasing}
                    className="mt-4 w-full py-2.5 rounded-lg font-bold text-sm uppercase tracking-wider disabled:opacity-50"
                    style={{ background: GOLD, color: '#000' }}
                  >
                    {purchasing === type ? 'Processing...' : `Purchase $${tier.priceUsd}`}
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* Download Hub */}
        <section>
          <h2 className="text-xl font-bold uppercase tracking-wider mb-6 text-center" style={{ color: GOLD }}>
            Download Hub
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {DOWNLOAD_LINKS.map(({ name, href, icon }) => (
              <a
                key={name}
                href={href}
                className="flex flex-col items-center justify-center rounded-xl border p-6 transition-all hover:opacity-90"
                style={{ borderColor: BORDER, background: 'rgba(0,0,0,0.3)' }}
              >
                <span className="text-4xl mb-2">{icon}</span>
                <span className="font-semibold" style={{ color: GOLD }}>{name}</span>
                <span className="text-xs text-neutral-500 mt-1">Sentinel installer</span>
              </a>
            ))}
          </div>
          <p className="text-xs text-neutral-500 text-center mt-4">
            Direct links to Windows, Mac, iOS, and Android Sentinel installers. (Placeholder links — replace with real installer URLs.)
          </p>
        </section>
      </div>
    </main>
  );
}

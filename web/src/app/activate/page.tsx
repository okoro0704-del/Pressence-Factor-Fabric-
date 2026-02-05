'use client';

import { useState, useEffect, useCallback } from 'react';
import { JetBrains_Mono } from 'next/font/google';
import {
  SENTINEL_TIERS,
  processSentinelPayment,
  type SentinelTierType,
} from '@/lib/sentinelLicensing';
import { createSecurityToken } from '@/lib/sentinelSecurityToken';
import { getSentinelWebhookUrl, getMainPffAppUrl } from '@/lib/sentinelConstants';

const jetbrains = JetBrains_Mono({ weight: ['400', '600', '700'], subsets: ['latin'] });

/** Deep slate / gold Sovereign aesthetic — matches Main PFF Protocol and pffsentinel.com */
const SOVEREIGN = {
  slateBg: '#0d0d0f',
  slateCard: '#16161a',
  slateBorder: '#2a2a2e',
  gold: '#D4AF37',
  goldDim: 'rgba(212, 175, 55, 0.7)',
  goldBorder: 'rgba(212, 175, 55, 0.3)',
  textMuted: '#6b6b70',
  textDim: '#a0a0a5',
} as const;

const TIER_ORDER: SentinelTierType[] = ['TIER_20', 'TIER_50', 'TIER_400', 'TIER_1000'];

const DOWNLOAD_LINKS = [
  { name: 'Windows', href: '#', icon: '🪟' },
  { name: 'Mac', href: '#', icon: '🍎' },
  { name: 'iOS', href: '#', icon: '📱' },
  { name: 'Android', href: '#', icon: '🤖' },
];

/**
 * Sentinel Download & Activate — pffsentinel.com/activate?uid=[USER_ID].
 * Once payment is confirmed via API, updates sentinel_licenses (Supabase) and triggers
 * Success webhook back to the Main PFF App so the dashboard unlocks instantly (Shared Vault).
 */
export default function ActivatePage() {
  const [uid, setUid] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState<SentinelTierType | null>(null);
  const [activated, setActivated] = useState<{
    token: string;
    tier: SentinelTierType;
    pffApiKey?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const readUid = useCallback(() => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    const raw = params.get('uid');
    return raw ? decodeURIComponent(raw) : null;
  }, []);

  useEffect(() => {
    setUid(readUid());
  }, [readUid]);

  const triggerSuccessWebhook = useCallback(async (ownerId: string, tier: SentinelTierType) => {
    const webhookUrl = getSentinelWebhookUrl();
    if (!webhookUrl) return;
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: ownerId, tier, success: true }),
      });
    } catch {
      // Non-fatal: Main app will still see license via Supabase when user returns
    }
  }, []);

  const handlePurchase = async (tierType: SentinelTierType) => {
    const owner = uid?.trim();
    if (!owner) {
      setError('Missing user. Open this page from the Main PFF App using the Secure Redirect link (with uid).');
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
      `Sentinel Activate ${tier.label}`
    );
    if (!payResult.ok) {
      setPurchasing(null);
      setError(payResult.error ?? 'Purchase failed');
      return;
    }
    const tokenResult = await createSecurityToken(owner);
    setPurchasing(null);
    if (!tokenResult.ok) {
      setError(tokenResult.error ?? 'License created but token generation failed.');
      return;
    }
    setActivated({
      token: tokenResult.token,
      tier: tierType,
      pffApiKey: payResult.pffApiKey,
    });
    await triggerSuccessWebhook(owner, tierType);
  };

  const copyToken = () => {
    if (activated?.token && typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(activated.token);
    }
  };

  const qrUrl = activated?.token
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(activated.token)}`
    : null;

  // Success state: token + QR + Return to Main App
  if (activated) {
    const tier = SENTINEL_TIERS[activated.tier];
    return (
      <main
        className="min-h-screen py-12 px-4"
        style={{ background: SOVEREIGN.slateBg, color: SOVEREIGN.gold }}
      >
        <div className="max-w-lg mx-auto text-center">
          <div
            className="rounded-2xl border-2 p-8 mb-6"
            style={{
              background: SOVEREIGN.slateCard,
              borderColor: SOVEREIGN.goldBorder,
              boxShadow: '0 0 60px rgba(212, 175, 55, 0.12)',
            }}
          >
            <div
              className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center text-4xl"
              style={{
                background: 'rgba(212, 175, 55, 0.1)',
                border: `2px solid ${SOVEREIGN.goldBorder}`,
              }}
            >
              ✓
            </div>
            <h1 className={`text-2xl font-bold uppercase tracking-wider mb-2 ${jetbrains.className}`} style={{ color: SOVEREIGN.gold }}>
              Sentinel Activated
            </h1>
            <p className="text-sm mb-6" style={{ color: SOVEREIGN.textDim }}>
              {tier.label} — ${tier.priceUsd} — up to {tier.maxDevices} device(s). Your Main PFF dashboard is now unlocked.
            </p>
            <div className="mb-4 p-4 rounded-xl text-left" style={{ background: 'rgba(0,0,0,0.4)', border: `1px solid ${SOVEREIGN.goldBorder}` }}>
              <p className="text-xs uppercase mb-2" style={{ color: SOVEREIGN.gold }}>Security Token — enter in Main PFF App to unlock funds</p>
              <p className={`font-mono text-sm break-all ${jetbrains.className} select-all`} style={{ color: SOVEREIGN.gold }}>{activated.token}</p>
              <button
                type="button"
                onClick={copyToken}
                className="mt-2 text-xs font-semibold uppercase"
                style={{ color: SOVEREIGN.gold }}
              >
                Copy Token
              </button>
              {qrUrl && (
                <div className="mt-3 inline-block p-2 rounded-lg bg-white">
                  <img src={qrUrl} alt="QR code for Security Token" width={200} height={200} />
                </div>
              )}
            </div>
            {activated.pffApiKey && (
              <div className="mb-4 p-4 rounded-lg text-left" style={{ background: 'rgba(0,0,0,0.4)', border: `1px solid ${SOVEREIGN.goldBorder}` }}>
                <p className="text-xs uppercase mb-2" style={{ color: SOVEREIGN.textMuted }}>PFF API Key (Business)</p>
                <p className={`font-mono text-sm break-all ${jetbrains.className}`} style={{ color: SOVEREIGN.gold }}>{activated.pffApiKey}</p>
              </div>
            )}
            <a
              href={getMainPffAppUrl() || (uid ? `/?uid=${encodeURIComponent(uid)}` : '/')}
              className="inline-flex items-center justify-center w-full py-4 rounded-xl font-bold text-sm uppercase tracking-wider transition-all hover:opacity-90"
              style={{
                background: SOVEREIGN.gold,
                color: SOVEREIGN.slateBg,
                boxShadow: '0 0 24px rgba(212, 175, 55, 0.35)',
              }}
            >
              Return to Main PFF App
            </a>
          </div>
        </div>
      </main>
    );
  }

  // Download & Activate landing
  return (
    <main
      className="min-h-screen py-12 px-4"
      style={{ background: SOVEREIGN.slateBg, color: SOVEREIGN.gold }}
    >
      <div className="max-w-4xl mx-auto">
        <section className="text-center mb-12">
          <div
            className="inline-flex items-center justify-center w-32 h-32 rounded-full border-4 mb-6 animate-pulse"
            style={{
              borderColor: SOVEREIGN.goldBorder,
              background: 'radial-gradient(circle, rgba(212,175,55,0.2) 0%, transparent 70%)',
              boxShadow: '0 0 60px rgba(212, 175, 55, 0.2)',
            }}
          >
            <span className="text-5xl">◐</span>
          </div>
          <h1 className={`text-3xl font-bold uppercase tracking-wider mb-2 ${jetbrains.className}`} style={{ color: SOVEREIGN.gold }}>
            Download & Activate
          </h1>
          <p className="text-sm mb-2" style={{ color: SOVEREIGN.textDim }}>
            PFF Sentinel — same Supabase Shared Vault. Activate here to unlock your Main PFF dashboard instantly.
          </p>
          {uid && (
            <p className="text-xs font-mono" style={{ color: SOVEREIGN.textMuted }}>
              Activating for: {uid}
            </p>
          )}
        </section>

        {!uid && (
          <div className="mb-6 p-4 rounded-xl border text-center" style={{ borderColor: 'rgba(239,68,68,0.5)', background: 'rgba(239,68,68,0.08)' }}>
            <p className="text-sm" style={{ color: '#fca5a5' }}>
              Open this page from the Main PFF App using the <strong>Secure Redirect</strong> button so we know which account to activate.
            </p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-lg border text-sm" style={{ borderColor: 'rgba(239,68,68,0.5)', background: 'rgba(239,68,68,0.08)', color: '#fca5a5' }}>
            {error}
          </div>
        )}

        <section className="mb-12">
          <h2 className="text-xl font-bold uppercase tracking-wider mb-6 text-center" style={{ color: SOVEREIGN.gold }}>
            Choose a tier
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {TIER_ORDER.map((tierType) => {
              const tier = SENTINEL_TIERS[tierType];
              const isBiz = tier.businessApi;
              return (
                <div
                  key={tierType}
                  className="rounded-xl border p-5 flex flex-col"
                  style={{
                    borderColor: isBiz ? SOVEREIGN.gold : SOVEREIGN.goldBorder,
                    background: SOVEREIGN.slateCard,
                    boxShadow: isBiz ? '0 0 20px rgba(212,175,55,0.15)' : 'none',
                  }}
                >
                  <h3 className="font-bold text-lg" style={{ color: SOVEREIGN.gold }}>{tier.label}</h3>
                  <p className={`text-2xl font-bold mt-1 ${jetbrains.className}`} style={{ color: SOVEREIGN.gold }}>
                    ${tier.priceUsd}
                  </p>
                  <p className="text-xs mt-1" style={{ color: SOVEREIGN.textMuted }}>up to {tier.maxDevices} device(s)</p>
                  {isBiz && <p className="text-xs mt-1" style={{ color: SOVEREIGN.goldDim }}>+ PFF API Key</p>}
                  <button
                    onClick={() => handlePurchase(tierType)}
                    disabled={!!purchasing || !uid}
                    className="mt-4 w-full py-2.5 rounded-lg font-bold text-sm uppercase tracking-wider disabled:opacity-50"
                    style={{ background: SOVEREIGN.gold, color: SOVEREIGN.slateBg }}
                  >
                    {purchasing === tierType ? 'Processing...' : `Activate $${tier.priceUsd}`}
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold uppercase tracking-wider mb-6 text-center" style={{ color: SOVEREIGN.gold }}>
            Download Sentinel
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {DOWNLOAD_LINKS.map(({ name, href, icon }) => (
              <a
                key={name}
                href={href}
                className="flex flex-col items-center justify-center rounded-xl border p-6 transition-all hover:opacity-90"
                style={{ borderColor: SOVEREIGN.goldBorder, background: 'rgba(0,0,0,0.3)' }}
              >
                <span className="text-4xl mb-2">{icon}</span>
                <span className="font-semibold" style={{ color: SOVEREIGN.gold }}>{name}</span>
                <span className="text-xs mt-1" style={{ color: SOVEREIGN.textMuted }}>Installer</span>
              </a>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

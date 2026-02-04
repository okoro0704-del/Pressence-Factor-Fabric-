'use client';

import { useState, useEffect } from 'react';
import { JetBrains_Mono } from 'next/font/google';
import Link from 'next/link';
import { PFFSentinel } from '@/components/partners/PFFSentinel';
import { getIdentityAnchorPhone, activateSentinelHandshake, isSentinelActive } from '@/lib/sentinelActivation';

const jetbrains = JetBrains_Mono({ weight: ['400', '600', '700'], subsets: ['latin'] });

const GOLD = '#D4AF37';
const GOLD_DIM = 'rgba(212, 175, 55, 0.7)';
const SLATE_BG = '#020617';
const SLATE = '#0f172a';
const BORDER = 'rgba(212, 175, 55, 0.25)';

/**
 * Sentinel Download Page — Mandatory Sentinel Activation Protocol.
 * PFF Sentinel guardian visual + Download PFF Sentinel + Activate Local Encryption Key (Handshake).
 */
export default function SentinelPage() {
  const [phone, setPhone] = useState<string | null>(null);
  const [active, setActive] = useState(false);
  const [activating, setActivating] = useState(false);
  const [activated, setActivated] = useState(false);
  const [sentinelId, setSentinelId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const p = getIdentityAnchorPhone();
    setPhone(p);
    if (p) isSentinelActive(p).then(setActive);
  }, []);

  const handleActivateLocalKey = async () => {
    if (!phone) {
      setError('Complete 4-layer gate first to set your Identity Anchor.');
      return;
    }
    setError(null);
    setActivating(true);
    const result = await activateSentinelHandshake(phone);
    setActivating(false);
    if (result.ok) {
      setSentinelId(result.sentinelId);
      setActive(true);
      setActivated(true);
    } else {
      setError(result.error ?? 'Activation failed');
    }
  };

  return (
    <main
      className="min-h-screen py-8 px-4"
      style={{ background: SLATE_BG, color: GOLD_DIM }}
    >
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <PFFSentinel />
        </div>

        {/* PFF Sentinel guardian visual */}
        <div
          className="rounded-2xl border p-8 mb-8 text-center"
          style={{
            background: `linear-gradient(180deg, ${SLATE} 0%, #1e293b 100%)`,
            borderColor: BORDER,
            boxShadow: '0 0 40px rgba(212, 175, 55, 0.1)',
          }}
        >
          <div
            className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center text-5xl animate-pulse"
            style={{
              background: 'rgba(212, 175, 55, 0.15)',
              border: `2px solid ${BORDER}`,
            }}
          >
            ◐
          </div>
          <h1 className={`text-2xl font-bold mb-2 ${jetbrains.className}`} style={{ color: GOLD }}>
            PFF Sentinel Guardian
          </h1>
          <p className={`text-sm ${jetbrains.className}`} style={{ color: GOLD_DIM, opacity: 0.9 }}>
            3-of-4 Biometric Guardian · Mandatory for full DLLR functionality
          </p>
        </div>

        {/* Two primary actions */}
        <div className="space-y-4 mb-8">
          <a
            href="#download"
            className="block w-full rounded-xl border p-5 text-center font-semibold transition-all hover:opacity-90"
            style={{
              background: 'rgba(212, 175, 55, 0.12)',
              borderColor: BORDER,
              color: GOLD,
            }}
          >
            Download PFF Sentinel (Mobile / Desktop)
          </a>

          <button
            type="button"
            onClick={handleActivateLocalKey}
            disabled={activating || active || !phone}
            className="w-full rounded-xl border p-5 text-center font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: active ? 'rgba(34, 197, 94, 0.15)' : GOLD,
              borderColor: active ? 'rgba(34, 197, 94, 0.4)' : BORDER,
              color: active ? '#22c55e' : SLATE_BG,
            }}
          >
            {activating
              ? 'Activating…'
              : active
                ? '✓ Sentinel Active'
                : 'Activate Local Encryption Key'}
          </button>
        </div>

        {activated && sentinelId && (
          <div
            className="rounded-xl border p-4 mb-6 font-mono text-sm break-all"
            style={{ borderColor: 'rgba(34, 197, 94, 0.4)', background: 'rgba(34, 197, 94, 0.08)', color: '#22c55e' }}
          >
            <p className="font-semibold mb-1">Sentinel ID (stored for this device):</p>
            <p>{sentinelId}</p>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-400 mb-6">{error}</p>
        )}

        {!phone && (
          <p className="text-sm mb-6" style={{ color: GOLD_DIM }}>
            Complete the 4-layer gate on the home page to set your Identity Anchor, then return here to activate your Sentinel.
          </p>
        )}

        <div className="flex flex-wrap gap-4">
          <Link
            href="/"
            className="text-sm font-medium"
            style={{ color: GOLD }}
          >
            ← Gate
          </Link>
          <Link
            href="/sentinel/purchase"
            className="text-sm font-medium"
            style={{ color: GOLD }}
          >
            Sentinel Store (Licenses)
          </Link>
          <Link
            href="/dashboard"
            className="text-sm font-medium"
            style={{ color: GOLD }}
          >
            Dashboard →
          </Link>
        </div>
      </div>
    </main>
  );
}

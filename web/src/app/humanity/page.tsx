'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { JetBrains_Mono } from 'next/font/google';

const jetbrains = JetBrains_Mono({ weight: ['400', '600', '700'], subsets: ['latin'] });

/**
 * Humanity Ledger — Public (anonymous) verified human count.
 * Proves the Protocol network's growth to the world. No PII; only the total.
 */
export default function HumanityLedgerPage() {
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/humanity-ledger')
      .then((res) => res.json())
      .then((data: { count?: number }) => {
        setCount(typeof data.count === 'number' ? data.count : 0);
      })
      .catch(() => setCount(0))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-[#0d0d0f] text-white">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Link
          href="/"
          className="inline-block text-sm text-[#6b6b70] hover:text-[#D4AF37] mb-8 transition-colors"
        >
          ← Home
        </Link>

        <header className="mb-10">
          <h1
            className={`text-2xl md:text-3xl font-bold bg-gradient-to-r from-[#e8c547] to-[#c9a227] bg-clip-text text-transparent tracking-tight ${jetbrains.className}`}
          >
            Humanity Ledger
          </h1>
          <p className="text-[#a0a0a5] text-sm mt-2">
            Anonymous count of verified humans in the Sovereign Protocol. Proof of Personhood only — no identities stored.
          </p>
        </header>

        <div
          className="rounded-2xl border border-[#2a2a2e] p-8 text-center"
          style={{
            background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.06) 0%, rgba(0, 0, 0, 0.4) 100%)',
            boxShadow: '0 0 0 1px rgba(212, 175, 55, 0.1), 0 8px 32px rgba(0,0,0,0.3)',
          }}
        >
          {loading ? (
            <p className="text-[#6b6b70] text-sm">Loading…</p>
          ) : (
            <>
              <p className="text-[#6b6b70] text-xs uppercase tracking-wider mb-2">Verified Humans</p>
              <p className={`text-5xl md:text-6xl font-bold text-[#D4AF37] ${jetbrains.className}`}>
                {count != null ? count.toLocaleString() : '—'}
              </p>
              <p className="text-[#6b6b70] text-xs mt-4">
                Each verified by Triple-Pillar scan with external biometric device. Proof of Personhood (humanity_score 1.0).
              </p>
            </>
          )}
        </div>

        <p className="text-center text-xs text-[#6b6b70] mt-8">
          Sovereign Protocol · Born in Lagos. Built for the World.
        </p>
      </div>
    </main>
  );
}

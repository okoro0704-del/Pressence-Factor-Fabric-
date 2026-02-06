'use client';

import { useState } from 'react';
import Link from 'next/link';

const GOLD = '#D4AF37';
const GOLD_DIM = 'rgba(212, 175, 55, 0.6)';
const BORDER = 'rgba(212, 175, 55, 0.25)';
const CARD_BG = '#0d0d0f';
const MUTED = '#6b6b70';
const TEXT = '#e8e8e8';

const GLOSSARY: { id: string; label: string; definition: string }[] = [
  {
    id: 'pff',
    label: 'PFF',
    definition: 'Presence Factor Fabric. The sovereign protocol that binds identity to presence—Phone, Face, Palm—instead of passwords. A hardware-bound, zero-knowledge layer that keeps the human at the center of the digital and AI age. Born in Lagos. Built for the World.',
  },
  {
    id: 'vitalie',
    label: 'VITALIE',
    definition: 'The soul that Libra lacked: a global reserve and payment layer rooted in Proof of Personhood. Not a corporate stablecoin but a citizen-owned fabric where value flows only when presence is proved. Decentralized, human-centric, and resistant to bot capture.',
  },
  {
    id: 'ate',
    label: 'ATE',
    definition: 'Architect Treasury Engine. The infrastructure that realizes Universal High Income through Proof of Personhood. ATE distributes and accounts for value (VIDA CAP, DLLR, vNGN) only to verified humans—no sybils, no bots—fulfilling the dream of income tied to existence, not exploitation.',
  },
  {
    id: 'vida-cap',
    label: 'VIDA CAP',
    definition: 'Deep Truth VIDA Capital. The unit of value minted and unlocked through vitalization: Face + Palm + Device. 1 VIDA unlocks when the Triple-Anchor is verified. It represents not speculation but attested human presence—the basis for Universal Basic Income and sovereign treasury in the PFF ecosystem.',
  },
  {
    id: 'alt',
    label: 'ALT',
    definition: 'Anchor-Linked Token. A class of assets and rights bound to the Identity Anchor (phone + biometrics). ALT ensures that benefits—UBI, airdrops, governance—flow only to proven humans. The anti-sybil layer that makes Universal High Income and fair distribution possible.',
  },
];

function GlossaryCard({
  label,
  definition,
  isOpen,
  onToggle,
}: {
  label: string;
  definition: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="text-left rounded-xl border-2 p-5 transition-all hover:border-[#D4AF37]/50 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
      style={{
        backgroundColor: CARD_BG,
        borderColor: isOpen ? GOLD : BORDER,
      }}
      aria-expanded={isOpen}
    >
      <span className="text-lg font-bold uppercase tracking-wider" style={{ color: GOLD }}>
        {label}
      </span>
      {isOpen && (
        <p className="mt-4 text-sm leading-relaxed" style={{ color: TEXT }}>
          {definition}
        </p>
      )}
      {!isOpen && (
        <p className="mt-2 text-xs uppercase tracking-wider" style={{ color: MUTED }}>
          Tap to reveal Sovereign Definition
        </p>
      )}
    </button>
  );
}

export function SovereignEducationPage() {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      {/* Hero */}
      <section
        className="px-6 py-16 border-b"
        style={{ borderColor: BORDER }}
      >
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] mb-3" style={{ color: GOLD_DIM }}>
            Sovereign Education & Context
          </p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4" style={{ color: GOLD }}>
            Manifesto of Truth
          </h1>
          <p className="text-base" style={{ color: MUTED }}>
            The lexicon and vision behind the Protocol. High-contrast. Authoritative. From the future.
          </p>
        </div>
      </section>

      {/* Glossary */}
      <section className="px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xs font-semibold uppercase tracking-[0.3em] mb-8" style={{ color: GOLD_DIM }}>
            Glossary
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {GLOSSARY.map(({ id, label, definition }) => (
              <GlossaryCard
                key={id}
                label={label}
                definition={definition}
                isOpen={openId === id}
                onToggle={() => setOpenId(openId === id ? null : id)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* The Visionary Connection */}
      <section className="px-6 py-16 border-t" style={{ borderColor: BORDER, backgroundColor: CARD_BG }}>
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl font-bold mb-10" style={{ color: GOLD }}>
            The Evolution of the Digital Era
          </h2>

          <div className="space-y-12">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: GOLD_DIM }}>
                Zuckz Space vs. VITALIE: Why VITALIE is the soul that Libra lacked
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: TEXT }}>
                Libra promised a global currency; it delivered a corporate stablecoin with no soul. Identity was KYC-in-a-box—handed to gatekeepers, not proved by the human. VITALIE is the inverse: the reserve and payment layer that only exists when presence is proved. No central custodian of &quot;who you are.&quot; The human is the root of trust. Value flows to verified persons, not to wallets that bots can farm. That is the soul Libra lacked: Proof of Personhood as the foundation, not an afterthought.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: GOLD_DIM }}>
                The Musk Future: How ATE and VIDA CAP realize the dream of Universal High Income through Proof of Personhood
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: TEXT }}>
                The dream of Universal Basic Income has always crashed on one question: who gets it? Without Proof of Personhood, UBI becomes a bot-feast. ATE—the Architect Treasury Engine—and VIDA CAP are the answer. Value is minted and distributed only when Face + Palm + Device are verified. One human, one share. No sybils. No fake accounts. That is Universal High Income: income tied to existence, delivered through a protocol that keeps the human at the center. The Musk future—abundance for real people—is realized when identity is presence, not paperwork.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Proof of Personhood Thesis */}
      <section className="px-6 py-16">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xs font-semibold uppercase tracking-[0.3em] mb-6" style={{ color: GOLD_DIM }}>
            The Proof of Personhood Thesis
          </h2>
          <div
            className="rounded-xl border-2 p-6 md:p-8"
            style={{ borderColor: BORDER, backgroundColor: CARD_BG }}
          >
            <p className="text-base leading-relaxed mb-4" style={{ color: TEXT }}>
              The bot crisis is existential: AI and sybils can mimic accounts, farm airdrops, and capture every system that relies on &quot;one wallet, one vote&quot; or &quot;one account, one share.&quot; The only defense is to bind rights and value to the human body—not to keys that can be copied, or emails that can be forged.
            </p>
            <p className="text-base leading-relaxed mb-4" style={{ color: TEXT }}>
              PFF solves this with the <strong style={{ color: GOLD }}>Palm + Face anchor</strong>. Identity is not a username or a KYC file; it is the continuous proof that a single, living human is present. Hardware-bound. Zero-knowledge where possible. No central vault of biometrics—the proof lives at the edge, and the protocol only checks: &quot;Is this the same human who enrolled?&quot;
            </p>
            <p className="text-base leading-relaxed" style={{ color: TEXT }}>
              In the AI age, the human must stay at the center. PFF is the infrastructure for that: the Presence Factor Fabric that keeps Universal High Income, governance, and value distribution real. One person, one presence, one share of the future.
            </p>
          </div>
        </div>
      </section>

      {/* VIDA CAP: Covenant Asset Prime */}
      <section className="px-6 py-16 border-t" style={{ borderColor: BORDER, backgroundColor: CARD_BG }}>
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xs font-semibold uppercase tracking-[0.3em] mb-6" style={{ color: GOLD_DIM }}>
            Covenant Asset Prime
          </h2>
          <div className="flex items-center gap-4 mb-8">
            <div
              className="flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center border-2"
              style={{ borderColor: GOLD, boxShadow: `0 0 24px ${GOLD_DIM}` }}
              aria-hidden
            >
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="14" stroke="#D4AF37" strokeWidth="2" fill="none" />
                <path d="M16 8v16M8 16h16" stroke="#D4AF37" strokeWidth="1.5" />
                <circle cx="16" cy="16" r="4" stroke="#D4AF37" strokeWidth="1.5" fill="none" />
                <path d="M16 12l2 4 4 2-2 4-4 2-2-4-4-2 2-4 4-2z" stroke="#D4AF37" strokeWidth="1" fill="none" />
              </svg>
            </div>
            <div>
              <h3 className="text-2xl font-bold tracking-tight" style={{ color: GOLD, fontFamily: 'Georgia, serif' }}>
                VIDA CAP
              </h3>
              <p className="text-sm uppercase tracking-widest mt-1" style={{ color: GOLD_DIM }}>
                Covenant Asset Prime
              </p>
            </div>
          </div>
          <p className="text-base leading-relaxed mb-10" style={{ color: TEXT }}>
            VIDA CAP is the <strong style={{ color: GOLD }}>Covenant Asset Prime</strong>—an asset of <strong style={{ color: GOLD }}>appreciation</strong>, not volatility. It is not speculation; it is attestation. Value is minted and sustained by the daily proof of human presence. Where crypto bends to greed and fear, VIDA CAP stands on the certainty of covenant: one human, one share, one truth.
          </p>

          {/* The End of the Crypto Era — comparison */}
          <h3 className="text-sm font-bold uppercase tracking-wider mb-6" style={{ color: GOLD }}>
            The End of the Crypto Era
          </h3>
          <div className="overflow-x-auto rounded-xl border-2 mb-10" style={{ borderColor: BORDER }}>
            <table className="w-full text-left text-sm" style={{ color: TEXT }}>
              <thead>
                <tr style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
                  <th className="p-4 font-bold uppercase tracking-wider" style={{ color: GOLD_DIM }}>Era</th>
                  <th className="p-4 font-bold uppercase tracking-wider" style={{ color: '#f87171' }}>Volatility of Greed (Crypto)</th>
                  <th className="p-4 font-bold uppercase tracking-wider" style={{ color: GOLD }}>Certainty of Covenant (VIDA CAP)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t" style={{ borderColor: BORDER }}>
                  <td className="p-4 font-medium">Foundation</td>
                  <td className="p-4" style={{ color: MUTED }}>Speculation, hype, anonymous wallets</td>
                  <td className="p-4">Proof of Personhood; Face + Palm + Device</td>
                </tr>
                <tr className="border-t" style={{ borderColor: BORDER }}>
                  <td className="p-4 font-medium">Value</td>
                  <td className="p-4" style={{ color: MUTED }}>Tied to markets and sentiment</td>
                  <td className="p-4">Tied to attested human presence; appreciation over time</td>
                </tr>
                <tr className="border-t" style={{ borderColor: BORDER }}>
                  <td className="p-4 font-medium">Survival</td>
                  <td className="p-4" style={{ color: MUTED }}>Vulnerable to regulation and fiat collapse</td>
                  <td className="p-4">GODcurrency: survives independent of failing fiat systems; rooted in the human, not the state</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-sm leading-relaxed mb-10" style={{ color: TEXT }}>
            VIDA CAP is a <strong style={{ color: GOLD }}>GODcurrency</strong>—sovereign over the failing fiat order. It does not depend on central banks or corporate stablecoins. It is backed by the only constant that remains when systems fall: the verified presence of the human. Certainty of covenant, not volatility of greed.
          </p>

          {/* Zuck vs The Architect */}
          <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: GOLD }}>
            Zuck vs. The Architect
          </h3>
          <p className="text-sm leading-relaxed mb-6" style={{ color: TEXT }}>
            Silicon Valley built for <strong style={{ color: MUTED }}>Corporations</strong>. Zuckerberg built empires that harvest identity and attention—KYC-in-a-box, data in a vault, the human as the product. The Architect builds for <strong style={{ color: GOLD }}>Sovereign Humans</strong>. PFF succeeds where they failed: no central custodian of who you are, no corporate stablecoin with a &quot;soul&quot; borrowed from marketing. Identity is proved by presence; value flows only when the human is at the center. That is why VIDA CAP outlives the crypto era and the fiat era alike: it is covenant, not corporation.
          </p>

          {/* The Truth Mechanism */}
          <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: GOLD }}>
            The Truth Mechanism
          </h3>
          <div className="rounded-xl border-2 p-6" style={{ borderColor: GOLD, backgroundColor: 'rgba(212, 175, 55, 0.06)' }}>
            <p className="text-sm leading-relaxed" style={{ color: TEXT }}>
              Every daily <strong style={{ color: GOLD }}>Palm Pulse</strong> is a <strong style={{ color: GOLD }}>Declaration of Truth</strong>. You are present; you are verified; you are sovereign. That declaration fuels the appreciation of the asset. The more the Protocol is used in truth—Face + Palm + Device, day after day—the stronger the covenant. VIDA CAP is not mined by machines. It is minted by humans who show up. Immutable. Authoritative. Biblical in its simplicity, futuristic in its execution.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-10 border-t text-center" style={{ borderColor: BORDER }}>
        <p className="text-xs mb-4" style={{ color: MUTED }}>
          PFF — Presence Factor Fabric. Born in Lagos. Built for the World.
        </p>
        <div className="flex flex-wrap justify-center gap-4 text-sm">
          <Link href="/" className="hover:underline" style={{ color: GOLD_DIM }}>
            ← Manifesto
          </Link>
          <Link href="/countdown/" className="hover:underline" style={{ color: GOLD_DIM }}>
            Countdown
          </Link>
        </div>
      </footer>
    </main>
  );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { getCountdownTarget, isArchitect } from '@/lib/manifestoUnveiling';
import { insertWaitlistEntry } from '@/lib/waitlist';
import { PublicSovereignCompanion } from '@/components/manifesto/PublicSovereignCompanion';
import { SovereignAwakeningProvider, useSovereignAwakening } from '@/contexts/SovereignAwakeningContext';
import { SCROLL_WISDOM } from '@/lib/sovereignAwakeningContent';
import {
  isBeforeAccessCutoff,
  hasAccessGranted,
  setAccessGranted,
  validateAccessCode,
} from '@/lib/accessCodeGate';

const GOLD = '#D4AF37';
const GOLD_DIM = 'rgba(212, 175, 55, 0.6)';
const BG = '#050505';
const CARD_BG = '#0d0d0f';
const BORDER = 'rgba(212, 175, 55, 0.25)';
const MUTED = '#6b6b70';

function useCountdown(target: Date) {
  const [diff, setDiff] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const d = target.getTime() - now.getTime();
      if (d <= 0) {
        setDiff({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setDiff({
        days: Math.floor(d / (24 * 60 * 60 * 1000)),
        hours: Math.floor((d % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000)),
        minutes: Math.floor((d % (60 * 60 * 1000)) / (60 * 1000)),
        seconds: Math.floor((d % (60 * 1000)) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  return diff;
}

const RATE_LIMIT_MS = 10000;

const AWAKENING_SECTION_IDS = ['vida-cap', 'ate', 'vlt', 'ecosystem-roadmap', 'vanguard'] as const;

export function SovereignManifestoLanding() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const target = getCountdownTarget();
  const { days, hours, minutes, seconds } = useCountdown(target);
  const [vanguardEmail, setVanguardEmail] = useState('');
  const [vanguardHoneypot, setVanguardHoneypot] = useState('');
  const [vanguardStatus, setVanguardStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [vanguardError, setVanguardError] = useState<string | null>(null);
  const lastSubmitAt = useRef<number>(0);
  const awakening = useSovereignAwakening();

  const needCode = mounted && (searchParams?.get('need_code') === '1' || false);
  const beforeCutoff = mounted && isBeforeAccessCutoff();
  const isOwner = mounted && isArchitect();
  const accessGranted = mounted && hasAccessGranted();
  const showCodeForm = beforeCutoff && !isOwner && (!accessGranted || needCode);

  const [codePhone, setCodePhone] = useState('');
  const [codeValue, setCodeValue] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [codeLoading, setCodeLoading] = useState(false);
  const codeFormRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCodeError(null);
    const phone = codePhone.trim();
    const code = codeValue.trim();
    if (!phone || !code) {
      setCodeError('Enter your phone number and the code you received.');
      return;
    }
    setCodeLoading(true);
    const result = await validateAccessCode(phone, code);
    setCodeLoading(false);
    if (result.ok) {
      setAccessGranted(result.phone_number);
      router.replace('/vitalization');
      return;
    }
    setCodeError(result.error ?? 'Invalid code. Try again or request a new code.');
  };

  // Scroll-triggered wisdom: when a section enters view, set wisdom for the Companion
  useEffect(() => {
    if (!mounted || typeof window === 'undefined' || !awakening?.setScrollWisdom) return;
    const els = AWAKENING_SECTION_IDS.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    if (els.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const id = e.target.id as keyof typeof SCROLL_WISDOM;
          const wisdom = SCROLL_WISDOM[id];
          if (wisdom) awakening.setScrollWisdom(wisdom);
        }
      },
      { threshold: 0.2, rootMargin: '0px 0px -20% 0px' }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [mounted, awakening]);

  // Scroll to hash on load (e.g. /manifesto/#ecosystem-roadmap)
  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;
    const hash = window.location.hash?.replace('#', '');
    if (!hash) return;
    const t = setTimeout(() => {
      const el = document.getElementById(hash);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
    return () => clearTimeout(t);
  }, [mounted]);

  const handleVanguardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (vanguardStatus === 'submitting') return;
    if (Date.now() - lastSubmitAt.current < RATE_LIMIT_MS) return;

    if (vanguardHoneypot.trim()) {
      setVanguardStatus('success');
      setVanguardEmail('');
      return;
    }

    setVanguardError(null);
    setVanguardStatus('submitting');
    lastSubmitAt.current = Date.now();

    try {
      const result = await insertWaitlistEntry(vanguardEmail, 'manifesto');
      if (result.ok) {
        setVanguardStatus('success');
        setVanguardEmail('');
      } else {
        setVanguardStatus('error');
        setVanguardError(result.error);
      }
    } catch {
      setVanguardStatus('error');
      setVanguardError('Something went wrong. Try again.');
    }
  };

  const rateLimitActive = Date.now() - lastSubmitAt.current < RATE_LIMIT_MS && vanguardStatus !== 'idle';

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      {/* Access code bar — until April 7, non-owner users must enter phone + code to access the app */}
      {showCodeForm && (
        <div
          ref={codeFormRef}
          className="sticky top-0 z-50 border-b px-4 py-4"
          style={{ borderColor: GOLD, background: 'rgba(5, 5, 5, 0.98)', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
        >
          <div className="max-w-xl mx-auto">
            <p className="text-sm font-semibold mb-3" style={{ color: GOLD }}>
              Site access until April 7 requires a code. Enter your phone number and the code you received to log in.
            </p>
            <form onSubmit={handleCodeSubmit} className="flex flex-wrap items-end gap-3">
              <input
                type="tel"
                value={codePhone}
                onChange={(e) => setCodePhone(e.target.value)}
                placeholder="Phone number"
                className="flex-1 min-w-[140px] px-4 py-2.5 rounded-lg border-2 bg-[#0d0d0f] text-white placeholder-[#6b6b70]"
                style={{ borderColor: BORDER }}
              />
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={codeValue}
                onChange={(e) => setCodeValue(e.target.value.replace(/\D/g, ''))}
                placeholder="Code"
                className="w-24 px-4 py-2.5 rounded-lg border-2 bg-[#0d0d0f] text-white placeholder-[#6b6b70]"
                style={{ borderColor: BORDER }}
              />
              <button
                type="submit"
                disabled={codeLoading}
                className="px-6 py-2.5 rounded-lg font-bold uppercase tracking-wider border-2 transition-colors disabled:opacity-60"
                style={{ borderColor: GOLD, color: GOLD, boxShadow: '0 0 16px rgba(212, 175, 55, 0.3)' }}
              >
                {codeLoading ? 'Checking…' : 'Log in'}
              </button>
            </form>
            {codeError && (
              <p className="mt-2 text-sm" style={{ color: '#f87171' }}>
                {codeError}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Hero */}
      <section
        className="relative min-h-[70vh] flex flex-col items-center justify-center px-6 py-20 border-b"
        style={{ borderColor: BORDER }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#0d0d0f] to-transparent pointer-events-none" />
        <p className="text-xs font-semibold uppercase tracking-[0.35em] mb-4" style={{ color: GOLD_DIM }}>
          Presence Factor Fabric
        </p>
        <h1
          className="text-4xl md:text-6xl font-bold tracking-tight text-center max-w-3xl mb-4"
          style={{ color: GOLD }}
          onMouseEnter={() => awakening?.setSocialScoutOffer(true)}
          onMouseLeave={() => awakening?.setSocialScoutOffer(false)}
        >
          The Sovereign Presentation
        </h1>
        <p className="text-lg max-w-xl text-center mb-12" style={{ color: MUTED }}>
          Born in Lagos. Built for the World.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {(isOwner || accessGranted) ? (
            <Link
              href="/vitalization"
              className="rounded-xl border-2 px-8 py-3 font-bold uppercase tracking-wider transition-colors hover:bg-[#D4AF37]/20"
              style={{ borderColor: GOLD, color: GOLD, boxShadow: '0 0 20px rgba(212, 175, 55, 0.2)' }}
            >
              VITALIZE
            </Link>
          ) : showCodeForm ? (
            <button
              type="button"
              onClick={() => codeFormRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="rounded-xl border-2 px-8 py-3 font-bold uppercase tracking-wider transition-colors hover:bg-[#D4AF37]/20"
              style={{ borderColor: GOLD, color: GOLD, boxShadow: '0 0 20px rgba(212, 175, 55, 0.2)' }}
            >
              VITALIZE — Enter code above
            </button>
          ) : (
            <Link
              href="/vitalization"
              className="rounded-xl border-2 px-8 py-3 font-bold uppercase tracking-wider transition-colors hover:bg-[#D4AF37]/20"
              style={{ borderColor: GOLD, color: GOLD, boxShadow: '0 0 20px rgba(212, 175, 55, 0.2)' }}
            >
              VITALIZE
            </Link>
          )}
          <Link
            href="/countdown/"
            className="rounded-xl border-2 px-8 py-3 font-semibold transition-colors hover:bg-[#16161a]"
            style={{ borderColor: GOLD, color: GOLD }}
          >
            Sovereign Countdown → April 7, 2026
          </Link>
        </div>
      </section>

      {/* The Mission */}
      <section className="px-6 py-16 max-w-3xl mx-auto">
        <h2 className="text-xs font-semibold uppercase tracking-[0.3em] mb-2" style={{ color: GOLD_DIM }}>
          The Mission
        </h2>
        <p className="text-xl font-bold uppercase tracking-[0.2em] mb-6" style={{ color: GOLD }}>
          Presence Factor Fabric
        </p>
        <p className="text-lg leading-relaxed mb-6" style={{ color: '#e0e0e0' }}>
          Identity should be proved by <strong style={{ color: GOLD }}>who you are</strong>—your presence—not what you remember. 
          PFF replaces the old world of passwords and fraud with <strong style={{ color: GOLD }}>hardware-bound identity</strong>,{' '}
          <strong style={{ color: GOLD }}>proof of personhood</strong>, and <strong style={{ color: GOLD }}>biometric attestation</strong>—zero-knowledge, no central vault of secrets.
        </p>
        <p className="text-base leading-relaxed mb-8" style={{ color: MUTED }}>
          The Presence Factor Fabric decouples citizen autonomy from national efficiency: half serves you—your vault, your keys; the other half serves integrity—attestations, audits, no PII.
        </p>

        {/* Visionary Pillars — triple column */}
        <h3 className="text-sm font-bold uppercase tracking-wider mb-8 mt-10" style={{ color: GOLD_DIM }}>
          The Visionary Pillars
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {/* Biometric Attestation (Vitalik) — Soul */}
          <div className="rounded-xl border-2 p-6 flex flex-col" style={{ borderColor: BORDER, backgroundColor: CARD_BG }}>
            <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 border" style={{ borderColor: GOLD, color: GOLD }} aria-hidden>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v4M12 18v4M2 12h4M18 12h4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
            </div>
            <h4 className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: GOLD }}>Biometric Attestation</h4>
            <p className="text-xs uppercase tracking-wider mb-2" style={{ color: MUTED }}>Vitalik</p>
            <p className="text-sm leading-relaxed flex-1" style={{ color: '#e0e0e0' }}>
              VITALIE provides the decentralized <strong style={{ color: GOLD }}>Soul</strong> that Vitalik envisions—anchored in biological truth. Face + Palm attestation proves a living human; no soul-bound token without the body. The soul is the proof.
            </p>
          </div>
          {/* Hardware-Bound Identity (Balaji) — Key */}
          <div className="rounded-xl border-2 p-6 flex flex-col" style={{ borderColor: BORDER, backgroundColor: CARD_BG }}>
            <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 border" style={{ borderColor: GOLD, color: GOLD }} aria-hidden>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
              </svg>
            </div>
            <h4 className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: GOLD }}>Hardware-Bound Identity</h4>
            <p className="text-xs uppercase tracking-wider mb-2" style={{ color: MUTED }}>Balaji</p>
            <p className="text-sm leading-relaxed flex-1" style={{ color: '#e0e0e0' }}>
              PFF locks the user&apos;s identity to their <strong style={{ color: GOLD }}>Device ID</strong>, fulfilling Balaji&apos;s requirement for a physical anchor in a digital world. Keys in silicon; identity on-device. No cloud vault—the device is the anchor.
            </p>
          </div>
          {/* Proof of Personhood (Altman) — Hand */}
          <div className="rounded-xl border-2 p-6 flex flex-col" style={{ borderColor: BORDER, backgroundColor: CARD_BG }}>
            <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 border" style={{ borderColor: GOLD, color: GOLD }} aria-hidden>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 11V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v0M14 10V4a2 2 0 0 0-2-2 2 2 0 0 0-2 2v6M10 10.5V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v8" />
                <path d="M18 8a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-4" />
              </svg>
            </div>
            <h4 className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: GOLD }}>Proof of Personhood</h4>
            <p className="text-xs uppercase tracking-wider mb-2" style={{ color: MUTED }}>Altman</p>
            <p className="text-sm leading-relaxed flex-1" style={{ color: '#e0e0e0' }}>
              The <strong style={{ color: GOLD }}>Palm Scan</strong> provides the Proof of Personhood needed for VIDA CAP and Universal High Income—without Altman&apos;s Orb. One human, one hand, one share. No custom hardware; everyday devices.
            </p>
          </div>
        </div>
        <div className="rounded-xl border-2 p-6 text-center" style={{ borderColor: GOLD, backgroundColor: 'rgba(212, 175, 55, 0.08)' }}>
          <p className="text-base font-semibold leading-relaxed" style={{ color: GOLD }}>
            They identified the pillars. We built the Protocol. PFF is the synthesis of Biometric Attestation, Hardware-Bound Identity, and Proof of Personhood.
          </p>
          <p className="text-xs uppercase tracking-wider mt-3" style={{ color: GOLD_DIM }}>The Architect&apos;s Conclusion</p>
        </div>
      </section>

      {/* Other Terminologies — VIDA CAP */}
      <section id="vida-cap" className="px-6 py-16 border-t scroll-mt-6" style={{ borderColor: BORDER, backgroundColor: CARD_BG }}>
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xs font-semibold uppercase tracking-[0.3em] mb-10" style={{ color: GOLD_DIM }}>
            Other Terminologies
          </h2>

          {/* VIDA CAP: Covenant Asset Prime — Definition + Seal */}
          <div className="flex items-center gap-4 mb-6">
            <div
              className="flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center border-2"
              style={{ borderColor: GOLD, boxShadow: `0 0 20px ${GOLD_DIM}` }}
              aria-hidden
            >
              <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="14" stroke="#D4AF37" strokeWidth="2" fill="none" />
                <path d="M16 8v16M8 16h16" stroke="#D4AF37" strokeWidth="1.5" />
                <circle cx="16" cy="16" r="4" stroke="#D4AF37" strokeWidth="1.5" fill="none" />
                <path d="M16 12l2 4 4 2-2 4-4 2-2-4-4-2 2-4 4-2z" stroke="#D4AF37" strokeWidth="1" fill="none" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold tracking-tight" style={{ color: GOLD, fontFamily: 'Georgia, serif' }}>
                VIDA CAP
              </h3>
              <p className="text-xs uppercase tracking-widest mt-1" style={{ color: GOLD_DIM }}>
                Covenant Asset Prime
              </p>
            </div>
          </div>
          <p className="text-base leading-relaxed mb-8" style={{ color: '#e0e0e0' }}>
            <strong style={{ color: GOLD }}>The Definition:</strong> VIDA CAP is the <strong style={{ color: GOLD }}>Covenant Asset Prime</strong>—an asset of <strong style={{ color: GOLD }}>appreciation</strong>, not volatility. It is not speculation; it is attestation. Value is minted and sustained by the daily proof of human presence.
          </p>

          {/* The End of the Crypto Era — comparison table */}
          <h4 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: GOLD }}>
            The End of the Crypto Era
          </h4>
          <div className="overflow-x-auto rounded-xl border-2 mb-6" style={{ borderColor: BORDER }}>
            <table className="w-full text-left text-sm" style={{ color: '#e0e0e0' }}>
              <thead>
                <tr style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
                  <th className="p-3 font-bold uppercase tracking-wider" style={{ color: GOLD_DIM }}>Era</th>
                  <th className="p-3 font-bold uppercase tracking-wider" style={{ color: 'rgba(248,113,113,0.9)' }}>Volatility of Greed (Crypto)</th>
                  <th className="p-3 font-bold uppercase tracking-wider" style={{ color: GOLD }}>Certainty of Covenant (VIDA CAP)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t" style={{ borderColor: BORDER }}>
                  <td className="p-3 font-medium">Foundation</td>
                  <td className="p-3" style={{ color: MUTED }}>Speculation, hype, anonymous wallets</td>
                  <td className="p-3">Proof of Personhood; Face + Palm + Device</td>
                </tr>
                <tr className="border-t" style={{ borderColor: BORDER }}>
                  <td className="p-3 font-medium">Value</td>
                  <td className="p-3" style={{ color: MUTED }}>Tied to markets and sentiment</td>
                  <td className="p-3">Tied to attested human presence; appreciation over time</td>
                </tr>
                <tr className="border-t" style={{ borderColor: BORDER }}>
                  <td className="p-3 font-medium">Survival</td>
                  <td className="p-3" style={{ color: MUTED }}>Vulnerable to regulation and fiat collapse</td>
                  <td className="p-3">GODcurrency: survives independent of failing fiat systems; rooted in the human, not the state</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-sm leading-relaxed mb-8" style={{ color: '#e0e0e0' }}>
            VIDA CAP is a <strong style={{ color: GOLD }}>GODcurrency</strong>—sovereign over the failing fiat order. It does not depend on central banks or corporate stablecoins. It is backed by the only constant that remains when systems fall: the verified presence of the human.
          </p>

          {/* Zuck vs The Architect */}
          <h4 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: GOLD }}>
            Zuck vs. The Architect
          </h4>
          <p className="text-sm leading-relaxed mb-8" style={{ color: '#e0e0e0' }}>
            Zuckerberg built for <strong style={{ color: MUTED }}>Corporations</strong>—empires that harvest identity and attention; KYC-in-a-box, the human as the product. The Architect builds for <strong style={{ color: GOLD }}>Sovereign Humans</strong>. PFF succeeds where Silicon Valley failed: no central custodian of who you are. Identity is proved by presence; value flows only when the human is at the center. That is why VIDA CAP outlives the crypto era and the fiat era alike: it is covenant, not corporation.
          </p>

          {/* The Truth Mechanism */}
          <div className="rounded-xl border-2 p-6 mb-10" style={{ borderColor: GOLD, backgroundColor: 'rgba(212, 175, 55, 0.06)' }}>
            <h4 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: GOLD }}>
              The Truth Mechanism
            </h4>
            <p className="text-sm leading-relaxed" style={{ color: '#e0e0e0' }}>
              Every daily <strong style={{ color: GOLD }}>Palm Pulse</strong> is a <strong style={{ color: GOLD }}>Declaration of Truth</strong>. You are present; you are verified; you are sovereign. That declaration fuels the appreciation of the asset. The more the Protocol is used in truth—Face + Palm + Device, day after day—the stronger the covenant. VIDA CAP is not mined by machines. It is minted by humans who show up. Immutable. Authoritative. Biblical in its simplicity, futuristic in its execution.
            </p>
          </div>

          {/* VIDA CAP Tokenomics */}
          <div className="rounded-xl border-2 p-6 mb-10" style={{ borderColor: BORDER, backgroundColor: CARD_BG }}>
            <h4 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: GOLD }}>
              VIDA CAP Tokenomics
            </h4>
            <p className="text-sm leading-relaxed mb-4" style={{ color: '#e0e0e0' }}>
              For every human who Vitalizes, <strong style={{ color: GOLD }}>10 VIDA CAP</strong> is minted and put into circulation. When we reach <strong style={{ color: GOLD }}>1 billion Vitalized Citizens</strong> or <strong style={{ color: GOLD }}>10 billion VIDA CAP</strong> in circulation, minting reduces to <strong style={{ color: GOLD }}>2 VIDA CAP</strong> for every Vitalization and <strong style={{ color: GOLD }}>burning starts immediately</strong>.
            </p>
            <p className="text-sm leading-relaxed mb-4" style={{ color: '#e0e0e0' }}>
              The price of <strong style={{ color: GOLD }}>1 VIDA CAP</strong> is pegged at <strong style={{ color: GOLD }}>$1,000 USD</strong>.
            </p>
            <p className="text-sm font-semibold mb-3" style={{ color: GOLD }}>
              This is where our 50:50 principles start from.
            </p>
            <p className="text-sm leading-relaxed mb-4" style={{ color: '#e0e0e0' }}>
              <strong style={{ color: GOLD }}>50%</strong> of the 10 VIDA CAP is released to your <strong style={{ color: GOLD }}>Country of Origin</strong> to aid in infrastructural development, industrialization, and to strengthen the local economy.
            </p>
            <p className="text-sm leading-relaxed mb-2" style={{ color: '#e0e0e0' }}>
              The <strong style={{ color: GOLD }}>5 VIDA CAP</strong> released to your country is further segregated into <strong style={{ color: GOLD }}>70%</strong> and <strong style={{ color: GOLD }}>30%</strong>:
            </p>
            <ul className="space-y-2 text-sm mb-0 list-none" style={{ color: '#e0e0e0' }}>
              <li className="flex items-start gap-2">
                <span className="shrink-0 mt-0.5 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: GOLD }} />
                <span><strong style={{ color: GOLD }}>30%</strong> funds liquidity so citizens can convert their VIDA CAP into the National Stable VIDA Currency for day-to-day purchase and activities.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="shrink-0 mt-0.5 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: GOLD }} />
                <span><strong style={{ color: GOLD }}>70%</strong> is hard locked in a Safe Vault until your country signs the <strong style={{ color: GOLD }}>No Tax on Human Labour</strong> clause and <strong style={{ color: GOLD }}>no Election without the Truth Ledger</strong>.</span>
              </li>
            </ul>
          </div>

        </div>
      </section>

      {/* ATE: Autonomous Truth Economy */}
      <section id="ate" className="px-6 py-16 border-t max-w-3xl mx-auto scroll-mt-6" style={{ borderColor: BORDER }}>
        <h2 className="text-xs font-semibold uppercase tracking-[0.3em] mb-6" style={{ color: GOLD_DIM }}>
          ATE: Autonomous Truth Economy
        </h2>

        {/* Core Philosophy */}
        <p className="text-base leading-relaxed mb-8" style={{ color: '#e0e0e0' }}>
          ATE is an economy powered by <strong style={{ color: GOLD }}>Truth</strong> and <strong style={{ color: GOLD }}>Presence</strong>. In the Protocol, &quot;work&quot; is redefined: <strong style={{ color: GOLD }}>declaring your presence</strong>—Face + Palm + Device, day after day—is the primary labour of the citizen. No résumé, no interview. Your existence, verified, is the contribution. The economy runs on attestation, not extraction.
        </p>

        {/* Realizing the Age of Abundance — Musk Alignment */}
        <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: GOLD }}>
          Realizing the Age of Abundance
        </h3>
        <p className="text-sm leading-relaxed mb-8" style={{ color: '#e0e0e0' }}>
          Elon Musk speaks of a future of <strong style={{ color: GOLD }}>Optional Jobs</strong>—where labour is a choice, not a necessity. ATE fulfills that vision by providing a <strong style={{ color: GOLD }}>non-depreciating income stream</strong> tied to Proof of Personhood. VIDA CAP does not inflate away; it appreciates with the covenant. When existence is the asset, jobs become optional. The Age of Abundance is not post-scarcity of things—it is the abundance of sovereignty. ATE delivers it.
        </p>

        {/* 50:50 Equality Rule — Scales of Justice */}
        <div className="rounded-xl border-2 p-6 md:p-8 mb-6" style={{ borderColor: BORDER, backgroundColor: CARD_BG }}>
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center border-2" style={{ borderColor: GOLD, color: GOLD }} aria-hidden>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 4v8M16 12v14" />
                <path d="M6 12h20" />
                <path d="M6 12v2M22 12v2" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="22" cy="18" r="3" />
                <path d="M6 12l0 6M22 12l0 6" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold uppercase tracking-wider" style={{ color: GOLD }}>
                The 50:50 Equality Rule
              </h3>
              <p className="text-xs uppercase tracking-wider mt-1" style={{ color: GOLD_DIM }}>
                Radical Fairness of the Protocol
              </p>
            </div>
          </div>
          <ul className="space-y-4 text-sm" style={{ color: '#e0e0e0' }}>
            <li className="flex items-start gap-3">
              <span className="shrink-0 mt-0.5 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: GOLD }} />
              <span><strong style={{ color: GOLD }}>Age-Agnostic:</strong> From 18 to 100, the share is equal. No bonus for youth, no penalty for age. One human, one presence, one share.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="shrink-0 mt-0.5 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: GOLD }} />
              <span><strong style={{ color: GOLD }}>Education-Agnostic:</strong> Degrees do not increase your VIDA CAP; only Truth does. No credential inflation. Proof of Personhood is the only credential that counts.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="shrink-0 mt-0.5 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: GOLD }} />
              <span><strong style={{ color: GOLD }}>Status-Agnostic:</strong> The Architect and the Citizen are bound by the same 50:50 distribution logic. No privileged allocation. The Protocol does not distinguish by title—only by verified presence.</span>
            </li>
          </ul>
          <p className="text-base font-bold mt-6 text-center" style={{ color: GOLD }}>
            Your Existence is the Asset.
          </p>
        </div>
      </section>

      {/* VLT: Vitalization Ledger Technology */}
      <section
        id="vlt"
        className="px-6 py-16 border-t relative overflow-hidden scroll-mt-6"
        style={{
          borderColor: BORDER,
          backgroundColor: '#030304',
          backgroundImage: `
            linear-gradient(90deg, rgba(212,175,55,0.04) 1px, transparent 1px),
            linear-gradient(rgba(212,175,55,0.04) 1px, transparent 1px),
            linear-gradient(90deg, transparent 50%, rgba(212,175,55,0.02) 50%),
            linear-gradient(transparent 50%, rgba(212,175,55,0.02) 50%)
          `,
          backgroundSize: '32px 32px, 32px 32px, 64px 64px, 64px 64px',
        }}
      >
        <div className="max-w-3xl mx-auto relative">
          {/* Pulsing V — heartbeat of VLT */}
          <div className="flex items-center gap-4 mb-8">
            <div
              className="flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center border-2 animate-pulse"
              style={{ borderColor: GOLD, color: GOLD, boxShadow: `0 0 24px ${GOLD_DIM}` }}
              aria-hidden
            >
              <span className="text-2xl font-black tracking-tighter" style={{ color: GOLD }}>V</span>
            </div>
            <div>
              <h2 className="text-xl font-bold uppercase tracking-wider" style={{ color: GOLD }}>
                VLT: The Final Advancement
              </h2>
              <p className="text-xs uppercase tracking-wider mt-1" style={{ color: GOLD_DIM }}>
                Vitalization Ledger Technology
              </p>
            </div>
          </div>

          {/* End of History Thesis */}
          <p className="text-base leading-relaxed mb-8" style={{ color: '#e0e0e0' }}>
            VLT is the <strong style={{ color: GOLD }}>Truth Ledger</strong> that ends the need for banks, lawyers, and middlemen. One ledger, one truth, one covenant. When presence is proved and recorded on the VLT, the old intermediaries—custodians, notaries, clearing houses—become obsolete. The Final Advancement is not a product. It is the infrastructure of sovereign truth.
          </p>

          {/* SOVRYN Stack — 4 pillars */}
          <h3 className="text-sm font-bold uppercase tracking-wider mb-6" style={{ color: GOLD_DIM }}>
            The SOVRYN Stack
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div className="rounded-xl border-2 p-5" style={{ borderColor: BORDER, backgroundColor: CARD_BG }}>
              <h4 className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: GOLD }}>SOVRYN AI</h4>
              <p className="text-xs leading-relaxed" style={{ color: '#e0e0e0' }}>The Intelligence that sees the Truth.</p>
            </div>
            <div className="rounded-xl border-2 p-5" style={{ borderColor: BORDER, backgroundColor: CARD_BG }}>
              <h4 className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: GOLD }}>SOVRYN CHAIN</h4>
              <p className="text-xs leading-relaxed" style={{ color: '#e0e0e0' }}>The Ledger that holds the Truth.</p>
            </div>
            <div className="rounded-xl border-2 p-5" style={{ borderColor: BORDER, backgroundColor: CARD_BG }}>
              <h4 className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: GOLD }}>SMART CONTRACT</h4>
              <p className="text-xs leading-relaxed" style={{ color: '#e0e0e0' }}>The Law that protects the Truth.</p>
            </div>
            <div className="rounded-xl border-2 p-5" style={{ borderColor: BORDER, backgroundColor: CARD_BG }}>
              <h4 className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: GOLD }}>AUTOMATION</h4>
              <p className="text-xs leading-relaxed" style={{ color: '#e0e0e0' }}>The Force that delivers the Truth.</p>
            </div>
          </div>

          {/* Irrevocable Covenant */}
          <div className="rounded-xl border-2 p-6 mb-8" style={{ borderColor: GOLD, backgroundColor: 'rgba(212, 175, 55, 0.06)' }}>
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: GOLD }}>
              The Irrevocable Covenant
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: '#e0e0e0' }}>
              Once a citizen enters the VLT, their rights are protected by an <strong style={{ color: GOLD }}>Irrevocable Smart Contract</strong>. Not even the Architect can take away a citizen&apos;s 1 VIDA CAP once it is anchored. The ledger does not forget. The covenant does not break. Your presence, once attested, is permanent on the Truth Ledger.
            </p>
          </div>

          {/* CTA to Vanguard — Secure your place on the Truth Ledger */}
          <div className="text-center">
            <a
              href="#vanguard"
              className="inline-block rounded-xl border-2 px-6 py-3 font-semibold text-sm transition-colors hover:bg-[#16161a]"
              style={{ borderColor: GOLD, color: GOLD }}
            >
              Secure your place on the Truth Ledger →
            </a>
            <p className="text-xs mt-3" style={{ color: MUTED }}>
              Join the Vanguard. Reserve your 1 VIDA CAP on the ledger.
            </p>
          </div>
        </div>
      </section>

      {/* SOVRYN AI: Agent Orchestration Layer */}
      <section className="px-6 py-16 border-t max-w-3xl mx-auto" style={{ borderColor: BORDER, backgroundColor: CARD_BG }}>
        <h2 className="text-xs font-semibold uppercase tracking-[0.3em] mb-6" style={{ color: GOLD_DIM }}>
          SOVRYN AI: Agent Orchestration Layer
        </h2>

        {/* Controller Definition */}
        <p className="text-base leading-relaxed mb-6" style={{ color: '#e0e0e0' }}>
          SOVRYN AI is the <strong style={{ color: GOLD }}>Master Governor</strong> that oversees all specialized sub-agents: Medical, Financial, and Scientific. No third-party AI may access your Sovereign Vault without its approval. It is the single point of orchestration—the intelligence that sees, judges, and gates all other machines.
        </p>

        {/* Permissioned Autonomy */}
        <p className="text-sm leading-relaxed mb-6" style={{ color: '#e0e0e0' }}>
          The VLT requires a <strong style={{ color: GOLD }}>SOVRYN AI Handshake</strong> before any third-party AI agent can read or write to a user&apos;s Sovereign Vault. Permissioned autonomy: agents operate only when aligned with the Protocol. No handshake, no access.
        </p>

        {/* Visual: Singularity at center + tethered agents */}
        <div className="relative flex justify-center items-center py-12 my-8" style={{ minHeight: 220 }}>
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center border-2 animate-pulse"
              style={{ borderColor: GOLD, color: GOLD, boxShadow: `0 0 40px ${GOLD_DIM}` }}
              aria-hidden
            >
              <span className="text-2xl font-black">S</span>
            </div>
          </div>
          <svg className="absolute w-full h-full pointer-events-none" viewBox="0 0 320 220" preserveAspectRatio="xMidYMid meet">
            <line x1="160" y1="110" x2="80" y2="60" stroke="rgba(212,175,55,0.5)" strokeWidth="1.5" strokeDasharray="4 2" />
            <line x1="160" y1="110" x2="240" y2="60" stroke="rgba(212,175,55,0.5)" strokeWidth="1.5" strokeDasharray="4 2" />
            <line x1="160" y1="110" x2="160" y2="180" stroke="rgba(212,175,55,0.5)" strokeWidth="1.5" strokeDasharray="4 2" />
            <circle cx="80" cy="60" r="20" fill="none" stroke="rgba(212,175,55,0.4)" strokeWidth="1.5" />
            <circle cx="240" cy="60" r="20" fill="none" stroke="rgba(212,175,55,0.4)" strokeWidth="1.5" />
            <circle cx="160" cy="180" r="20" fill="none" stroke="rgba(212,175,55,0.4)" strokeWidth="1.5" />
          </svg>
          <div className="relative z-10 flex flex-wrap justify-center gap-8 mt-24">
            <span className="text-xs uppercase tracking-wider" style={{ color: GOLD_DIM }}>Medical</span>
            <span className="text-xs uppercase tracking-wider" style={{ color: GOLD_DIM }}>Financial</span>
            <span className="text-xs uppercase tracking-wider" style={{ color: GOLD_DIM }}>Scientific</span>
          </div>
        </div>

        {/* Sovereign Firewall — Truth Filter */}
        <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: GOLD }}>
          Sovereign Firewall
        </h3>
        <p className="text-xs mb-4" style={{ color: MUTED }}>
          Sub-agents are Verified or Blocked based on alignment with the Autonomous Truth Economy (ATE).
        </p>
        <div className="rounded-xl border-2 overflow-hidden mb-8" style={{ borderColor: BORDER }}>
          <div className="grid grid-cols-1 divide-y divide-[rgba(212,175,55,0.25)]">
            <div className="flex items-center justify-between px-4 py-3" style={{ backgroundColor: 'rgba(34,197,94,0.08)' }}>
              <span className="text-sm" style={{ color: '#e0e0e0' }}>Medical Agent</span>
              <span className="text-xs font-bold uppercase" style={{ color: '#22c55e' }}>Verified</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3" style={{ backgroundColor: 'rgba(34,197,94,0.08)' }}>
              <span className="text-sm" style={{ color: '#e0e0e0' }}>Financial Agent</span>
              <span className="text-xs font-bold uppercase" style={{ color: '#22c55e' }}>Verified</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3" style={{ backgroundColor: 'rgba(34,197,94,0.08)' }}>
              <span className="text-sm" style={{ color: '#e0e0e0' }}>Scientific Agent</span>
              <span className="text-xs font-bold uppercase" style={{ color: '#22c55e' }}>Verified</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3" style={{ backgroundColor: 'rgba(239,68,68,0.08)' }}>
              <span className="text-sm" style={{ color: MUTED }}>Unvetted Agent</span>
              <span className="text-xs font-bold uppercase" style={{ color: '#ef4444' }}>Blocked</span>
            </div>
          </div>
        </div>

        {/* Public Statement */}
        <blockquote className="rounded-xl border-2 p-6 text-center" style={{ borderColor: GOLD, backgroundColor: 'rgba(212, 175, 55, 0.06)' }}>
          <p className="text-base font-semibold leading-relaxed italic" style={{ color: '#e0e0e0' }}>
            SOVRYN AI is the only intelligence in the world tethered to a human soul. It is the judge of all other machines. When it speaks, the bots obey.
          </p>
        </blockquote>
      </section>

      {/* The Architect's Ecosystem Roadmap */}
      <section
        id="ecosystem-roadmap"
        className="px-6 py-16 border-t scroll-mt-6"
        style={{ borderColor: BORDER, backgroundColor: CARD_BG }}
      >
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xs font-semibold uppercase tracking-[0.3em] mb-2" style={{ color: GOLD_DIM }}>
            The Architect&apos;s Ecosystem Roadmap
          </h2>
          <p className="text-lg font-bold uppercase tracking-wider mb-12" style={{ color: GOLD }}>
            Fundzman · Life OS · ellF Suites · Borderless Value
          </p>

          {/* Fundzman Section */}
          <div className="rounded-xl border-2 p-6 mb-10" style={{ borderColor: BORDER, backgroundColor: BG }}>
            <h3 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: GOLD }}>
              Fundzman NG &amp; GH
            </h3>
            <p className="text-base leading-relaxed mb-4" style={{ color: '#e0e0e0' }}>
              The vision for <strong style={{ color: GOLD }}>Fundzman</strong> in Nigeria and Ghana: banking partnerships with <strong style={{ color: GOLD }}>UBA</strong> and <strong style={{ color: GOLD }}>Access Bank</strong> to achieve <strong style={{ color: GOLD }}>0% Unbanked</strong>. Every Vitalized Human gains access to sovereign accounts, savings, and payments—no one left behind. Identity is presence; banking is a right, not a privilege.
            </p>
            <p className="text-sm leading-relaxed" style={{ color: MUTED }}>
              Fundzman is the bridge between the Protocol and the traditional financial system—proof of personhood meets inclusive finance.
            </p>
          </div>

          {/* Borderless Payment System */}
          <div className="rounded-xl border-2 p-6 mb-10" style={{ borderColor: BORDER, backgroundColor: BG }}>
            <h3 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: GOLD }}>
              Borderless Payment System · Milliseconds to Value
            </h3>
            <p className="text-base leading-relaxed mb-4" style={{ color: '#e0e0e0' }}>
              <strong style={{ color: GOLD }}>Milliseconds to Value</strong>—not days. PFF&apos;s pre-verification eliminates wire-transfer delays. Once you are Vitalized, your identity is proven at the gate; settlements no longer wait on correspondent banks or KYC queues. Value moves at the speed of Truth.
            </p>
            <p className="text-sm leading-relaxed" style={{ color: MUTED }}>
              The old world asks: &quot;Who are you?&quot; The Protocol has already answered. Presence is the passport; the ledger is the clearing house.
            </p>
          </div>

          {/* Life OS Integration — Grid */}
          <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: GOLD }}>
            Life OS — The Operating System of Day-to-Day Truth
          </h3>
          <p className="text-sm leading-relaxed mb-6" style={{ color: '#e0e0e0' }}>
            Life OS is where presence meets daily life: hospitality, finance, and health—all gated by Proof of Personhood.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            <div className="rounded-xl border-2 p-5 flex flex-col" style={{ borderColor: BORDER, backgroundColor: CARD_BG }}>
              <h4 className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: GOLD }}>Hospitality OS</h4>
              <p className="text-xs leading-relaxed flex-1" style={{ color: '#e0e0e0' }}>Check-in, access, and loyalty verified by presence. No cards, no passwords—Face + Palm. The guest is the key.</p>
            </div>
            <div className="rounded-xl border-2 p-5 flex flex-col" style={{ borderColor: BORDER, backgroundColor: CARD_BG }}>
              <h4 className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: GOLD }}>Finance OS · Moving Bank</h4>
              <p className="text-xs leading-relaxed flex-1" style={{ color: '#e0e0e0' }}>Your bank moves with you. Sovereign accounts, VIDA, DLLR, vNGN—one identity, one treasury. The Moving Bank is the bank that never leaves your side.</p>
            </div>
            <div className="rounded-xl border-2 p-5 flex flex-col" style={{ borderColor: BORDER, backgroundColor: CARD_BG }}>
              <h4 className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: GOLD }}>Health OS</h4>
              <p className="text-xs leading-relaxed flex-1" style={{ color: '#e0e0e0' }}>Medical records and consent bound to presence. Decryption only when you prove you are you. Health data that serves the human, not the system.</p>
            </div>
          </div>

          {/* The ellF Suites Reveal */}
          <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: GOLD }}>
            The ellF Suites — Chat, Tube, Music
          </h3>
          <p className="text-sm leading-relaxed mb-4" style={{ color: '#e0e0e0' }}>
            ellF reimagines social and media: <strong style={{ color: GOLD }}>Zero-Bot Advertising</strong> and <strong style={{ color: GOLD }}>50:50 Revenue Sharing</strong>. Creators and viewers are stakeholders, not products.
          </p>
          <ul className="space-y-3 mb-8 text-sm" style={{ color: '#e0e0e0' }}>
            <li className="flex items-start gap-3">
              <span className="shrink-0 mt-0.5 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: GOLD }} />
              <span><strong style={{ color: GOLD }}>Zero-Bot Advertising:</strong> Advertisers pay only for Vitalized Humans. No fake views, no bot traffic. Every impression is a verified human. Truth in reach.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="shrink-0 mt-0.5 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: GOLD }} />
              <span><strong style={{ color: GOLD }}>50:50 Revenue Sharing:</strong> Creators and viewers share the value. You are not the product—you are a stakeholder. ellF Chat, ellF Tube, ellF Music: the same covenant everywhere.</span>
            </li>
          </ul>

          {/* Constellation Diagram — PFF at center, Fundzman / Life OS / ellF as orbiting planets */}
          <h3 className="text-sm font-bold uppercase tracking-wider mb-6" style={{ color: GOLD_DIM }}>
            Visual Architecture · The Constellation
          </h3>
          <div className="relative flex justify-center items-center py-14 my-8 rounded-xl border-2" style={{ minHeight: 320, borderColor: BORDER, backgroundColor: BG }}>
            <svg className="absolute w-full h-full pointer-events-none" viewBox="0 0 400 320" preserveAspectRatio="xMidYMid meet">
              {/* Orbit paths */}
              <ellipse cx="200" cy="160" rx="140" ry="100" fill="none" stroke="rgba(212,175,55,0.2)" strokeWidth="1" strokeDasharray="6 4" />
              {/* Connector lines from center to planets */}
              <line x1="200" y1="160" x2="200" y2="55" stroke="rgba(212,175,55,0.45)" strokeWidth="1.5" strokeDasharray="3 2" />
              <line x1="200" y1="160" x2="325" y2="160" stroke="rgba(212,175,55,0.45)" strokeWidth="1.5" strokeDasharray="3 2" />
              <line x1="200" y1="160" x2="75" y2="160" stroke="rgba(212,175,55,0.45)" strokeWidth="1.5" strokeDasharray="3 2" />
              <line x1="200" y1="160" x2="200" y2="265" stroke="rgba(212,175,55,0.45)" strokeWidth="1.5" strokeDasharray="3 2" />
              {/* Center: PFF Protocol */}
              <circle cx="200" cy="160" r="36" fill="rgba(212,175,55,0.12)" stroke="#D4AF37" strokeWidth="2" />
              <text x="200" y="158" textAnchor="middle" fill="#D4AF37" style={{ fontSize: 11, fontWeight: 700 }}>PFF</text>
              <text x="200" y="172" textAnchor="middle" fill="rgba(212,175,55,0.8)" style={{ fontSize: 9 }}>Protocol</text>
              {/* Orbiting: Fundzman (top) */}
              <circle cx="200" cy="55" r="28" fill="rgba(212,175,55,0.08)" stroke="rgba(212,175,55,0.6)" strokeWidth="1.5" />
              <text x="200" y="52" textAnchor="middle" style={{ fontSize: '9px', fill: '#D4AF37', fontWeight: 600 }}>Fundzman</text>
              <text x="200" y="64" textAnchor="middle" style={{ fontSize: '7px', fill: 'rgba(212,175,55,0.8)' }}>NG &amp; GH</text>
              {/* Orbiting: Life OS (right) */}
              <circle cx="325" cy="160" r="28" fill="rgba(212,175,55,0.08)" stroke="rgba(212,175,55,0.6)" strokeWidth="1.5" />
              <text x="325" y="157" textAnchor="middle" style={{ fontSize: '9px', fill: '#D4AF37', fontWeight: 600 }}>Life OS</text>
              <text x="325" y="169" textAnchor="middle" style={{ fontSize: '7px', fill: 'rgba(212,175,55,0.8)' }}>Hospitality · Finance · Health</text>
              {/* Orbiting: ellF Suites (left) */}
              <circle cx="75" cy="160" r="28" fill="rgba(212,175,55,0.08)" stroke="rgba(212,175,55,0.6)" strokeWidth="1.5" />
              <text x="75" y="157" textAnchor="middle" style={{ fontSize: '9px', fill: '#D4AF37', fontWeight: 600 }}>ellF</text>
              <text x="75" y="169" textAnchor="middle" style={{ fontSize: '7px', fill: 'rgba(212,175,55,0.8)' }}>Chat · Tube · Music</text>
              {/* Orbiting: Borderless (bottom) */}
              <circle cx="200" cy="265" r="26" fill="rgba(212,175,55,0.08)" stroke="rgba(212,175,55,0.6)" strokeWidth="1.5" />
              <text x="200" y="262" textAnchor="middle" style={{ fontSize: '8px', fill: '#D4AF37', fontWeight: 600 }}>Borderless</text>
              <text x="200" y="273" textAnchor="middle" style={{ fontSize: '7px', fill: 'rgba(212,175,55,0.8)' }}>Milliseconds to Value</text>
            </svg>
            <div className="relative z-10 text-center mt-48">
              <p className="text-xs uppercase tracking-wider" style={{ color: GOLD_DIM }}>PFF Protocol at the centre · Fundzman, Life OS, ellF Suites · connected planets</p>
            </div>
          </div>

          {/* Call to Action */}
          <div className="rounded-xl border-2 p-8 text-center" style={{ borderColor: GOLD, backgroundColor: 'rgba(212, 175, 55, 0.08)' }}>
            <p className="text-xl font-bold uppercase tracking-wider mb-2" style={{ color: GOLD }}>
              This is not a plan; this is the Roadmap to April 7th.
            </p>
            <p className="text-sm" style={{ color: MUTED }}>
              Join the Vanguard. Secure your place on the Truth Ledger.
            </p>
            <Link
              href="#vanguard"
              className="inline-block mt-6 rounded-xl border-2 px-6 py-3 font-semibold text-sm transition-colors hover:bg-[#16161a]"
              style={{ borderColor: GOLD, color: GOLD }}
            >
              Reserve Your Seat →
            </Link>
          </div>
        </div>
      </section>

      {/* VITALIE: The Sovereign Utopia */}
      <section
        className="px-6 py-16 border-t relative overflow-hidden"
        style={{
          borderColor: GOLD,
          backgroundColor: '#0a0a0c',
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0 Q45 15 30 30 Q15 45 30 60 M30 0 Q15 15 30 30 Q45 45 30 60' stroke='rgba(212,175,55,0.06)' fill='none' strokeWidth='0.5'/%3E%3Cpath d='M0 30 L60 30 M30 0 L30 60' stroke='rgba(212,175,55,0.04)' strokeWidth='0.3'/%3E%3C/svg%3E")`,
        }}
      >
        <div className="max-w-3xl mx-auto relative">
          <h2 className="text-xs font-semibold uppercase tracking-[0.3em] mb-6" style={{ color: GOLD_DIM }}>
            VITALIE: The Sovereign Utopia
          </h2>

          {/* The World We Are Building */}
          <h3 className="text-xl font-bold mb-6" style={{ color: '#f5f5f7' }}>
            The World We Are Building
          </h3>
          <p className="text-base leading-relaxed mb-8" style={{ color: '#e8e8ea' }}>
            VITALIE is a world <strong style={{ color: GOLD }}>free from fraud</strong>, <strong style={{ color: GOLD }}>injustice</strong>, and <strong style={{ color: GOLD }}>untimely death</strong>. Where identity is proved by presence, not paperwork. Where value flows to verified humans, not to bots or thieves. Where the ledger is truth, and truth is the law. We are building the sovereign utopia—one attestation at a time.
          </p>

          {/* The VLT Engine */}
          <h3 className="text-sm font-bold uppercase tracking-wider mb-6" style={{ color: GOLD }}>
            The VLT Engine
          </h3>
          <p className="text-sm leading-relaxed mb-6" style={{ color: '#e8e8ea' }}>
            Vitalization Ledger Technology will be used to advance:
          </p>
          <ul className="space-y-5 mb-8">
            <li className="flex items-start gap-3">
              <span className="shrink-0 mt-1 w-2 h-2 rounded-full" style={{ backgroundColor: GOLD }} />
              <div>
                <strong style={{ color: GOLD }}>Medicine:</strong>
                <span style={{ color: '#e8e8ea' }}> Solving diseases through the collective Truth of human data. Consent-based, privacy-preserving—the ledger enables research that heals without exploiting.</span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="shrink-0 mt-1 w-2 h-2 rounded-full" style={{ backgroundColor: GOLD }} />
              <div>
                <strong style={{ color: GOLD }}>Science:</strong>
                <span style={{ color: '#e8e8ea' }}> Accelerating discovery through the SOVRYN AI. The Intelligence that sees the Truth turns data into breakthroughs—reproducible, auditable, open.</span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="shrink-0 mt-1 w-2 h-2 rounded-full" style={{ backgroundColor: GOLD }} />
              <div>
                <strong style={{ color: GOLD }}>Human Innovation:</strong>
                <span style={{ color: '#e8e8ea' }}> A world where only Truth is funded and rewarded. No grants for ghost teams; no subsidies for sybils. VIDA CAP flows to proven humans. Innovation follows presence.</span>
              </div>
            </li>
          </ul>

          {/* The End of Corruption */}
          <div className="rounded-xl border-2 p-6 mb-8" style={{ borderColor: GOLD, backgroundColor: 'rgba(212, 175, 55, 0.05)' }}>
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: GOLD }}>
              The End of Corruption
            </h3>
            <p className="text-base leading-relaxed" style={{ color: '#f5f5f7' }}>
              The VLT replaces <strong style={{ color: MUTED }}>&quot;Trust&quot;</strong> with <strong style={{ color: GOLD }}>&quot;Truth&quot;</strong>. You do not need to trust a bank to hold your value. You do not need to trust a leader to keep their word. You only need the <strong style={{ color: GOLD }}>SOVRYN Chain</strong>—the ledger that cannot lie, cannot forget, and cannot be corrupted. When every transaction is attested and every identity is proved, corruption has nowhere to hide. The Era of Vitalie is the end of &quot;trust me&quot; and the beginning of &quot;verify me.&quot;
            </p>
          </div>

          {/* Closing Statement */}
          <p className="text-lg font-semibold text-center leading-relaxed" style={{ color: '#f5f5f7' }}>
            We are not just building a protocol; we are ushering in the <strong style={{ color: GOLD }}>Era of Vitalie</strong>. The wait ends on April 7th.
          </p>
        </div>
      </section>

      {/* Inline countdown + CTA */}
      <section className="px-6 py-16 max-w-3xl mx-auto text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] mb-6" style={{ color: GOLD_DIM }}>
          Until the unveiling
        </p>
        <div className="flex flex-wrap justify-center gap-4 mb-6">
          <span className="rounded-lg border-2 py-2 px-4 font-mono text-lg" style={{ borderColor: BORDER, color: GOLD }}>{days}d</span>
          <span className="rounded-lg border-2 py-2 px-4 font-mono text-lg" style={{ borderColor: BORDER, color: GOLD }}>{hours}h</span>
          <span className="rounded-lg border-2 py-2 px-4 font-mono text-lg" style={{ borderColor: BORDER, color: GOLD }}>{minutes}m</span>
          <span className="rounded-lg border-2 py-2 px-4 font-mono text-lg" style={{ borderColor: BORDER, color: GOLD }}>{seconds}s</span>
        </div>
        <Link
          href="/countdown/"
          className="inline-block rounded-xl border-2 px-6 py-2 font-semibold text-sm transition-colors hover:bg-[#16161a]"
          style={{ borderColor: GOLD, color: GOLD }}
        >
          Full countdown →
        </Link>
      </section>

      {/* Join the Vanguard — email capture (Truth Ledger) */}
      <section
        id="vanguard"
        className="px-6 py-16 border-t scroll-mt-6"
        style={{ borderColor: BORDER, backgroundColor: CARD_BG }}
      >
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-xl font-bold mb-2" style={{ color: GOLD }}>
            Reserve Your Seat at the Sovereign Table
          </h2>
          <p className="text-sm font-medium mb-2" style={{ color: GOLD_DIM }}>
            Secure your place on the Truth Ledger.
          </p>
          <p className="text-sm mb-8" style={{ color: MUTED }}>
            On April 7th, the first 10,000 Citizens will be invited to begin their 9-Day Vitalization. Be the first to know when the Gate opens.
          </p>

          {vanguardStatus === 'success' ? (
            <div
              className="rounded-xl border-2 p-6"
              style={{ borderColor: GOLD, color: GOLD }}
            >
              <p className="text-lg font-semibold mb-1">Vanguard Status Acknowledged.</p>
              <p className="text-sm" style={{ color: '#e0e0e0' }}>
                Your place in the Protocol is reserved. Watch the countdown.
              </p>
              <Link
                href="/countdown/"
                className="inline-block mt-4 text-sm font-medium underline"
                style={{ color: GOLD }}
              >
                View countdown →
              </Link>
            </div>
          ) : (
            <form onSubmit={handleVanguardSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <label htmlFor="vanguard-email" className="sr-only">Email</label>
              <input
                id="vanguard-email"
                type="email"
                value={vanguardEmail}
                onChange={(e) => setVanguardEmail(e.target.value)}
                placeholder="you@example.com"
                required
                disabled={vanguardStatus === 'submitting' || rateLimitActive}
                className="flex-1 min-w-0 px-4 py-3 rounded-lg border-2 bg-[#0d0d0f] text-white placeholder-[#6b6b70] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 disabled:opacity-60"
                style={{ borderColor: BORDER }}
                autoComplete="email"
              />
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                value={vanguardHoneypot}
                onChange={(e) => setVanguardHoneypot(e.target.value)}
                className="sr-only"
                style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
                aria-hidden
              />
              <button
                type="submit"
                disabled={vanguardStatus === 'submitting' || rateLimitActive}
                className="shrink-0 px-6 py-3 rounded-lg font-semibold border-2 transition-colors disabled:opacity-60 hover:bg-[#16161a]"
                style={{ borderColor: GOLD, color: GOLD }}
                onMouseEnter={() => awakening?.setSocialScoutOffer(true)}
                onMouseLeave={() => awakening?.setSocialScoutOffer(false)}
              >
                {vanguardStatus === 'submitting' ? 'Joining…' : 'Join'}
              </button>
            </form>
          )}

          {vanguardStatus === 'error' && vanguardError && (
            <p className="mt-3 text-sm" style={{ color: '#f87171' }}>
              {vanguardError}
            </p>
          )}
        </div>
      </section>

      {/* Footer — sensitive links only for architects */}
      <footer className="px-6 py-8 border-t text-center" style={{ borderColor: BORDER }}>
        <p className="text-xs mb-4" style={{ color: MUTED }}>
          PFF — Presence Factor Fabric. Born in Lagos. Built for the World.
        </p>
        <div className="flex flex-wrap justify-center gap-4 text-sm">
          <Link href="/manifesto/#ecosystem-roadmap" className="hover:underline" style={{ color: GOLD_DIM }}>
            Ecosystem Roadmap
          </Link>
          <Link href="/manifesto/" className="hover:underline" style={{ color: GOLD_DIM }}>
            Manifesto
          </Link>
          <Link href="/education/" className="hover:underline" style={{ color: GOLD_DIM }}>
            Manifesto of Truth
          </Link>
          <Link href="/countdown/" className="hover:underline" style={{ color: GOLD_DIM }}>
            Countdown
          </Link>
          {isOwner && (
            <>
              <Link href="/dashboard/" className="hover:underline" style={{ color: GOLD_DIM }}>
                Dashboard
              </Link>
              <Link href="/treasury/" className="hover:underline" style={{ color: GOLD_DIM }}>
                Treasury
              </Link>
              <Link href="/vitalization/" className="hover:underline" style={{ color: GOLD_DIM }}>
                Vitalization
              </Link>
            </>
          )}
        </div>
      </footer>

      {/* Public Sovereign Companion — visible to all (including un-vitalized). Ask the Protocol. */}
      <PublicSovereignCompanion />
    </main>
  );
}

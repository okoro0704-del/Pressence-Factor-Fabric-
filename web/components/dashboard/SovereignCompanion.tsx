'use client';

/**
 * Sovereign Companion — AI avatar with pulsing aura.
 * - Integration: Rendered on Dashboard (DashboardContent); appears as sleek pulsing aura + AI avatar.
 * - Daily Briefing: As soon as app opens, speaks (text + voice): "Welcome, Architect. You are on Day X of 9. Your daily $100 is ready for Palm-Vitalization."
 * - Real-time: Watches spendable_vida; when credit hits, congratulates: "Identity confirmed. Your Personal Treasury has been credited."
 * - Eyes: Guides during Face Pulse and Palm Scan with verbal cues ("Move closer", "Hold still") via CompanionEyes in layout.
 * - Connection errors: Failed API calls replaced with local Sovereign Intelligence (fallback briefing, no throw on poll).
 */

import { useState, useEffect, useRef } from 'react';
import { JetBrains_Mono } from 'next/font/google';
import { useSovereignCompanion } from '@/contexts/SovereignCompanionContext';
import { getVitalizationStatus, STREAK_TARGET } from '@/lib/vitalizationRitual';
import { getSpendableVidaFromProfile } from '@/lib/treasuryProfile';
import { SovrynCompanion } from './SovrynCompanion';

const jetbrains = JetBrains_Mono({ weight: ['400', '600', '700'], subsets: ['latin'] });

const GOLD = '#D4AF37';

/** Default briefing when Supabase / API is offline (local Sovereign Intelligence). */
const FALLBACK_BRIEFING = 'Welcome, Architect. Your daily $100 is ready for Palm-Vitalization.';

export interface SovereignCompanionProps {
  userName: string;
  phoneNumber: string | null;
  onScrollToBalance?: () => void;
  onOpenSwapModal?: () => void;
  onShowVitalizationStatus?: () => void;
  onTriggerLockdown?: () => void;
}

/** Speak text via browser Speech Synthesis (local Sovereign Intelligence). */
function speakSovereign(text: string): void {
  if (typeof window === 'undefined' || !text?.trim()) return;
  try {
    const u = new SpeechSynthesisUtterance(text.trim());
    u.rate = 0.9;
    u.pitch = 1;
    u.volume = 1;
    u.lang = 'en-US';
    window.speechSynthesis?.cancel();
    window.speechSynthesis?.speak(u);
  } catch {
    // ignore
  }
}

export function SovereignCompanion({
  userName,
  phoneNumber,
  onScrollToBalance,
  onOpenSwapModal,
  onShowVitalizationStatus,
  onTriggerLockdown,
}: SovereignCompanionProps) {
  const { scanCue, creditJustHit, setCreditJustHit } = useSovereignCompanion();
  const [briefing, setBriefing] = useState<string>('');
  const [briefingSpoken, setBriefingSpoken] = useState(false);
  const prevSpendableRef = useRef<number | null>(null);
  const creditShownRef = useRef(false);

  // Daily Briefing (as soon as app opens): Day X of 9 — use local Sovereign Intelligence if getVitalizationStatus fails
  useEffect(() => {
    if (!phoneNumber?.trim()) {
      setBriefing('Welcome, Architect. Complete your daily Palm-Vitalization to unlock your treasury.');
      return;
    }
    let cancelled = false;
    getVitalizationStatus(phoneNumber)
      .then((status) => {
        if (cancelled) return;
        if (status?.unlocked) {
          setBriefing('Welcome, Architect. Identity Mastered. Your Sovereign Treasury is fully unlocked.');
        } else {
          const day = status?.streak ?? 0;
          setBriefing(
            `Welcome, Architect. You are on Day ${day} of ${STREAK_TARGET}. Your daily $100 is ready for Palm-Vitalization.`
          );
        }
      })
      .catch(() => {
        if (!cancelled) setBriefing(FALLBACK_BRIEFING);
      });
    return () => { cancelled = true; };
  }, [phoneNumber]);

  // Speak briefing once on mount (Sovereign Intelligence)
  useEffect(() => {
    if (!briefing || briefingSpoken) return;
    const t = setTimeout(() => {
      speakSovereign(briefing);
      setBriefingSpoken(true);
    }, 800);
    return () => clearTimeout(t);
  }, [briefing, briefingSpoken]);

  // Eyes: scan cues are spoken by CompanionEyes (in layout) so they work during Face/Palm scan on gate too.

  // Real-time: watch spendable_vida (and effective balance); when credit hits, congratulate — local fallback on errors
  useEffect(() => {
    if (!phoneNumber?.trim()) return;
    const poll = async () => {
      let spendable: number;
      try {
        spendable = await getSpendableVidaFromProfile(phoneNumber);
      } catch {
        return; // getSpendableVidaFromProfile returns default and does not throw; safeguard only
      }
      const prev = prevSpendableRef.current;
      prevSpendableRef.current = spendable;
      if (prev != null && spendable > prev && !creditShownRef.current) {
        creditShownRef.current = true;
        setCreditJustHit(true);
        speakSovereign('Identity confirmed. Your Personal Treasury has been credited.');
        setTimeout(() => setCreditJustHit(false), 8000);
      }
    };
    const id = setInterval(poll, 2500);
    poll();
    return () => clearInterval(id);
  }, [phoneNumber, setCreditJustHit]);

  return (
    <>
      <SovrynCompanion
        userName={userName}
        onScrollToBalance={onScrollToBalance}
        onOpenSwapModal={onOpenSwapModal}
        onShowVitalizationStatus={onShowVitalizationStatus}
        onTriggerLockdown={onTriggerLockdown}
      />

      {/* Sleek pulsing aura + AI avatar: always visible; briefing + credit + Eyes cues */}
      <div className="fixed bottom-28 right-8 z-[49] flex flex-col items-end gap-3 max-w-[300px]">
        {/* AI Avatar with pulsing aura — Companion "Eyes" presence */}
        <div className="relative flex items-center gap-2">
          <div
            className="absolute inset-0 rounded-full animate-[sovereignPulse_2.5s_ease-in-out_infinite] opacity-70"
            style={{
              width: 44,
              height: 44,
              marginLeft: -6,
              marginTop: -6,
              boxShadow: '0 0 30px rgba(212, 175, 55, 0.5), 0 0 60px rgba(212, 175, 55, 0.2)',
            }}
            aria-hidden
          />
          <div
            className="relative w-8 h-8 rounded-full flex items-center justify-center text-base border-2"
            style={{
              background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.25), rgba(201, 162, 39, 0.15))',
              borderColor: 'rgba(212, 175, 55, 0.6)',
              boxShadow: 'inset 0 0 12px rgba(212, 175, 55, 0.2)',
            }}
            title="Sovereign Companion"
          >
            <span className="opacity-90">◇</span>
          </div>
          <span className={`text-[10px] font-semibold uppercase tracking-widest ${jetbrains.className}`} style={{ color: GOLD }}>
            Companion
          </span>
        </div>

        {briefing && (
          <div
            className={`rounded-xl border-2 px-4 py-3 backdrop-blur-md ${jetbrains.className}`}
            style={{
              background: 'rgba(5, 5, 5, 0.92)',
              borderColor: 'rgba(212, 175, 55, 0.5)',
              boxShadow: '0 0 24px rgba(212, 175, 55, 0.15)',
            }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: GOLD }}>
              Daily Briefing
            </p>
            <p className="text-[11px] text-[#a0a0a5] leading-relaxed">{briefing}</p>
          </div>
        )}

        {creditJustHit && (
          <div
            className="rounded-xl border-2 px-4 py-3 backdrop-blur-md animate-in fade-in duration-300"
            style={{
              background: 'rgba(34, 197, 94, 0.12)',
              borderColor: 'rgba(34, 197, 94, 0.6)',
              boxShadow: '0 0 20px rgba(34, 197, 94, 0.2)',
            }}
          >
            <p className="text-xs font-bold text-[#22c55e]">Identity confirmed.</p>
            <p className="text-[11px] text-[#22c55e]/90 mt-0.5">
              Your Personal Treasury has been credited.
            </p>
          </div>
        )}

        {scanCue && (
          <div
            className="rounded-lg border px-3 py-2 backdrop-blur-md"
            style={{
              background: 'rgba(59, 130, 246, 0.12)',
              borderColor: 'rgba(59, 130, 246, 0.5)',
            }}
          >
            <p className="text-[10px] font-semibold text-[#3b82f6] uppercase tracking-wide">Eyes</p>
            <p className="text-[11px] font-medium text-[#3b82f6] mt-0.5">{scanCue}</p>
          </div>
        )}
      </div>
    </>
  );
}

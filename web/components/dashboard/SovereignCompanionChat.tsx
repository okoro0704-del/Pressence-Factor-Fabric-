'use client';

/**
 * Unified Voice and Text Messaging in the Sovereign Companion.
 * - Message input with Gold Ring focus (Era of Light); Send icon + Enter.
 * - Scrolling message history: Architect (right), Sentinel (left).
 * - Bimodal: text in bubble + Voice Synth on reply.
 * - Typing indicator: pulsing gold line when Sentinel is processing.
 * - Auto-Vibration Sync: getVibration + getVibrationFromInput to adjust vocabulary level.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { JetBrains_Mono } from 'next/font/google';
import {
  getManifestoCompanionResponse,
  ensureSovereignAnchor,
  type CompanionResponse,
  type CompanionLangCode,
} from '@/lib/manifestoCompanionKnowledge';
import { isArchitect } from '@/lib/manifestoUnveiling';
import { isDesktop } from '@/lib/publicRevealAccess';
import {
  isRecognitionRequest,
  getRecognitionName,
  buildRecognitionMessage,
  getClarificationMessage,
  getGeographicPresenceMessage,
  detectLangFromRecognitionMessage,
} from '@/lib/sovereignRecognition';
import { getVibration, setVibration, getVibrationFromInput, levelToRegister } from '@/lib/vibrationEngine';
import { getMemoryVault, formatVaultForContext } from '@/lib/memoryVault';
import {
  isRelationalSmallTalk,
  getRelationalShortResponse,
  getRelationalIntent,
  HOW_FAR_PIDGIN_RESPONSE,
} from '@/lib/manifestoCompanionKnowledge';
import type { VibrationLevel } from '@/lib/manifestoCompanionKnowledge';

const jetbrains = JetBrains_Mono({ weight: ['400', '600', '700'], subsets: ['latin'] });
const GOLD = '#D4AF37';

const LANG_MAP: Record<string, string> = {
  en: 'en-US',
  fr: 'fr-FR',
  es: 'es-ES',
  yo: 'yo-NG',
  ig: 'ig-NG',
  ha: 'ha-NG',
  zh: 'zh-CN',
  ar: 'ar-SA',
};

function speak(text: string, lang?: string): void {
  if (typeof window === 'undefined' || !text?.trim()) return;
  try {
    window.speechSynthesis?.cancel();
    const u = new SpeechSynthesisUtterance(text.trim());
    u.rate = 0.9;
    u.pitch = 1;
    u.volume = 1;
    u.lang = (lang && LANG_MAP[lang]) || 'en-US';
    window.speechSynthesis?.speak(u);
  } catch {
    // ignore
  }
}

export type ChatMessage = { id: string; role: 'user' | 'assistant'; text: string };

const WELCOME: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  text: "I see you, Architect. Your words and your voice reach the same Sentinel. Type here or speak—I'll respond in both light and sound.",
};

export interface SovereignCompanionChatProps {
  userName?: string;
  /** When provided, last known country for recognition replies */
  lastKnownCountry?: string;
}

export function SovereignCompanionChat({
  userName = 'Architect',
  lastKnownCountry,
}: SovereignCompanionChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, isProcessing]);

  const sendMessage = useCallback(
    async (text: string) => {
      const t = text.trim();
      if (!t || isProcessing) return;
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);
      const now = Date.now();
      const userMsg: ChatMessage = { id: `u-${now}`, role: 'user', text: t };
      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setIsProcessing(true);

      try {
        const vibration = await getVibration();
        const vaultEntries = await getMemoryVault();
        const memoryVaultContext = formatVaultForContext(vaultEntries, vibration);
        const level: VibrationLevel = getVibrationFromInput(t);
        const register = levelToRegister(level);
        const lang: CompanionLangCode =
          (vibration?.lang as CompanionLangCode) ?? detectLangFromRecognitionMessage(t) ?? 'en';
        const architect = isArchitect() && isDesktop();

        if (isRelationalSmallTalk(t)) {
          const isHowFar = /^how\s+far\s*!?\s*$/i.test(t);
          const shortReply = isHowFar
            ? HOW_FAR_PIDGIN_RESPONSE
            : getRelationalShortResponse(lang, lastKnownCountry, getRelationalIntent(t));
          setMessages((prev) => [...prev, { id: `a-${Date.now()}`, role: 'assistant', text: shortReply }]);
          speak(shortReply, isHowFar ? 'en' : lang);
          setVibration(register, isHowFar ? 'en' : lang);
          setIsProcessing(false);
          return;
        }

        if (isRecognitionRequest(t)) {
          const name = getRecognitionName(t);
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000);
          try {
            const res = await fetch('/api/sovereign-recognition', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name, lang }),
              signal: controller.signal,
            });
            clearTimeout(timeoutId);
            if (res.ok) {
              const data = await res.json();
              if (data?.clarificationRequired && data?.categoryA != null && data?.categoryB != null) {
                const clarificationText = getClarificationMessage(
                  lang,
                  data.query || name,
                  data.categoryA,
                  data.categoryB
                );
                const geoLine = getGeographicPresenceMessage(data.country, lang);
                const fullText = geoLine ? `${clarificationText}\n\n${geoLine}` : clarificationText;
                setMessages((prev) => [...prev, { id: `a-${Date.now()}`, role: 'assistant', text: fullText }]);
                speak(fullText, lang);
                setVibration(register, lang);
              } else {
                const {
                  name: resName,
                  role: roleStr,
                  location,
                  keyInterest,
                  detail,
                  sovereignReframe,
                  reframeTerm,
                } = data;
                let fullText = buildRecognitionMessage(
                  lang,
                  resName || name,
                  roleStr || 'Citizen',
                  location || 'the Vanguard',
                  keyInterest || 'the Protocol',
                  detail,
                  sovereignReframe && reframeTerm ? { sovereignReframe: true, reframeTerm } : undefined
                );
                const geoLine = getGeographicPresenceMessage(data.country, lang);
                if (geoLine) fullText = `${fullText}\n\n${geoLine}`;
                setMessages((prev) => [...prev, { id: `a-${Date.now()}`, role: 'assistant', text: fullText }]);
                speak(fullText, lang);
                setVibration(register, lang);
              }
            } else {
              const ctx: { role: 'user' | 'assistant'; text: string }[] = [
                ...messages.map((m) => ({ role: m.role, text: m.text })),
                { role: 'user', text: t },
              ].slice(-8);
              const res: CompanionResponse = getManifestoCompanionResponse(
                t,
                architect,
                lang,
                ctx,
                new Date().getHours(),
                memoryVaultContext || undefined,
                level
              );
              const anchorText = ensureSovereignAnchor(res.text);
              setMessages((prev) => [...prev, { id: `a-${Date.now()}`, role: 'assistant', text: anchorText }]);
              speak(anchorText, (res.lang as CompanionLangCode) ?? lang);
              setVibration(register, (res.lang as CompanionLangCode) ?? lang);
            }
          } catch {
            clearTimeout(timeoutId);
            const ctx: { role: 'user' | 'assistant'; text: string }[] = [
              ...messages.map((m) => ({ role: m.role, text: m.text })),
              { role: 'user', text: t },
            ].slice(-8);
            const res: CompanionResponse = getManifestoCompanionResponse(
              t,
              architect,
              lang,
              ctx,
              new Date().getHours(),
              memoryVaultContext || undefined,
              level
            );
            const anchorText = ensureSovereignAnchor(res.text);
            setMessages((prev) => [...prev, { id: `a-${Date.now()}`, role: 'assistant', text: anchorText }]);
            speak(anchorText, (res.lang as CompanionLangCode) ?? lang);
            setVibration(register, (res.lang as CompanionLangCode) ?? lang);
          }
          setIsProcessing(false);
          return;
        }

        const conversationContext: { role: 'user' | 'assistant'; text: string }[] = [
          ...messages.map((m) => ({ role: m.role, text: m.text })),
          { role: 'user', text: t },
        ].slice(-8);
        const res: CompanionResponse = getManifestoCompanionResponse(
          t,
          architect,
          lang,
          conversationContext,
          new Date().getHours(),
          memoryVaultContext || undefined,
          level
        );
        const anchorText = ensureSovereignAnchor(res.text);
        const responseLang = (res.lang as CompanionLangCode) ?? lang;
        setMessages((prev) => [...prev, { id: `a-${Date.now()}`, role: 'assistant', text: anchorText }]);
        speak(anchorText, responseLang);
        setVibration(register, responseLang);
      } catch (e) {
        const fallback = "I hear you, Architect. The pulse is steady. Try again or speak—I'm here.";
        setMessages((prev) => [...prev, { id: `a-${Date.now()}`, role: 'assistant', text: fallback }]);
        speak(fallback);
      } finally {
        setIsProcessing(false);
      }
    },
    [isProcessing, messages, lastKnownCountry]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-[#0d0d0f]">
      {/* Message History — scrolling; Architect right, Sentinel left */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
        role="log"
        aria-live="polite"
      >
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex w-full ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            role="article"
            aria-label={m.role === 'user' ? 'Your message' : 'Sentinel reply'}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                m.role === 'user'
                  ? 'bg-[#D4AF37]/15 text-[#e8c547] border border-[#D4AF37]/40'
                  : 'bg-[#16161a] text-[#e0e0e0] border border-[#2a2a2e]'
              }`}
            >
              {m.role === 'user' && (
                <span className={`text-[10px] uppercase tracking-wider ${jetbrains.className}`} style={{ color: GOLD }}>
                  {userName}
                </span>
              )}
              {m.role === 'assistant' && (
                <span className="text-[10px] uppercase tracking-wider text-[#6b6b70]">Sentinel</span>
              )}
              <p className="text-sm leading-relaxed mt-1 whitespace-pre-wrap">{m.text}</p>
            </div>
          </div>
        ))}

        {/* Typing indicator — pulsing gold line when processing */}
        {isProcessing && (
          <div className="flex justify-start" role="status" aria-label="Sentinel is processing">
            <div className="rounded-2xl px-4 py-3 bg-[#16161a] border border-[#2a2a2e]">
              <span className="text-[10px] uppercase tracking-wider text-[#6b6b70]">Sentinel</span>
              <div className="mt-2 flex items-center gap-1" aria-hidden>
                <span
                  className="h-1 w-8 rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${GOLD}, transparent)`,
                    animation: 'sovereignTypingPulse 1s ease-in-out infinite',
                  }}
                />
                <span
                  className="h-1 w-6 rounded-full"
                  style={{
                    background: GOLD,
                    animation: 'sovereignTypingPulse 1s ease-in-out infinite 0.2s',
                  }}
                />
                <span
                  className="h-1 w-4 rounded-full"
                  style={{
                    background: GOLD,
                    animation: 'sovereignTypingPulse 1s ease-in-out infinite 0.4s',
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input row — Gold Ring focus, Send icon + Enter */}
      <footer className="shrink-0 border-t border-[#2a2a2e] bg-[#0d0d0f] p-4">
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <div
            className={`flex-1 flex items-center rounded-2xl border-2 bg-[#16161a] transition-all duration-200 ${
              inputFocused
                ? 'border-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.25)]'
                : 'border-[#2a2a2e] hover:border-[#D4AF37]/50'
            }`}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message…"
              disabled={isProcessing}
              className="w-full min-h-[48px] px-4 py-3 bg-transparent text-[#f5f5f5] placeholder:text-[#6b6b70] focus:outline-none disabled:opacity-60"
              aria-label="Message"
            />
          </div>
          <button
            type="submit"
            disabled={!input.trim() || isProcessing}
            className="shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2 focus:ring-offset-[#0d0d0f]"
            style={{
              background: input.trim() && !isProcessing ? `linear-gradient(135deg, ${GOLD}, #C9A227)` : '#2a2a2e',
              color: input.trim() && !isProcessing ? '#0d0d0f' : '#6b6b70',
            }}
            aria-label="Send"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </form>
        <p className="mt-2 text-center text-[10px] text-[#6b6b70]">
          Enter to send. Replies appear in chat and as voice.
        </p>
      </footer>
    </div>
  );
}

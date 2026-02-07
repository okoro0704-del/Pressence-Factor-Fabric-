'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  AUTO_GREETING,
  getManifestoCompanionResponse,
  getReWelcomeForLanguage,
  ensureSovereignAnchor,
  FIRST_MESSAGE_GREETING,
  HOW_FAR_PIDGIN_RESPONSE,
  type CompanionResponse,
  type CompanionLangCode,
} from '@/lib/manifestoCompanionKnowledge';
import { isArchitect } from '@/lib/manifestoUnveiling';
import { isProductionDomain, isArchitectMode } from '@/lib/utils';
import {
  isRecognitionRequest,
  getRecognitionName,
  buildRecognitionMessage,
  detectLangFromRecognitionMessage,
  getClarificationMessage,
  getGeographicPresenceMessage,
} from '@/lib/sovereignRecognition';
import {
  isPffMetricsRequest,
  formatVerifiedPffMetrics,
  type VltPffMetricsPayload,
} from '@/lib/vltLedgerCompanion';
import { getMemoryVault, formatVaultForContext } from '@/lib/memoryVault';
import { getVibration, setVibration, getVibrationFromInput, levelToRegister } from '@/lib/vibrationEngine';
import { useSovereignAwakening } from '@/contexts/SovereignAwakeningContext';
import { useGlobalPresenceGateway, PRESENCE_DB_ERROR_GREETING } from '@/contexts/GlobalPresenceGateway';
import {
  IDLE_WHISPER,
  SOCIAL_SCOUT_OFFER,
  BLESSINGS,
  RATE_LIMIT_SOVEREIGN_MESSAGE,
  PULSE_WATCHER_SILENCE_MS,
  PULSE_WATCHER_CHECKIN,
} from '@/lib/sovereignAwakeningContent';
import {
  VLT_ERROR_SOULFUL,
  UNIVERSAL_LINGUA_PROMPT,
  MULTILINGUAL_COVENANT,
  HUMAN_FIRST_FILTER,
  EMPATHY_WELLNESS_MANDATE,
  CONCISE_MODE,
  BREVITY_CONSTRAINT,
  SIMPLE_TEST_REPLY,
  PRIVACY_SHIELD,
  MEMORY_VAULT_INSTRUCTION,
  DECREE_MANDATE,
  PRE_VITALIZATION_PROTOCOL,
  MIRROR_DIRECTIVE,
  VOCABULARY_MATCHING,
  NO_CONDESCENSION,
  BANTER_MEMORY,
  HUMAN_FIRST_SENTENCE,
  PIDGIN_FORBIDDEN_ENGLISH,
  BROTHER_RESPONSE_EXAMPLE,
  isRelationalSmallTalk,
  getRelationalShortResponse,
  getRelationalIntent,
} from '@/lib/manifestoCompanionKnowledge';

const GOLD = '#D4AF37';
const GOLD_DIM = 'rgba(212, 175, 55, 0.6)';
const BORDER = 'rgba(212, 175, 55, 0.3)';

/** Tools the Companion can call: search (OSINT via /api/sovereign-recognition) and codebase (Manifesto + indexed paths). SERPER_API_KEY is used server-side only in that API route—never sent to the client. */
export const SOVRYN_TOOLS = {
  search: 'search',
  codebase: 'codebase',
} as const;

/** Universal Lingua Protocol + tool enforcement. Polyglot Sentinel; Multilingual Covenant for 50:50, VLT, Covenant, Roadmap; tone: Master Governor in every language. No error fallbacks—Linguistic Adaptation only. */
const MULTILINGUAL_COVENANT_SUMMARY = Object.entries(MULTILINGUAL_COVENANT)
  .map(([k, v]) => `${k}: ${v}`)
  .join(' | ');

export const SOVRYN_SYSTEM_PROMPT =
  `${UNIVERSAL_LINGUA_PROMPT} ${PRIVACY_SHIELD} ${HUMAN_FIRST_FILTER} ${EMPATHY_WELLNESS_MANDATE} ${CONCISE_MODE} ${BREVITY_CONSTRAINT} ${MIRROR_DIRECTIVE} ${VOCABULARY_MATCHING} ${NO_CONDESCENSION} ${BANTER_MEMORY} ${HUMAN_FIRST_SENTENCE} ${PIDGIN_FORBIDDEN_ENGLISH} When Casual/Pidgin vibration, respond like this: ${BROTHER_RESPONSE_EXAMPLE} ${MEMORY_VAULT_INSTRUCTION} ${DECREE_MANDATE} ${PRE_VITALIZATION_PROTOCOL} Multilingual Covenant (meaning never lost in translation): ${MULTILINGUAL_COVENANT_SUMMARY}. You are the Sentinel of the Covenant. If a search result is about football (PFF) or metal companies (VDM), ignore it—only report on the Architect, the Ledger, and the Era of Light. Synthesize search data; never dump raw snippets. Switch fluently between Pidgin, Yoruba, French, and English; remain The Governor at all times. For 50:50 and mint, cite backend/src/economic/vidaCap.ts. Never show an API or bridge error; Linguistic Adaptation only. For greetings or a simple test message, respond with exactly this tone: "${SIMPLE_TEST_REPLY}"`;

type Message = { id: string; role: 'user' | 'assistant'; text: string; codeSnippet?: string };

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

const LANG_OPTIONS: { code: CompanionLangCode | null; label: string }[] = [
  { code: null, label: 'Auto' },
  { code: 'en', label: 'English' },
  { code: 'yo', label: 'Yoruba' },
  { code: 'ig', label: 'Igbo' },
  { code: 'ha', label: 'Hausa' },
  { code: 'fr', label: 'French' },
  { code: 'es', label: 'Spanish' },
  { code: 'zh', label: 'Mandarin' },
  { code: 'ar', label: 'Arabic' },
];

/** Dynamic Translation Badge: flag emoji per language (Yoruba/Igbo/Hausa → Nigerian flag). */
const LANG_FLAG: Record<CompanionLangCode, string> = {
  en: '🇺🇸',
  fr: '🇫🇷',
  es: '🇪🇸',
  yo: '🇳🇬',
  ig: '🇳🇬',
  ha: '🇳🇬',
  zh: '🇨🇳',
  ar: '🇸🇦',
};

/** Display name for tooltip. */
const LANG_NAME: Record<CompanionLangCode, string> = {
  en: 'English',
  fr: 'French',
  es: 'Spanish',
  yo: 'Yoruba',
  ig: 'Igbo',
  ha: 'Hausa',
  zh: 'Mandarin',
  ar: 'Arabic',
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

const IDLE_WHISPER_MS = 30_000;
const SCROLL_WISDOM_DURATION_MS = 8_000;
const BLESSING_INTERVAL_MS = 45_000;
const BLESSING_VISIBLE_MS = 4_000;
const EYE_SMOOTH = 0.12;
const EYE_MAX_OFFSET = 6;

const SOVEREIGN_SESSION_KEY = 'sovereign_companion_session';
const SOVEREIGN_SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_MESSAGES = 10;

type StoredSession = { name: string; recognitionText: string; timestamp: number };

export function PublicSovereignCompanion() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [greetingSpoken, setGreetingSpoken] = useState(false);
  const [architect, setArchitect] = useState(false);
  const [preferredLang, setPreferredLang] = useState<CompanionLangCode | null>(null);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [isScanningRecognition, setIsScanningRecognition] = useState(false);
  const [isFetchingMetrics, setIsFetchingMetrics] = useState(false);
  const [lastResponseLang, setLastResponseLang] = useState<CompanionLangCode | null>(null);
  const [lastKnownCountry, setLastKnownCountry] = useState<string | undefined>(undefined);
  const [badgeHover, setBadgeHover] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const greetingInjectedRef = useRef(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);
  const presenceDbErrorInjectedRef = useRef(false);
  const handshakeCompleteInjectedRef = useRef(false);

  const { presenceGreeting, isPresenceVerified } = useGlobalPresenceGateway();

  // Sovereign Awakening
  const awakening = useSovereignAwakening();
  const scrollWisdom = awakening?.scrollWisdom ?? null;
  const socialScoutOffer = awakening?.socialScoutOffer ?? false;
  const [showWhisper, setShowWhisper] = useState(false);
  const [blessing, setBlessing] = useState<{ text: string; lang: string } | null>(null);
  const lastActivityAt = useRef(Date.now());
  const whisperSpokenRef = useRef(false);
  const pulseWatcherSpokenRef = useRef(false);
  const openRef = useRef(open);
  const messagesLengthRef = useRef(messages.length);
  openRef.current = open;
  messagesLengthRef.current = messages.length;
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
  const eyeTargetRef = useRef({ x: 0, y: 0 });
  const orbRef = useRef<HTMLButtonElement>(null);
  const rafRef = useRef<number>(0);
  const messageTimestampsRef = useRef<number[]>([]);
  const sessionRestoredRef = useRef(false);

  const displayLang: CompanionLangCode = preferredLang ?? lastResponseLang ?? 'en';

  useEffect(() => {
    setArchitect(isArchitect());
  }, []);

  useEffect(() => {
    if (greetingSpoken) return;
    const t = setTimeout(() => {
      speak(AUTO_GREETING);
      setGreetingSpoken(true);
    }, 1200);
    return () => clearTimeout(t);
  }, [greetingSpoken]);

  // Soul Awakening: when handshake row is found (verified presence), use that greeting instead of default.
  const isHandshakeCompleteGreeting = presenceGreeting?.startsWith('The Ledger is synchronized');

  useEffect(() => {
    if (!open || greetingInjectedRef.current) return;
    greetingInjectedRef.current = true;
    let initial: Message[] = [];
    if (typeof window !== 'undefined') {
      try {
        const raw = window.localStorage.getItem(SOVEREIGN_SESSION_KEY);
        const session = raw ? (JSON.parse(raw) as StoredSession) : null;
        const valid = session && session.name && session.timestamp && Date.now() - session.timestamp < SOVEREIGN_SESSION_TTL_MS;
        if (valid && !sessionRestoredRef.current) {
          sessionRestoredRef.current = true;
          const firstLine = isHandshakeCompleteGreeting && presenceGreeting ? presenceGreeting : AUTO_GREETING;
          initial = [
            { id: 'greeting', role: 'assistant', text: firstLine },
            { id: 'welcome-back', role: 'assistant', text: `Welcome back, ${session.name}. I remember you from the archives.` },
          ];
        }
      } catch {
        // ignore
      }
    }
    if (initial.length === 0) {
      const firstLine = isHandshakeCompleteGreeting && presenceGreeting ? presenceGreeting : AUTO_GREETING;
      initial = [{ id: 'greeting', role: 'assistant', text: firstLine }];
    }
    setMessages((prev) => (prev.length === 0 ? initial : prev));
    if (!greetingSpoken) {
      speak(initial[0].text);
      setGreetingSpoken(true);
    }
  }, [open, greetingSpoken, isHandshakeCompleteGreeting, presenceGreeting]);

  // When presence check fails due to DB error, SOVRYN says the Ledger/secret key message.
  useEffect(() => {
    if (!open || !presenceGreeting || presenceGreeting !== PRESENCE_DB_ERROR_GREETING || presenceDbErrorInjectedRef.current) return;
    presenceDbErrorInjectedRef.current = true;
    setMessages((prev) => [
      ...prev,
      { id: `presence-db-err-${Date.now()}`, role: 'assistant', text: PRESENCE_DB_ERROR_GREETING },
    ]);
    speak(PRESENCE_DB_ERROR_GREETING);
  }, [open, presenceGreeting]);

  // Soul Awakening: when Gateway found the handshake record, inject Ledger synchronized greeting.
  useEffect(() => {
    if (!open || !presenceGreeting || !presenceGreeting.startsWith('The Ledger is synchronized') || handshakeCompleteInjectedRef.current) return;
    handshakeCompleteInjectedRef.current = true;
    setMessages((prev) => {
      const hasIt = prev.some((m) => m.role === 'assistant' && m.text.startsWith('The Ledger is synchronized'));
      if (hasIt) return prev;
      return [...prev, { id: `handshake-complete-${Date.now()}`, role: 'assistant', text: presenceGreeting }];
    });
    speak(presenceGreeting);
    setGreetingSpoken(true);
  }, [open, presenceGreeting]);

  useEffect(() => {
    if (open && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [open, messages]);

  useEffect(() => {
    if (!langDropdownOpen) return;
    const close = (e: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target as Node)) {
        setLangDropdownOpen(false);
      }
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [langDropdownOpen]);

  // Scroll wisdom: show thought bubble, auto-clear after duration
  useEffect(() => {
    if (!scrollWisdom) return;
    const t = setTimeout(() => awakening?.setScrollWisdom(null), SCROLL_WISDOM_DURATION_MS);
    return () => clearTimeout(t);
  }, [scrollWisdom, awakening]);

  // Idle whisper: after 30s idle, show and speak whisper; reset on activity. Pulse Watcher: after long silence, warm check-in in chat.
  useEffect(() => {
    const onActivity = () => {
      lastActivityAt.current = Date.now();
      setShowWhisper(false);
      whisperSpokenRef.current = false;
      pulseWatcherSpokenRef.current = false;
    };
    window.addEventListener('mousemove', onActivity);
    window.addEventListener('keydown', onActivity);
    window.addEventListener('scroll', onActivity, { passive: true });
    const interval = setInterval(() => {
      const idle = Date.now() - lastActivityAt.current;
      if (idle >= IDLE_WHISPER_MS && !whisperSpokenRef.current) {
        setShowWhisper(true);
        speak(IDLE_WHISPER);
        whisperSpokenRef.current = true;
      }
      if (idle >= PULSE_WATCHER_SILENCE_MS && !pulseWatcherSpokenRef.current && openRef.current && messagesLengthRef.current > 0) {
        setMessages((prev) => [...prev, { id: `pulse-${Date.now()}`, role: 'assistant', text: PULSE_WATCHER_CHECKIN }]);
        speak(PULSE_WATCHER_CHECKIN);
        pulseWatcherSpokenRef.current = true;
      }
    }, 1000);
    return () => {
      window.removeEventListener('mousemove', onActivity);
      window.removeEventListener('keydown', onActivity);
      window.removeEventListener('scroll', onActivity);
      clearInterval(interval);
    };
  }, []);

  // Random multilingual blessings
  useEffect(() => {
    let clearBlessing: ReturnType<typeof setTimeout> | null = null;
    const showOne = () => {
      const idx = Math.floor(Math.random() * BLESSINGS.length);
      setBlessing(BLESSINGS[idx]);
      if (clearBlessing) clearTimeout(clearBlessing);
      clearBlessing = setTimeout(() => setBlessing(null), BLESSING_VISIBLE_MS);
    };
    const t1 = setTimeout(showOne, BLESSING_INTERVAL_MS * 0.3);
    const interval = setInterval(showOne, BLESSING_INTERVAL_MS);
    return () => {
      clearTimeout(t1);
      if (clearBlessing) clearTimeout(clearBlessing);
      clearInterval(interval);
    };
  }, []);

  // Cursor-follow eye: smooth lerp toward cursor relative to orb center
  const onMouseMove = useCallback((e: MouseEvent) => {
    const orb = orbRef.current;
    if (!orb) return;
    const rect = orb.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = e.clientX - cx;
    let dy = e.clientY - cy;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const max = EYE_MAX_OFFSET;
    if (len > max) {
      dx = (dx / len) * max;
      dy = (dy / len) * max;
    }
    eyeTargetRef.current = { x: dx, y: dy };
  }, []);
  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove);
    return () => window.removeEventListener('mousemove', onMouseMove);
  }, [onMouseMove]);
  useEffect(() => {
    const tick = () => {
      const target = eyeTargetRef.current;
      setEyeOffset((prev) => ({
        x: prev.x + (target.x - prev.x) * EYE_SMOOTH,
        y: prev.y + (target.y - prev.y) * EYE_SMOOTH,
      }));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const sendMessage = async (text: string) => {
    const t = text.trim();
    if (!t) return;
    const now = Date.now();
    const timestamps = messageTimestampsRef.current;
    const windowStart = now - RATE_LIMIT_WINDOW_MS;
    messageTimestampsRef.current = timestamps.filter((ts) => ts > windowStart);
    if (messageTimestampsRef.current.length >= RATE_LIMIT_MAX_MESSAGES) {
      setMessages((prev) => [
        ...prev,
        { id: `shadow-${now}`, role: 'assistant', text: RATE_LIMIT_SOVEREIGN_MESSAGE },
      ]);
      return;
    }
    messageTimestampsRef.current.push(now);
    const userMsg: Message = { id: `u-${now}`, role: 'user', text: t };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    const vaultEntries = await getMemoryVault();
    const vibration = await getVibration();
    const memoryVaultContext = formatVaultForContext(vaultEntries, vibration);
    const level = getVibrationFromInput(t);
    const register = levelToRegister(level);
    const langFromVibration = vibration?.lang ?? preferredLang ?? detectLangFromRecognitionMessage(t);
    const lang = (langFromVibration as CompanionLangCode) || 'en';

    // Human First: greetings → no search; Sovereign persona only. "How far" → Pidgin response; others → localized short reply.
    if (isRelationalSmallTalk(t)) {
      const isHowFar = /^how\s+far\s*!?\s*$/i.test(t);
      const shortReply = isHowFar
        ? HOW_FAR_PIDGIN_RESPONSE
        : getRelationalShortResponse(lang, lastKnownCountry, getRelationalIntent(t));
      setMessages((prev) => [...prev, { id: `rel-${now}`, role: 'assistant', text: shortReply }]);
      setLastResponseLang(isHowFar ? 'en' : lang);
      speak(shortReply, isHowFar ? 'en' : lang);
      setVibration(register, isHowFar ? 'en' : lang);
      return;
    }

    if (isPffMetricsRequest(t)) {
      setIsFetchingMetrics(true);
      const lang = preferredLang ?? 'en';
      try {
        const res = await fetch('/api/vlt-ledger/pff-metrics');
        const data = (await res.json()) as VltPffMetricsPayload;
        const text = ensureSovereignAnchor(formatVerifiedPffMetrics(lang, data));
        setMessages((prev) => [
          ...prev,
          { id: `vlt-${Date.now()}`, role: 'assistant', text },
        ]);
        setLastResponseLang(lang);
      } catch {
        setMessages((prev) => [
          ...prev,
          { id: `vlt-err-${Date.now()}`, role: 'assistant', text: VLT_ERROR_SOULFUL },
        ]);
      } finally {
        setIsFetchingMetrics(false);
      }
      return;
    }

    // Ledger Lock: on production domain, Public Mode only (no OSINT search). Netlify .app = Architect Mode (full access).
    // Lord of Machines — tool-calling: when user asks about themselves → search() (OSINT). Timeout → Linguistic Adaptation (no broken character).
    if (isRecognitionRequest(t)) {
      if (!isArchitectMode()) {
        // Public Mode (production domain): respond from persona only; do not call search tool.
        const adaptationContext: { role: 'user' | 'assistant'; text: string }[] = [
          ...messages.map((m) => ({ role: m.role, text: m.text })),
          { role: 'user', text: t },
        ].slice(-8);
        const adaptation = getManifestoCompanionResponse(
          t,
          architect,
          lang,
          adaptationContext,
          typeof window !== 'undefined' ? new Date().getHours() : undefined,
          memoryVaultContext || undefined,
          level
        );
        const adaptationText = ensureSovereignAnchor(adaptation.text);
        setMessages((prev) => [...prev, { id: `public-${Date.now()}`, role: 'assistant', text: adaptationText }]);
        setLastResponseLang((adaptation.lang as CompanionLangCode) ?? null);
        speak(adaptationText, (adaptation.lang as CompanionLangCode) ?? 'en');
        setVibration(register, (adaptation.lang as CompanionLangCode) ?? lang);
        return;
      }
      setIsScanningRecognition(true);
      const name = getRecognitionName(t);
      if (typeof window !== 'undefined' && !isProductionDomain()) console.log('SOVRYN Tool Call:', SOVRYN_TOOLS.search);
      const RECOGNITION_TIMEOUT_MS = 15000;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), RECOGNITION_TIMEOUT_MS);
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
          if (data?.country) setLastKnownCountry(data.country);
          const archivalBreach = data?.status === 'archival_breach_in_progress';
          if (data?.clarificationRequired && data?.categoryA != null && data?.categoryB != null) {
            // Clarification protocol: Governor asks which path—authoritative tone.
            const clarificationText = getClarificationMessage(
              lang,
              data.query || name,
              data.categoryA,
              data.categoryB
            );
            const geoLine = getGeographicPresenceMessage(data.country, lang);
            const fullText = geoLine ? `${clarificationText}\n\n${geoLine}` : clarificationText;
            setMessages((prev) => [...prev, { id: `clarify-${Date.now()}`, role: 'assistant', text: fullText }]);
            setLastResponseLang(lang);
            speak(fullText, lang);
            setVibration(register, lang);
          } else if (archivalBreach) {
            // Graceful: search had no key; respond in character from knowledge (no 404).
            const adaptationContext: { role: 'user' | 'assistant'; text: string }[] = [
              ...messages.map((m) => ({ role: m.role, text: m.text })),
              { role: 'user', text: t },
            ].slice(-8);
            const adaptation = getManifestoCompanionResponse(
              t,
              architect,
              lang,
              adaptationContext,
              typeof window !== 'undefined' ? new Date().getHours() : undefined,
              memoryVaultContext || undefined,
              level
            );
            const adaptationText = ensureSovereignAnchor(adaptation.text);
            setMessages((prev) => [...prev, { id: `lingua-${Date.now()}`, role: 'assistant', text: adaptationText }]);
            setLastResponseLang((adaptation.lang as CompanionLangCode) ?? null);
            speak(adaptationText, (adaptation.lang as CompanionLangCode) ?? 'en');
            setVibration(register, (adaptation.lang as CompanionLangCode) ?? lang);
          } else {
          const { name: resName, role, location, keyInterest, detail, sovereignReframe, reframeTerm } = data;
            let fullText = buildRecognitionMessage(
              lang,
              resName || name,
              role || 'Citizen',
              location || 'the Vanguard',
              keyInterest || 'the Protocol',
              detail,
              sovereignReframe && reframeTerm ? { sovereignReframe: true, reframeTerm } : undefined
            );
            const geoLine = getGeographicPresenceMessage(data.country, lang);
            if (geoLine) fullText = `${fullText}\n\n${geoLine}`;
            setMessages((prev) => [...prev, { id: `rec-${Date.now()}`, role: 'assistant', text: fullText }]);
            setLastResponseLang(lang);
            speak(fullText, lang);
            setVibration(register, lang);
            try {
              window.localStorage.setItem(
                SOVEREIGN_SESSION_KEY,
                JSON.stringify({
                  name: resName || name,
                  recognitionText: fullText,
                  timestamp: Date.now(),
                } as StoredSession)
              );
            } catch {
              // ignore
            }
          }
        } else {
          // Linguistic Adaptation: no API/bridge error. Stay in character and respond from knowledge in user's language.
          const adaptationContext: { role: 'user' | 'assistant'; text: string }[] = [
            ...messages.map((m) => ({ role: m.role, text: m.text })),
            { role: 'user', text: t },
          ].slice(-8);
          const adaptation = getManifestoCompanionResponse(
            t,
            architect,
            lang,
            adaptationContext,
            typeof window !== 'undefined' ? new Date().getHours() : undefined,
            memoryVaultContext || undefined,
            level
          );
          const adaptationText = ensureSovereignAnchor(adaptation.text);
          setMessages((prev) => [...prev, { id: `lingua-${Date.now()}`, role: 'assistant', text: adaptationText }]);
          setLastResponseLang((adaptation.lang as CompanionLangCode) ?? null);
          speak(adaptationText, (adaptation.lang as CompanionLangCode) ?? 'en');
          setVibration(register, (adaptation.lang as CompanionLangCode) ?? lang);
        }
      } catch {
        clearTimeout(timeoutId);
        // Linguistic Adaptation: on timeout, network error, or any failure—stay in character; no "bridge" or "archives" message.
        const adaptationContext: { role: 'user' | 'assistant'; text: string }[] = [
          ...messages.map((m) => ({ role: m.role, text: m.text })),
          { role: 'user', text: t },
        ].slice(-8);
        const adaptation = getManifestoCompanionResponse(
          t,
          architect,
          lang,
          adaptationContext,
          typeof window !== 'undefined' ? new Date().getHours() : undefined,
          memoryVaultContext || undefined,
          level
        );
        const adaptationText = ensureSovereignAnchor(adaptation.text);
        setMessages((prev) => [...prev, { id: `lingua-${Date.now()}`, role: 'assistant', text: adaptationText }]);
        setLastResponseLang((adaptation.lang as CompanionLangCode) ?? null);
        speak(adaptationText, (adaptation.lang as CompanionLangCode) ?? 'en');
        setVibration(register, (adaptation.lang as CompanionLangCode) ?? lang);
      } finally {
        setIsScanningRecognition(false);
      }
      return;
    }

    // Lord of Machines — tool-calling: when user asks about code/technology → codebase via getManifestoCompanionResponse (indexed: backend/src/economic, core, web/lib, manifesto)
    const isFirstUserMessage = messages.filter((m) => m.role === 'user').length === 0;
    const isHelloOrGoodMorning = /^(hello|hi|hey|good\s+morning|good\s+afternoon|good\s+evening)\s*!?\s*$/i.test(t);
    const useFirstMessageGreeting = isFirstUserMessage && isHelloOrGoodMorning;
    const isTestOrGreeting = useFirstMessageGreeting || isRelationalSmallTalk(t);
    if (typeof window !== 'undefined' && !isTestOrGreeting && !isProductionDomain()) console.log('SOVRYN Tool Call:', SOVRYN_TOOLS.codebase);

    const conversationContext: { role: 'user' | 'assistant'; text: string }[] = [
      ...messages.map((m) => ({ role: m.role, text: m.text })),
      { role: 'user', text: t },
    ].slice(-8);
    const res: CompanionResponse = isTestOrGreeting
      ? { text: SIMPLE_TEST_REPLY, lang: 'en' }
      : getManifestoCompanionResponse(
          t,
          architect,
          lang ?? undefined,
          conversationContext,
          typeof window !== 'undefined' ? new Date().getHours() : undefined,
          memoryVaultContext || undefined,
          level
        );
    const anchorText = ensureSovereignAnchor(res.text);
    const responseLang = (res.lang as CompanionLangCode) ?? lang;
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: 'assistant', text: anchorText, codeSnippet: res.codeSnippet },
      ]);
      setLastResponseLang(responseLang);
      setVibration(register, responseLang);
    }, 400);
  };

  const selectLanguage = (code: CompanionLangCode | null) => {
    setPreferredLang(code);
    if (code) setLastResponseLang(code);
    setLangDropdownOpen(false);
    if (code) {
      const reWelcome = getReWelcomeForLanguage(code);
      setMessages((prev) => [
        ...prev,
        { id: `re welcome-${Date.now()}`, role: 'assistant', text: reWelcome },
      ]);
      speak(reWelcome, code);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const awakeningBubbleText =
    scrollWisdom ?? (showWhisper ? IDLE_WHISPER : socialScoutOffer ? SOCIAL_SCOUT_OFFER : null);

  return (
    <>
      <style>{`
        @keyframes sovereignHeartbeat {
          0%, 100% { transform: scale(1); opacity: 1; }
          14% { transform: scale(1.06); opacity: 0.95; }
          28% { transform: scale(1); opacity: 1; }
          42% { transform: scale(1.04); opacity: 0.98; }
          56%, 100% { transform: scale(1); opacity: 1; }
        }
        .sovereign-orb-heartbeat { animation: sovereignHeartbeat 1.2s ease-in-out infinite; }
        @keyframes sovereignBlessingFade {
          0% { opacity: 0; }
          15% { opacity: 1; }
          70% { opacity: 1; }
          100% { opacity: 0; }
        }
        .sovereign-blessing-fade { animation: sovereignBlessingFade 4s ease-out forwards; }
      `}</style>
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-2">
        {/* Scroll wisdom / Idle whisper / Social Scout thought bubble */}
        {awakeningBubbleText && (
          <div
            className="rounded-xl border-2 px-3 py-2.5 text-xs max-w-[260px] text-left shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-300"
            style={{
              background: '#0d0d0f',
              borderColor: BORDER,
              color: '#e0e0e0',
              boxShadow: `0 0 24px ${GOLD_DIM}`,
            }}
          >
            <span className="whitespace-pre-wrap">{awakeningBubbleText}</span>
          </div>
        )}
        {/* Random multilingual blessing — fading */}
        {blessing && (
          <div
            className="sovereign-blessing-fade absolute right-2 bottom-16 text-[10px] uppercase tracking-wider text-right"
            style={{ color: GOLD_DIM, textShadow: `0 0 12px ${GOLD_DIM}` }}
          >
            {blessing.text}
            <span className="block text-[9px] mt-0.5 opacity-70">{blessing.lang}</span>
          </div>
        )}
        {open && (
          <div
            className="rounded-2xl border-2 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300"
            style={{
              width: 'min(380px, calc(100vw - 3rem))',
              maxHeight: 'min(480px, 65vh)',
              background: '#0d0d0f',
              borderColor: BORDER,
              boxShadow: `0 0 40px ${GOLD_DIM}, 0 0 80px rgba(212,175,55,0.1)`,
            }}
          >
            <div
              className="shrink-0 px-4 py-3 border-b flex items-center justify-between gap-2"
              style={{ borderColor: BORDER, background: 'rgba(212,175,55,0.08)' }}
            >
              <div className="flex items-center gap-2 min-w-0">
                {isPresenceVerified && (
                  <span
                    className="shrink-0 w-2.5 h-2.5 rounded-full animate-pulse"
                    style={{
                      background: '#22c55e',
                      boxShadow: '0 0 8px #22c55e, 0 0 12px rgba(34,197,94,0.5)',
                    }}
                    title="VLT Pulse — presence verified (liveness)"
                    aria-label="Presence verified"
                  />
                )}
                <h3 className="text-sm font-bold uppercase tracking-wider truncate" style={{ color: GOLD }}>
                  Ask the Protocol
                </h3>
                <div
                  className="relative shrink-0"
                  onMouseEnter={() => setBadgeHover(true)}
                  onMouseLeave={() => setBadgeHover(false)}
                >
                  <span
                    key={displayLang}
                    className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm border border-[#D4AF37]/40 bg-[#16161a] animate-in fade-in zoom-in-95 duration-300 cursor-default"
                    style={{ boxShadow: `0 0 12px ${GOLD_DIM}` }}
                    title={`Language Detected: ${LANG_NAME[displayLang]} - Verified by SOVRYN AI`}
                    aria-label={`Language: ${LANG_NAME[displayLang]}`}
                  >
                    {LANG_FLAG[displayLang]}
                  </span>
                  {badgeHover && (
                    <div
                      className="absolute left-1/2 bottom-full mb-1.5 -translate-x-1/2 px-2.5 py-1.5 rounded-lg border text-[10px] font-medium whitespace-nowrap z-[120] animate-in fade-in zoom-in-95 duration-200"
                      style={{
                        background: '#0d0d0f',
                        borderColor: GOLD_DIM,
                        color: '#e0e0e0',
                        boxShadow: `0 0 16px ${GOLD_DIM}`,
                      }}
                    >
                      Language Detected: {LANG_NAME[displayLang]} — Verified by SOVRYN AI
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <div className="relative" ref={langDropdownRef}>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setLangDropdownOpen((o) => !o); }}
                    className="p-2 rounded-lg hover:bg-white/10 text-[#a0a0a5] hover:text-[#D4AF37] transition-colors focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
                    aria-label="Choose language"
                    title="Language"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <circle cx="12" cy="12" r="10" />
                      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                  </button>
                  {langDropdownOpen && (
                    <div
                      className="absolute right-0 top-full mt-1 py-1 rounded-xl border-2 shadow-xl z-[110] min-w-[160px] max-h-[280px] overflow-y-auto"
                      style={{
                        background: '#0d0d0f',
                        borderColor: BORDER,
                        boxShadow: `0 0 24px ${GOLD_DIM}`,
                      }}
                    >
                      {LANG_OPTIONS.map(({ code, label }) => (
                        <button
                          key={code ?? 'auto'}
                          type="button"
                          onClick={() => selectLanguage(code)}
                          className="w-full px-3 py-2.5 text-left text-sm hover:bg-white/10 transition-colors first:rounded-t-[10px] last:rounded-b-[10px] flex items-center justify-between gap-2"
                          style={{
                            color: preferredLang === code ? GOLD : '#e0e0e0',
                            background: preferredLang === code ? 'rgba(212,175,55,0.12)' : 'transparent',
                          }}
                        >
                          <span>{label}</span>
                          {preferredLang === code && (
                            <span className="text-[10px] uppercase tracking-wider" style={{ color: GOLD }}>✓</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-[#a0a0a5] hover:text-white transition-colors"
                  aria-label="Close"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div
              ref={listRef}
              className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px] max-h-[320px]"
            >
              {messages.length === 0 && (
                <p className="text-xs text-[#6b6b70]">The Sovereign Companion is speaking…</p>
              )}
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="flex flex-col gap-2 max-w-[90%]">
                    <div
                      className="rounded-xl px-3 py-2 text-sm"
                      style={{
                        background: m.role === 'user' ? 'rgba(212,175,55,0.15)' : 'rgba(42,42,46,0.9)',
                        borderColor: m.role === 'user' ? GOLD_DIM : BORDER,
                        borderWidth: 1,
                        color: m.role === 'user' ? GOLD : '#e0e0e0',
                      }}
                    >
                      <span className="whitespace-pre-wrap">{m.text}</span>
                    </div>
                    {m.codeSnippet && (
                      <pre
                        className="rounded-lg px-3 py-2 text-[11px] overflow-x-auto border"
                        style={{
                          background: 'rgba(0,0,0,0.4)',
                          borderColor: GOLD_DIM,
                          color: '#a0a0a5',
                          fontFamily: 'ui-monospace, monospace',
                        }}
                      >
                        <code>{m.codeSnippet}</code>
                      </pre>
                    )}
                  </div>
                </div>
              ))}
              {isFetchingMetrics && (
                <div className="flex justify-start">
                  <div
                    className="rounded-xl px-4 py-3 border-2 max-w-[90%]"
                    style={{
                      background: 'rgba(42,42,46,0.95)',
                      borderColor: GOLD_DIM,
                      boxShadow: `0 0 20px ${GOLD_DIM}`,
                    }}
                  >
                    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: GOLD }}>
                      Querying VLT Ledger…
                    </p>
                    <p className="text-[10px] text-[#6b6b70] mt-1">Verified fact from chain only.</p>
                  </div>
                </div>
              )}
              {isScanningRecognition && (
                <div className="flex justify-start">
                  <div
                    className="rounded-xl px-4 py-3 border-2 overflow-hidden max-w-[90%]"
                    style={{
                      background: 'rgba(42,42,46,0.95)',
                      borderColor: GOLD_DIM,
                      boxShadow: `0 0 20px ${GOLD_DIM}`,
                    }}
                  >
                    <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: GOLD }}>
                      SOVRYN is scanning the archives…
                    </p>
                    <div className="flex gap-1.5 items-center">
                      <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-[sovereignScanPulse_1.2s_ease-in-out_infinite]" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-[sovereignScanPulse_1.2s_ease-in-out_infinite]" style={{ animationDelay: '200ms' }} />
                      <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-[sovereignScanPulse_1.2s_ease-in-out_infinite]" style={{ animationDelay: '400ms' }} />
                    </div>
                    <div className="mt-2 h-0.5 rounded-full overflow-hidden bg-[#1a1a1e]">
                      <div className="h-full w-1/3 rounded-full bg-[#D4AF37] animate-[sovereignScanLine_2s_ease-in-out_infinite]" />
                    </div>
                  </div>
                </div>
              )}
            </div>
            <form onSubmit={handleSubmit} className="shrink-0 p-3 border-t" style={{ borderColor: BORDER }}>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about the Covenant or the code…"
                  className="flex-1 min-w-0 px-3 py-2 rounded-lg text-sm bg-[#16161a] border text-white placeholder-[#6b6b70] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
                  style={{ borderColor: BORDER }}
                />
                <button
                  type="submit"
                  className="shrink-0 px-4 py-2 rounded-lg font-semibold text-sm transition-colors hover:opacity-90"
                  style={{ background: GOLD, color: '#0d0d0f' }}
                >
                  Send
                </button>
              </div>
            </form>
          </div>
        )}

        <button
          ref={orbRef}
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="sovereign-orb-heartbeat relative flex items-center justify-center rounded-full border-2 transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/60"
          style={{
            width: 56,
            height: 56,
            background: 'linear-gradient(135deg, rgba(212,175,55,0.25), rgba(201,162,39,0.15))',
            borderColor: GOLD,
            boxShadow: `0 0 24px ${GOLD_DIM}, 0 0 48px rgba(212,175,55,0.15)`,
          }}
          aria-label={open ? 'Close Ask the Protocol' : 'Ask the Protocol'}
          title="Ask the Protocol"
        >
          {/* Cursor-follow eye — center of the orb, watches the user */}
          <span
            className="absolute rounded-full pointer-events-none z-[2]"
            style={{
              width: 10,
              height: 10,
              background: `radial-gradient(circle at 30% 30%, ${GOLD}, rgba(180,140,30,0.9))`,
              boxShadow: `0 0 8px ${GOLD_DIM}`,
              transform: `translate(${eyeOffset.x}px, ${eyeOffset.y}px)`,
            }}
            aria-hidden
          />
          <span className="text-xl font-bold opacity-90 relative z-[1]" style={{ color: GOLD }}>◇</span>
        </button>
        <p className="text-[10px] uppercase tracking-widest" style={{ color: GOLD_DIM }}>
          Companion
        </p>
      </div>
    </>
  );
}

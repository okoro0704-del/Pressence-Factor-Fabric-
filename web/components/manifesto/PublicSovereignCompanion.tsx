'use client';

import { useState, useEffect, useRef } from 'react';
import {
  AUTO_GREETING,
  getManifestoCompanionResponse,
} from '@/lib/manifestoCompanionKnowledge';
import { isArchitect } from '@/lib/manifestoUnveiling';

const GOLD = '#D4AF37';
const GOLD_DIM = 'rgba(212, 175, 55, 0.6)';
const BORDER = 'rgba(212, 175, 55, 0.3)';

type Message = { id: string; role: 'user' | 'assistant'; text: string };

function speak(text: string): void {
  if (typeof window === 'undefined' || !text?.trim()) return;
  try {
    window.speechSynthesis?.cancel();
    const u = new SpeechSynthesisUtterance(text.trim());
    u.rate = 0.9;
    u.pitch = 1;
    u.volume = 1;
    u.lang = 'en-US';
    window.speechSynthesis?.speak(u);
  } catch {
    // ignore
  }
}

export function PublicSovereignCompanion() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [greetingSpoken, setGreetingSpoken] = useState(false);
  const [architect, setArchitect] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const greetingInjectedRef = useRef(false);

  useEffect(() => {
    setArchitect(isArchitect());
  }, []);

  // Auto-greeting on page load (speak once)
  useEffect(() => {
    if (greetingSpoken) return;
    const t = setTimeout(() => {
      speak(AUTO_GREETING);
      setGreetingSpoken(true);
    }, 1200);
    return () => clearTimeout(t);
  }, [greetingSpoken]);

  // When user opens the panel, show greeting as first message once (and speak if not yet)
  useEffect(() => {
    if (!open || greetingInjectedRef.current) return;
    greetingInjectedRef.current = true;
    setMessages((prev) => (prev.length === 0 ? [{ id: 'greeting', role: 'assistant', text: AUTO_GREETING }] : prev));
    if (!greetingSpoken) {
      speak(AUTO_GREETING);
      setGreetingSpoken(true);
    }
  }, [open, greetingSpoken]);

  useEffect(() => {
    if (open && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [open, messages]);

  const sendMessage = (text: string) => {
    const t = text.trim();
    if (!t) return;
    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', text: t };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    const reply = getManifestoCompanionResponse(t, architect);
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: 'assistant', text: reply },
      ]);
    }, 400);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <>
      {/* Floating Sovereign Seal — bottom right, golden aura */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-2">
        {open && (
          <div
            className="rounded-2xl border-2 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300"
            style={{
              width: 'min(380px, calc(100vw - 3rem))',
              maxHeight: 'min(420px, 60vh)',
              background: '#0d0d0f',
              borderColor: BORDER,
              boxShadow: `0 0 40px ${GOLD_DIM}, 0 0 80px rgba(212,175,55,0.1)`,
            }}
          >
            <div
              className="shrink-0 px-4 py-3 border-b flex items-center justify-between"
              style={{ borderColor: BORDER, background: 'rgba(212,175,55,0.08)' }}
            >
              <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: GOLD }}>
                Ask the Protocol
              </h3>
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
            <div
              ref={listRef}
              className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px] max-h-[280px]"
            >
              {messages.length === 0 && (
                <p className="text-xs text-[#6b6b70]">The Sovereign Companion is speaking…</p>
              )}
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className="rounded-xl px-3 py-2 max-w-[90%] text-sm"
                    style={{
                      background: m.role === 'user' ? 'rgba(212,175,55,0.15)' : 'rgba(42,42,46,0.9)',
                      borderColor: m.role === 'user' ? GOLD_DIM : BORDER,
                      borderWidth: 1,
                      color: m.role === 'user' ? GOLD : '#e0e0e0',
                    }}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={handleSubmit} className="shrink-0 p-3 border-t" style={{ borderColor: BORDER }}>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about the Covenant…"
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

        {/* Seal button — golden aura */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="relative flex items-center justify-center rounded-full border-2 transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/60"
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
          <span className="text-xl font-bold opacity-90" style={{ color: GOLD }}>◇</span>
        </button>
        <p className="text-[10px] uppercase tracking-widest" style={{ color: GOLD_DIM }}>
          Companion
        </p>
      </div>
    </>
  );
}

'use client';

import { useState, useCallback, useRef } from 'react';
import { PresenceOrb } from './PresenceOrb';
import { ChatBubble } from './ChatBubble';
import { VoiceButton } from './VoiceButton';
import { BillOfRightsOverlay } from './BillOfRightsOverlay';
import { EmpathyMeter } from './EmpathyMeter';
import { PeaceProtocolOverlay } from './PeaceProtocolOverlay';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  simplifiedText?: string;
  isTruth?: boolean;
};

function hapticConfirm() {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(50);
  }
}

const WELCOME: Message = {
  id: 'welcome',
  role: 'assistant',
  text: 'Welcome. I’m your SOVRYN Companion. Your words stay on your bonded device—encrypted, never on a central server. Ask me anything in English, Pidgin, Yoruba, Igbo, or Hausa. Tap the scale icon anytime to see your Bill of Rights.',
  simplifiedText: 'I’m here to help. What you say stays private on your phone. You can talk in your language. Tap the scale to see your rights.',
  isTruth: false,
};

export function CompanionChat() {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [billOpen, setBillOpen] = useState(false);
  const [peaceOpen, setPeaceOpen] = useState(false);
  const [calmness, setCalmness] = useState(0.85);
  const [listening, setListening] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const sendMessage = useCallback((text: string) => {
    const t = text.trim();
    if (!t) return;
    hapticConfirm();
    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', text: t };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    // Placeholder reply (replace with real AI / backend later)
    setTimeout(() => {
      const reply: Message = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        text: 'Your message is received. In production, this would be verified over the Lightning Network and answered in your chosen language. Your data remains encrypted on your device.',
        simplifiedText: 'Got it. When we connect the backend, you’ll get a real reply. Your info stays safe on your device.',
        isTruth: true,
      };
      setMessages((prev) => [...prev, reply]);
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
    }, 800);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div
      className="flex min-h-screen flex-col bg-obsidian-bg"
      style={
        calmness < 0.7
          ? { backgroundColor: 'rgba(13, 13, 15, 0.98)', color: '#f5f5f5' }
          : undefined
      }
    >
      {/* Top bar: Empathy meter + Bill of Rights (Scale of Justice) */}
      <header className="flex items-center justify-between border-b border-[#2a2a2e] px-4 py-2">
        <EmpathyMeter calmness={calmness} onPeaceProtocol={() => setPeaceOpen(true)} />
        <button
          type="button"
          onClick={() => setBillOpen(true)}
          className="rounded-full p-2 text-sovereign-gold hover:bg-sovereign-gold/20"
          aria-label="Open VITALIE Bill of Rights"
          title="Bill of Rights"
        >
          <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path d="M12 2L4 6v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V6l-8-4zm-1 14.5l-4-4 1.41-1.41L11 13.67l3.59-3.59L16 11.5l-5 5z" />
          </svg>
        </button>
      </header>

      {/* Presence Orb */}
      <PresenceOrb calm={calmness >= 0.7} />

      {/* Messages */}
      <div
        ref={listRef}
        className="flex-1 space-y-4 overflow-y-auto px-4 pb-4"
        role="log"
        aria-live="polite"
      >
        {messages.map((m) => (
          <ChatBubble
            key={m.id}
            role={m.role}
            text={m.text}
            simplifiedText={m.simplifiedText}
            isTruth={m.isTruth}
          />
        ))}
      </div>

      {/* Input + Voice */}
      <footer className="border-t border-[#2a2a2e] bg-obsidian-surface p-4">
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type or tap mic..."
            className="min-h-[48px] flex-1 rounded-2xl border border-[#2a2a2e] bg-obsidian-bg px-4 text-[18px] text-[#f5f5f5] placeholder:text-[#6b6b70] focus:border-vitalie-blue focus:outline-none focus:ring-1 focus:ring-vitalie-blue"
            aria-label="Message"
          />
          <VoiceButton
            listening={listening}
            onPress={() => {
              setListening((l) => !l);
              hapticConfirm();
              // Placeholder: in production, start STT and send when done
            }}
            disabled={false}
          />
          <button
            type="submit"
            className="rounded-2xl bg-sovereign-gold/30 px-4 py-3 text-[18px] font-medium text-sovereign-gold hover:bg-sovereign-gold/40 focus:outline-none focus:ring-2 focus:ring-sovereign-gold/50"
            aria-label="Send"
          >
            Send
          </button>
        </form>
        <p className="mt-2 text-center text-xs text-[#6b6b70]">
          Encrypted on your device. Lightning verification coming soon.
        </p>
      </footer>

      <BillOfRightsOverlay open={billOpen} onClose={() => setBillOpen(false)} />
      <PeaceProtocolOverlay open={peaceOpen} onClose={() => setPeaceOpen(false)} />
    </div>
  );
}

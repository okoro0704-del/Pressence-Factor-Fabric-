'use client';

import { ClarityLens } from './ClarityLens';

/** Wide, rounded message bubble. Min 18px typography. Sovereign Gold for truth, Vitalie Blue for info. */
export function ChatBubble({
  role,
  text,
  simplifiedText,
  isTruth,
}: {
  role: 'user' | 'assistant';
  text: string;
  simplifiedText?: string;
  isTruth?: boolean;
}) {
  const isUser = role === 'user';
  return (
    <div
      className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
      role="article"
      aria-label={isUser ? 'Your message' : 'Companion reply'}
    >
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-vitalie-blue/20 text-vitalie-blue border border-vitalie-blue/30'
            : isTruth
              ? 'bg-sovereign-gold/15 text-sovereign-gold border border-sovereign-gold/30'
              : 'bg-obsidian-surface text-[#f5f5f5] border border-[#2a2a2e]'
        }`}
      >
        {isUser ? (
          <p className="text-[18px] leading-relaxed">{text}</p>
        ) : simplifiedText ? (
          <ClarityLens originalText={text} simplifiedText={simplifiedText} />
        ) : (
          <p className="text-[18px] leading-relaxed">{text}</p>
        )}
      </div>
    </div>
  );
}

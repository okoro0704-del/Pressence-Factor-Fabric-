'use client';

import { useState } from 'react';

/** "Simplify" button on AI messages — explains complex terms in simple market-story format. */
export function ClarityLens({
  originalText,
  simplifiedText,
  className = '',
}: {
  originalText: string;
  simplifiedText: string;
  className?: string;
}) {
  const [showSimple, setShowSimple] = useState(false);
  return (
    <div className={className}>
      <p className="text-[18px] leading-relaxed">
        {showSimple ? simplifiedText : originalText}
      </p>
      <button
        type="button"
        onClick={() => setShowSimple((s) => !s)}
        className="mt-2 flex items-center gap-1.5 rounded-lg border border-vitalie-blue/50 bg-vitalie-blue/10 px-3 py-1.5 text-sm font-medium text-vitalie-blue hover:bg-vitalie-blue/20"
        aria-label={showSimple ? 'Show original' : 'Simplify this'}
      >
        <span aria-hidden>🔍</span>
        {showSimple ? 'Show original' : 'Simplify'}
      </button>
    </div>
  );
}

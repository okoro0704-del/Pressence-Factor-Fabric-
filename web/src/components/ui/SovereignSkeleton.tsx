'use client';

/**
 * Sovereign aesthetic skeleton screens — gold/black pulse for zero-latency navigation.
 * Use in loading.tsx for instant visual feedback during page transitions.
 */

const GOLD = '#D4AF37';
const BG = '#0d0d0f';
const CARD = '#16161a';
const BORDER = 'rgba(212, 175, 55, 0.2)';

export function SovereignSkeletonCard() {
  return (
    <div
      className="rounded-xl p-6 border-2 animate-pulse"
      style={{ background: CARD, borderColor: BORDER }}
    >
      <div className="h-3 w-1/3 rounded mb-4 bg-[#2a2a2e]" style={{ opacity: 0.8 }} />
      <div className="h-8 w-2/3 rounded mb-2 bg-[#2a2a2e]" style={{ opacity: 0.6 }} />
      <div className="h-3 w-full rounded bg-[#2a2a2e]" style={{ opacity: 0.4 }} />
    </div>
  );
}

export function SovereignSkeletonBar({ width = '60%' }: { width?: string }) {
  return (
    <div
      className="h-4 rounded animate-pulse bg-[#2a2a2e]"
      style={{ width, opacity: 0.7 }}
    />
  );
}

export function SovereignSkeletonLines({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-3 rounded animate-pulse bg-[#2a2a2e]"
          style={{
            width: i === count - 1 ? '40%' : `${80 - i * 15}%`,
            opacity: 0.5 + (i * 0.1),
          }}
        />
      ))}
    </div>
  );
}

/** Full-page Sovereign loading — single column skeleton. pointer-events-none so it never blocks clicks if it persists. */
export function SovereignSkeletonPage() {
  return (
    <div
      className="min-h-screen flex flex-col pointer-events-none"
      style={{ background: BG }}
    >
      <header className="border-b px-4 py-4 shrink-0" style={{ borderColor: BORDER, background: CARD }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <div className="h-6 w-48 rounded animate-pulse bg-[#2a2a2e] mb-2" style={{ opacity: 0.8 }} />
            <div className="h-3 w-32 rounded animate-pulse bg-[#2a2a2e]" style={{ opacity: 0.5 }} />
          </div>
        </div>
      </header>
      <div className="max-w-6xl mx-auto w-full flex-1 p-4 md:p-6 space-y-6">
        <SovereignSkeletonCard />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SovereignSkeletonCard />
          <SovereignSkeletonCard />
        </div>
        <SovereignSkeletonLines count={6} />
      </div>
    </div>
  );
}

/** Compact spinner for inline button — Sovereign gold. */
export function SovereignSpinner({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

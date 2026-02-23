'use client';

/** Calmness indicator. When anxiety detected, UI shifts to warmer colors and offers Peace Protocol. */
export function EmpathyMeter({
  calmness = 0.85,
  onPeaceProtocol,
}: {
  calmness?: number;
  onPeaceProtocol?: () => void;
}) {
  const isCalm = calmness >= 0.7;
  const label = isCalm ? 'Calm' : 'Need peace?';
  return (
    <div className="flex items-center gap-2 rounded-full border border-sovereign-gold/30 bg-obsidian-surface/80 px-3 py-1.5">
      <div
        className="h-2 w-16 overflow-hidden rounded-full bg-obsidian-bg"
        role="progressbar"
        aria-valuenow={Math.round(calmness * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Calmness level"
      >
        <div
          className="h-full rounded-full transition-colors duration-300"
          style={{
            width: `${calmness * 100}%`,
            backgroundColor: isCalm ? 'var(--vitalie-blue)' : 'var(--companion-amber)',
          }}
        />
      </div>
      <span className="text-xs font-medium text-[#a0a0a5]">{label}</span>
      {!isCalm && onPeaceProtocol && (
        <button
          type="button"
          onClick={onPeaceProtocol}
          className="rounded-lg bg-sovereign-gold/20 px-2 py-1 text-xs font-medium text-sovereign-gold hover:bg-sovereign-gold/30"
        >
          Peace
        </button>
      )}
    </div>
  );
}

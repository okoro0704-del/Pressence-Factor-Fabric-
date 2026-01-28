'use client';

/**
 * High-fidelity HUD shown while the native biometric prompt is active.
 * mrfundzman aesthetic: obsidian backdrop, gold accent, minimal copy.
 */

export function BiometricScanningHUD({ active }: { active: boolean }) {
  if (!active) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#0d0d0f]/95 backdrop-blur-sm"
      role="status"
      aria-live="polite"
      aria-label="Biometric scan in progress"
    >
      <div className="flex flex-col items-center gap-6">
        <div
          className="h-16 w-16 rounded-full border-2 border-[#c9a227] border-t-transparent animate-spin"
          aria-hidden
        />
        <p className="text-xl font-bold tracking-tight text-[#e8c547]">Scanning…</p>
        <p className="text-sm text-[#6b6b70] max-w-[260px] text-center">
          Use Face ID, Touch ID, or your device fingerprint to prove presence.
        </p>
      </div>
    </div>
  );
}

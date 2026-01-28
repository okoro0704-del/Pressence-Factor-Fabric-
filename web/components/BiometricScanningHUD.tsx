'use client';

/**
 * High-fidelity HUD shown while the native biometric prompt is active.
 * mrfundzman aesthetic: obsidian backdrop, gold accent, minimal copy.
 */

export function BiometricScanningHUD({ 
  active, 
  message 
}: { 
  active: boolean;
  message?: 'scanning' | 'minting';
}) {
  if (!active) return null;

  const displayMessage = message === 'minting' 
    ? 'Minting VIDA CAP…'
    : 'Scanning…';
  
  const subMessage = message === 'minting'
    ? 'Processing 50/50 split allocation.'
    : 'Use Face ID, Touch ID, or your device fingerprint to prove presence.';

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#0d0d0f]/95 backdrop-blur-sm"
      role="status"
      aria-live="polite"
      aria-label={message === 'minting' ? 'VIDA CAP minting in progress' : 'Biometric scan in progress'}
    >
      <div className="flex flex-col items-center gap-6">
        <div
          className="h-16 w-16 rounded-full border-2 border-[#c9a227] border-t-transparent animate-spin"
          aria-hidden
        />
        <p className="text-xl font-bold tracking-tight text-[#e8c547]">{displayMessage}</p>
        <p className="text-sm text-[#6b6b70] max-w-[260px] text-center">
          {subMessage}
        </p>
      </div>
    </div>
  );
}

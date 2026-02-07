'use client';

import { useState, useEffect } from 'react';
import { useBeforeInstallPrompt } from '@/lib/useBeforeInstallPrompt';

type Platform = 'ios' | 'android' | 'desktop' | null;

/** Keys for INSTALL_STEPS: platform values plus string 'null' for fallback (Record keys must be string | number | symbol). */
type InstallStepKey = 'ios' | 'android' | 'desktop' | 'null';

function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') return null;
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
  if (/Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua)) return 'android';
  return 'desktop';
}

const LAGOS_COPY = 'In Lagos: Add to Home Screen to use PFF on the go—manifesto, Presence Proof, and offline Vitalization—without an App Store download.';

const INSTALL_STEPS: Record<InstallStepKey, string> = {
  ios: 'Tap the Share icon (□↑) at the bottom of Safari, then **Add to Home Screen**. Open PFF from your home screen for the full experience.',
  android: 'Tap the menu (⋮) in Chrome, then **Add to Home Screen** or **Install app**. Open PFF from your home screen for the full experience.',
  desktop: 'On desktop, use **Chrome** or **Edge** → menu (⋮) → **Install PFF…** or **Create shortcut**. For the best experience, use on mobile and Add to Home Screen.',
  null: 'Use **Chrome** or **Safari** on your phone, open this site, then add it to your home screen from the browser menu.',
};

export function HowToInstallTooltip() {
  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState<Platform>(null);
  const [standalone, setStandalone] = useState(false);
  const { canPrompt, promptInstall, isInstalling } = useBeforeInstallPrompt();

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setPlatform(detectPlatform());
    setStandalone(
      typeof window !== 'undefined' &&
        (window.matchMedia('(display-mode: standalone)').matches ||
          (window.navigator as unknown as { standalone?: boolean }).standalone === true)
    );
    setIsMobile(
      typeof navigator !== 'undefined' &&
        (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
          (typeof navigator.maxTouchPoints === 'number' && navigator.maxTouchPoints > 0))
    );
  }, []);

  if (standalone || isMobile) return null;

  const handleInstall = async () => {
    const ok = await promptInstall();
    if (ok) setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed top-4 right-4 z-50 flex items-center gap-1.5 rounded-lg border border-[#2a2a2e] bg-[#16161a] px-3 py-2 text-xs font-medium text-[#6b6b70] hover:border-[#c9a227] hover:text-[#e8c547] transition-colors cursor-pointer"
        aria-label="How to install PFF"
      >
        <span aria-hidden>↓</span>
        Add to Home Screen
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 p-4 cursor-pointer"
          role="dialog"
          aria-modal="true"
          aria-labelledby="install-title"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-[#2a2a2e] bg-[#16161a] p-6 shadow-xl cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="install-title" className="text-lg font-bold text-[#e8c547] mb-2">
              How to Install PFF
            </h2>
            <p className="text-sm text-[#6b6b70] mb-4">
              Get the full PFF experience without an App Store download. Install on your home screen for standalone mode and offline use.
            </p>

            {canPrompt && (
              <div className="mb-4">
                <button
                  type="button"
                  onClick={handleInstall}
                  disabled={isInstalling}
                  className="w-full rounded-lg bg-[#D4AF37] px-4 py-3 text-sm font-semibold text-[#0A0A0A] hover:bg-[#c9a227] disabled:opacity-60"
                >
                  {isInstalling ? 'Installing…' : 'Install PFF to this device'}
                </button>
              </div>
            )}

            <div className="space-y-3 text-sm text-[#f5f5f5]">
              <p
                className="whitespace-pre-wrap"
                dangerouslySetInnerHTML={{
                  __html: INSTALL_STEPS[platform ?? 'null'].replace(
                    /\*\*(.+?)\*\*/g,
                    '<strong class="text-[#c9a227]">$1</strong>'
                  ),
                }}
              />
              <p className="text-[#6b6b70] italic">{LAGOS_COPY}</p>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-[#2a2a2e] px-4 py-2 text-sm font-medium text-[#6b6b70] hover:bg-[#0d0d0f] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';

const BANNER_DISMISS_KEY = 'pff_install_banner_dismissed';

/**
 * Smart Banner: appears only on mobile, prompts "Install PFF PROTOCOL to your Home Screen for Secure Access".
 * Dismissible; state stored in localStorage so we don't show every time.
 */
export function InstallSmartBanner() {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      (typeof navigator.maxTouchPoints === 'number' && navigator.maxTouchPoints > 0);
    const standalone =
      (window as any).standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches ||
      (document as any).referrer?.includes('android-app');
    const dismissed = localStorage.getItem(BANNER_DISMISS_KEY) === '1';
    if (isMobile && !standalone && !dismissed) setVisible(true);
  }, [mounted]);

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(BANNER_DISMISS_KEY, '1');
    } catch {}
  };

  if (!visible) return null;

  return (
    <div
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 p-4 border-t border-[#D4AF37]/30 bg-[#0A0A0A]/98 backdrop-blur"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 1rem)' }}
      role="banner"
      aria-label="Install PFF PROTOCOL"
    >
      <div className="max-w-lg mx-auto flex items-start gap-3">
        <div className="shrink-0 w-10 h-10 rounded-lg bg-[#D4AF37]/20 flex items-center justify-center">
          <Download className="w-5 h-5 text-[#D4AF37]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#f5f5f5]">
            Install PFF PROTOCOL to your Home Screen for Secure Access
          </p>
          <p className="text-xs text-[#6b6b70] mt-0.5">
            Add to Home Screen for faster, app-like access and biometric security.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-[#D4AF37]">
              Safari: Share → Add to Home Screen · Chrome: Menu → Install app
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 min-h-[48px] min-w-[48px] flex items-center justify-center rounded-lg text-[#6b6b70] hover:text-[#f5f5f5] hover:bg-[#16161a] touch-manipulation"
          aria-label="Dismiss"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

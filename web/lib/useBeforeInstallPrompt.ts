'use client';

import { useState, useEffect, useRef } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<{ outcome: 'accepted' | 'dismissed' }>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * Captures the PWA beforeinstallprompt event (Chrome/Edge).
 * Returns whether the native install prompt is available and a function to trigger it.
 */
export function useBeforeInstallPrompt(): {
  canPrompt: boolean;
  promptInstall: () => Promise<boolean>;
  isInstalling: boolean;
} {
  const [canPrompt, setCanPrompt] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const deferredRef = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      deferredRef.current = e as BeforeInstallPromptEvent;
      setCanPrompt(true);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
    };
  }, []);

  const promptInstall = async (): Promise<boolean> => {
    const evt = deferredRef.current;
    if (!evt) return false;
    setIsInstalling(true);
    try {
      await evt.prompt();
      deferredRef.current = null;
      setCanPrompt(false);
      return true;
    } catch {
      return false;
    } finally {
      setIsInstalling(false);
    }
  };

  return { canPrompt, promptInstall, isInstalling };
}

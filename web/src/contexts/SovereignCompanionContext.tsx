'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

export interface SpendableVidaAnimation {
  from: number;
  to: number;
}

export interface SovereignCompanionState {
  /** Verbal cue during Face Pulse / Palm Scan (e.g. "Move closer", "Hold still"). Companion speaks this. */
  scanCue: string;
  setScanCue: (cue: string) => void;
  /** When true, Companion shows "Identity confirmed. Your Personal Treasury has been credited." */
  creditJustHit: boolean;
  setCreditJustHit: (hit: boolean) => void;
  /** When set, dashboard should count up from `from` to `to` with shimmer, then clear. */
  spendableVidaAnimation: SpendableVidaAnimation | null;
  setSpendableVidaAnimation: (v: SpendableVidaAnimation | null) => void;
}

const defaultState: SovereignCompanionState = {
  scanCue: '',
  setScanCue: () => {},
  creditJustHit: false,
  setCreditJustHit: () => {},
  spendableVidaAnimation: null,
  setSpendableVidaAnimation: () => {},
};

const SovereignCompanionContext = createContext<SovereignCompanionState>(defaultState);

export function SovereignCompanionProvider({ children }: { children: React.ReactNode }) {
  const [scanCue, setScanCueState] = useState('');
  const [creditJustHit, setCreditJustHit] = useState(false);
  const [spendableVidaAnimation, setSpendableVidaAnimation] = useState<SpendableVidaAnimation | null>(null);
  const setScanCue = useCallback((cue: string) => {
    setScanCueState((prev) => (prev === cue ? prev : cue));
  }, []);

  return (
    <SovereignCompanionContext.Provider
      value={{
        scanCue,
        setScanCue,
        creditJustHit,
        setCreditJustHit,
        spendableVidaAnimation,
        setSpendableVidaAnimation,
      }}
    >
      {children}
    </SovereignCompanionContext.Provider>
  );
}

export function useSovereignCompanion(): SovereignCompanionState {
  const ctx = useContext(SovereignCompanionContext);
  return ctx ?? defaultState;
}

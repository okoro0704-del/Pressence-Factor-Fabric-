'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export interface SovereignAwakeningState {
  scrollWisdom: string | null;
  setScrollWisdom: (text: string | null) => void;
  socialScoutOffer: boolean;
  setSocialScoutOffer: (show: boolean) => void;
}

const SovereignAwakeningContext = createContext<SovereignAwakeningState | null>(null);

export function SovereignAwakeningProvider({ children }: { children: ReactNode }) {
  const [scrollWisdom, setScrollWisdom] = useState<string | null>(null);
  const [socialScoutOffer, setSocialScoutOffer] = useState(false);
  return (
    <SovereignAwakeningContext.Provider
      value={{
        scrollWisdom,
        setScrollWisdom,
        socialScoutOffer,
        setSocialScoutOffer,
      }}
    >
      {children}
    </SovereignAwakeningContext.Provider>
  );
}

export function useSovereignAwakening(): SovereignAwakeningState | null {
  return useContext(SovereignAwakeningContext);
}

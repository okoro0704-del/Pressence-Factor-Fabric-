'use client';

import { SovereignManifestoLanding } from '@/components/SovereignManifestoLanding';
import { SovereignAwakeningProvider } from '@/contexts/SovereignAwakeningContext';

/**
 * Manifesto page — same full Manifesto as home (Ecosystem Roadmap, VIDA CAP Tokenomics, Public SOVRYN AI).
 * Ensures /manifesto/ always works and SOVRYN AI (Ask the Protocol) is accessible.
 */
export default function ManifestoPage() {
  return (
    <SovereignAwakeningProvider>
      <SovereignManifestoLanding />
    </SovereignAwakeningProvider>
  );
}

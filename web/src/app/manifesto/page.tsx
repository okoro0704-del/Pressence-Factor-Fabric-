'use client';

import { SovereignManifestoLanding } from '@/components/SovereignManifestoLanding';

/**
 * Manifesto page — same full Manifesto as home (Ecosystem Roadmap, VIDA CAP Tokenomics, Public SOVRYN AI).
 * Ensures /manifesto/ always works and SOVRYN AI (Ask the Protocol) is accessible.
 */
export default function ManifestoPage() {
  return <SovereignManifestoLanding />;
}

'use client';

import { FourLayerGate } from '@/components/dashboard/FourLayerGate';

/**
 * ROOT PAGE - 4-LAYER HANDSHAKE GATE
 * Mandatory authentication gate for entire PFF system
 * All users must complete 4-layer biometric authentication before accessing any page
 */
export default function Home() {
  return <FourLayerGate />;
}

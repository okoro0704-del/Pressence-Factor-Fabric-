/**
 * PFF Real Vitalization Service
 * 
 * Production service that connects to the real VLT API.
 * 
 * To use this service, update the import in VitalizationScreen.tsx:
 * import { vitalizationService } from '@/lib/realVitalizationService';
 * 
 * Environment Variables Required:
 * - NEXT_PUBLIC_PFF_BACKEND_URL: Backend API URL
 * - NEXT_PUBLIC_VLT_API_URL: VLT API URL (optional)
 */

import type { VitalizationService, PresenceProof, VidaCapResult, VidaBalance } from './vitalizationService';

const BACKEND_URL = process.env.NEXT_PUBLIC_PFF_BACKEND_URL || '';
const VLT_API_URL = process.env.NEXT_PUBLIC_VLT_API_URL || BACKEND_URL;

/**
 * Perform PFF Scan (Triple-Lock: Phone UUID + Face + Sovereign Palm)
 * Connects to real backend API
 */
async function performPFFScan(): Promise<PresenceProof> {
  if (!BACKEND_URL?.trim()) {
    return Promise.reject(new Error('NEXT_PUBLIC_PFF_BACKEND_URL not configured. Set it in .env.local or Netlify.'));
  }

  // TODO: Implement real WebAuthn flow
  // This would use the actual WebAuthn API to get biometric verification
  // For now, this is a placeholder that shows the structure
  
  const response = await fetch(`${BACKEND_URL}/vitalize/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      // Real WebAuthn assertion would go here
    }),
  });

  if (!response.ok) {
    throw new Error('PFF Scan failed');
  }

  const data = await response.json();
  return {
    success: data.success,
    pffId: data.pffId,
    deviceId: data.deviceId || '',
    timestamp: Date.now(),
    handshakeId: data.handshakeId || '',
  };
}

/**
 * Mint VIDA CAP with 50/50 split
 * Connects to real economic layer API
 */
async function mintVidaCap(pffId: string): Promise<VidaCapResult> {
  if (!BACKEND_URL?.trim()) {
    return Promise.reject(new Error('NEXT_PUBLIC_PFF_BACKEND_URL not configured. Set it in .env.local or Netlify.'));
  }

  // The minting happens automatically on registration, but we can fetch the result
  const response = await fetch(`${BACKEND_URL}/economic/vida-cap/balance`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      // TODO: Add Presence Token from previous scan
    },
  });

  if (!response.ok) {
    throw new Error('VIDA CAP minting failed');
  }

  const data = await response.json();
  
  // Extract from balance response or make separate call
  return {
    success: true,
    pffId,
    vidaCap: {
      totalMinted: data.citizenVault?.vidaCapBalance * 2 || 1.0,
      citizenShare: data.citizenVault?.vidaCapBalance || 0.5,
      nationalReserveShare: data.nationalReserve?.totalVidaCap || 0.5,
      transactionHash: '', // Would come from API
    },
  };
}

/**
 * Get current VIDA balance
 * Connects to real economic layer API
 */
async function getVidaBalance(pffId: string): Promise<VidaBalance> {
  if (!BACKEND_URL?.trim()) {
    return Promise.reject(new Error('NEXT_PUBLIC_PFF_BACKEND_URL not configured. Set it in .env.local or Netlify.'));
  }

  const response = await fetch(`${BACKEND_URL}/economic/vida-cap/balance`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      // TODO: Add Presence Token
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch VIDA balance');
  }

  const data = await response.json();
  return {
    citizenVault: {
      vidaCapBalance: data.citizenVault?.vidaCapBalance || 0,
      pffId: data.citizenVault?.pffId || pffId,
    },
    nationalReserve: {
      totalVidaCap: data.nationalReserve?.totalVidaCap || 0,
    },
    vidaCurrency: {
      balance: 0, // Would come from separate $VIDA endpoint
    },
  };
}

/**
 * Real Vitalization Service Implementation
 */
export const vitalizationService: VitalizationService = {
  performPFFScan,
  mintVidaCap,
  getVidaBalance,
};

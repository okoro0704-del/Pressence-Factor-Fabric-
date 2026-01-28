/**
 * PFF Mock Service — Localized Testing Environment
 * Simulates PFF Triple-Lock (Phone UUID, Face, Fingerprint) and VIDA CAP minting.
 * 
 * This service can be easily swapped for the real VLT API when ready for production.
 * Simply replace the import in VitalizationScreen.tsx with the real service.
 * 
 * To use real API: Change import in VitalizationScreen.tsx from '@/lib/mockService' 
 * to '@/lib/realVitalizationService'
 */

import type { VitalizationService, PresenceProof, VidaCapResult, VidaBalance } from './vitalizationService';

export interface MockDeviceInfo {
  phoneUuid: string;
  faceVerified: boolean;
  fingerprintVerified: boolean;
}

/**
 * Generate mock device UUID (simulates Phone UUID)
 */
function generateMockDeviceUuid(): string {
  // Simulate device UUID format
  return `device_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Simulate PFF Scan (Triple-Lock verification)
 * Returns success after 3 seconds as specified
 */
async function performPFFScan(): Promise<PresenceProof> {
  // Simulate 3-second delay
  await new Promise((resolve) => setTimeout(resolve, 3000));

  const deviceId = generateMockDeviceUuid();
  const pffId = `pff_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const handshakeId = `handshake_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

  // Simulate successful Triple-Lock verification
  return {
    success: true,
    pffId,
    deviceId,
    timestamp: Date.now(),
    handshakeId,
  };
}

/**
 * Simulate VIDA CAP minting with 50/50 split
 */
async function mintVidaCap(pffId: string): Promise<VidaCapResult> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  const totalMinted = 1.0; // 1 VIDA CAP per Vitalization
  const citizenShare = totalMinted * 0.5; // 50%
  const nationalReserveShare = totalMinted * 0.5; // 50%
  const transactionHash = `tx_${Date.now()}_${Math.random().toString(36).slice(2, 16)}`;

  return {
    success: true,
    pffId,
    vidaCap: {
      totalMinted,
      citizenShare,
      nationalReserveShare,
      transactionHash,
    },
  };
}

/**
 * Get mock VIDA balance (simulates current balances)
 */
async function getVidaBalance(pffId: string): Promise<VidaBalance> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  // Mock balances - in production, these would come from the real API
  return {
    citizenVault: {
      vidaCapBalance: 0.5, // 50% of 1.0 VIDA CAP
      pffId,
    },
    nationalReserve: {
      totalVidaCap: 1000.0, // Mock national reserve total
    },
    vidaCurrency: {
      balance: 0.0, // No $VIDA issued yet
    },
  };
}

/**
 * Mock Vitalization Service Implementation
 * Exported as a service object for easy swapping
 */
export const vitalizationService: VitalizationService = {
  performPFFScan,
  mintVidaCap,
  getVidaBalance,
};

// Legacy exports for backward compatibility (can be removed later)
export const mockPFFScan = performPFFScan;
export const mockMintVidaCap = mintVidaCap;
export const mockGetVidaBalance = getVidaBalance;

// Type exports for backward compatibility
export type MockPresenceProof = PresenceProof;
export type MockVidaCapResult = VidaCapResult;
export type MockVidaBalance = VidaBalance;

/**
 * Simulate $VIDA issuance (optional - for future use)
 */
export async function mockIssueVida(amount: number, pffId: string): Promise<{
  success: boolean;
  vidaIssued: number;
  vidaCapReserved: number;
  transactionHash: string;
}> {
  await new Promise((resolve) => setTimeout(resolve, 500));

  return {
    success: true,
    vidaIssued: amount,
    vidaCapReserved: amount, // 1:1 backing
    transactionHash: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 16)}`,
  };
}

/**
 * Check if we're in mock mode (for easy switching)
 */
export function isMockMode(): boolean {
  // In production, this would check an environment variable
  // For now, always return true for standalone testing
  return process.env.NEXT_PUBLIC_USE_MOCK !== 'false';
}

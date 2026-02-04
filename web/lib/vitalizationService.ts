/**
 * PFF Vitalization Service Interface
 * 
 * This file provides a unified interface for both mock and real services.
 * To switch from mock to real API, simply change the import in VitalizationScreen.tsx:
 * 
 * Mock: import { vitalizationService } from '@/lib/mockService';
 * Real: import { vitalizationService } from '@/lib/realVitalizationService';
 */

export interface PresenceProof {
  success: boolean;
  pffId: string;
  deviceId: string;
  timestamp: number;
  handshakeId: string;
}

export interface VidaCapResult {
  success: boolean;
  pffId: string;
  vidaCap: {
    totalMinted: number;
    citizenShare: number;
    nationalReserveShare: number;
    sentinelShare?: number;
    transactionHash: string;
    batchId?: string;
  };
}

export interface VidaBalance {
  citizenVault: {
    vidaCapBalance: number;
    pffId: string;
  };
  nationalReserve: {
    totalVidaCap: number;
  };
  vidaCurrency: {
    balance: number;
  };
}

export interface VitalizationService {
  /**
   * Perform PFF Scan (Triple-Lock: Phone UUID + Face + Fingerprint)
   * Returns Presence Proof after verification
   */
  performPFFScan(): Promise<PresenceProof>;

  /**
   * Mint VIDA CAP with 50/50 split
   */
  mintVidaCap(pffId: string): Promise<VidaCapResult>;

  /**
   * Get current VIDA balance
   */
  getVidaBalance(pffId: string): Promise<VidaBalance>;
}

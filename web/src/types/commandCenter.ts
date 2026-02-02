/**
 * PFF Web — Command Center Type Definitions
 * TypeScript types for Architect's Sentinel Command Center
 * Architect: Isreal Okoro (mrfundzman)
 */

/**
 * Command Center Telemetry Data
 */
export interface CommandCenterTelemetry {
  activeSentinels: {
    citizen: number;
    personalMulti: number;
    enterpriseLite: number;
    total: number;
  };
  totalTributes: {
    deepTruthVIDA: number;
    deepTruthUSD: number;
    businessCount: number;
    last24hVIDA: number;
    stateShareVIDA?: number;      // 50% State allocation
    citizenShareVIDA?: number;    // 50% Citizen allocation
  };
  nationalLiquidity: {
    totalReservesVIDA: number;
    totalReservesUSD: number;
    activeNations: number;
    avgReservePerNation: number;
  };
  lastUpdated: string;
}

/**
 * Security Status
 */
export interface SecurityStatus {
  laptopBinded: boolean;
  mobileBinded: boolean;
  genesisHashVerified: boolean;
  laptopDeviceUUID: string;
  mobileDeviceUUID: string;
  genesisHash?: string;
  hardwareTPMHash?: string;
  lastVerificationTimestamp?: string;
}

/**
 * Action Result
 */
export interface ActionResult {
  success: boolean;
  message?: string;
  error?: string;
  timestamp?: string;
}

/**
 * National Liquidity Data
 */
export interface NationalLiquidity {
  nationCode: string;
  nationName: string;
  reservesVIDA: number;
  reservesUSD: number;
  citizenCount: number;
  avgReservePerCitizen: number;
  rank: number;
}


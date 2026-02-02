/**
 * PFF Data Service — Production Data Layer
 * Handles transition from mock data to live API/blockchain sources
 * Architect: Isreal Okoro (mrfundzman)
 */

import { getMockData, type MockData } from './mockDataService';

// ============================================================================
// CONFIGURATION
// ============================================================================

const IS_PRODUCTION = process.env.NEXT_PUBLIC_VITALIE_MODE === 'PURE_SOVRYN';
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
const VLT_API_URL = process.env.NEXT_PUBLIC_VLT_API_URL;
const BACKEND_URL = process.env.NEXT_PUBLIC_PFF_BACKEND_URL;

// ============================================================================
// TYPES
// ============================================================================

export interface NationalReserveData {
  country: string;
  vault_balance_vida_cap: number;
  backed_currency_circulation_vida: number;
  backing_ratio: string;
  burn_rate_infrastructure: string;
  monthly_growth: string;
}

export interface CitizenVaultData {
  owner: string;
  alias: string;
  status: string;
  total_vida_cap_minted: number;
  split_records: {
    personal_share_50: number;
    state_contribution_50: number;
  };
  spendable_balance_vida: number;
  linked_bank_accounts: string[];
}

export interface SystemStatus {
  system_status: string;
  protocol: string;
  last_vitalization: {
    timestamp: string;
    location: string;
    device_uuid: string;
    status: string;
  };
}

// ============================================================================
// DATA SOURCE DETECTION
// ============================================================================

export function getDataSource(): 'MOCK' | 'VLT_LIVE' | 'BACKEND_API' {
  if (USE_MOCK_DATA || !IS_PRODUCTION) {
    return 'MOCK';
  }
  
  if (VLT_API_URL) {
    return 'VLT_LIVE';
  }
  
  if (BACKEND_URL) {
    return 'BACKEND_API';
  }
  
  console.warn('No live data source configured, falling back to mock data');
  return 'MOCK';
}

// ============================================================================
// NATIONAL RESERVE DATA
// ============================================================================

async function fetchNationalReserveFromVLT(): Promise<NationalReserveData> {
  const response = await fetch(`${VLT_API_URL}/national-reserve`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`VLT API error: ${response.status}`);
  }
  
  return response.json();
}

async function fetchNationalReserveFromBackend(): Promise<NationalReserveData> {
  const response = await fetch(`${BACKEND_URL}/economic/national-reserve`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Backend API error: ${response.status}`);
  }
  
  return response.json();
}

export async function getNationalReserveData(): Promise<NationalReserveData> {
  const source = getDataSource();
  
  try {
    switch (source) {
      case 'VLT_LIVE':
        return await fetchNationalReserveFromVLT();
      
      case 'BACKEND_API':
        return await fetchNationalReserveFromBackend();
      
      case 'MOCK':
      default:
        return getMockData().national_reserve;
    }
  } catch (error) {
    console.error('Error fetching national reserve data:', error);
    // Fallback to mock data on error
    return getMockData().national_reserve;
  }
}

// ============================================================================
// CITIZEN VAULT DATA
// ============================================================================

async function fetchCitizenVaultFromVLT(citizenId: string): Promise<CitizenVaultData> {
  const response = await fetch(`${VLT_API_URL}/citizen-vault/${citizenId}`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('pff_token')}`,
    },
  });
  
  if (!response.ok) {
    throw new Error(`VLT API error: ${response.status}`);
  }
  
  return response.json();
}

async function fetchCitizenVaultFromBackend(citizenId: string): Promise<CitizenVaultData> {
  const response = await fetch(`${BACKEND_URL}/vault/${citizenId}`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('pff_token')}`,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Backend API error: ${response.status}`);
  }
  
  return response.json();
}

export async function getCitizenVaultData(citizenId?: string): Promise<CitizenVaultData> {
  const source = getDataSource();

  try {
    switch (source) {
      case 'VLT_LIVE':
        if (!citizenId) throw new Error('Citizen ID required for VLT');
        return await fetchCitizenVaultFromVLT(citizenId);

      case 'BACKEND_API':
        if (!citizenId) throw new Error('Citizen ID required for Backend API');
        return await fetchCitizenVaultFromBackend(citizenId);

      case 'MOCK':
      default:
        return getMockData().citizen_vault;
    }
  } catch (error) {
    console.error('Error fetching citizen vault data:', error);
    // Fallback to mock data on error
    return getMockData().citizen_vault;
  }
}

// ============================================================================
// SYSTEM STATUS
// ============================================================================

async function fetchSystemStatusFromVLT(): Promise<SystemStatus> {
  const response = await fetch(`${VLT_API_URL}/system/status`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`VLT API error: ${response.status}`);
  }

  return response.json();
}

export async function getSystemStatus(): Promise<SystemStatus> {
  const source = getDataSource();

  try {
    switch (source) {
      case 'VLT_LIVE':
        return await fetchSystemStatusFromVLT();

      case 'BACKEND_API':
      case 'MOCK':
      default:
        const mockData = getMockData();
        return {
          system_status: mockData.system_status,
          protocol: mockData.protocol,
          last_vitalization: mockData.last_vitalization,
        };
    }
  } catch (error) {
    console.error('Error fetching system status:', error);
    const mockData = getMockData();
    return {
      system_status: mockData.system_status,
      protocol: mockData.protocol,
      last_vitalization: mockData.last_vitalization,
    };
  }
}

// ============================================================================
// BALANCE UPDATES
// ============================================================================

export async function updateCitizenVaultBalance(
  citizenId: string,
  newBalance: number
): Promise<CitizenVaultData> {
  const source = getDataSource();

  try {
    switch (source) {
      case 'VLT_LIVE':
        const vltResponse = await fetch(`${VLT_API_URL}/citizen-vault/${citizenId}/balance`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('pff_token')}`,
          },
          body: JSON.stringify({ balance: newBalance }),
        });

        if (!vltResponse.ok) {
          throw new Error(`VLT API error: ${vltResponse.status}`);
        }

        return vltResponse.json();

      case 'BACKEND_API':
        const backendResponse = await fetch(`${BACKEND_URL}/vault/${citizenId}/balance`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('pff_token')}`,
          },
          body: JSON.stringify({ balance: newBalance }),
        });

        if (!backendResponse.ok) {
          throw new Error(`Backend API error: ${backendResponse.status}`);
        }

        return backendResponse.json();

      case 'MOCK':
      default:
        // Use mock service for local updates
        const { updateCitizenVaultBalance: mockUpdate } = await import('./mockDataService');
        return mockUpdate(newBalance);
    }
  } catch (error) {
    console.error('Error updating citizen vault balance:', error);
    throw error;
  }
}

// ============================================================================
// CURRENT BALANCE
// ============================================================================

export async function getCurrentVidaBalance(citizenId?: string): Promise<number> {
  const vaultData = await getCitizenVaultData(citizenId);
  return vaultData.spendable_balance_vida;
}

// ============================================================================
// DATA SOURCE INFO (for debugging/monitoring)
// ============================================================================

export function getDataSourceInfo() {
  const source = getDataSource();

  return {
    source,
    isProduction: IS_PRODUCTION,
    useMockData: USE_MOCK_DATA,
    vltApiUrl: VLT_API_URL,
    backendUrl: BACKEND_URL,
    mode: process.env.NEXT_PUBLIC_VITALIE_MODE,
    networkId: process.env.NEXT_PUBLIC_NETWORK_ID,
  };
}


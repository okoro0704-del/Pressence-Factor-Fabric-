/**
 * Mock Data Service
 * Loads and provides access to mockData.json
 */

import mockData from '@/data/mockData.json';

export interface MockData {
  system_status: string;
  protocol: string;
  last_vitalization: {
    timestamp: string;
    location: string;
    device_uuid: string;
    status: string;
  };
  national_reserve: {
    country: string;
    vault_balance_vida_cap: number;
    backed_currency_circulation_vida: number;
    backing_ratio: string;
    burn_rate_infrastructure: string;
    monthly_growth: string;
  };
  citizen_vault: {
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
  };
  agent_metrics: {
    agent_id: string;
    total_personal_vitalization: number;
    current_agent_payout_vida: number;
    commission_rate: string;
  };
}

/**
 * Get all mock data
 */
export function getMockData(): MockData {
  return mockData as MockData;
}

/**
 * Get national reserve data
 */
export function getNationalReserveData() {
  return mockData.national_reserve;
}

/**
 * Get citizen vault data
 */
export function getCitizenVaultData() {
  return mockData.citizen_vault;
}

/**
 * Get agent metrics
 */
export function getAgentMetrics() {
  return mockData.agent_metrics;
}

/**
 * Update citizen vault balance (for when PFF Scan succeeds)
 * This simulates updating the balance after a successful vitalization
 */
export function updateCitizenVaultBalance(newBalance: number) {
  // Update the mock data in memory
  mockData.citizen_vault.spendable_balance_vida = newBalance;
  
  // Return updated data
  return {
    ...mockData.citizen_vault,
    spendable_balance_vida: newBalance,
  };
}

/**
 * Get current $VIDA balance
 */
export function getCurrentVidaBalance(): number {
  return mockData.citizen_vault.spendable_balance_vida;
}

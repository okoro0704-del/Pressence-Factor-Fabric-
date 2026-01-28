/**
 * PFF Core — Economic Layer Types & Constants.
 * VIDA CAP, $VIDA, ATE (Autonomous Truth Economy), VLT (Vitalization Ledger Technology).
 */

// VIDA CAP minting amount per Vitalization (configurable)
export const VIDA_CAP_MINT_AMOUNT = 1.0; // 1 VIDA CAP per citizen

// Split ratios (immutable economic laws)
export const MINTING_SPLIT_CITIZEN = 0.5;      // 50%
export const MINTING_SPLIT_NATIONAL = 0.5;     // 50%

export const RECOVERY_SPLIT_PEOPLE = 0.45;     // 45%
export const RECOVERY_SPLIT_STATE = 0.45;      // 45%
export const RECOVERY_SPLIT_AGENT = 0.10;      // 10%

// $VIDA issuance ratio (1:1 against VIDA CAP)
export const VIDA_ISSUANCE_RATIO = 1.0;

// VIDA CAP allocation result
export interface VidaCapAllocation {
  totalMinted: number;
  citizenShare: number;
  nationalReserveShare: number;
  transactionHash: string;
}

// National Reserve status
export interface NationalReserveStatus {
  totalVidaCap: number;
  backingRatio: number;
  lastUpdated: string;
}

// Citizen Vault status
export interface CitizenVaultStatus {
  vidaCapBalance: number;
  pffId: string;
}

// $VIDA issuance result
export interface VidaIssuanceResult {
  vidaIssued: number;
  vidaCapReserved: number;
  reserveBalanceBefore: number;
  reserveBalanceAfter: number;
  transactionHash: string;
}

// Recovery split result
export interface RecoverySplitResult {
  peopleShare: number;
  stateShare: number;
  agentShare: number;
  transactionHash: string;
}

// VLT transaction types
export type VLTTransactionType = 'mint' | 'issue' | 'recovery' | 'transfer';

// VLT transaction
export interface VLTTransaction {
  transactionType: VLTTransactionType;
  transactionHash: string;
  citizenId?: string;
  amount?: number;
  fromVault?: string;
  toVault?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

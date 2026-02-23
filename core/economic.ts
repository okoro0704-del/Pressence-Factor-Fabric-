/**
 * PFF Core — Economic Layer Types & Constants.
 * VIDA CAP, $VIDA, ATE (Autonomous Truth Economy), VLT (Vitalization Ledger Technology).
 * Sovereign Handshake: 11 VIDA grant per Vitalization (5-5-1 split).
 */

/** Global cap: once total minted VIDA CAP reaches this, minting halves to 2 VIDA and Burning Mechanism is enabled. */
export const VITALIZATION_CAP = 1_000_000_000;

// Sovereign Handshake — 11 VIDA grant ($11,000) per Vitalization (pre-halving)
// 5-5-1 Split: 5 Citizen + 5 National Treasury + 1 Foundation
export const GROSS_SOVEREIGN_GRANT_VIDA = 11;

/** After VITALIZATION_CAP is reached: each new user gets 2 VIDA (1 National, 1 Citizen, 0 Foundation). */
export const POST_HALVING_MINT_VIDA = 2;

// 5-5-1 split — 5 to Citizen (spendable), 5 to National Treasury (locked), 1 to Foundation (locked)
export const CITIZEN_VAULT_VIDA = 5.0;           // 5 VIDA → Citizen (spendable)
export const NATIONAL_VAULT_VIDA = 5.0;          // 5 VIDA → National Treasury (locked)
export const FOUNDATION_VAULT_VIDA = 1.0;        // 1 VIDA → PFF Foundation (locked)

// Legacy three-way (kept for backward compatibility)
export const GOVERNMENT_TREASURY_VIDA = NATIONAL_VAULT_VIDA;
export const USER_WALLET_VIDA = 4.98;            // 49.8% → user_wallet (Net Spendable)
export const SENTINEL_BUSINESS_VIDA = 0.02;     // 0.2% → sentinel_business_ledger (Security Activation)

/** Sovereign Hub Access Fee — 0.1 VIDA ($100 USD). Deducted from the $1,000 Liquid of the person registered via Guest Mode; transferred to the device owner's vault. */
export const HUB_SERVICE_FEE_VIDA = 0.1;
/** Minimum new-user balance (VIDA) required before the hub fee transfer runs (ensures grant was issued). */
export const MIN_BALANCE_FOR_HUB_FEE_VIDA = 1.0;

// Legacy 50/50 ratios (kept for backward compatibility; prefer Sovereign Handshake constants above)
export const VIDA_CAP_MINT_AMOUNT = GROSS_SOVEREIGN_GRANT_VIDA;
export const MINTING_SPLIT_CITIZEN = CITIZEN_VAULT_VIDA / GROSS_SOVEREIGN_GRANT_VIDA;  // 5/11 = 0.4545
export const MINTING_SPLIT_NATIONAL = NATIONAL_VAULT_VIDA / GROSS_SOVEREIGN_GRANT_VIDA;  // 5/11 = 0.4545
export const MINTING_SPLIT_FOUNDATION = FOUNDATION_VAULT_VIDA / GROSS_SOVEREIGN_GRANT_VIDA;  // 1/11 = 0.0909

export const RECOVERY_SPLIT_PEOPLE = 0.45;     // 45%
export const RECOVERY_SPLIT_STATE = 0.45;      // 45%
export const RECOVERY_SPLIT_AGENT = 0.10;      // 10%

// $VIDA issuance ratio (1:1 against VIDA CAP)
export const VIDA_ISSUANCE_RATIO = 1.0;

// VIDA CAP allocation result (Sovereign Handshake: 5-5-1 split)
export interface VidaCapAllocation {
  totalMinted: number;
  citizenShare: number;           // Citizen Vault (spendable) — 5 VIDA
  nationalReserveShare: number;   // National Treasury (locked) — 5 VIDA
  foundationShare?: number;       // Foundation Vault (locked) — 1 VIDA
  sentinelShare?: number;         // Legacy: sentinel_business_ledger — 0.02 VIDA
  transactionHash: string;
  batchId: string;
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

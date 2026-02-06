/**
 * PFF Core — Economic Layer Types & Constants.
 * VIDA CAP, $VIDA, ATE (Autonomous Truth Economy), VLT (Vitalization Ledger Technology).
 * Sovereign Handshake: 10 VIDA grant per Vitalization; 50/50 National_Vault / Citizen_Vault with locks.
 */

/** Global cap: once total minted VIDA CAP reaches this, minting halves to 2 VIDA and Burning Mechanism is enabled. */
export const VITALIZATION_CAP = 1_000_000_000;

// Sovereign Handshake — 10 VIDA grant ($10,000) per Vitalization (pre-halving)
export const GROSS_SOVEREIGN_GRANT_VIDA = 10;

/** After VITALIZATION_CAP is reached: each new user gets 2 VIDA (1 National, 1 Citizen). */
export const POST_HALVING_MINT_VIDA = 2;

// 50:50 split — 5 to National_Vault (70/30 lock), 5 to Citizen_Vault (4/1 lock)
export const NATIONAL_VAULT_VIDA = 5.0;   // 50% → National_Vault (National Future)
export const CITIZEN_VAULT_VIDA = 5.0;     // 50% → Citizen_Vault (Citizen's Heritage)

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
export const MINTING_SPLIT_CITIZEN = USER_WALLET_VIDA / GROSS_SOVEREIGN_GRANT_VIDA;  // 0.498
export const MINTING_SPLIT_NATIONAL = GOVERNMENT_TREASURY_VIDA / GROSS_SOVEREIGN_GRANT_VIDA;  // 0.5

export const RECOVERY_SPLIT_PEOPLE = 0.45;     // 45%
export const RECOVERY_SPLIT_STATE = 0.45;      // 45%
export const RECOVERY_SPLIT_AGENT = 0.10;      // 10%

// $VIDA issuance ratio (1:1 against VIDA CAP)
export const VIDA_ISSUANCE_RATIO = 1.0;

// VIDA CAP allocation result (Sovereign Handshake: three-way mint)
export interface VidaCapAllocation {
  totalMinted: number;
  citizenShare: number;           // user_wallet (Net Spendable) — 4.98 VIDA
  nationalReserveShare: number;   // government_treasury_vault — 5 VIDA
  sentinelShare: number;          // sentinel_business_ledger — 0.02 VIDA
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

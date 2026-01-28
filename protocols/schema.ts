/**
 * PFF Protocols — 50/50 Schema.
 * Identity Metadata (citizen autonomy) | Transaction Integrity (audit, no PII).
 */

import type { IdentityMetadata, TransactionIntegrityRecord } from '../core/types';

/** Identity Metadata store: PFF ids, keys, device binding. No transaction data. */
export type IdentityMetadataStore = IdentityMetadata[];

/** Transaction Integrity store: audit logs, vault access, hashes. No PII. */
export type TransactionIntegrityStore = TransactionIntegrityRecord[];

/** 50/50 boundary: writes to Identity vs Integrity are separate. */
export interface Schema50_50 {
  identityMetadata: IdentityMetadataStore;
  transactionIntegrity: TransactionIntegrityStore;
}

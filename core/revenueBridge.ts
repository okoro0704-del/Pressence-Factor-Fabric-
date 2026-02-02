/**
 * PFF Protocol Core — Unified Revenue-to-Dividend Bridge Constants
 * Consolidates all revenue into PROT_TRIBUTE_POOL with hardcoded 50/50 split
 * Architect: Isreal Okoro (mrfundzman)
 *
 * Purpose:
 * - Define the 1% Standard for all revenue sources
 * - Hardcode the 50/50 auto-split:
 *   - 50% → National Liquidity Vault (National backing)
 *   - 50% → Global Citizen Block (The People's Share)
 * - Link Monthly Truth Dividend to unified pool
 *
 * Revenue Sources:
 * - Sentinel Tier 1 ($10 USD)
 * - Sentinel Tier 2 ($30 USD)
 * - Sentinel Tier 3 ($1,000 USD)
 * - Business Tributes (future)
 * - Protocol Fees (future)
 */

// ============================================================================
// THE 1% STANDARD
// ============================================================================

/**
 * The 1% Standard: All revenue sources contribute 1% to PROT_TRIBUTE_POOL
 * This is the universal tribute percentage across ALL revenue types
 */
export const PROT_TRIBUTE_PERCENTAGE = 0.01; // 1% of all revenue

/**
 * Architect Retention: 99% of all revenue secured for Architect
 */
export const ARCHITECT_RETENTION_PERCENTAGE = 0.99; // 99% retention

// ============================================================================
// THE AUTO-SPLIT (50/50)
// ============================================================================

/**
 * National Liquidity Vault Split: 50% of the 1% tribute
 * Purpose: National backing and liquidity reserves
 */
export const NATIONAL_LIQUIDITY_SPLIT = 0.50; // 50% of 1% = 0.5% of total revenue

/**
 * Global Citizen Block Split: 50% of the 1% tribute
 * Purpose: The People's Share for Monthly Truth Dividend
 */
export const GLOBAL_CITIZEN_SPLIT = 0.50; // 50% of 1% = 0.5% of total revenue

// ============================================================================
// CALCULATED PERCENTAGES (for reference)
// ============================================================================

/**
 * National Liquidity Vault: 0.5% of total revenue
 */
export const NATIONAL_LIQUIDITY_PERCENTAGE = PROT_TRIBUTE_PERCENTAGE * NATIONAL_LIQUIDITY_SPLIT; // 0.005

/**
 * Global Citizen Block: 0.5% of total revenue
 */
export const GLOBAL_CITIZEN_PERCENTAGE = PROT_TRIBUTE_PERCENTAGE * GLOBAL_CITIZEN_SPLIT; // 0.005

// ============================================================================
// REVENUE SOURCE TYPES
// ============================================================================

export enum RevenueSourceType {
  SENTINEL_TIER_1 = 'SENTINEL_TIER_1',
  SENTINEL_TIER_2 = 'SENTINEL_TIER_2',
  SENTINEL_TIER_3 = 'SENTINEL_TIER_3',
  BUSINESS_TRIBUTE = 'BUSINESS_TRIBUTE',
  PROTOCOL_FEE = 'PROTOCOL_FEE',
  RECOVERY_AGENT_SHARE = 'RECOVERY_AGENT_SHARE',
}

// ============================================================================
// DIVIDEND TRIGGER CONFIGURATION
// ============================================================================

/**
 * Monthly Truth Dividend Trigger Configuration
 * Executes on last day of month at 23:59 GMT
 */
export const DIVIDEND_TRIGGER_CONFIG = {
  /**
   * Execution time: Last day of month at 23:59 GMT
   */
  executionTime: '23:59',
  
  /**
   * Timezone: GMT (Universal)
   */
  timezone: 'GMT',
  
  /**
   * Distribution method: Equal share to all VerifiedTruthTellers
   */
  distributionMethod: 'equal_share',
  
  /**
   * Minimum balance required for distribution (in VIDA)
   */
  minimumBalanceForDistribution: 0.00000001, // 1 satoshi equivalent
};

// ============================================================================
// VALIDATION RULES
// ============================================================================

/**
 * Validate that auto-split percentages sum to 100%
 */
export function validateAutoSplit(): boolean {
  const total = NATIONAL_LIQUIDITY_SPLIT + GLOBAL_CITIZEN_SPLIT;
  return Math.abs(total - 1.0) < 0.0001; // Allow for floating point precision
}

/**
 * Validate that tribute + retention sum to 100%
 */
export function validateRevenueSplit(): boolean {
  const total = PROT_TRIBUTE_PERCENTAGE + ARCHITECT_RETENTION_PERCENTAGE;
  return Math.abs(total - 1.0) < 0.0001; // Allow for floating point precision
}

// ============================================================================
// HARDCODED CONSTRAINTS (IMMUTABLE)
// ============================================================================

/**
 * These values are HARDCODED and IMMUTABLE
 * Any attempt to modify these values should trigger a protocol violation alert
 */
export const IMMUTABLE_CONSTRAINTS = {
  PROT_TRIBUTE_PERCENTAGE: 0.01,
  NATIONAL_LIQUIDITY_SPLIT: 0.50,
  GLOBAL_CITIZEN_SPLIT: 0.50,
  ARCHITECT_RETENTION_PERCENTAGE: 0.99,
} as const;

/**
 * Verify that runtime values match immutable constraints
 */
export function verifyImmutableConstraints(): boolean {
  return (
    PROT_TRIBUTE_PERCENTAGE === IMMUTABLE_CONSTRAINTS.PROT_TRIBUTE_PERCENTAGE &&
    NATIONAL_LIQUIDITY_SPLIT === IMMUTABLE_CONSTRAINTS.NATIONAL_LIQUIDITY_SPLIT &&
    GLOBAL_CITIZEN_SPLIT === IMMUTABLE_CONSTRAINTS.GLOBAL_CITIZEN_SPLIT &&
    ARCHITECT_RETENTION_PERCENTAGE === IMMUTABLE_CONSTRAINTS.ARCHITECT_RETENTION_PERCENTAGE
  );
}


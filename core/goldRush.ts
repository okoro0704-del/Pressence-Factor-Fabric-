/**
 * PFF Core — Sovereign Gold Rush & Burn Logic
 * Genesis Protocol v1.0
 * Architect: Isreal Okoro (mrfundzman)
 * 
 * Implements the economic scarcity mechanism:
 * - 10-Unit Era (Pre-Burn): 10 VIDA Cap per citizen until 5B supply
 * - Great Burn Trigger: At 5B total supply
 * - 2-Unit Era (Post-Burn): 2 VIDA Cap per citizen after 5B
 * - Burn-to-One: 1% transaction burn until 1 VIDA Cap per citizen remains
 */

// ============================================================================
// VIDA CAP PRICING
// ============================================================================

/** Base valuation of 1 VIDA Cap in USD */
export const VIDA_CAP_BASE_PRICE_USD = 1000.0; // $1,000 USD per VIDA Cap

// ============================================================================
// SOVEREIGN GOLD RUSH — ERA CONFIGURATION
// ============================================================================

/** The 10-Unit Era: Minting amount before the Great Burn */
export const VIDA_CAP_MINT_AMOUNT_PRE_BURN = 10.0; // 10 VIDA CAP per citizen

/** The 2-Unit Era: Minting amount after the Great Burn */
export const VIDA_CAP_MINT_AMOUNT_POST_BURN = 2.0; // 2 VIDA CAP per citizen

/** The Great Burn Trigger: Total supply threshold for era transition */
export const GREAT_BURN_SUPPLY_THRESHOLD = 5_000_000_000; // 5 billion VIDA Cap

// ============================================================================
// BURN MECHANISM
// ============================================================================

/** Transaction burn rate (1% of every transaction) */
export const TRANSACTION_BURN_RATE = 0.01; // 1%

/** Burn-to-One Target: 1 VIDA Cap per verified citizen */
export const BURN_TO_ONE_TARGET_PER_CITIZEN = 1.0;

// ============================================================================
// ERA DETECTION
// ============================================================================

export type EconomicEra = 'PRE_BURN' | 'POST_BURN' | 'BURN_TO_ONE_COMPLETE';

export interface EraStatus {
  currentEra: EconomicEra;
  totalSupply: number;
  totalCitizens: number;
  mintAmountPerCitizen: number;
  remainingSlotsInPreBurn: number;
  percentageToGreatBurn: number;
  burnToOneTarget: number;
  burnToOneProgress: number;
}

/**
 * Determine current economic era based on total supply
 */
export function getCurrentEra(totalSupply: number): EconomicEra {
  if (totalSupply < GREAT_BURN_SUPPLY_THRESHOLD) {
    return 'PRE_BURN';
  }
  return 'POST_BURN';
}

/**
 * Get minting amount based on current era
 */
export function getMintAmountForEra(era: EconomicEra): number {
  switch (era) {
    case 'PRE_BURN':
      return VIDA_CAP_MINT_AMOUNT_PRE_BURN;
    case 'POST_BURN':
    case 'BURN_TO_ONE_COMPLETE':
      return VIDA_CAP_MINT_AMOUNT_POST_BURN;
  }
}

/**
 * Calculate how many 10-unit slots remain before Great Burn
 */
export function getRemainingPreBurnSlots(totalSupply: number): number {
  if (totalSupply >= GREAT_BURN_SUPPLY_THRESHOLD) {
    return 0;
  }
  
  const remainingSupply = GREAT_BURN_SUPPLY_THRESHOLD - totalSupply;
  const remainingSlots = Math.floor(remainingSupply / VIDA_CAP_MINT_AMOUNT_PRE_BURN);
  
  return remainingSlots;
}

/**
 * Calculate percentage progress to Great Burn
 */
export function getPercentageToGreatBurn(totalSupply: number): number {
  if (totalSupply >= GREAT_BURN_SUPPLY_THRESHOLD) {
    return 100;
  }
  
  return (totalSupply / GREAT_BURN_SUPPLY_THRESHOLD) * 100;
}

/**
 * Calculate Burn-to-One target (1 VIDA Cap per citizen)
 */
export function getBurnToOneTarget(totalCitizens: number): number {
  return totalCitizens * BURN_TO_ONE_TARGET_PER_CITIZEN;
}

/**
 * Calculate Burn-to-One progress percentage
 */
export function getBurnToOneProgress(totalSupply: number, totalCitizens: number): number {
  const target = getBurnToOneTarget(totalCitizens);
  
  if (totalSupply <= target) {
    return 100; // Burn-to-One complete
  }
  
  // Calculate how much has been burned from peak
  const peak = GREAT_BURN_SUPPLY_THRESHOLD;
  const burned = peak - totalSupply;
  const totalToBurn = peak - target;
  
  if (totalToBurn <= 0) {
    return 0;
  }
  
  return (burned / totalToBurn) * 100;
}

/**
 * Get complete era status
 */
export function getEraStatus(totalSupply: number, totalCitizens: number): EraStatus {
  const currentEra = getCurrentEra(totalSupply);
  const mintAmountPerCitizen = getMintAmountForEra(currentEra);
  const remainingSlotsInPreBurn = getRemainingPreBurnSlots(totalSupply);
  const percentageToGreatBurn = getPercentageToGreatBurn(totalSupply);
  const burnToOneTarget = getBurnToOneTarget(totalCitizens);
  const burnToOneProgress = getBurnToOneProgress(totalSupply, totalCitizens);
  
  return {
    currentEra,
    totalSupply,
    totalCitizens,
    mintAmountPerCitizen,
    remainingSlotsInPreBurn,
    percentageToGreatBurn,
    burnToOneTarget,
    burnToOneProgress,
  };
}

// ============================================================================
// BURN CALCULATION
// ============================================================================

export interface BurnResult {
  originalAmount: number;
  burnAmount: number;
  netAmount: number;
  burnRate: number;
}

/**
 * Calculate burn amount for a transaction
 */
export function calculateBurn(amount: number): BurnResult {
  const burnAmount = amount * TRANSACTION_BURN_RATE;
  const netAmount = amount - burnAmount;
  
  return {
    originalAmount: amount,
    burnAmount,
    netAmount,
    burnRate: TRANSACTION_BURN_RATE,
  };
}

/**
 * Check if Burn-to-One is complete
 */
export function isBurnToOneComplete(totalSupply: number, totalCitizens: number): boolean {
  const target = getBurnToOneTarget(totalCitizens);
  return totalSupply <= target;
}


/**
 * Hardcoded Sovereignty fallbacks when API/Supabase fails.
 * Prevents blank screens; use these so the UI always shows values.
 */

/** National Vault (70% Stability Reserve) — 3.5 VIDA CAP */
export const FALLBACK_NATIONAL_VAULT_VIDA_CAP = 3.5;

/** VIDA CAP Liquidity (15%) — 0.75 VIDA CAP */
export const FALLBACK_VIDA_CAP_LIQUIDITY = 0.75;

/** National VIDA Pool (15%) — 0.75 VIDA CAP */
export const FALLBACK_NATIONAL_VIDA_POOL_VIDA_CAP = 0.75;

/** Sovereign share (50% of 10 VIDA) for portfolio display */
export const FALLBACK_SOVEREIGN_SHARE_VIDA = 5;

/** Total National Reserve Accumulated (Government view) — sum of vault + liquidity + pool */
export const FALLBACK_TOTAL_NATIONAL_RESERVE_ACCUMULATED =
  FALLBACK_NATIONAL_VAULT_VIDA_CAP + FALLBACK_VIDA_CAP_LIQUIDITY + FALLBACK_NATIONAL_VIDA_POOL_VIDA_CAP;

const VIDA_USD = 1000;
const NAIRA_RATE = 1400;

/** Fallback NationalReserve shape for dashboard when Supabase/API fails (no blank screen). */
export function getSovereigntyFallbackReserve(): {
  country: string;
  sovereign_share_vida: number;
  total_value_naira: number;
  total_value_usd: number;
  national_vault_vida: number;
  national_liquidity_vida: number;
  naira_vida_amount: number;
  naira_vida_value_naira: number;
  backing_ratio: string;
  burn_rate_infrastructure: string;
  monthly_growth: string;
} {
  return {
    country: 'Nigeria',
    sovereign_share_vida: FALLBACK_SOVEREIGN_SHARE_VIDA,
    total_value_naira: FALLBACK_SOVEREIGN_SHARE_VIDA * VIDA_USD * NAIRA_RATE,
    total_value_usd: FALLBACK_SOVEREIGN_SHARE_VIDA * VIDA_USD,
    national_vault_vida: FALLBACK_NATIONAL_VAULT_VIDA_CAP,
    national_liquidity_vida: FALLBACK_VIDA_CAP_LIQUIDITY + FALLBACK_NATIONAL_VIDA_POOL_VIDA_CAP,
    naira_vida_amount: FALLBACK_VIDA_CAP_LIQUIDITY,
    naira_vida_value_naira: FALLBACK_VIDA_CAP_LIQUIDITY * VIDA_USD * NAIRA_RATE,
    backing_ratio: '1:1',
    burn_rate_infrastructure: '0.05%',
    monthly_growth: '+12.4%',
  };
}

/** Fallback NationalBlockReserves shape for treasury/national block when Supabase fails. */
export function getSovereigntyFallbackBlockReserves(): {
  national_vault_vida_cap: number;
  national_vault_locked: boolean;
  national_vault_value_naira: number;
  national_vault_value_usd: number;
  vida_cap_liquidity: number;
  vida_cap_liquidity_reserved: number;
  vida_cap_liquidity_available: number;
  vida_cap_liquidity_value_naira: number;
  national_vida_pool_vida_cap: number;
  national_vida_minted: number;
  national_vida_circulating: number;
  national_vida_burned: number;
  national_vida_pool_value_naira: number;
  vida_price_usd: number;
  naira_rate: number;
  last_updated: string;
} {
  return {
    national_vault_vida_cap: FALLBACK_NATIONAL_VAULT_VIDA_CAP,
    national_vault_locked: true,
    national_vault_value_naira: FALLBACK_NATIONAL_VAULT_VIDA_CAP * VIDA_USD * NAIRA_RATE,
    national_vault_value_usd: FALLBACK_NATIONAL_VAULT_VIDA_CAP * VIDA_USD,
    vida_cap_liquidity: FALLBACK_VIDA_CAP_LIQUIDITY,
    vida_cap_liquidity_reserved: 0,
    vida_cap_liquidity_available: FALLBACK_VIDA_CAP_LIQUIDITY,
    vida_cap_liquidity_value_naira: FALLBACK_VIDA_CAP_LIQUIDITY * VIDA_USD * NAIRA_RATE,
    national_vida_pool_vida_cap: FALLBACK_NATIONAL_VIDA_POOL_VIDA_CAP,
    national_vida_minted: 0,
    national_vida_circulating: 0,
    national_vida_burned: 0,
    national_vida_pool_value_naira: FALLBACK_NATIONAL_VIDA_POOL_VIDA_CAP * VIDA_USD * NAIRA_RATE,
    vida_price_usd: VIDA_USD,
    naira_rate: NAIRA_RATE,
    last_updated: new Date().toISOString(),
  };
}

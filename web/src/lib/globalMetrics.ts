/**
 * Global Aggregator Logic — Master Architect Command Center.
 * Sums national_levy_inflow, corporate_royalty_inflow from foundation_vault_ledger,
 * and revenue from sentinel_business_ledger.
 */

export interface GlobalMetrics {
  nationalLevyInflow: number;
  corporateRoyaltyInflow: number;
  sentinelRevenue: number;
  totalFoundationInflow: number;
}

/** Sum all national_levy_inflow and corporate_royalty_inflow from foundation_vault_ledger. */
export async function getGlobalMetrics(supabase: any): Promise<GlobalMetrics> {
  const out: GlobalMetrics = {
    nationalLevyInflow: 0,
    corporateRoyaltyInflow: 0,
    sentinelRevenue: 0,
    totalFoundationInflow: 0,
  };

  if (!supabase?.from) return out;

  try {
    // Foundation vault: sum national_levy_inflow and corporate_royalty_inflow
    const { data: fvl, error: fvlError } = await supabase
      .from('foundation_vault_ledger')
      .select('national_levy_inflow, corporate_royalty_inflow');

    if (!fvlError && Array.isArray(fvl)) {
      for (const row of fvl) {
        out.nationalLevyInflow += Number(row?.national_levy_inflow ?? 0);
        out.corporateRoyaltyInflow += Number(row?.corporate_royalty_inflow ?? 0);
      }
    }

    // Sentinel business ledger: sum amount_usd as revenue (fallback amount_dllr if needed)
    const { data: sbl, error: sblError } = await supabase
      .from('sentinel_business_ledger')
      .select('amount_usd, amount_dllr');

    if (!sblError && Array.isArray(sbl)) {
      for (const row of sbl) {
        const usd = Number(row?.amount_usd ?? 0);
        const dllr = Number(row?.amount_dllr ?? 0);
        out.sentinelRevenue += usd > 0 ? usd : dllr;
      }
    }

    out.totalFoundationInflow =
      out.nationalLevyInflow + out.corporateRoyaltyInflow + out.sentinelRevenue;
  } catch {
    // return partial
  }

  return out;
}

/**
 * Real-time ticker for Command Center: Sentinel activations and National Block inflows.
 */

export type TickerItemType = 'sentinel_activation' | 'national_inflow';

export interface TickerItem {
  id: string;
  type: TickerItemType;
  message: string;
  amount?: string;
  location?: string;
  createdAt: string;
}

const DEFAULT_LIMIT = 30;

/** Fetch recent sentinel_business_ledger (activations) and foundation_vault_ledger national_levy (inflows). */
export async function getCommandCenterTicker(
  supabase: any,
  limit: number = DEFAULT_LIMIT
): Promise<TickerItem[]> {
  if (!supabase?.from) return [];

  const items: TickerItem[] = [];
  const seen = new Set<string>();

  try {
    const half = Math.ceil(limit / 2);

    // Sentinel activations (sentinel_business_ledger)
    const { data: sbl } = await supabase
      .from('sentinel_business_ledger')
      .select('id, owner_id, tier_type, amount_usd, amount_dllr, created_at')
      .order('created_at', { ascending: false })
      .limit(half);

    if (Array.isArray(sbl)) {
      for (const row of sbl) {
        const id = `sbl-${(row as any).id}`;
        if (seen.has(id)) continue;
        seen.add(id);
        const amount = Number((row as any).amount_usd) || Number((row as any).amount_dllr) || 0;
        items.push({
          id,
          type: 'sentinel_activation',
          message: `Sentinel activated — ${(row as any).tier_type ?? 'tier'}`,
          amount: amount ? `$${amount.toFixed(2)}` : undefined,
          createdAt: (row as any).created_at ?? new Date().toISOString(),
        });
      }
    }

    // National block inflows (foundation_vault_ledger where national_levy_inflow > 0)
    const { data: fvl } = await supabase
      .from('foundation_vault_ledger')
      .select('id, national_levy_inflow, created_at')
      .gt('national_levy_inflow', 0)
      .order('created_at', { ascending: false })
      .limit(half);

    if (Array.isArray(fvl)) {
      for (const row of fvl) {
        const id = `fvl-${(row as any).id}`;
        if (seen.has(id)) continue;
        seen.add(id);
        const amount = Number((row as any).national_levy_inflow) ?? 0;
        items.push({
          id,
          type: 'national_inflow',
          message: 'National Block inflow — levy',
          amount: amount ? `${amount.toFixed(4)} VIDA` : undefined,
          createdAt: (row as any).created_at ?? new Date().toISOString(),
        });
      }
    }

    // Sort by createdAt desc and cap
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return items.slice(0, limit);
  } catch {
    return [];
  }
}

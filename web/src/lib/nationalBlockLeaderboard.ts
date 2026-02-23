/**
 * National Block Leaderboard — active blocks sorted by 50% Government Reserves.
 * Uses national_liquidity_vaults (balance_vida) when available; else national_revenue_ledger by block_id.
 */

export interface NationalBlockRow {
  blockId: string;
  blockName: string;
  governmentReservesVida: number;
  governmentReservesUsd?: number;
  rank: number;
}

export async function getNationalBlockLeaderboard(supabase: any): Promise<NationalBlockRow[]> {
  if (!supabase?.from) return [];

  try {
    // Prefer national_liquidity_vaults (nation_code, nation_name, balance_vida = gov reserve)
    const { data: vaults, error: vaultError } = await supabase
      .from('national_liquidity_vaults')
      .select('nation_code, nation_name, balance_vida, balance_usd')
      .order('balance_vida', { ascending: false });

    if (!vaultError && Array.isArray(vaults) && vaults.length > 0) {
      return vaults.map((v: any, i: number) => ({
        blockId: v.nation_code ?? '',
        blockName: v.nation_name ?? v.nation_code ?? '—',
        governmentReservesVida: Number(v.balance_vida ?? 0),
        governmentReservesUsd: Number(v.balance_usd ?? 0),
        rank: i + 1,
      }));
    }

    // Fallback: national_revenue_ledger grouped by block_id (sum gross_revenue as reserve proxy)
    const { data: ledger, error: ledgerError } = await supabase
      .from('national_revenue_ledger')
      .select('block_id, gross_revenue');

    if (ledgerError || !Array.isArray(ledger)) return [];

    const byBlock: Record<string, { name: string; total: number }> = {};
    for (const row of ledger) {
      const id = (row as any).block_id ?? '';
      if (!id) continue;
      if (!byBlock[id]) byBlock[id] = { name: id, total: 0 };
      byBlock[id].total += Number((row as any).gross_revenue ?? 0);
    }

    const entries = Object.entries(byBlock)
      .map(([blockId, { name, total }]) => ({ blockId, blockName: name, total }))
      .sort((a, b) => b.total - a.total);

    return entries.map((e, i) => ({
      blockId: e.blockId,
      blockName: e.blockName,
      governmentReservesVida: e.total,
      rank: i + 1,
    }));
  } catch {
    return [];
  }
}

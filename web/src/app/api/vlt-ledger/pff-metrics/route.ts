/**
 * VLT Ledger API — RAT (Verified Fact from Chain).
 * Companion's "Brain" uses this for any PFF metrics response; no generative guess.
 * Returns only verified facts from the chain (sovereign_mint_ledger / VLT).
 */

import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';

export const dynamic = 'force-static';

export interface VltPffMetrics {
  source: 'vlt_ledger';
  citizens_vitalized: number;
  total_vida_minted: number;
  last_ledger_activity_iso: string | null;
}

/**
 * Fetch verified PFF metrics from the chain.
 * Uses sovereign_mint_ledger (and optionally user_profiles) for counts.
 */
export async function GET() {
  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({
      source: 'vlt_ledger',
      citizens_vitalized: 0,
      total_vida_minted: 0,
      last_ledger_activity_iso: null,
      _fallback: true,
      _message: 'Ledger not configured; metrics unavailable.',
    } satisfies VltPffMetrics & { _fallback?: boolean; _message?: string });
  }

  try {
    const { data: citizenRows, error: citizenError } = await supabase
      .from('sovereign_mint_ledger')
      .select('citizen_id')
      .limit(5000);

    const distinctCitizens = citizenError
      ? 0
      : new Set((citizenRows ?? []).map((r) => r?.citizen_id).filter(Boolean)).size;

    const { data: sumData, error: sumError } = await supabase
      .from('sovereign_mint_ledger')
      .select('amount_vida')
      .limit(10000);

    let totalVida = 0;
    if (!sumError && Array.isArray(sumData)) {
      totalVida = sumData.reduce((acc, row) => acc + (Number(row?.amount_vida) || 0), 0);
    }

    const { data: lastRow } = await supabase
      .from('sovereign_mint_ledger')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const lastActivity = lastRow?.created_at ?? null;

    const payload: VltPffMetrics = {
      source: 'vlt_ledger',
      citizens_vitalized: distinctCitizens,
      total_vida_minted: Math.round(totalVida * 100) / 100,
      last_ledger_activity_iso: lastActivity,
    };

    return NextResponse.json(payload);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      {
        source: 'vlt_ledger',
        citizens_vitalized: 0,
        total_vida_minted: 0,
        last_ledger_activity_iso: null,
        _fallback: true,
        _message: msg,
      } satisfies VltPffMetrics & { _fallback?: boolean; _message?: string },
      { status: 200 }
    );
  }
}

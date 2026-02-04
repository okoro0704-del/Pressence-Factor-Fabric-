/**
 * Master Architect — Global Metrics API.
 * Returns aggregated national_levy_inflow, corporate_royalty_inflow, sentinel revenue.
 * Requires MASTER_ARCHITECT (pff_role cookie).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';
import { getGlobalMetrics } from '@/lib/globalMetrics';

export const dynamic = 'force-static';

const ROLE_COOKIE = 'pff_role';
const MASTER = 'MASTER_ARCHITECT';

export async function GET(request: NextRequest) {
  if (process.env.NEXT_STATIC_EXPORT === '1') {
    return NextResponse.json({
      national_levy_inflow: 0,
      corporate_royalty_inflow: 0,
      sentinel_revenue: 0,
    });
  }
  const role = request.cookies.get(ROLE_COOKIE)?.value?.toUpperCase() ?? '';
  if (role !== MASTER) {
    return NextResponse.json({ error: 'Forbidden: MASTER_ARCHITECT required' }, { status: 403 });
  }

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase not configured' },
      { status: 503 }
    );
  }

  try {
    const metrics = await getGlobalMetrics(supabase);
    return NextResponse.json(metrics);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

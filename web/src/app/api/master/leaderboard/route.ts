/**
 * Master Architect — National Block Leaderboard API.
 * Returns active National Blocks sorted by 50% Government Reserves (balance_vida / gross_revenue).
 * Requires MASTER_ARCHITECT (pff_role cookie).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';
import { getNationalBlockLeaderboard } from '@/lib/nationalBlockLeaderboard';

export const dynamic = 'force-static';

const ROLE_COOKIE = 'pff_role';
const MASTER = 'MASTER_ARCHITECT';

export async function GET(request: NextRequest) {
  if (process.env.NEXT_STATIC_EXPORT === '1') {
    return NextResponse.json({ blocks: [] });
  }
  const role = request.cookies.get(ROLE_COOKIE)?.value?.toUpperCase() ?? '';
  if (role !== MASTER) {
    return NextResponse.json({ error: 'Forbidden: MASTER_ARCHITECT required' }, { status: 403 });
  }

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  try {
    const rows = await getNationalBlockLeaderboard(supabase);
    return NextResponse.json({ blocks: rows });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

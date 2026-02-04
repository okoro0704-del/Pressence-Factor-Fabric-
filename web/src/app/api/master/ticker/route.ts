/**
 * Master Architect — Real-time ticker API.
 * Returns latest Sentinel activations and National Block inflows.
 * Requires MASTER_ARCHITECT (pff_role cookie).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';
import { getCommandCenterTicker } from '@/lib/commandCenterTicker';

export const dynamic = 'force-static';

const ROLE_COOKIE = 'pff_role';
const MASTER = 'MASTER_ARCHITECT';

export async function GET(request: NextRequest) {
  if (process.env.NEXT_STATIC_EXPORT === '1') {
    return NextResponse.json({ items: [] });
  }
  const role = request.cookies.get(ROLE_COOKIE)?.value?.toUpperCase() ?? '';
  if (role !== MASTER) {
    return NextResponse.json({ error: 'Forbidden: MASTER_ARCHITECT required' }, { status: 403 });
  }

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  const limit = Math.min(Number(request.nextUrl.searchParams.get('limit')) || 30, 50);

  try {
    const items = await getCommandCenterTicker(supabase, limit);
    return NextResponse.json({ items });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

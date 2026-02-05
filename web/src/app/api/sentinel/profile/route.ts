/**
 * GET ?phone= — returns device_limit and sentinel_plan_type for the given Identity Anchor (phone).
 * Used by Plan Selector and Device Manager to show current plan and enforce device limit.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';

export const dynamic = 'force-static';

export async function GET(request: NextRequest) {
  if (process.env.NEXT_STATIC_EXPORT === '1') {
    return NextResponse.json({ ok: true, device_limit: 1, sentinel_plan_type: null });
  }
  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Supabase not configured' }, { status: 503 });
  }

  const phone = request.nextUrl.searchParams.get('phone')?.trim().replace(/\s/g, '');
  if (!phone) {
    return NextResponse.json({ ok: false, error: 'phone query required' }, { status: 400 });
  }

  const { data, error } = await (supabase as any)
    .from('user_profiles')
    .select('device_limit, sentinel_plan_type')
    .eq('phone_number', phone)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message ?? 'Failed to load profile' }, { status: 500 });
  }

  const row = data as { device_limit?: number; sentinel_plan_type?: string | null } | null;
  return NextResponse.json({
    ok: true,
    device_limit: row?.device_limit ?? 1,
    sentinel_plan_type: row?.sentinel_plan_type ?? null,
  });
}

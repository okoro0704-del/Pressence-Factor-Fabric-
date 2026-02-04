/**
 * Master Switch — Enable/Disable new Partner Applications.
 * GET: return { enabled: boolean }
 * PATCH: body { enabled: boolean }, requires MASTER_ARCHITECT.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';
import {
  getPartnerApplicationsEnabled,
  setPartnerApplicationsEnabled,
} from '@/lib/systemSettings';

export const dynamic = 'force-static';

const ROLE_COOKIE = 'pff_role';
const MASTER = 'MASTER_ARCHITECT';

export async function GET() {
  if (process.env.NEXT_STATIC_EXPORT === '1') {
    return NextResponse.json({ enabled: false });
  }
  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }
  try {
    const enabled = await getPartnerApplicationsEnabled(supabase);
    return NextResponse.json({ enabled });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const role = request.cookies.get(ROLE_COOKIE)?.value?.toUpperCase() ?? '';
  if (role !== MASTER) {
    return NextResponse.json({ error: 'Forbidden: MASTER_ARCHITECT required' }, { status: 403 });
  }

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const enabled = body?.enabled === true || body?.enabled === 'true';
    const result = await setPartnerApplicationsEnabled(supabase, enabled, 'master_command_center');
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ enabled });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

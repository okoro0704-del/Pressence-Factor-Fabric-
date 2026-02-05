/**
 * EVG Admin — Update or revoke authorized partner.
 * MASTER_ARCHITECT only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

const ROLE_COOKIE = 'pff_role';
const MASTER = 'MASTER_ARCHITECT';

function requireMaster(request: NextRequest): NextResponse | null {
  const role = request.cookies.get(ROLE_COOKIE)?.value?.toUpperCase() ?? '';
  if (role !== MASTER) {
    return NextResponse.json({ error: 'Forbidden: MASTER_ARCHITECT required' }, { status: 403 });
  }
  return null;
}

/** PATCH: Update partner (name, redirect_uris, fee, revenue_share_user_pct, status). */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const forbidden = requireMaster(request);
  if (forbidden) return forbidden;

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Partner id required' }, { status: 400 });
  }

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (typeof body.name === 'string' && body.name.trim()) updates.name = body.name.trim();
    if (Array.isArray(body.redirect_uris)) {
      updates.redirect_uris = body.redirect_uris.map((u: unknown) => String(u).trim()).filter(Boolean);
    }
    if (typeof body.data_integrity_fee_cents === 'number' || typeof body.data_integrity_fee_cents === 'string') {
      updates.data_integrity_fee_cents = Math.max(0, parseInt(String(body.data_integrity_fee_cents), 10) || 0);
    }
    if (typeof body.revenue_share_user_pct === 'number' || typeof body.revenue_share_user_pct === 'string') {
      updates.revenue_share_user_pct = Math.min(
        100,
        Math.max(0, parseFloat(String(body.revenue_share_user_pct)) || 50)
      );
    }
    if (body.status === 'active' || body.status === 'revoked') updates.status = body.status;

    const { data, error } = await (supabase as any)
      .from('evg_authorized_partners')
      .update(updates)
      .eq('id', id)
      .select('id, client_id, name, redirect_uris, data_integrity_fee_cents, revenue_share_user_pct, status, updated_at')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message ?? 'Update failed' }, { status: 500 });
    }
    return NextResponse.json({ partner: data });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

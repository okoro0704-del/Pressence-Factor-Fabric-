/**
 * EVG Admin — Authorized Partners (Transparency Log).
 * MASTER_ARCHITECT only. List and create partners.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';
import { hashClientSecret } from '@/lib/evg';

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

/** List authorized partners (no client_secret). MASTER_ARCHITECT only. */
export async function GET(request: NextRequest) {
  const forbidden = requireMaster(request);
  if (forbidden) return forbidden;
  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }
  const { data, error } = await (supabase as any)
    .from('evg_authorized_partners')
    .select('id, client_id, name, redirect_uris, data_integrity_fee_cents, revenue_share_user_pct, status, created_at, updated_at')
    .order('created_at', { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message ?? 'List failed' }, { status: 500 });
  }
  return NextResponse.json({ partners: data ?? [] });
}

/** Create new authorized partner. Returns client_id and client_secret (show once). */
export async function POST(request: NextRequest) {
  const forbidden = requireMaster(request);
  if (forbidden) return forbidden;

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const redirectUris = Array.isArray(body.redirect_uris)
      ? body.redirect_uris.map((u: unknown) => String(u).trim()).filter(Boolean)
      : [];
    const dataIntegrityFeeCents = Math.max(0, parseInt(String(body.data_integrity_fee_cents ?? 0), 10) || 0);
    const revenueShareUserPct = Math.min(
      100,
      Math.max(0, parseFloat(String(body.revenue_share_user_pct ?? 50)) || 50)
    );

    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }
    if (redirectUris.length === 0) {
      return NextResponse.json({ error: 'At least one redirect_uri is required' }, { status: 400 });
    }

    const clientId = crypto.randomUUID();
    const clientSecret = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '').slice(0, 16);
    const clientSecretHash = await hashClientSecret(clientSecret);

    const { data: row, error } = await (supabase as any)
      .from('evg_authorized_partners')
      .insert({
        client_id: clientId,
        client_secret_hash: clientSecretHash,
        name,
        redirect_uris: redirectUris,
        data_integrity_fee_cents: dataIntegrityFeeCents,
        revenue_share_user_pct: revenueShareUserPct,
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .select('id, client_id, name, redirect_uris, data_integrity_fee_cents, revenue_share_user_pct, status, created_at')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message ?? 'Create failed' }, { status: 500 });
    }

    return NextResponse.json({
      partner: row,
      client_secret: clientSecret,
      message: 'Store client_secret securely; it will not be shown again.',
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

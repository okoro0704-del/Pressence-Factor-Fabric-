/**
 * Admin-only: Force PostgREST to reload schema cache (NOTIFY pgrst, 'reload schema').
 * Callable only when request is from the account in NEXT_PUBLIC_ADMIN_PHONE.
 * With static export this route may not run on Netlify; use Supabase SQL Editor or run migration then RPC.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const ADMIN_PHONE = process.env.NEXT_PUBLIC_ADMIN_PHONE?.trim() ?? '';

export async function POST(request: NextRequest) {
  if (process.env.NEXT_STATIC_EXPORT === '1') {
    return NextResponse.json(
      { error: 'Schema refresh not available in static export. Run NOTIFY pgrst, \'reload schema\'; in Supabase SQL Editor.' },
      { status: 501 }
    );
  }

  if (!ADMIN_PHONE) {
    return NextResponse.json({ error: 'Admin phone not configured (NEXT_PUBLIC_ADMIN_PHONE)' }, { status: 503 });
  }

  let body: { phone?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const phone = (body.phone ?? request.headers.get('x-admin-phone') ?? '').trim().replace(/\s/g, '');
  const normalizedAdmin = ADMIN_PHONE.replace(/\s/g, '');
  if (!phone || phone !== normalizedAdmin) {
    return NextResponse.json({ error: 'Forbidden: admin only' }, { status: 403 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? '';
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)?.trim() ?? '';
  if (!url || !key) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  try {
    const supabase = createClient(url, key);
    const { error } = await supabase.rpc('reload_pgrst_schema');
    if (error) {
      return NextResponse.json(
        { error: error.message, hint: 'Run migration 20260218000000_reload_pgrst_schema.sql in Supabase' },
        { status: 502 }
      );
    }
    return NextResponse.json({ ok: true, message: 'Schema cache reload requested' });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

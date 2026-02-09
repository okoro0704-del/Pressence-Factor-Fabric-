import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

/**
 * POST body: { password: string }
 * Validates against the permanent master password (numbers only). Returns { ok: true } if correct.
 * Order: default 202604070001 first (always works), then env, then Supabase.
 */
export async function POST(request: Request) {
  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }
  const raw = typeof body?.password === 'string' ? body.password : '';
  const digitsOnly = raw.trim().replace(/\D/g, '');
  if (!digitsOnly) {
    return NextResponse.json({ ok: false, error: 'Password required' }, { status: 400 });
  }

  // 1. Default password — check first so it always works (no dependency on env or DB)
  if (digitsOnly === '202604070001') {
    return NextResponse.json({ ok: true }, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
    });
  }

  // 2. Env override (Netlify: PFF_MASTER_PASSWORD)
  const envPassword = process.env.PFF_MASTER_PASSWORD?.trim().replace(/\D/g, '');
  if (envPassword && digitsOnly === envPassword) {
    return NextResponse.json({ ok: true });
  }

  // 3. Supabase (for custom passwords set in Settings)
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await (supabase as any).rpc('validate_master_password', {
        p_password: digitsOnly,
      });
      if (!error && data === true) {
        return NextResponse.json({ ok: true });
      }
    } catch {
      // RPC missing or error — already checked default and env above
    }
  }

  return NextResponse.json(
    { ok: false, error: 'Incorrect password' },
    { status: 401, headers: { 'Cache-Control': 'no-store' } }
  );
}

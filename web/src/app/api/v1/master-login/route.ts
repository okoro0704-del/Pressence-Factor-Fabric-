import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

/**
 * POST body: { password: string }
 * Validates against the permanent master password. If correct, returns { ok: true }.
 * Checks PFF_MASTER_PASSWORD env first (set in Netlify); else uses Supabase validate_master_password.
 */
export async function POST(request: Request) {
  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }
  const password = typeof body?.password === 'string' ? body.password.trim() : '';
  if (!password) {
    return NextResponse.json({ ok: false, error: 'Password required' }, { status: 400 });
  }

  const envPassword = process.env.PFF_MASTER_PASSWORD?.trim();
  if (envPassword && password === envPassword) {
    return NextResponse.json({ ok: true });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Database unavailable' }, { status: 503 });
  }

  const { data, error } = await (supabase as any).rpc('validate_master_password', {
    p_password: password,
  });
  if (error) {
    return NextResponse.json({ ok: false, error: error.message ?? 'Validation failed' }, { status: 500 });
  }
  if (data === true) {
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ ok: false, error: 'Incorrect password' }, { status: 401 });
}

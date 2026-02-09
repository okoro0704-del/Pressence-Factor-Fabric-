import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

/**
 * POST body: { password: string }
 * Validates against the permanent master password. If correct, returns { ok: true }.
 * Client then sets master access in localStorage so the user can access the app from any device.
 */
export async function POST(request: Request) {
  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }
  const password = typeof body?.password === 'string' ? body.password : '';
  if (!password.trim()) {
    return NextResponse.json({ ok: false, error: 'Password required' }, { status: 400 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Database unavailable' }, { status: 503 });
  }

  const { data, error } = await (supabase as any).rpc('validate_master_password', {
    p_password: password.trim(),
  });
  if (error) {
    return NextResponse.json({ ok: false, error: error.message ?? 'Validation failed' }, { status: 500 });
  }
  if (data === true) {
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ ok: false, error: 'Incorrect password' }, { status: 401 });
}

import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

/**
 * POST body: { phone_number, code }
 * Returns { ok: true, phone_number } if valid; { ok: false, error } otherwise.
 */
export async function POST(request: Request) {
  let body: { phone_number?: string; code?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }
  const phone_number = typeof body?.phone_number === 'string' ? body.phone_number.trim() : '';
  const code = typeof body?.code === 'string' ? body.code.trim() : '';
  if (!phone_number || !code) {
    return NextResponse.json(
      { ok: false, error: 'phone_number and code required' },
      { status: 400 }
    );
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Database unavailable' }, { status: 503 });
  }

  const { data, error } = await (supabase as any).rpc('validate_access_code', {
    p_phone_number: phone_number,
    p_code: code,
  });
  if (error) {
    return NextResponse.json({ ok: false, error: error.message ?? 'Validation failed' }, { status: 500 });
  }
  const out = data as { ok?: boolean; error?: string; phone_number?: string };
  if (out?.ok === true && out?.phone_number) {
    return NextResponse.json({ ok: true, phone_number: out.phone_number });
  }
  return NextResponse.json({ ok: false, error: out?.error ?? 'Invalid code or phone number' }, { status: 400 });
}

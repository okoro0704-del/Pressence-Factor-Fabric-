import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

/**
 * POST body: { phone_number, created_by_phone? }
 * Architect only (caller must enforce via session/cookie). Returns { ok: true, code, phone_number }.
 */
export async function POST(request: Request) {
  let body: { phone_number?: string; created_by_phone?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }
  const phone_number = typeof body?.phone_number === 'string' ? body.phone_number.trim() : '';
  const created_by_phone = typeof body?.created_by_phone === 'string' ? body.created_by_phone.trim() : undefined;
  if (!phone_number) {
    return NextResponse.json({ ok: false, error: 'phone_number required' }, { status: 400 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Database unavailable' }, { status: 503 });
  }

  const { data, error } = await (supabase as any).rpc('generate_access_code', {
    p_phone_number: phone_number,
    p_created_by_phone: created_by_phone ?? null,
  });
  if (error) {
    return NextResponse.json({ ok: false, error: error.message ?? 'Generate failed' }, { status: 500 });
  }
  const out = data as { ok?: boolean; error?: string; code?: string; phone_number?: string };
  if (out?.ok === true && out?.code) {
    return NextResponse.json({ ok: true, code: out.code, phone_number: out.phone_number ?? phone_number });
  }
  return NextResponse.json({ ok: false, error: out?.error ?? 'Failed to generate code' }, { status: 400 });
}

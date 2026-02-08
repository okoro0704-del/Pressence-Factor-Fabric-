/**
 * Anchor Citizen — persist face_hash (citizen_hash) and return Supabase row ID.
 * POST body: { face_hash: string, phone_number: string }
 * Returns 200 OK with { ok: true, id: string } (user_profiles.id).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';

export async function POST(request: NextRequest) {
  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Supabase not configured' }, { status: 503 });
  }

  let body: { face_hash?: string; phone_number?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const phone_number = typeof body?.phone_number === 'string' ? body.phone_number.trim() : '';
  const face_hash = typeof body?.face_hash === 'string' ? body.face_hash.trim() : '';
  if (!phone_number || !face_hash) {
    return NextResponse.json({ ok: false, error: 'phone_number and face_hash required' }, { status: 400 });
  }

  const { data: rpcData, error: rpcError } = await (supabase as any).rpc('update_user_profile_face_hash', {
    p_phone_number: phone_number,
    p_face_hash: face_hash,
  });

  if (rpcError) {
    return NextResponse.json(
      { ok: false, error: rpcError.message ?? 'Failed to persist face_hash' },
      { status: 400 }
    );
  }

  const out = (rpcData ?? {}) as { ok?: boolean; error?: string };
  if (out.ok !== true) {
    return NextResponse.json({ ok: false, error: out.error ?? 'RPC failed' }, { status: 400 });
  }

  const { data: row, error } = await (supabase as any)
    .from('user_profiles')
    .select('id')
    .eq('phone_number', phone_number)
    .maybeSingle();

  if (error || !row?.id) {
    return NextResponse.json({ ok: true, id: null }, { status: 200 });
  }

  return NextResponse.json({ ok: true, id: row.id });
}

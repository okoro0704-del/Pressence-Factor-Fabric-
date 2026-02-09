/**
 * Save pillars at 75% (Face, Palm, Mobile ID) and set vitalization_status to VITALIZED.
 * POST body: { phone_number, face_hash, palm_hash, device_id }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';

export async function POST(request: NextRequest) {
  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Supabase not configured' }, { status: 503 });
  }

  let body: { phone_number?: string; face_hash?: string; palm_hash?: string; device_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const phone_number = typeof body?.phone_number === 'string' ? body.phone_number.trim() : '';
  const face_hash = typeof body?.face_hash === 'string' ? body.face_hash.trim() : '';
  const palm_hash = typeof body?.palm_hash === 'string' ? body.palm_hash.trim() : '';
  const device_id = typeof body?.device_id === 'string' ? body.device_id.trim() : '';

  if (!phone_number || !face_hash || !palm_hash || !device_id) {
    return NextResponse.json(
      { ok: false, error: 'phone_number, face_hash, palm_hash, device_id required' },
      { status: 400 }
    );
  }

  const { data: rpcData, error: rpcError } = await (supabase as any).rpc('save_pillars_at_75', {
    p_phone_number: phone_number,
    p_face_hash: face_hash,
    p_palm_hash: palm_hash,
    p_device_id: device_id,
  });

  if (rpcError) {
    return NextResponse.json(
      { ok: false, error: rpcError.message ?? 'Failed to save pillars' },
      { status: 400 }
    );
  }

  const out = (rpcData ?? {}) as { ok?: boolean; error?: string };
  if (out.ok !== true) {
    return NextResponse.json({ ok: false, error: out.error ?? 'RPC failed' }, { status: 400 });
  }

  return NextResponse.json({ ok: true, action: (out as { action?: string }).action ?? 'saved' });
}

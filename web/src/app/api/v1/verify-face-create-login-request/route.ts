/**
 * Verify face then create login request (sub-device flow).
 * Only the same face (hash) as stored for this phone can create a request.
 * Any device using this number with a different face gets 403 — never gains access.
 * POST body: { phone_number, face_hash, requested_display_name?, device_info? }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';

export async function POST(request: NextRequest) {
  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Supabase not configured' }, { status: 503 });
  }

  let body: {
    phone_number?: string;
    face_hash?: string;
    requested_display_name?: string;
    device_info?: Record<string, unknown>;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const phone_number = typeof body?.phone_number === 'string' ? body.phone_number.trim() : '';
  const face_hash = typeof body?.face_hash === 'string' ? body.face_hash.trim() : '';

  if (!phone_number || !face_hash) {
    return NextResponse.json(
      { ok: false, error: 'phone_number and face_hash required' },
      { status: 400 }
    );
  }

  const { data: profile, error: profileError } = await (supabase as any)
    .from('user_profiles')
    .select('face_hash')
    .eq('phone_number', phone_number)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json(
      { ok: false, error: profileError.message ?? 'Failed to verify identity' },
      { status: 500 }
    );
  }

  const storedFaceHash = profile?.face_hash != null ? String(profile.face_hash).trim() : '';
  if (!storedFaceHash) {
    return NextResponse.json(
      { ok: false, error: 'No identity on file for this number. Complete vitalization on your main device first.' },
      { status: 400 }
    );
  }

  if (storedFaceHash !== face_hash) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Face does not match. This number is linked to another identity. Access denied.',
        code: 'FACE_MISMATCH',
      },
      { status: 403 }
    );
  }

  const { data: insertData, error: insertError } = await (supabase as any)
    .from('login_requests')
    .insert({
      phone_number,
      requested_display_name: typeof body?.requested_display_name === 'string' ? body.requested_display_name.trim() || null : null,
      status: 'PENDING',
      device_info: body?.device_info ?? null,
    })
    .select('id')
    .single();

  if (insertError) {
    return NextResponse.json(
      { ok: false, error: insertError.message ?? 'Failed to create login request' },
      { status: 500 }
    );
  }

  const requestId = insertData?.id;
  if (!requestId) {
    return NextResponse.json({ ok: false, error: 'No request id returned' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, requestId });
}

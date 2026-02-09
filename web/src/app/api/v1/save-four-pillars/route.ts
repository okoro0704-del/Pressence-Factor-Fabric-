/**
 * Save Four Pillars — Face ID, Palm Scan, Device ID, GPS — tied to phone (anchor).
 * POST body: { phone_number, face_hash, palm_hash, device_id, geolocation: { latitude, longitude, accuracy? } }
 * All four must be present before user can access the site.
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
    palm_hash?: string;
    device_id?: string;
    geolocation?: { latitude: number; longitude: number; accuracy?: number };
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const phone_number = typeof body?.phone_number === 'string' ? body.phone_number.trim() : '';
  const face_hash = typeof body?.face_hash === 'string' ? body.face_hash.trim() : '';
  const palm_hash = typeof body?.palm_hash === 'string' ? body.palm_hash.trim() : '';
  const device_id = typeof body?.device_id === 'string' ? body.device_id.trim() : '';
  const geo = body?.geolocation;
  const geolocation =
    geo != null &&
    typeof geo.latitude === 'number' &&
    typeof geo.longitude === 'number'
      ? { latitude: geo.latitude, longitude: geo.longitude, accuracy: typeof geo.accuracy === 'number' ? geo.accuracy : undefined }
      : null;

  if (!phone_number || !face_hash || !palm_hash || !device_id || !geolocation) {
    return NextResponse.json(
      { ok: false, error: 'phone_number, face_hash, palm_hash, device_id, and geolocation (latitude, longitude) required' },
      { status: 400 }
    );
  }

  const { data: rpcData, error: rpcError } = await (supabase as any).rpc('save_four_pillars', {
    p_phone_number: phone_number,
    p_face_hash: face_hash,
    p_palm_hash: palm_hash,
    p_device_id: device_id,
    p_geolocation: geolocation,
  });

  if (rpcError) {
    return NextResponse.json(
      { ok: false, error: rpcError.message ?? 'Failed to save four pillars' },
      { status: 400 }
    );
  }

  const out = (rpcData ?? {}) as { ok?: boolean; error?: string };
  if (out.ok !== true) {
    return NextResponse.json({ ok: false, error: out.error ?? 'RPC failed' }, { status: 400 });
  }

  return NextResponse.json({ ok: true, action: (out as { action?: string }).action ?? 'saved' });
}

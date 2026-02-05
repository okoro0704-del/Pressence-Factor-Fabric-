/**
 * Hard Identity Reset — unlink current device from any profile so the device is treated as brand new.
 * POST body: { deviceId: string }
 * Clears primary_sentinel_device_id, primary_sentinel_assigned_at, face_hash, recovery_seed_hash
 * for the profile row where primary_sentinel_device_id = deviceId.
 * Optionally clears sentinel_identities for that profile (by phone_number).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Supabase not configured' }, { status: 503 });
  }

  let body: { deviceId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const deviceId = typeof body?.deviceId === 'string' ? body.deviceId.trim() : '';
  if (!deviceId) {
    return NextResponse.json({ ok: false, error: 'deviceId required' }, { status: 400 });
  }

  try {
    const { data: profile, error: fetchError } = await (supabase as any)
      .from('user_profiles')
      .select('id, phone_number')
      .eq('primary_sentinel_device_id', deviceId)
      .maybeSingle();

    if (fetchError) {
      console.error('[identity-reset] fetch profile by device_id:', fetchError);
      return NextResponse.json({ ok: false, error: fetchError.message ?? 'Failed to find profile' }, { status: 500 });
    }

    if (!profile) {
      return NextResponse.json({ ok: true, message: 'No profile bound to this device' });
    }

    const { error: updateError } = await (supabase as any)
      .from('user_profiles')
      .update({
        primary_sentinel_device_id: null,
        primary_sentinel_assigned_at: null,
        face_hash: null,
        recovery_seed_hash: null,
      })
      .eq('id', profile.id);

    if (updateError) {
      console.error('[identity-reset] user_profiles update:', updateError);
      return NextResponse.json({ ok: false, error: updateError.message ?? 'Failed to clear profile' }, { status: 500 });
    }

    const phone = profile.phone_number;
    if (phone) {
      await (supabase as any)
        .from('sentinel_identities')
        .delete()
        .eq('phone_number', phone);
    }

    return NextResponse.json({ ok: true, message: 'Device unlinked; ready for re-registration' });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[identity-reset]', msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

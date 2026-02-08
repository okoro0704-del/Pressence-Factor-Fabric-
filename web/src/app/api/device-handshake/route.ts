/**
 * Device Handshake — register device identity from User-Agent (Oppo, iPhone, Redmi) in device_registry.
 * POST body: { phoneNumber: string, userAgent?: string }
 * Uses request headers User-Agent if body.userAgent not provided.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';
import { parseDeviceFromUserAgent, generateDeviceUniqueId } from '@/lib/deviceIdentity';

export async function POST(request: NextRequest) {
  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Supabase not configured' }, { status: 503 });
  }

  let body: { phoneNumber?: string; userAgent?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const phoneNumber = typeof body?.phoneNumber === 'string' ? body.phoneNumber.trim() : '';
  if (!phoneNumber) {
    return NextResponse.json({ ok: false, error: 'phoneNumber required' }, { status: 400 });
  }

  const userAgent =
    (typeof body?.userAgent === 'string' ? body.userAgent.trim() : null) ||
    request.headers.get('user-agent') ||
    '';

  const deviceVendor = parseDeviceFromUserAgent(userAgent);
  const deviceUniqueId = await generateDeviceUniqueId(phoneNumber, userAgent);

  try {
    const { data: rpcData, error: rpcError } = await (supabase as any).rpc('upsert_device_registry', {
      p_phone_number: phoneNumber,
      p_device_unique_id: deviceUniqueId,
      p_device_vendor: deviceVendor,
      p_user_agent: userAgent || null,
    });

    if (rpcError) {
      console.error('[device-handshake] RPC error:', rpcError);
      return NextResponse.json({ ok: false, error: rpcError.message ?? 'Failed to register device' }, { status: 500 });
    }

    const out = (rpcData ?? {}) as { ok?: boolean; id?: string; error?: string };
    if (out.ok !== true) {
      return NextResponse.json({ ok: false, error: out.error ?? 'Upsert failed' }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      id: out.id,
      deviceVendor,
      deviceUniqueId,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[device-handshake]', msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

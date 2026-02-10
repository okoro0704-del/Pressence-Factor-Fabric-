/**
 * GET /api/v1/vitalization-status?phone=+234...
 *
 * Returns backend vitalization status for the given phone so you can confirm
 * the database has recorded your vitalization without relying on the UI.
 *
 * Response when found:
 * - ok: true, found: true
 * - vitalization_status: 'VITALIZED' | '' | etc.
 * - is_minted: boolean
 * - face_hash_set: boolean
 * - device_id_set: boolean
 * - vida_cap_balance: number
 * - updated_at: string
 *
 * Response when no profile: ok: true, found: false, message: "..."
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';

export async function GET(request: NextRequest) {
  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: 'Supabase not configured' },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const phone = searchParams.get('phone')?.trim() ?? '';

  if (!phone) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Missing phone. Use: /api/v1/vitalization-status?phone=+234XXXXXXXXXX',
      },
      { status: 400 }
    );
  }

  const { data, error } = await (supabase as any).rpc('get_vitalization_status', {
    p_phone: phone,
  });

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message ?? 'RPC failed' },
      { status: 500 }
    );
  }

  const out = (data ?? {}) as {
    ok?: boolean;
    error?: string;
    found?: boolean;
    vitalization_status?: string;
    is_minted?: boolean;
    face_hash_set?: boolean;
    device_id_set?: boolean;
    vida_cap_balance?: number;
    updated_at?: string;
    message?: string;
  };

  if (out.ok === false) {
    return NextResponse.json(
      { ok: false, error: out.error ?? 'Unknown error' },
      { status: 400 }
    );
  }

  return NextResponse.json(out);
}

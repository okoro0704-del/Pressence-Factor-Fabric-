/**
 * Save sovereign root (Merkle root of face + palm + identity anchor) to user_profiles by phone.
 * POST body: { phone_number, sovereign_root }
 * Call after generateSovereignRoot() so the combined hash is stored in Supabase.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';

export async function POST(request: NextRequest) {
  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Supabase not configured' }, { status: 503 });
  }

  let body: { phone_number?: string; sovereign_root?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const phone_number = typeof body?.phone_number === 'string' ? body.phone_number.trim() : '';
  const sovereign_root = typeof body?.sovereign_root === 'string' ? body.sovereign_root.trim() : '';

  if (!phone_number || !sovereign_root) {
    return NextResponse.json(
      { ok: false, error: 'phone_number and sovereign_root required' },
      { status: 400 }
    );
  }

  const { data: rpcData, error: rpcError } = await (supabase as any).rpc('update_user_profile_sovereign_root', {
    p_phone_number: phone_number,
    p_sovereign_root: sovereign_root,
  });

  if (rpcError) {
    return NextResponse.json(
      { ok: false, error: rpcError.message ?? 'Failed to save sovereign root' },
      { status: 400 }
    );
  }

  const out = (rpcData ?? {}) as { ok?: boolean; error?: string };
  if (out.ok !== true) {
    return NextResponse.json({ ok: false, error: out.error ?? 'RPC failed' }, { status: 400 });
  }

  return NextResponse.json({ ok: true, updated: true });
}

/**
 * Save Master Identity Anchor (citizen_root) to Supabase citizens table.
 * POST body: { device_id, key_id, citizen_root }
 * Call after generateSovereignRoot() on the client. Individual pillar hashes must be
 * cleared from client memory after this succeeds (one-way recognition).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';

export async function POST(request: NextRequest) {
  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Supabase not configured' }, { status: 503 });
  }

  let body: { device_id?: string; key_id?: string; citizen_root?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const device_id = typeof body?.device_id === 'string' ? body.device_id.trim() : '';
  const key_id = typeof body?.key_id === 'string' ? body.key_id.trim() : '';
  const citizen_root = typeof body?.citizen_root === 'string' ? body.citizen_root.trim() : '';

  if (!device_id || !citizen_root) {
    return NextResponse.json(
      { ok: false, error: 'device_id and citizen_root required' },
      { status: 400 }
    );
  }

  const keyId = key_id || 'default';

  const { data: rpcData, error: rpcError } = await (supabase as any).rpc('set_citizen_root', {
    p_device_id: device_id,
    p_key_id: keyId,
    p_citizen_root: citizen_root,
  });

  if (rpcError) {
    return NextResponse.json(
      { ok: false, error: rpcError.message ?? 'Failed to save citizen root' },
      { status: 400 }
    );
  }

  const out = (rpcData ?? {}) as { ok?: boolean; error?: string };
  if (out.ok !== true) {
    return NextResponse.json({ ok: false, error: out.error ?? 'RPC failed' }, { status: 400 });
  }

  return NextResponse.json({ ok: true, updated: (out as { updated?: boolean }).updated ?? true });
}

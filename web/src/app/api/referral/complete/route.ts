/**
 * Referral completion: record referral and process staff bounty.
 * Call after a new user registers with a referrer (e.g. from ?ref= referrer_phone).
 * 1) record_referral(referrer_phone, referred_phone) — idempotent; syncs referral_count; may promote to SENTINEL_STAFF at 10.
 * 2) process_staff_bounty(referrer_phone, referred_phone) — if referrer is SENTINEL_STAFF: $100 to corporate, $30 to staff VIDA.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';

export async function POST(request: NextRequest) {
  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Supabase not configured' }, { status: 503 });
  }

  let body: { referrer_phone?: string; referred_phone?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const referrer = (body.referrer_phone ?? '').trim().replace(/\s/g, '');
  const referred = (body.referred_phone ?? '').trim().replace(/\s/g, '');

  if (!referrer || !referred) {
    return NextResponse.json({ ok: false, error: 'referrer_phone and referred_phone required' }, { status: 400 });
  }

  if (referrer === referred) {
    return NextResponse.json({ ok: false, error: 'Cannot self-refer' }, { status: 400 });
  }

  try {
    const { data: recordData, error: recordError } = await (supabase as any).rpc('record_referral', {
      referrer_phone: referrer,
      referred_phone: referred,
    });
    if (recordError) {
      return NextResponse.json({ ok: false, error: recordError.message ?? 'Failed to record referral' }, { status: 500 });
    }
    const recordResult = recordData as { ok?: boolean; error?: string };
    if (!recordResult?.ok) {
      return NextResponse.json({ ok: false, error: recordResult?.error ?? 'Failed to record referral' }, { status: 400 });
    }

    const { data: bountyData, error: bountyError } = await (supabase as any).rpc('process_staff_bounty', {
      staff_phone: referrer,
      referred_phone: referred,
    });
    if (bountyError) {
      return NextResponse.json({
        ok: true,
        referral_recorded: true,
        bounty_processed: false,
        error: bountyError.message ?? 'Bounty not processed (referrer may not be SENTINEL_STAFF yet)',
      });
    }
    const bountyResult = bountyData as { ok?: boolean; error?: string };
    return NextResponse.json({
      ok: true,
      referral_recorded: true,
      bounty_processed: bountyResult?.ok === true,
      error: bountyResult?.ok ? undefined : bountyResult?.error,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

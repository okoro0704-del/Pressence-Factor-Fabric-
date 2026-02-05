/**
 * Humanity Ledger — Public (anonymous) count of verified humans in the Protocol.
 * Returns total number of profiles with humanity_score = 1.0 (Proof of Personhood).
 * No auth required; proves network growth to the world.
 */

import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';

export const dynamic = 'force-static';

export async function GET() {
  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json(
      { count: 0, error: 'Supabase not configured' },
      { status: 200 }
    );
  }

  try {
    const { count, error } = await (supabase as any)
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('humanity_score', 1.0);

    if (error) {
      console.error('[humanity-ledger]', error);
      return NextResponse.json({ count: 0 }, { status: 200 });
    }

    return NextResponse.json({
      count: typeof count === 'number' ? count : 0,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[humanity-ledger]', msg);
    return NextResponse.json({ count: 0 }, { status: 200 });
  }
}

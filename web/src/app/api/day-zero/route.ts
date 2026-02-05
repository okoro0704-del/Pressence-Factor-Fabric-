/**
 * Day Zero — Master Architect Initialization.
 * GET: Returns { empty: boolean } when user_profiles has zero rows (database cleared).
 * Used by the client to run nuclear local clear and treat app as "Day Zero".
 * Requires Supabase RPC get_user_profiles_count (SECURITY DEFINER) or falls back to false.
 */

import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ empty: false, error: 'Supabase not configured' });
  }

  try {
    const { data, error } = await (supabase as any).rpc('get_user_profiles_count');
    if (error) {
      console.warn('[day-zero] RPC get_user_profiles_count failed:', error.message);
      return NextResponse.json({ empty: false });
    }
    const count = typeof data === 'number' ? data : Number(data ?? 0);
    return NextResponse.json({ empty: count === 0 });
  } catch (e) {
    console.warn('[day-zero]', e);
    return NextResponse.json({ empty: false });
  }
}

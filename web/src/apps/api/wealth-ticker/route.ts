import { NextResponse } from 'next/server';
import { supabase, hasSupabase } from '@/lib/supabase';

/**
 * GET /api/wealth-ticker
 * Returns total_handshakes from presence_handshakes (Supabase).
 * Used by Wealth Secured Ticker for live calculation.
 */
export async function GET() {
  try {
    if (!hasSupabase() || !supabase) {
      return NextResponse.json({ total_handshakes: 0 });
    }

    const { count, error } = await supabase
      .from('presence_handshakes')
      .select('*', { count: 'exact', head: true });

    if (error) {
      return NextResponse.json(
        { total_handshakes: 0, error: error.message },
        { status: 200 }
      );
    }

    return NextResponse.json({
      total_handshakes: typeof count === 'number' ? count : 0,
    });
  } catch {
    return NextResponse.json({ total_handshakes: 0 });
  }
}

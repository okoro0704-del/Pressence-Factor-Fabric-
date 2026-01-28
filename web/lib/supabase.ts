/**
 * Supabase client for National Pulse realtime (presence_handshakes).
 */

import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const supabase = url && anon ? createClient(url, anon) : null;

export function hasSupabase(): boolean {
  return !!supabase;
}

/**
 * Server-side Supabase client for API routes (Next.js app router).
 * Uses NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
 */

import { createClient } from '@supabase/supabase-js';

let _serverClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseServer(): ReturnType<typeof createClient> | null {
  if (typeof window !== 'undefined') return null;
  if (_serverClient) return _serverClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? '';
  if (!url || !key) return null;
  _serverClient = createClient(url, key);
  return _serverClient;
}

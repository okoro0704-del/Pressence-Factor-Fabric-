/**
 * Supabase client for National Pulse realtime (presence_handshakes).
 */

import { createClient } from '@supabase/supabase-js';

let _supabase: any = null;
let _initialized = false;

function initSupabase() {
  if (_initialized) return;
  _initialized = true;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

  // DEBUG: Log environment variable detection
  console.log('[SUPABASE INIT] Vault Endpoint:', url ? 'DETECTED' : 'MISSING');
  console.log('[SUPABASE INIT] Anon Key:', anon ? 'DETECTED' : 'MISSING');
  console.log('[SUPABASE INIT] URL Value:', url || 'EMPTY');
  console.log('[SUPABASE INIT] URL Length:', url.length);

  if (url && anon) {
    try {
      _supabase = createClient(url, anon);
      console.log('[SUPABASE INIT] ✅ Client created successfully');
    } catch (error) {
      console.error('[SUPABASE INIT] ❌ Failed to initialize client:', error);
      _supabase = null;
    }
  } else {
    console.error('[SUPABASE INIT] ❌ Missing credentials - URL or Anon Key not provided');
  }
}

// Initialize only in browser
if (typeof window !== 'undefined') {
  initSupabase();
}

// @ts-ignore - Supabase client type inference
export const supabase = _supabase;

export function hasSupabase(): boolean {
  // During build time (SSG), always return false to skip Supabase calls
  if (typeof window === 'undefined') {
    return false;
  }
  return !!_supabase;
}

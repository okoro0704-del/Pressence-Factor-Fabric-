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

  // FORCE HANDSHAKE DEBUG: Log EVERYTHING
  console.log('═══════════════════════════════════════════════════════════');
  console.log('[SUPABASE INIT] 🔐 FORCE HANDSHAKE WITH SUPABASE VAULT');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('[SUPABASE INIT] Environment Check:');
  console.log('  - NODE_ENV:', process.env.NODE_ENV);
  console.log('  - Vault Endpoint:', url ? '✅ DETECTED' : '❌ MISSING');
  console.log('  - Anon Key:', anon ? '✅ DETECTED' : '❌ MISSING');
  console.log('[SUPABASE INIT] Vault Endpoint Details:');
  console.log('  - URL Value:', url || 'EMPTY');
  console.log('  - URL Length:', url.length);
  console.log('  - URL First 30 chars:', url.substring(0, 30));
  console.log('[SUPABASE INIT] Anon Key Details:');
  console.log('  - Key Length:', anon.length);
  console.log('  - Key First 30 chars:', anon.substring(0, 30));
  console.log('  - Key Last 30 chars:', anon.substring(anon.length - 30));

  if (url && anon) {
    try {
      _supabase = createClient(url, anon);
      console.log('[SUPABASE INIT] ✅ Client created successfully');
      console.log('[SUPABASE INIT] Client object:', _supabase ? 'EXISTS' : 'NULL');
      console.log('═══════════════════════════════════════════════════════════');
    } catch (error) {
      console.error('[SUPABASE INIT] ❌ Failed to initialize client');
      console.error('[SUPABASE INIT] Error Type:', error instanceof Error ? error.constructor.name : typeof error);
      console.error('[SUPABASE INIT] Error Message:', error instanceof Error ? error.message : String(error));
      console.error('[SUPABASE INIT] Full Error:', error);
      console.log('═══════════════════════════════════════════════════════════');
      _supabase = null;
    }
  } else {
    console.error('[SUPABASE INIT] ❌ CRITICAL: Missing credentials');
    console.error('[SUPABASE INIT] URL provided:', !!url);
    console.error('[SUPABASE INIT] Anon Key provided:', !!anon);
    console.log('═══════════════════════════════════════════════════════════');
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

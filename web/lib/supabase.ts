/**
 * Supabase client for National Pulse realtime (presence_handshakes).
 * When NEXT_PUBLIC_SUPABASE_URL is missing, returns a mock client so the app does not crash.
 */

import { createClient } from '@supabase/supabase-js';

let _supabase: any = null;
let _initialized = false;
let _isMock = false;

/** No-op mock so supabase.from().select().gte().order().limit() never throws when URL is missing */
function createMockClient(): any {
  const resolved = Promise.resolve({ data: null, error: { message: 'Supabase URL not configured' } });
  const chain = () => ({ gte: chain, order: chain, limit: () => resolved, eq: chain, single: () => resolved });
  return {
    from: () => ({
      select: () => ({ gte: chain, order: chain, limit: () => resolved }),
      insert: () => resolved,
      update: () => resolved,
      delete: () => ({ eq: chain }),
      eq: chain,
      order: chain,
      limit: () => resolved,
      gte: chain,
      single: () => resolved,
    }),
    channel: () => ({ on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }) }),
    removeChannel: () => {},
  };
}

function initSupabase() {
  if (_initialized) return;
  _initialized = true;

  const url = (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SUPABASE_URL)?.trim() ?? '';
  const anon = (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)?.trim() ?? '';

  if (!url || !anon) {
    console.warn(
      '[SUPABASE] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Using mock client so the app does not crash. Add env vars to .env.local for real data.'
    );
    _supabase = createMockClient();
    _isMock = true;
    return;
  }

  // Format check: URL should be https://*.supabase.co; anon key should look like a JWT (three base64 segments)
  const urlFormatOk = url.startsWith('https://') && url.includes('.supabase.co');
  const anonFormatOk = anon.split('.').length === 3;
  if (!urlFormatOk || !anonFormatOk) {
    console.warn(
      '[SUPABASE] Env format may be wrong: URL should be https://*.supabase.co; ANON_KEY should be a JWT. Check .env.local.'
    );
  }

  try {
    _supabase = createClient(url, anon);
    _isMock = false;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn('[SUPABASE] Failed to create client (using mock):', msg);
    _supabase = createMockClient();
    _isMock = true;
  }
}

// Initialize only in browser
if (typeof window !== 'undefined') {
  initSupabase();
}

// Export the client (never null after init in browser; mock when URL missing)
// @ts-ignore - Supabase client type inference
export const supabase = _supabase ?? createMockClient();

export function hasSupabase(): boolean {
  if (typeof window === 'undefined') return false;
  if (!_initialized) initSupabase();
  return !!_supabase && !_isMock;
}

/** Safe getter: returns real client or mock. Use when module may load before init. */
export function getSupabase(): any {
  if (typeof window !== 'undefined' && !_initialized) initSupabase();
  return _supabase ?? createMockClient();
}

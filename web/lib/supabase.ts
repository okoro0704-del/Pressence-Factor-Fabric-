/**
 * Supabase client for National Pulse realtime (presence_handshakes).
 * When NEXT_PUBLIC_SUPABASE_URL is missing, returns a mock client so the app does not crash.
 */

import { createClient } from '@supabase/supabase-js';

let _supabase: any = null;
let _initialized = false;
let _isMock = false;

/** Cached mock client — single instance so we never re-run or create new refs during render/SSR. */
let _cachedMock: any = null;

/** No-op mock so supabase.from().select().gte().order().limit() never throws when URL is missing. Initialized once. */
function getMockClient(): any {
  if (_cachedMock) return _cachedMock;
  const resolved = Promise.resolve({ data: null, error: { message: 'Supabase URL not configured' } });
  const chain = () => ({ gte: chain, order: chain, limit: () => resolved, eq: chain, single: () => resolved });
  _cachedMock = {
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
  return _cachedMock;
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
    _supabase = getMockClient();
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
    _supabase = getMockClient();
    _isMock = true;
  }
}

// Initialize only in browser — outside component render cycle so it does not re-run on every click
if (typeof window !== 'undefined') {
  initSupabase();
}

// Export the client (stable ref: real client or single cached mock)
// @ts-ignore - Supabase client type inference
export const supabase = _supabase ?? getMockClient();

export function hasSupabase(): boolean {
  if (typeof window === 'undefined') return false;
  if (!_initialized) initSupabase();
  return !!_supabase && !_isMock;
}

/** Safe getter: returns real client or cached mock. Use when module may load before init. */
export function getSupabase(): any {
  if (typeof window !== 'undefined' && !_initialized) initSupabase();
  return _supabase ?? getMockClient();
}

/**
 * Singleton Supabase client for National Pulse (presence_handshakes) and app-wide use.
 * If globalThis.__PFF_SUPABASE__ exists, use it; otherwise create once and assign to global scope.
 * Stops Multiple GoTrueClient warnings. When NEXT_PUBLIC_SUPABASE_URL is missing, returns a mock.
 */

import { createClient } from '@supabase/supabase-js';

const GLOBAL_KEY = '__PFF_SUPABASE__';

declare global {
  interface Window {
    [key: string]: any;
  }
}

let _supabase: any = null;
let _initialized = false;
let _isMock = false;

const SCHEMA_REFRESH_TS = typeof window !== 'undefined' ? String(Date.now()) : '0';

function noCacheFetch(url: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers ?? undefined);
  headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  headers.set('Pragma', 'no-cache');
  headers.set('X-PFF-Schema-Refresh', SCHEMA_REFRESH_TS);
  return fetch(url, { ...init, cache: 'no-store', headers });
}

let _cachedMock: any = null;

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
    rpc: () => resolved,
    auth: { getUser: () => resolved },
  };
  return _cachedMock;
}

/** Create the client exactly once. Reuse globalThis[GLOBAL_KEY] if it exists to avoid multiple GoTrueClient. */
function initSupabase(): void {
  if (_initialized) return;
  const g = typeof globalThis !== 'undefined' ? (globalThis as any) : null;
  if (g && g[GLOBAL_KEY]) {
    _supabase = g[GLOBAL_KEY];
    _initialized = true;
    _isMock = false;
    return;
  }
  _initialized = true;

  const url = (typeof process !== 'undefined' ? (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '') : '').trim();
  const anon = (typeof process !== 'undefined' ? (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '') : '').trim();

  if (!url || !anon) {
    _supabase = getMockClient();
    _isMock = true;
    return;
  }

  try {
    _supabase = createClient(url, anon, {
      auth: { autoRefreshToken: true, persistSession: true },
      global: { fetch: noCacheFetch },
    } as any);
    _isMock = false;
    if (g) g[GLOBAL_KEY] = _supabase;
  } catch (error) {
    _supabase = getMockClient();
    _isMock = true;
  }
}

if (typeof window !== 'undefined') {
  initSupabase();
}

/** Returns the single Supabase instance. Use this or the exported `supabase` proxy. */
export function getSupabase(): any {
  if (typeof window !== 'undefined' && !_initialized) initSupabase();
  return _supabase ?? getMockClient();
}

/** Single exported instance: every access delegates to getSupabase() so one client is used everywhere. */
export const supabase = new Proxy({} as any, {
  get(_, prop: string) {
    return (getSupabase() as any)[prop];
  },
});

export function hasSupabase(): boolean {
  if (typeof window === 'undefined') return false;
  if (!_initialized) initSupabase();
  return !!_supabase && !_isMock;
}

/** Resolves when the Supabase client is fully initialized. Use before running presence checks to avoid undefined behavior. */
export function whenSupabaseReady(): Promise<any> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(getMockClient());
      return;
    }
    initSupabase();
    resolve(getSupabase());
  });
}

export async function testConnection(): Promise<
  { ok: true; latencyMs: number } | { ok: false; error: string }
> {
  const client = getSupabase();
  if (!client || _isMock) {
    return { ok: false, error: 'Supabase not configured or mock client' };
  }
  const start = typeof performance !== 'undefined' ? performance.now() : Date.now();
  try {
    const { error } = await client.from('user_profiles').select('id').limit(1);
    const latencyMs = Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - start);
    if (error) return { ok: false, error: error.message ?? 'Query failed' };
    return { ok: true, latencyMs };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

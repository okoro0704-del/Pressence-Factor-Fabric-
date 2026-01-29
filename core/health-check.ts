/**
 * PFF System Health Check — diagnostic utility for the 3 core layers.
 * Run in browser (PWA) only. Use pffHealthCheck() or /debug route.
 *
 * Layer 1: Hardware (WebAuthn / Secure Enclave)
 * Layer 2: Resilience (IndexedDB pff_sync_queue, Service Worker sync)
 * Layer 3: National Pulse (Backend /health, Supabase Realtime presence_handshakes)
 */

export type CheckStatus = 'ok' | 'fail' | 'skip';

export interface LayerReport {
  layer: 'hardware' | 'resilience' | 'national-pulse';
  label: string;
  status: CheckStatus;
  detail?: string;
}

export interface HealthCheckResult {
  ok: boolean;
  layers: LayerReport[];
  report: string;
  ready: boolean;
}

const DB_NAME = 'pff_vault';
const DB_VERSION = 1;
const STORE_QUEUE = 'pff_sync_queue';
const HEALTH_URL = '/api/health';

function line(status: CheckStatus, message: string): string {
  const prefix = status === 'ok' ? '[OK]' : status === 'fail' ? '[FAIL]' : '[SKIP]';
  return `${prefix} ${message}`;
}

async function checkHardware(): Promise<LayerReport> {
  if (typeof window === 'undefined') {
    return { layer: 'hardware', label: 'Hardware (WebAuthn)', status: 'skip', detail: 'Browser only' };
  }
  const cred = window.PublicKeyCredential;
  if (!cred) {
    return {
      layer: 'hardware',
      label: 'Secure Enclave Active',
      status: 'fail',
      detail: 'PublicKeyCredential not available',
    };
  }
  let platform = false;
  try {
    if (typeof cred.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
      platform = await cred.isUserVerifyingPlatformAuthenticatorAvailable();
    }
  } catch {
    platform = false;
  }
  if (!platform) {
    return {
      layer: 'hardware',
      label: 'Secure Enclave Active',
      status: 'fail',
      detail: 'No user-verifying platform authenticator (Face ID / Touch ID)',
    };
  }
  return {
    layer: 'hardware',
    label: 'Secure Enclave Active',
    status: 'ok',
  };
}

async function checkResilience(): Promise<LayerReport> {
  if (typeof window === 'undefined') {
    return { layer: 'resilience', label: 'Resilience (IndexedDB & SW)', status: 'skip', detail: 'Browser only' };
  }
  let pending = 0;
  let idbOk = false;
  try {
    const { openDB } = await import('idb');
    const db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(database) {
        if (!database.objectStoreNames.contains(STORE_QUEUE)) {
          const s = database.createObjectStore(STORE_QUEUE, { keyPath: 'handshakeId' });
          s.createIndex('by-status', 'status');
          s.createIndex('by-timestamp', 'timestamp');
        }
        if (!database.objectStoreNames.contains('pff_keys')) {
          database.createObjectStore('pff_keys', { keyPath: 'id' });
        }
      },
    });
    pending = await db.countFromIndex(STORE_QUEUE, 'by-status', 'pending');
    idbOk = true;
  } catch (e) {
    return {
      layer: 'resilience',
      label: 'Sync Queue Initialized',
      status: 'fail',
      detail: e instanceof Error ? e.message : 'IndexedDB failed',
    };
  }
  let syncOk = false;
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    if (reg) {
      syncOk = 'sync' in reg;
    } else {
      return {
        layer: 'resilience',
        label: `Sync Queue Initialized (${pending} pending)`,
        status: 'fail',
        detail: 'Service Worker not registered',
      };
    }
  } catch (e) {
    return {
      layer: 'resilience',
      label: `Sync Queue Initialized (${pending} pending)`,
      status: 'fail',
      detail: e instanceof Error ? e.message : 'Service Worker check failed',
    };
  }
  if (!idbOk || !syncOk) {
    return {
      layer: 'resilience',
      label: `Sync Queue Initialized (${pending} pending)`,
      status: 'fail',
      detail: !syncOk ? 'registration.sync not available' : undefined,
    };
  }
  return {
    layer: 'resilience',
    label: `Sync Queue Initialized (${pending} pending)`,
    status: 'ok',
  };
}

async function checkNationalPulse(): Promise<LayerReport> {
  if (typeof window === 'undefined') {
    return { layer: 'national-pulse', label: 'National Pulse Online', status: 'skip', detail: 'Browser only' };
  }
  let backendOk = false;
  try {
    const res = await fetch(HEALTH_URL, { method: 'GET', credentials: 'same-origin' });
    backendOk = res.ok;
  } catch {
    backendOk = false;
  }
  if (!backendOk) {
    return {
      layer: 'national-pulse',
      label: 'National Pulse Online',
      status: 'fail',
      detail: 'Backend /api/health unreachable',
    };
  }
  const url = typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_URL;
  const anon = typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return {
      layer: 'national-pulse',
      label: 'National Pulse Online',
      status: 'ok',
      detail: 'Backend OK; Supabase not configured (optional)',
    };
  }
  let realtimeOk = false;
  type SupabaseClient = {
    channel: (name: string) => { on: (ev: string, opts: unknown, cb: () => void) => { subscribe: (cb: (s: string) => void) => void } };
    removeChannel: (ch: unknown) => void;
  };
  let supabaseInstance: SupabaseClient | null = null;
  let ch: unknown = null;
  try {
    const { createClient } = await import('@supabase/supabase-js');
    supabaseInstance = createClient(url, anon) as SupabaseClient;
    ch = supabaseInstance.channel('pff-health-check').on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'presence_handshakes' },
      () => {}
    );
    await new Promise<void>((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('Realtime timeout')), 5000);
      const done = (fn: () => void) => {
        clearTimeout(t);
        fn();
      };
      (ch as { subscribe: (cb: (s: string) => void) => void }).subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          done(resolve);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          done(() => reject(new Error(`Realtime ${status}`)));
        }
      });
    });
    realtimeOk = true;
  } catch {
    realtimeOk = false;
  } finally {
    if (supabaseInstance && ch) {
      supabaseInstance.removeChannel(ch);
    }
  }
  if (!realtimeOk) {
    return {
      layer: 'national-pulse',
      label: 'National Pulse Online',
      status: 'fail',
      detail: 'Supabase Realtime (presence_handshakes) not established',
    };
  }
  return {
    layer: 'national-pulse',
    label: 'National Pulse Online',
    status: 'ok',
  };
}

/**
 * Run the PFF System Health Check. Browser (PWA) only.
 * Returns a structured result and a printable report.
 */
export async function pffHealthCheck(): Promise<HealthCheckResult> {
  if (typeof window === 'undefined') {
    const report = line('skip', 'Run pffHealthCheck() in browser (PWA context).');
    return {
      ok: false,
      layers: [],
      report: `${report}\n[SKIP] SYSTEM READY FOR VITALIZATION — run in browser.`,
      ready: false,
    };
  }
  const hw = await checkHardware();
  const res = await checkResilience();
  const np = await checkNationalPulse();
  const layers: LayerReport[] = [hw, res, np];
  const allOk = layers.every((l) => l.status === 'ok');
  const anyFail = layers.some((l) => l.status === 'fail');
  const lines: string[] = layers.map((l) => line(l.status, l.detail ? `${l.label} — ${l.detail}` : l.label));
  if (allOk) {
    lines.push('[SYSTEM READY FOR VITALIZATION]');
  } else if (anyFail) {
    lines.push('[SYSTEM NOT READY — resolve failures above]');
  } else {
    lines.push('[SYSTEM READY FOR VITALIZATION]');
  }
  return {
    ok: allOk,
    layers,
    report: lines.join('\n'),
    ready: allOk,
  };
}

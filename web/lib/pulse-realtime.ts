/**
 * National Pulse — realtime handshake events for PulsePoint.
 * Subscribes to Supabase presence_handshakes; falls back to mock when no Supabase.
 * Fortress: sanitize nation at emit so all consumers receive safe data.
 */

import { sanitizeNation } from './sanitize-pulse';

export interface HandshakeEvent {
  nation: string;
  at: number;
}

type Listener = (ev: HandshakeEvent) => void;

const listeners = new Set<Listener>();

export function subscribeHandshakes(cb: Listener): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function emitHandshake(ev: HandshakeEvent): void {
  const nation = sanitizeNation(ev.nation);
  if (!nation) return;
  listeners.forEach((cb) => cb({ nation, at: ev.at }));
}

export function useRealtimeHandshakes(): void {
  // Hook-like; actual subscription happens in component via subscribeHandshakes.
}

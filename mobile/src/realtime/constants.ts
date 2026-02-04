/**
 * Realtime channel constants — MUST match web (web/lib/realtimeConstants.ts).
 * Same channel so mobile and web receive the same presence_handshakes stream.
 */

/** Channel name — must be identical to web PRESENCE_HANDSHAKES_CHANNEL. */
export const PRESENCE_HANDSHAKES_CHANNEL = 'presence_handshakes';

export const PRESENCE_HANDSHAKES_SCHEMA = 'public';
export const PRESENCE_HANDSHAKES_TABLE = 'presence_handshakes';

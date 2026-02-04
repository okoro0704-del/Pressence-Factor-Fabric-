/**
 * Shared Realtime channel/table constants for web and mobile.
 * Use the same channel name so both apps subscribe to the same presence_handshakes stream.
 * Mobile: copy these values when adding Supabase Realtime (e.g. @supabase/supabase-js).
 */

/** Channel name for presence_handshakes — web and mobile must use this exact string. */
export const PRESENCE_HANDSHAKES_CHANNEL = 'presence_handshakes';

/** Schema and table for postgres_changes subscription. */
export const PRESENCE_HANDSHAKES_SCHEMA = 'public';
export const PRESENCE_HANDSHAKES_TABLE = 'presence_handshakes';

/**
 * To receive handshakes only for a specific number (e.g. +2347038256449), filter client-side:
 * - Option A: Add phone_number to presence_handshakes (migration + backend insert), then in
 *   the INSERT callback check payload.new.phone_number === targetPhone.
 * - Option B: presence_handshakes currently has citizen_id only; join to citizens/sentinel_identities
 *   by phone on each event (or add phone_number to the table for simpler filtering).
 */

/**
 * Subscribe to presence_handshakes (same channel as web).
 * Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY (or equivalent) to enable.
 * To receive only handshakes for a number (e.g. +2347038256449), pass filterPhone;
 * requires presence_handshakes to have phone_number column (backend + migration).
 */

import {
  PRESENCE_HANDSHAKES_CHANNEL,
  PRESENCE_HANDSHAKES_SCHEMA,
  PRESENCE_HANDSHAKES_TABLE,
} from './constants';

export type PresenceHandshakeRow = {
  nation?: string;
  phone_number?: string;
  citizen_id?: string;
};

export type HandshakeInsertCallback = (row: PresenceHandshakeRow) => void;

/**
 * Subscribe to presence_handshakes INSERTs. Returns unsubscribe function.
 * Uses same channel as web so both apps get the same realtime stream.
 */
export function subscribePresenceHandshakes(
  supabaseClient: {
    channel: (name: string) => {
      on: (
        event: string,
        opts: { event: string; schema: string; table: string },
        cb: (payload: { new: PresenceHandshakeRow }) => void
      ) => { subscribe: () => void };
    };
    removeChannel: (ch: unknown) => void;
  },
  onInsert: HandshakeInsertCallback,
  options?: { filterPhone?: string }
): () => void {
  const { filterPhone } = options ?? {};
  const ch = supabaseClient.channel(PRESENCE_HANDSHAKES_CHANNEL).on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: PRESENCE_HANDSHAKES_SCHEMA,
      table: PRESENCE_HANDSHAKES_TABLE,
    },
    (payload: { new: PresenceHandshakeRow }) => {
      const row = payload.new;
      if (filterPhone && row.phone_number !== undefined && row.phone_number !== filterPhone) return;
      onInsert(row);
    }
  );
  ch.subscribe();
  return () => supabaseClient.removeChannel(ch);
}

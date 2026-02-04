'use client';

import { useEffect, useRef, useCallback } from 'react';
import { supabase, hasSupabase } from '@/lib/supabase';
import { emitHandshake } from '@/lib/pulse-realtime';
import { sanitizeNation } from '@/lib/sanitize-pulse';
import { MOCK_NATION_METRICS } from '@/data/pulse-metrics';
import {
  PRESENCE_HANDSHAKES_CHANNEL,
  PRESENCE_HANDSHAKES_SCHEMA,
  PRESENCE_HANDSHAKES_TABLE,
} from '@/lib/realtimeConstants';

const NATIONS = Object.keys(MOCK_NATION_METRICS);

/** Payload row from presence_handshakes INSERT (optional phone_number when added by backend). */
type PresenceHandshakeRow = { nation?: string; phone_number?: string; citizen_id?: string };

export interface UseHandshakeRealtimeOptions {
  /** If set, only emit when row.phone_number matches (e.g. +2347038256449). Requires phone_number on presence_handshakes. */
  filterPhone?: string;
}

/**
 * Subscribe to presence_handshakes (Supabase Realtime) or mock interval.
 * Uses shared channel name so web and mobile receive the same stream.
 * Emits HandshakeEvents for PulsePoint. Fortress: sanitize nation before emit.
 */
export function useHandshakeRealtime(options?: UseHandshakeRealtimeOptions) {
  const { filterPhone } = options ?? {};
  const mockRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const onInsert = useCallback(
    (payload?: { new?: PresenceHandshakeRow }) => {
      const row = payload?.new;
      if (!row) return;
      if (filterPhone && row.phone_number !== undefined && row.phone_number !== filterPhone) return;
      const raw = row.nation;
      const n = sanitizeNation(raw);
      if (n) emitHandshake({ nation: n, at: Date.now() });
    },
    [filterPhone]
  );

  useEffect(() => {
    if (hasSupabase() && supabase) {
      const channel = supabase
        .channel(PRESENCE_HANDSHAKES_CHANNEL)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: PRESENCE_HANDSHAKES_SCHEMA,
            table: PRESENCE_HANDSHAKES_TABLE,
          },
          onInsert
        )
        .subscribe();
      return () => {
        supabase?.removeChannel(channel);
      };
    }

    const interval = setInterval(() => {
      const nation = sanitizeNation(NATIONS[Math.floor(Math.random() * NATIONS.length)]);
      if (nation) emitHandshake({ nation, at: Date.now() });
    }, 4000);
    mockRef.current = interval;
    return () => {
      if (mockRef.current) clearInterval(mockRef.current);
    };
  }, [onInsert]);
}

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { supabase, hasSupabase } from '@/lib/supabase';
import { emitHandshake } from '@/lib/pulse-realtime';
import { sanitizeNation } from '@/lib/sanitize-pulse';
import { MOCK_NATION_METRICS } from '@/data/pulse-metrics';

const NATIONS = Object.keys(MOCK_NATION_METRICS);

/**
 * Subscribe to presence_handshakes (Supabase Realtime) or mock interval.
 * Emits HandshakeEvents for PulsePoint. Fortress: sanitize nation before emit.
 */
export function useHandshakeRealtime() {
  const mockRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const onInsert = useCallback((payload: { new?: { nation?: string } }) => {
    const raw = payload.new?.nation;
    const n = sanitizeNation(raw);
    if (n) emitHandshake({ nation: n, at: Date.now() });
  }, []);

  useEffect(() => {
    if (hasSupabase() && supabase) {
      const channel = supabase
        .channel('presence_handshakes')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'presence_handshakes' },
          onInsert
        )
        .subscribe();
      return () => {
        supabase.removeChannel(channel);
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

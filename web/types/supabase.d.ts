/**
 * Declare '@supabase/supabase-js' for type-checking when core/health-check.ts is built by the web app,
 * and to avoid resolution issues. Includes Realtime (channel/removeChannel) and DB (.from/.select).
 */
declare module '@supabase/supabase-js' {
  export function createClient(
    url: string,
    anonKey: string
  ): {
    channel: (name: string) => {
      on: (
        event: string,
        opts: { event: string; schema: string; table: string },
        callback: (payload?: { new?: Record<string, unknown> }) => void
      ) => { subscribe: (cb?: (status: string) => void) => void };
    };
    removeChannel: (ch: unknown) => void;
    from: (table: string) => {
      select: (
        columns?: string,
        opts?: { count?: 'exact'; head?: boolean }
      ) => Promise<{ count: number | null; error: { message: string } | null }>;
    };
  };
}

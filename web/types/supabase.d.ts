/**
 * Declare '@supabase/supabase-js' for type-checking when core/health-check.ts is built by the web app,
 * and to avoid resolution issues. Includes Realtime (channel/removeChannel) and DB (.from/.select).
 * user_profiles includes recovery_seed_encrypted for Schema Cache / type safety.
 */
declare module '@supabase/supabase-js' {
  export function createClient(
    url: string,
    anonKey: string,
    options?: { global?: { fetch?: typeof fetch } }
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

/** Database table types for type safety (recovery_seed_encrypted, etc.). */
export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          phone_number: string | null;
          full_name: string | null;
          recovery_seed_hash: string | null;
          recovery_seed_encrypted: string | null;
          recovery_seed_iv: string | null;
          recovery_seed_salt: string | null;
          primary_sentinel_device_id: string | null;
          primary_sentinel_assigned_at: string | null;
          updated_at: string | null;
          [key: string]: unknown;
        };
        Insert: Partial<Database['public']['Tables']['user_profiles']['Row']>;
        Update: Partial<Database['public']['Tables']['user_profiles']['Row']>;
      };
    };
  };
}

/**
 * Declare '@supabase/supabase-js' for type-checking when core/health-check.ts is built by the web app,
 * and to avoid resolution issues. Includes Realtime (channel/removeChannel) and DB (.from/.select).
 * user_profile / user_profiles include recovery_seed_hash for Schema Cache / type safety.
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

/** Database table types for type safety (recovery_seed_hash, etc.). */
export interface Database {
  public: {
    Tables: {
      user_profile: {
        Row: {
          id: string;
          phone_number: string | null;
          full_name: string | null;
          face_hash: string | null;
          recovery_seed_hash: string | null;
          recovery_seed_encrypted: string | null;
          recovery_seed_iv: string | null;
          recovery_seed_salt: string | null;
          external_scanner_serial_number: string | null;
          external_fingerprint_hash: string | null;
          primary_sentinel_device_id: string | null;
          primary_sentinel_assigned_at: string | null;
          humanity_score: number | null;
          mint_status: string | null;
          is_minted: boolean | null;
          is_fully_verified: boolean | null;
          vida_mint_tx_hash: string | null;
          identity_bound: boolean | null;
          spending_unlocked: boolean | null;
          updated_at: string | null;
          [key: string]: unknown;
        };
        Insert: Partial<Database['public']['Tables']['user_profile']['Row']>;
        Update: Partial<Database['public']['Tables']['user_profile']['Row']>;
      };
      user_profiles: {
        Row: Database['public']['Tables']['user_profile']['Row'];
        Insert: Database['public']['Tables']['user_profile']['Insert'];
        Update: Database['public']['Tables']['user_profile']['Update'];
      };
    };
  };
}

/** User profile row (user_profile table). Includes recovery_seed_hash. */
export type UserProfile = Database['public']['Tables']['user_profile']['Row'];

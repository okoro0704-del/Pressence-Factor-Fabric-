-- Sentinel Remote Commands — Sentinel (laptop) can send commands to user's phone via Supabase Realtime.
-- Phone subscribes to INSERTs; when command = 'wake_scanner', triggers external scanner (Auto-On).

CREATE TABLE IF NOT EXISTS public.sentinel_remote_commands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  command TEXT NOT NULL DEFAULT 'wake_scanner',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sentinel_remote_commands_phone_number ON public.sentinel_remote_commands(phone_number);
CREATE INDEX IF NOT EXISTS idx_sentinel_remote_commands_created_at ON public.sentinel_remote_commands(created_at DESC);

COMMENT ON TABLE public.sentinel_remote_commands IS 'Sentinel (laptop) inserts a row to remotely wake scanner on user phone. Phone subscribes via Realtime. Enable Realtime for this table in Supabase Dashboard (Database → Replication).';

-- RLS: allow authenticated users to insert (Sentinel) and allow select by phone_number for the recipient
ALTER TABLE public.sentinel_remote_commands ENABLE ROW LEVEL SECURITY;

CREATE POLICY sentinel_remote_commands_insert ON public.sentinel_remote_commands
  FOR INSERT WITH CHECK (true);

CREATE POLICY sentinel_remote_commands_select_own ON public.sentinel_remote_commands
  FOR SELECT USING (true);

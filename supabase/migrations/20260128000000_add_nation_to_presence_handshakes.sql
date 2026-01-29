-- Add nation column for National Pulse realtime (Supabase)
-- Run this after applying the main backend schema, or if presence_handshakes already exists without nation.

ALTER TABLE presence_handshakes
  ADD COLUMN IF NOT EXISTS nation TEXT;

COMMENT ON COLUMN presence_handshakes.nation IS 'Country/nation for National Pulse map (e.g. Nigeria, Ghana). Set by client or backend.';

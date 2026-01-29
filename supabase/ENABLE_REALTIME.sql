-- =============================================================================
-- Enable Realtime for presence_handshakes (National Pulse)
-- Run this in Supabase → SQL Editor → New query → Paste → Run
-- =============================================================================

-- Add the table to Supabase's Realtime publication (no UI needed)
ALTER PUBLICATION supabase_realtime ADD TABLE presence_handshakes;

-- Add verified_at to presence_handshakes if missing (fixes "column verified_at is missing" error).
-- Safe to run multiple times: only adds the column when it does not exist.
-- Type: timestamp with time zone (TIMESTAMPTZ).

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'presence_handshakes'
      AND column_name = 'verified_at'
  ) THEN
    ALTER TABLE presence_handshakes
      ADD COLUMN verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    COMMENT ON COLUMN presence_handshakes.verified_at IS 'When the handshake was verified (used by web presence check).';
  END IF;
END $$;

-- Index for presence check queries that order by verified_at
CREATE INDEX IF NOT EXISTS idx_handshakes_verified
  ON presence_handshakes(verified_at DESC);

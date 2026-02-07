-- Add liveness_score and verified_at to presence_handshakes if missing (schema mismatch fix).
-- Run this in Supabase SQL Editor if you see "column verified_at is missing" or "column liveness_score is missing".
-- Safe to run multiple times: only adds columns when they do not exist.

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

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'presence_handshakes'
      AND column_name = 'liveness_score'
  ) THEN
    ALTER TABLE presence_handshakes
      ADD COLUMN liveness_score NUMERIC(5,4) NOT NULL DEFAULT 1.0;
    COMMENT ON COLUMN presence_handshakes.liveness_score IS 'Liveness score from biometric verification (e.g. > 0.99).';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_handshakes_verified
  ON presence_handshakes(verified_at DESC);

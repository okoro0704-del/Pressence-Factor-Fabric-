-- =============================================================================
-- Run this in Supabase Dashboard → SQL Editor (one-time or when you see errors).
-- Ensures: presence_handshakes has verified_at + liveness_score, optional columns
--         nullable, and get_user_profiles_count() RPC exists (avoids 404).
-- =============================================================================

-- 1) RPC used by the app for Day Zero / first registration (avoids 404)
CREATE OR REPLACE FUNCTION get_user_profiles_count()
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::bigint FROM user_profiles;
$$;
COMMENT ON FUNCTION get_user_profiles_count() IS 'Day Zero: count of user_profiles. App fallback 777 on RPC error.';

-- 2) presence_handshakes: add verified_at and liveness_score if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'presence_handshakes' AND column_name = 'verified_at'
  ) THEN
    ALTER TABLE presence_handshakes ADD COLUMN verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    COMMENT ON COLUMN presence_handshakes.verified_at IS 'When the handshake was verified (web presence check).';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'presence_handshakes' AND column_name = 'liveness_score'
  ) THEN
    ALTER TABLE presence_handshakes ADD COLUMN liveness_score NUMERIC(5,4) NOT NULL DEFAULT 1.0;
    COMMENT ON COLUMN presence_handshakes.liveness_score IS 'Liveness score from biometric verification (e.g. > 0.99).';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_handshakes_verified ON presence_handshakes(verified_at DESC);

-- 3) Make handshake_code / anchor_phone optional if they exist (avoids NOT NULL errors)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'presence_handshakes' AND column_name = 'handshake_code'
  ) THEN
    ALTER TABLE presence_handshakes ALTER COLUMN handshake_code DROP NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'presence_handshakes' AND column_name = 'anchor_phone'
  ) THEN
    ALTER TABLE presence_handshakes ALTER COLUMN anchor_phone DROP NOT NULL;
  END IF;
END $$;

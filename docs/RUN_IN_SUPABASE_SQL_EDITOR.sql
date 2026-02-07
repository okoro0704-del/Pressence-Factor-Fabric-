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

-- =============================================================================
-- 4) Sovereign Memory Vault + vibration scope (Linguistic Vibration / Banter Memory)
-- Run if you use the Companion's Memory Vault or vibration matching.
-- =============================================================================

CREATE TABLE IF NOT EXISTS sovereign_memory_vault (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  citizen_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  scope text NOT NULL CHECK (scope IN ('family', 'health', 'goals', 'other', 'vibration')),
  content text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE(citizen_id, scope)
);

COMMENT ON TABLE sovereign_memory_vault IS 'SOVRYN Memory Vault: relational context + vibration (register|lang) for banter memory. Private to the Citizen.';

CREATE INDEX IF NOT EXISTS idx_memory_vault_citizen ON sovereign_memory_vault(citizen_id);
CREATE INDEX IF NOT EXISTS idx_memory_vault_updated ON sovereign_memory_vault(updated_at DESC);

ALTER TABLE sovereign_memory_vault ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Citizens read own vault" ON sovereign_memory_vault;
CREATE POLICY "Citizens read own vault"
  ON sovereign_memory_vault FOR SELECT
  USING (auth.uid() = citizen_id);

DROP POLICY IF EXISTS "Citizens insert own vault" ON sovereign_memory_vault;
CREATE POLICY "Citizens insert own vault"
  ON sovereign_memory_vault FOR INSERT
  WITH CHECK (auth.uid() = citizen_id);

DROP POLICY IF EXISTS "Citizens update own vault" ON sovereign_memory_vault;
CREATE POLICY "Citizens update own vault"
  ON sovereign_memory_vault FOR UPDATE
  USING (auth.uid() = citizen_id)
  WITH CHECK (auth.uid() = citizen_id);

DROP POLICY IF EXISTS "Citizens delete own vault" ON sovereign_memory_vault;
CREATE POLICY "Citizens delete own vault"
  ON sovereign_memory_vault FOR DELETE
  USING (auth.uid() = citizen_id);

-- If table already existed with the old scope CHECK (no 'vibration'), add it:
DO $$
DECLARE
  conname text;
BEGIN
  SELECT c.conname INTO conname
  FROM pg_constraint c
  JOIN pg_class t ON c.conrelid = t.oid
  WHERE t.relname = 'sovereign_memory_vault' AND c.contype = 'c'
    AND pg_get_constraintdef(c.oid) LIKE '%scope%';
  IF conname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE sovereign_memory_vault DROP CONSTRAINT %I', conname);
    ALTER TABLE sovereign_memory_vault
      ADD CONSTRAINT sovereign_memory_vault_scope_check
      CHECK (scope IN ('family', 'health', 'goals', 'other', 'vibration'));
  END IF;
EXCEPTION
  WHEN undefined_object THEN NULL; -- table didn't exist, CREATE TABLE above already has vibration
END $$;

COMMENT ON COLUMN sovereign_memory_vault.scope IS 'family|health|goals|other|vibration. vibration = register|lang for banter memory.';

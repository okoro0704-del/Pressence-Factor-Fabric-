-- Sovereign Memory Vault: relational details (family, health, goals) for SOVRYN to reference in small talk.
-- Citizen-scoped; RLS so each user sees only their own vault. No corporation—private counsel.

CREATE TABLE IF NOT EXISTS sovereign_memory_vault (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  citizen_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  scope text NOT NULL CHECK (scope IN ('family', 'health', 'goals', 'other')),
  content text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE(citizen_id, scope)
);

COMMENT ON TABLE sovereign_memory_vault IS 'SOVRYN Memory Vault: relational context (family, health, goals) for warm, personalized small talk. Private to the Citizen.';

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

-- Allow anonymous/session-based use: if app uses session_id instead of citizen_id, add a separate table or column.
-- Here we use citizen_id only; when no auth, app can use a local/session store and sync when user signs in.

-- Sovereign Recovery Key (Master Seed) — columns on user_profiles
-- Stores hash (for recovery verification) and AES-256 encrypted seed.
-- Decryption key is only available after Authenticated Face Pulse.

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS recovery_seed_hash TEXT,
  ADD COLUMN IF NOT EXISTS recovery_seed_encrypted TEXT,
  ADD COLUMN IF NOT EXISTS recovery_seed_iv TEXT,
  ADD COLUMN IF NOT EXISTS recovery_seed_salt TEXT;

COMMENT ON COLUMN user_profiles.recovery_seed_hash IS 'SHA-256 hash of 12-word phrase for Recover My Account verification';
COMMENT ON COLUMN user_profiles.recovery_seed_encrypted IS 'AES-256-GCM encrypted seed; key derived from identity + salt, only after Face Pulse';
COMMENT ON COLUMN user_profiles.recovery_seed_iv IS 'IV for AES-GCM';
COMMENT ON COLUMN user_profiles.recovery_seed_salt IS 'Salt for key derivation';

CREATE INDEX IF NOT EXISTS idx_user_profiles_recovery_seed_hash ON user_profiles(recovery_seed_hash) WHERE recovery_seed_hash IS NOT NULL;

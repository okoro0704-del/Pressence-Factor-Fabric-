-- Ensure recovery_seed_hash (and related columns) exist on user_profiles.
-- Run after this: NOTIFY pgrst, 'reload schema';

ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS recovery_seed_hash TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS recovery_seed_encrypted TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS recovery_seed_iv TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS recovery_seed_salt TEXT;

COMMENT ON COLUMN user_profiles.recovery_seed_hash IS 'SHA-256 hash of 12-word phrase for Recover My Account verification';
COMMENT ON COLUMN user_profiles.recovery_seed_encrypted IS 'AES-256-GCM encrypted seed; key derived from identity + salt';
COMMENT ON COLUMN user_profiles.recovery_seed_iv IS 'IV for AES-GCM';
COMMENT ON COLUMN user_profiles.recovery_seed_salt IS 'Salt for key derivation';

CREATE INDEX IF NOT EXISTS idx_user_profiles_recovery_seed_hash ON user_profiles(recovery_seed_hash) WHERE recovery_seed_hash IS NOT NULL;

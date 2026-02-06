-- DNA Learning Curve: trust_level increases on each successful login.
-- Soft Start: first 10 logins use LOW biometric sensitivity; after trust_level > 10 suggest Sovereign Shield (High Security).

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS trust_level INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN user_profiles.trust_level IS 'Incremented on each successful login. Soft start (low sensitivity) until > 10; then suggest Sovereign Shield mode.';

CREATE INDEX IF NOT EXISTS idx_user_profiles_trust_level ON user_profiles(trust_level) WHERE trust_level IS NOT NULL;

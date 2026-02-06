-- Contactless Palm Verification: store palm geometry hash (MediaPipe Hands) for Dual-Pillar auth.
-- Scan 1: Face Pulse (identity). Scan 2: Palm Pulse (authorize $100 daily unlock).

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS palm_hash TEXT DEFAULT NULL;

COMMENT ON COLUMN user_profiles.palm_hash IS 'SHA-256 hash of palm geometry (distances between fingers, line intersections). Used for Palm Pulse second pillar.';

CREATE INDEX IF NOT EXISTS idx_user_profiles_palm_hash ON user_profiles(palm_hash) WHERE palm_hash IS NOT NULL;

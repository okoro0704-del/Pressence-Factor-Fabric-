-- Contactless Palm Verification: store palm geometry hash for dual-pillar (Face + Palm) auth.
-- palm_hash: SHA-256 of normalized palm geometry (distances between fingers, line intersections).

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS palm_hash TEXT DEFAULT NULL;

COMMENT ON COLUMN user_profiles.palm_hash IS 'SHA-256 hash of palm geometry (MediaPipe Hands landmarks: distances, intersections). Used for Palm Pulse (second pillar) and $100 daily unlock.';

CREATE INDEX IF NOT EXISTS idx_user_profiles_palm_hash ON user_profiles(palm_hash) WHERE palm_hash IS NOT NULL;

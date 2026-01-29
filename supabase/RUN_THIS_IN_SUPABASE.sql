-- =============================================================================
-- RUN THIS IN SUPABASE SQL EDITOR to fix "column citizen_id does not exist"
-- Copy the entire file, paste in SQL Editor, click Run.
-- =============================================================================

-- 1. Ensure citizens table exists (required for presence_handshakes)
CREATE TABLE IF NOT EXISTS citizens (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pff_id            TEXT UNIQUE NOT NULL,
  vitalization_status TEXT NOT NULL DEFAULT 'pending',
  hardware_anchor_hash TEXT NOT NULL,
  public_key        TEXT NOT NULL,
  key_id            TEXT NOT NULL,
  device_id         TEXT NOT NULL,
  legal_identity_ref TEXT,
  attested_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(device_id, key_id)
);
CREATE INDEX IF NOT EXISTS idx_citizens_device_key ON citizens(device_id, key_id);
CREATE INDEX IF NOT EXISTS idx_citizens_pff_id ON citizens(pff_id);
CREATE INDEX IF NOT EXISTS idx_citizens_vitalization ON citizens(vitalization_status);

-- 2. Drop presence_handshakes so we can recreate it with the correct columns
DROP TABLE IF EXISTS presence_handshakes CASCADE;

-- 3. Create presence_handshakes with all columns (including citizen_id and nation)
CREATE TABLE presence_handshakes (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  citizen_id        UUID NOT NULL REFERENCES citizens(id) ON DELETE CASCADE,
  nonce_used        TEXT NOT NULL UNIQUE,
  payload_hash      TEXT NOT NULL,
  attestation_info  TEXT,
  liveness_score    NUMERIC(5,4) NOT NULL,
  verified_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  nation            TEXT,
  CHECK (liveness_score > 0.99)
);

CREATE INDEX idx_handshakes_citizen ON presence_handshakes(citizen_id);
CREATE INDEX idx_handshakes_nonce ON presence_handshakes(nonce_used);
CREATE INDEX idx_handshakes_verified ON presence_handshakes(verified_at);

-- 4. Enable Realtime for National Pulse (no need for "read replica" page)
ALTER PUBLICATION supabase_realtime ADD TABLE presence_handshakes;

-- Fix: "column citizen_id does not exist"
-- Run this if presence_handshakes was created without citizen_id (e.g. minimal table for National Pulse).
-- Requires: citizens table must already exist (run main schema first).

-- Drop the table so we can recreate it with the full structure.
DROP TABLE IF EXISTS presence_handshakes CASCADE;

-- Recreate with all columns (matches backend/src/db/schema.sql).
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

COMMENT ON COLUMN presence_handshakes.nation IS 'Country for National Pulse map (e.g. Nigeria, Ghana).';

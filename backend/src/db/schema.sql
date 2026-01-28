-- PFF Backend — 50/50 Doctrine Schema
-- Lead: Isreal Okoro (mrfundzman). Born in Lagos, Built for the World.
--
-- Identity Metadata (citizen autonomy) vs Transaction Integrity (audit, no PII).

-- -----------------------------------------------------------------------------
-- IDENTITY METADATA
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS citizens (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pff_id            TEXT UNIQUE NOT NULL,
  vitalization_status TEXT NOT NULL DEFAULT 'pending',  -- pending | vitalized | revoked
  hardware_anchor_hash TEXT NOT NULL,                   -- hash(publicKey || deviceId); no biometrics
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

-- Guardian Anchor: Child ID tethered to Parent PFF for sanctuary rights
CREATE TABLE IF NOT EXISTS guardian_anchor (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_pff_id     TEXT NOT NULL REFERENCES citizens(pff_id) ON DELETE CASCADE,
  child_id          TEXT NOT NULL,
  permissions       JSONB NOT NULL DEFAULT '[]',       -- read_vault, request_decrypt, manage_consent, revoke
  constraints       JSONB,                            -- maxUsageCount, expiresAt, allowedActions
  signed_tether_digest TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(parent_pff_id, child_id)
);

CREATE INDEX IF NOT EXISTS idx_guardian_parent ON guardian_anchor(parent_pff_id);
CREATE INDEX IF NOT EXISTS idx_guardian_child ON guardian_anchor(child_id);

-- -----------------------------------------------------------------------------
-- TRANSACTION INTEGRITY (audit, attestations, no PII)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS presence_handshakes (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  citizen_id        UUID NOT NULL REFERENCES citizens(id) ON DELETE CASCADE,
  nonce_used        TEXT NOT NULL UNIQUE,
  payload_hash      TEXT NOT NULL,
  attestation_info  TEXT,
  liveness_score    NUMERIC(5,4) NOT NULL,             -- required > 0.99
  verified_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (liveness_score > 0.99)
);

CREATE INDEX IF NOT EXISTS idx_handshakes_citizen ON presence_handshakes(citizen_id);
CREATE INDEX IF NOT EXISTS idx_handshakes_nonce ON presence_handshakes(nonce_used);
CREATE INDEX IF NOT EXISTS idx_handshakes_verified ON presence_handshakes(verified_at);

-- -----------------------------------------------------------------------------
-- THE LIVING RECORD — AES-256 field-level encryption; decrypt gated by Presence Proof
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS the_living_record (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  citizen_id        UUID NOT NULL REFERENCES citizens(id) ON DELETE CASCADE UNIQUE,
  encrypted_medical TEXT,                             -- AES-256-GCM encrypted JSON
  encrypted_financial TEXT,                           -- AES-256-GCM encrypted JSON
  iv_medical        TEXT,
  iv_financial      TEXT,
  auth_tag_medical  TEXT,
  auth_tag_financial TEXT,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_living_record_citizen ON the_living_record(citizen_id);

-- Optional: access log for vault decryption (integrity only, no PII)
CREATE TABLE IF NOT EXISTS living_record_access_log (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  citizen_id_ref    UUID NOT NULL,
  action            TEXT NOT NULL,                    -- decrypt_request | decrypt_granted | decrypt_denied
  integrity_hash    TEXT NOT NULL,
  at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_access_log_citizen ON living_record_access_log(citizen_id_ref);

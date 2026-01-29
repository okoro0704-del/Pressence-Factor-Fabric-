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
  nation            TEXT,                              -- for National Pulse realtime (e.g. Nigeria, Ghana)
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

-- -----------------------------------------------------------------------------
-- ECONOMIC LAYER — VIDA CAP, $VIDA, ATE (Autonomous Truth Economy)
-- -----------------------------------------------------------------------------

-- VIDA CAP allocations: 50/50 split per Vitalization
CREATE TABLE IF NOT EXISTS vida_cap_allocations (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  citizen_id            UUID NOT NULL REFERENCES citizens(id) ON DELETE CASCADE,
  pff_id                TEXT NOT NULL REFERENCES citizens(pff_id),
  total_minted          NUMERIC(20, 8) NOT NULL,           -- Total VIDA CAP minted
  citizen_share         NUMERIC(20, 8) NOT NULL,            -- 50% to Citizen Vault
  national_reserve_share NUMERIC(20, 8) NOT NULL,          -- 50% to National Reserve
  minted_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  transaction_hash      TEXT,                               -- VLT transaction hash
  UNIQUE(citizen_id)
);

CREATE INDEX IF NOT EXISTS idx_vida_cap_citizen ON vida_cap_allocations(citizen_id);
CREATE INDEX IF NOT EXISTS idx_vida_cap_pff ON vida_cap_allocations(pff_id);
CREATE INDEX IF NOT EXISTS idx_vida_cap_hash ON vida_cap_allocations(transaction_hash);

-- National Reserve Vault (State's 50% share of all VIDA CAP)
CREATE TABLE IF NOT EXISTS national_reserve (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vida_cap_balance      NUMERIC(20, 8) NOT NULL DEFAULT 0,
  last_updated          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(id)            -- Singleton table (id = 1)
);

-- Initialize singleton National Reserve (fixed UUID for singleton pattern)
INSERT INTO national_reserve (id, vida_cap_balance) 
VALUES ('00000000-0000-0000-0000-000000000001'::uuid, 0)
ON CONFLICT (id) DO NOTHING;

-- Citizen Private Vaults (Citizen's 50% share of VIDA CAP)
CREATE TABLE IF NOT EXISTS citizen_vaults (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  citizen_id            UUID NOT NULL REFERENCES citizens(id) ON DELETE CASCADE,
  pff_id                TEXT NOT NULL REFERENCES citizens(pff_id),
  vida_cap_balance      NUMERIC(20, 8) NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(citizen_id)
);

CREATE INDEX IF NOT EXISTS idx_citizen_vault_citizen ON citizen_vaults(citizen_id);
CREATE INDEX IF NOT EXISTS idx_citizen_vault_pff ON citizen_vaults(pff_id);

-- $VIDA currency issuance (1:1 against VIDA CAP Reserve)
CREATE TABLE IF NOT EXISTS vida_currency (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issuance_type         TEXT NOT NULL,                      -- 'citizen' | 'state'
  citizen_id            UUID REFERENCES citizens(id),        -- NULL if state issuance
  amount                NUMERIC(20, 8) NOT NULL,            -- $VIDA issued
  vida_cap_backing      NUMERIC(20, 8) NOT NULL,             -- VIDA CAP reserved
  reserve_balance_before NUMERIC(20, 8) NOT NULL,           -- Reserve before issuance
  reserve_balance_after NUMERIC(20, 8) NOT NULL,            -- Reserve after issuance
  issued_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  transaction_hash      TEXT,                                -- VLT transaction hash
  status                TEXT NOT NULL DEFAULT 'issued'       -- 'issued' | 'redeemed'
);

CREATE INDEX IF NOT EXISTS idx_vida_currency_citizen ON vida_currency(citizen_id);
CREATE INDEX IF NOT EXISTS idx_vida_currency_type ON vida_currency(issuance_type);
CREATE INDEX IF NOT EXISTS idx_vida_currency_hash ON vida_currency(transaction_hash);

-- Recovery transactions (45-10-45 split)
CREATE TABLE IF NOT EXISTS recovery_transactions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recovery_amount       NUMERIC(20, 8) NOT NULL,            -- Total recovered
  people_share          NUMERIC(20, 8) NOT NULL,            -- 45% to People
  state_share           NUMERIC(20, 8) NOT NULL,             -- 45% to State
  agent_share           NUMERIC(20, 8) NOT NULL,              -- 10% to Agents
  agent_id              TEXT,                                -- Agent identifier
  distribution_method   TEXT,                                -- 'proportional' | 'equal'
  recovered_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  transaction_hash      TEXT,                                -- VLT transaction hash
  metadata              JSONB                                -- Additional recovery details
);

CREATE INDEX IF NOT EXISTS idx_recovery_agent ON recovery_transactions(agent_id);
CREATE INDEX IF NOT EXISTS idx_recovery_hash ON recovery_transactions(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_recovery_date ON recovery_transactions(recovered_at);

-- VLT (Vitalization Ledger Technology) — Immutable transaction log
CREATE TABLE IF NOT EXISTS vlt_transactions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type      TEXT NOT NULL,                      -- 'mint' | 'issue' | 'recovery' | 'transfer'
  transaction_hash      TEXT NOT NULL UNIQUE,                -- SHA-256 hash
  citizen_id            UUID REFERENCES citizens(id),
  amount                NUMERIC(20, 8),
  from_vault            TEXT,                                 -- 'citizen' | 'national_reserve' | 'external'
  to_vault              TEXT,                                 -- 'citizen' | 'national_reserve' | 'agent'
  metadata              JSONB,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vlt_type ON vlt_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_vlt_hash ON vlt_transactions(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_vlt_citizen ON vlt_transactions(citizen_id);
CREATE INDEX IF NOT EXISTS idx_vlt_date ON vlt_transactions(created_at);

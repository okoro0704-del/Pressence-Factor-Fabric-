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
  citizen_root      TEXT,                               -- Master Identity Anchor: SHA-256(face||palm||identity_anchor); one-way recognition
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

-- National Reserve Vault (National_Vault — National Future). 70/30 lock; Diplomatic Lock: has_signed_sovereign_clauses.
CREATE TABLE IF NOT EXISTS national_reserve (
  id                            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vida_cap_balance              NUMERIC(20, 8) NOT NULL DEFAULT 0,
  has_signed_sovereign_clauses  BOOLEAN NOT NULL DEFAULT false,
  vida_locked_70                NUMERIC(20, 8) NOT NULL DEFAULT 0,
  vida_spendable_30             NUMERIC(20, 8) NOT NULL DEFAULT 0,
  last_updated                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(id)
);

-- Initialize singleton National Reserve (fixed UUID for singleton pattern)
INSERT INTO national_reserve (id, vida_cap_balance) 
VALUES ('00000000-0000-0000-0000-000000000001'::uuid, 0)
ON CONFLICT (id) DO NOTHING;

-- Citizen Private Vaults (Citizen_Vault — Citizen's Heritage). 4/1 lock: 4 locked, 1 released via 9-Day Ritual.
CREATE TABLE IF NOT EXISTS citizen_vaults (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  citizen_id            UUID NOT NULL REFERENCES citizens(id) ON DELETE CASCADE,
  pff_id                TEXT NOT NULL REFERENCES citizens(pff_id),
  vida_cap_balance      NUMERIC(20, 8) NOT NULL DEFAULT 0,
  vida_locked_4        NUMERIC(20, 8) NOT NULL DEFAULT 0,
  vida_ritual_pool_1   NUMERIC(20, 8) NOT NULL DEFAULT 0,
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

-- -----------------------------------------------------------------------------
-- BENEFICIARY VAULT — Legacy nominations (Primary + 2 Secondary)
-- Links owner (citizen_id or identity anchor) to beneficiary_anchor (phone/identity hash).
-- Proof of Life: 365 days without 3-of-4 → Presence Check; 30 days no response → Inheritance Protocol.
-- Governance: 50% National Reserve remains with Government on transfer; family keeps personal wealth.
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS legacy_beneficiaries (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  citizen_id            UUID REFERENCES citizens(id) ON DELETE CASCADE,
  owner_identity_anchor TEXT NOT NULL,                  -- E.164 phone or identity hash (Master Device)
  beneficiary_anchor    TEXT NOT NULL,                  -- Nominee phone or identity hash
  rank                  TEXT NOT NULL CHECK (rank IN ('primary', 'secondary_1', 'secondary_2')),
  display_name          TEXT,                            -- Optional label for Family Tree
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(owner_identity_anchor, rank)
);

CREATE INDEX IF NOT EXISTS idx_legacy_beneficiaries_owner ON legacy_beneficiaries(owner_identity_anchor);
CREATE INDEX IF NOT EXISTS idx_legacy_beneficiaries_beneficiary ON legacy_beneficiaries(beneficiary_anchor);
CREATE INDEX IF NOT EXISTS idx_legacy_beneficiaries_citizen ON legacy_beneficiaries(citizen_id);

-- Proof of Life: last 3-of-4 verification per citizen; 365 days → Presence Check; +30 days → Inheritance Protocol
CREATE TABLE IF NOT EXISTS proof_of_life_checks (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  citizen_id            UUID NOT NULL REFERENCES citizens(id) ON DELETE CASCADE,
  owner_identity_anchor TEXT NOT NULL,
  last_3of4_verified_at TIMESTAMPTZ NOT NULL,            -- Last time 3-out-of-4 verification succeeded
  presence_check_sent_at TIMESTAMPTZ,                     -- When Presence Check notification was sent
  inheritance_activated_at TIMESTAMPTZ,                  -- When Inheritance Protocol activated (30 days no response)
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(citizen_id)
);

CREATE INDEX IF NOT EXISTS idx_proof_of_life_owner ON proof_of_life_checks(owner_identity_anchor);
CREATE INDEX IF NOT EXISTS idx_proof_of_life_last_verified ON proof_of_life_checks(last_3of4_verified_at);

-- Inheritance Protocol activations: claim by beneficiary (3-of-4 scan → match anchor → transfer spendable VIDA)
CREATE TABLE IF NOT EXISTS inheritance_activations (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  citizen_id            UUID NOT NULL REFERENCES citizens(id) ON DELETE CASCADE,
  beneficiary_anchor    TEXT NOT NULL,
  beneficiary_citizen_id UUID REFERENCES citizens(id),  -- New owner after claim
  status                TEXT NOT NULL DEFAULT 'pending',  -- pending | claimed | transferred | expired
  spendable_transferred NUMERIC(20, 8) NOT NULL DEFAULT 0, -- Citizen share transferred; 50% National Reserve preserved
  national_reserve_preserved NUMERIC(20, 8) NOT NULL DEFAULT 0,
  claimed_at            TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inheritance_citizen ON inheritance_activations(citizen_id);
CREATE INDEX IF NOT EXISTS idx_inheritance_beneficiary ON inheritance_activations(beneficiary_anchor);
CREATE INDEX IF NOT EXISTS idx_inheritance_status ON inheritance_activations(status);

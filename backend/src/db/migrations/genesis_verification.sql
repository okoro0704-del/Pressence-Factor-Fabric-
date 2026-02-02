/**
 * PFF Backend — Genesis Verification Database Schema
 * Tables for Architect's Final Genesis Verification (The Master Key)
 * Architect: Isreal Okoro (mrfundzman)
 */

-- ============================================================================
-- HARDWARE SYNC SESSIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS hardware_sync_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_session_id TEXT NOT NULL UNIQUE,
  laptop_device_uuid TEXT NOT NULL,
  mobile_device_uuid TEXT NOT NULL,
  pair_binding_hash TEXT NOT NULL,
  sync_encryption_key TEXT NOT NULL,
  sync_status TEXT NOT NULL CHECK (sync_status IN ('ACTIVE', 'COMPLETED', 'FAILED')),
  sync_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hardware_sync_session ON hardware_sync_sessions(sync_session_id);
CREATE INDEX IF NOT EXISTS idx_hardware_sync_pair ON hardware_sync_sessions(laptop_device_uuid, mobile_device_uuid);

-- ============================================================================
-- GENESIS TPM SEALS
-- ============================================================================

CREATE TABLE IF NOT EXISTS genesis_tpm_seals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  genesis_authority_hash TEXT NOT NULL UNIQUE,
  device_uuid TEXT NOT NULL,
  tpm_seal_hash TEXT NOT NULL UNIQUE,
  storage_location TEXT NOT NULL,
  encryption_algorithm TEXT NOT NULL,
  export_allowed BOOLEAN NOT NULL DEFAULT FALSE,
  backup_allowed BOOLEAN NOT NULL DEFAULT FALSE,
  access_control TEXT NOT NULL,
  sealed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_genesis_tpm_device ON genesis_tpm_seals(device_uuid);
CREATE INDEX IF NOT EXISTS idx_genesis_tpm_hash ON genesis_tpm_seals(genesis_authority_hash);

-- ============================================================================
-- GENESIS GOVERNANCE BINDINGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS genesis_governance_bindings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  genesis_authority_hash TEXT NOT NULL UNIQUE,
  architect_pff_id TEXT NOT NULL UNIQUE,
  architect_citizen_id UUID NOT NULL,
  governance_binding_hash TEXT NOT NULL UNIQUE,
  sentinel_business_block_binding BOOLEAN NOT NULL DEFAULT TRUE,
  architect_master_vault_binding BOOLEAN NOT NULL DEFAULT TRUE,
  revenue_oversight_access BOOLEAN NOT NULL DEFAULT TRUE,
  emergency_override_access BOOLEAN NOT NULL DEFAULT TRUE,
  sovereign_movement_validator BOOLEAN NOT NULL DEFAULT TRUE,
  binding_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_genesis_governance_architect ON genesis_governance_bindings(architect_pff_id);
CREATE INDEX IF NOT EXISTS idx_genesis_governance_hash ON genesis_governance_bindings(genesis_authority_hash);

-- ============================================================================
-- STASIS RELEASE STATUS
-- ============================================================================

CREATE TABLE IF NOT EXISTS stasis_release_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  genesis_authority_hash TEXT NOT NULL,
  architect_pff_id TEXT NOT NULL UNIQUE,
  stasis_ready BOOLEAN NOT NULL DEFAULT FALSE,
  unveiling_date TIMESTAMPTZ NOT NULL DEFAULT '2026-02-07T06:00:00.000Z',
  genesis_verification_timestamp TIMESTAMPTZ NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stasis_release_architect ON stasis_release_status(architect_pff_id);
CREATE INDEX IF NOT EXISTS idx_stasis_release_ready ON stasis_release_status(stasis_ready);

-- ============================================================================
-- GENESIS VERIFICATION LOG
-- ============================================================================

CREATE TABLE IF NOT EXISTS genesis_verification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  architect_pff_id TEXT NOT NULL,
  architect_citizen_id UUID NOT NULL,
  laptop_device_uuid TEXT NOT NULL,
  mobile_device_uuid TEXT NOT NULL,
  genesis_authority_hash TEXT,
  tpm_seal_hash TEXT,
  governance_binding_hash TEXT,
  verification_score NUMERIC(5, 4) NOT NULL,
  liveness_score NUMERIC(5, 4) NOT NULL,
  verification_status TEXT NOT NULL CHECK (verification_status IN ('SUCCESS', 'FAILED')),
  stasis_ready BOOLEAN NOT NULL DEFAULT FALSE,
  verification_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_genesis_verification_architect ON genesis_verification_log(architect_pff_id);
CREATE INDEX IF NOT EXISTS idx_genesis_verification_session ON genesis_verification_log(session_id);
CREATE INDEX IF NOT EXISTS idx_genesis_verification_status ON genesis_verification_log(verification_status);

-- ============================================================================
-- GENESIS BROADCAST LOG
-- ============================================================================

CREATE TABLE IF NOT EXISTS genesis_broadcast_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_hash TEXT NOT NULL UNIQUE,
  genesis_authority_hash TEXT NOT NULL,
  architect_pff_id TEXT NOT NULL,
  broadcast_message TEXT NOT NULL,
  broadcast_channels TEXT[] NOT NULL,
  broadcast_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_genesis_broadcast_architect ON genesis_broadcast_log(architect_pff_id);
CREATE INDEX IF NOT EXISTS idx_genesis_broadcast_hash ON genesis_broadcast_log(genesis_authority_hash);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE hardware_sync_sessions IS 'Tracks secure handshake sessions between HP Laptop and Mobile Device';
COMMENT ON TABLE genesis_tpm_seals IS 'Stores metadata for GENESIS_AUTHORITY_HASH sealed in hardware TPM';
COMMENT ON TABLE genesis_governance_bindings IS 'Binds Genesis Signature to Sentinel Business Block and Architect Master Vault';
COMMENT ON TABLE stasis_release_status IS 'Tracks STASIS_READY flag for Feb 7th unveiling preparation';
COMMENT ON TABLE genesis_verification_log IS 'Audit trail for all Genesis Verification attempts';
COMMENT ON TABLE genesis_broadcast_log IS 'Logs final broadcast of genesis completion message';


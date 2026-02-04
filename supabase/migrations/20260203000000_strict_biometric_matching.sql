/**
 * PFF Database Migration — Strict Biometric Identity Matching
 * Creates tables for biometric identity verification, breach detection, and device tethering
 * Architect: Isreal Okoro (mrfundzman)
 * Date: 2026-02-03
 */

-- ============================================================================
-- SENTINEL IDENTITIES (Biometric Identity Records)
-- ============================================================================

CREATE TABLE IF NOT EXISTS sentinel_identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  biometric_hash TEXT UNIQUE NOT NULL, -- SHA-256 hash of face signature
  voice_print_hash TEXT UNIQUE NOT NULL, -- MFCC-based voice signature hash
  authorized_device_uuids TEXT[] NOT NULL DEFAULT '{}', -- Hardware tethering
  face_signature_data TEXT, -- Encrypted face template (AES-256-GCM)
  voice_mfcc_coefficients NUMERIC[] DEFAULT '{}', -- MFCC coefficients for voice matching
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'LOCKED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_verified TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_sentinel_identities_phone ON sentinel_identities(phone_number);
CREATE INDEX idx_sentinel_identities_biometric_hash ON sentinel_identities(biometric_hash);
CREATE INDEX idx_sentinel_identities_voice_hash ON sentinel_identities(voice_print_hash);
CREATE INDEX idx_sentinel_identities_status ON sentinel_identities(status);

-- ============================================================================
-- BREACH ATTEMPTS (Security Monitoring)
-- ============================================================================

CREATE TABLE IF NOT EXISTS breach_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  layer TEXT NOT NULL, -- BIOMETRIC_SIGNATURE, VOICE_PRINT, HARDWARE_TPM, GENESIS_HANDSHAKE
  variance_percentage NUMERIC(5, 2) NOT NULL, -- Variance from stored identity
  device_hash TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  blocked_until TIMESTAMPTZ NOT NULL,
  attempt_data TEXT, -- Encrypted attempt data for forensics
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_breach_attempts_timestamp ON breach_attempts(timestamp DESC);
CREATE INDEX idx_breach_attempts_device_hash ON breach_attempts(device_hash);
CREATE INDEX idx_breach_attempts_layer ON breach_attempts(layer);

-- ============================================================================
-- BREACH ALERTS (Dashboard Notifications)
-- ============================================================================

CREATE TABLE IF NOT EXISTS breach_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  breach_id UUID NOT NULL REFERENCES breach_attempts(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL, -- BIOMETRIC_MISMATCH, VOICE_MISMATCH, DEVICE_UNAUTHORIZED
  severity TEXT NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  message TEXT NOT NULL,
  device_hash TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by TEXT,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_breach_alerts_timestamp ON breach_alerts(timestamp DESC);
CREATE INDEX idx_breach_alerts_acknowledged ON breach_alerts(acknowledged);
CREATE INDEX idx_breach_alerts_severity ON breach_alerts(severity);

-- ============================================================================
-- DEVICE APPROVAL REQUESTS (Secondary Guardian Approval)
-- ============================================================================

CREATE TABLE IF NOT EXISTS device_approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  full_name TEXT NOT NULL,
  device_uuid TEXT NOT NULL,
  device_info JSONB NOT NULL, -- userAgent, platform, timestamp
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  approved_by TEXT,
  rejection_reason TEXT,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_device_approval_phone ON device_approval_requests(phone_number);
CREATE INDEX idx_device_approval_status ON device_approval_requests(status);
CREATE INDEX idx_device_approval_created ON device_approval_requests(created_at DESC);

-- ============================================================================
-- PRESENCE VERIFICATION SESSIONS (24-Hour Expiry)
-- ============================================================================

CREATE TABLE IF NOT EXISTS presence_verification_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  identity_hash TEXT NOT NULL,
  device_uuid TEXT NOT NULL,
  biometric_variance NUMERIC(5, 2) NOT NULL,
  voice_variance NUMERIC(5, 2) NOT NULL,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'EXPIRED', 'REVOKED')),
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_presence_sessions_phone ON presence_verification_sessions(phone_number);
CREATE INDEX idx_presence_sessions_expires ON presence_verification_sessions(expires_at);
CREATE INDEX idx_presence_sessions_status ON presence_verification_sessions(status);

-- ============================================================================
-- GENESIS RESET LOG (Audit Trail)
-- ============================================================================

CREATE TABLE IF NOT EXISTS genesis_reset_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reset_type TEXT NOT NULL, -- FULL_RESET, IDENTITY_RESET, SESSION_CLEAR
  triggered_by TEXT NOT NULL, -- Architect phone number or system
  reason TEXT NOT NULL,
  affected_identities_count INTEGER NOT NULL DEFAULT 0,
  affected_sessions_count INTEGER NOT NULL DEFAULT 0,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_genesis_reset_timestamp ON genesis_reset_log(timestamp DESC);

-- ============================================================================
-- SEED DATA: Architect's Master Identity
-- ============================================================================

-- Insert Architect's identity (will be updated with real biometric data on first scan)
INSERT INTO sentinel_identities (
  id,
  phone_number,
  full_name,
  biometric_hash,
  voice_print_hash,
  authorized_device_uuids,
  status
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  '+2348012345678',
  'Isreal Okoro',
  'GENESIS_ARCHITECT_BIOMETRIC_HASH_PLACEHOLDER',
  'GENESIS_ARCHITECT_VOICE_HASH_PLACEHOLDER',
  '{}',
  'ACTIVE'
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to auto-expire presence sessions
CREATE OR REPLACE FUNCTION expire_presence_sessions()
RETURNS void AS $$
BEGIN
  UPDATE presence_verification_sessions
  SET status = 'EXPIRED'
  WHERE expires_at < NOW() AND status = 'ACTIVE';
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old breach attempts (keep last 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_breach_attempts()
RETURNS void AS $$
BEGIN
  DELETE FROM breach_attempts
  WHERE timestamp < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;


/**
 * PFF Database Migration — Architect's Command Center
 * Architect: Isreal Okoro (mrfundzman)
 * Date: 2026-02-01
 *
 * Purpose:
 * - Create tables for ROOT_SOVEREIGN_PAIR device tracking
 * - Create tables for national liquidity vaults
 * - Create tables for system configuration
 */

-- ============================================================================
-- ROOT SOVEREIGN DEVICES
-- ============================================================================

CREATE TABLE IF NOT EXISTS root_sovereign_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_uuid TEXT NOT NULL UNIQUE,
  device_type TEXT NOT NULL CHECK (device_type IN ('LAPTOP', 'MOBILE')),
  is_root_pair BOOLEAN NOT NULL DEFAULT FALSE,
  hardware_tpm_hash TEXT,
  activation_timestamp TIMESTAMPTZ,
  last_verification_timestamp TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_root_sovereign_devices_uuid ON root_sovereign_devices(device_uuid);
CREATE INDEX IF NOT EXISTS idx_root_sovereign_devices_root_pair ON root_sovereign_devices(is_root_pair);

-- ============================================================================
-- NATIONAL LIQUIDITY VAULTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS national_liquidity_vaults (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nation_code TEXT NOT NULL UNIQUE,
  nation_name TEXT NOT NULL,
  balance_vida NUMERIC(20, 8) NOT NULL DEFAULT 0,
  balance_usd NUMERIC(20, 2) NOT NULL DEFAULT 0,
  last_deposit_timestamp TIMESTAMPTZ,
  last_withdrawal_timestamp TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_national_liquidity_nation_code ON national_liquidity_vaults(nation_code);
CREATE INDEX IF NOT EXISTS idx_national_liquidity_balance ON national_liquidity_vaults(balance_vida DESC);

-- ============================================================================
-- SYSTEM CONFIGURATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS system_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key TEXT NOT NULL UNIQUE,
  config_value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_config_key ON system_config(config_key);

-- Insert default system configuration
INSERT INTO system_config (config_key, config_value, description)
VALUES 
  ('EMERGENCY_STASIS_ACTIVE', 'false', 'Global emergency stasis lock status'),
  ('STASIS_TIMER_LOCK_ACTIVE', 'true', 'Stasis timer lock status (Feb 7, 2026)'),
  ('MESH_BROADCAST_ENABLED', 'true', 'Darknet mesh broadcast enabled status')
ON CONFLICT (config_key) DO NOTHING;

-- ============================================================================
-- SENTINEL LICENSES (if not exists)
-- ============================================================================

CREATE TABLE IF NOT EXISTS sentinel_licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  citizen_id TEXT NOT NULL,
  pff_id TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('TIER_1_CITIZEN', 'TIER_2_PERSONAL_MULTI', 'TIER_3_ENTERPRISE_LITE')),
  status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'EXPIRED')),
  price_usd NUMERIC(10, 2) NOT NULL,
  payment_transaction_hash TEXT NOT NULL,
  activation_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expiry_timestamp TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sentinel_licenses_citizen ON sentinel_licenses(citizen_id);
CREATE INDEX IF NOT EXISTS idx_sentinel_licenses_tier ON sentinel_licenses(tier);
CREATE INDEX IF NOT EXISTS idx_sentinel_licenses_status ON sentinel_licenses(status);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE root_sovereign_devices IS 'ROOT_SOVEREIGN_PAIR device tracking for HP Laptop and Mobile Device';
COMMENT ON TABLE national_liquidity_vaults IS 'National liquidity reserves for 195 sovereign blocks';
COMMENT ON TABLE system_config IS 'Global system configuration and feature flags';
COMMENT ON TABLE sentinel_licenses IS 'Sentinel license tracking by tier and status';


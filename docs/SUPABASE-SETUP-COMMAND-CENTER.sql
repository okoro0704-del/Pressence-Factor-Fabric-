/**
 * PFF Supabase Setup — Architect's Command Center
 * Run this in Supabase SQL Editor to create all required tables
 * Architect: Isreal Okoro (mrfundzman)
 * Date: 2026-02-02
 */

-- ============================================================================
-- 1. SENTINEL TELEMETRY (Command Center Live Data)
-- ============================================================================

CREATE TABLE IF NOT EXISTS sentinel_telemetry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  active_sentinels_citizen INTEGER NOT NULL DEFAULT 0,
  active_sentinels_personal_multi INTEGER NOT NULL DEFAULT 0,
  active_sentinels_enterprise_lite INTEGER NOT NULL DEFAULT 0,
  active_sentinels_total INTEGER NOT NULL DEFAULT 0,
  total_tributes_vida NUMERIC(20, 8) NOT NULL DEFAULT 0,
  total_tributes_usd NUMERIC(20, 2) NOT NULL DEFAULT 0,
  business_count INTEGER NOT NULL DEFAULT 0,
  last_24h_tributes_vida NUMERIC(20, 8) NOT NULL DEFAULT 0,
  state_share_vida NUMERIC(20, 8) DEFAULT 0,
  citizen_share_vida NUMERIC(20, 8) DEFAULT 0,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sentinel_telemetry_updated ON sentinel_telemetry(last_updated DESC);

-- ============================================================================
-- 2. SOVEREIGN AUDIT LOG (Action Center Tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS sovereign_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type TEXT NOT NULL CHECK (action_type IN ('BROADCAST_TO_MESH', 'EMERGENCY_STASIS', 'STASIS_RELEASE', 'PROTOCOL_CHANGE')),
  message TEXT NOT NULL,
  executed_by TEXT NOT NULL DEFAULT 'ARCHITECT',
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_action ON sovereign_audit_log(action_type, executed_at DESC);

-- ============================================================================
-- 3. ROOT SOVEREIGN DEVICES (Hardware Binding)
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

CREATE INDEX IF NOT EXISTS idx_root_devices_pair ON root_sovereign_devices(is_root_pair);

-- ============================================================================
-- 4. NATIONAL LIQUIDITY VAULTS (195 Sovereign Blocks)
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

CREATE INDEX IF NOT EXISTS idx_liquidity_nation ON national_liquidity_vaults(nation_code);

-- ============================================================================
-- 5. AUTO-CALCULATE 50:50 SPLIT (Trigger Function)
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_sovereign_split()
RETURNS TRIGGER AS $$
BEGIN
  NEW.state_share_vida := NEW.total_tributes_vida * 0.5;
  NEW.citizen_share_vida := NEW.total_tributes_vida * 0.5;
  NEW.last_updated := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calculate_split
BEFORE INSERT OR UPDATE ON sentinel_telemetry
FOR EACH ROW EXECUTE FUNCTION calculate_sovereign_split();

-- ============================================================================
-- 6. SEED DATA (Initial Records)
-- ============================================================================

-- Insert singleton telemetry record
INSERT INTO sentinel_telemetry (
  id,
  active_sentinels_citizen,
  active_sentinels_personal_multi,
  active_sentinels_enterprise_lite,
  active_sentinels_total,
  total_tributes_vida,
  total_tributes_usd,
  business_count,
  last_24h_tributes_vida
)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  1247,
  342,
  89,
  1678,
  12847.50000000,
  12847.50,
  23,
  1284.75000000
)
ON CONFLICT (id) DO UPDATE SET
  active_sentinels_citizen = EXCLUDED.active_sentinels_citizen,
  active_sentinels_personal_multi = EXCLUDED.active_sentinels_personal_multi,
  active_sentinels_enterprise_lite = EXCLUDED.active_sentinels_enterprise_lite,
  active_sentinels_total = EXCLUDED.active_sentinels_total,
  total_tributes_vida = EXCLUDED.total_tributes_vida,
  total_tributes_usd = EXCLUDED.total_tributes_usd,
  business_count = EXCLUDED.business_count,
  last_24h_tributes_vida = EXCLUDED.last_24h_tributes_vida,
  last_updated = NOW();

-- Insert sample national liquidity vaults
INSERT INTO national_liquidity_vaults (nation_code, nation_name, balance_vida, balance_usd)
VALUES 
  ('NG', 'Nigeria', 2847.50000000, 2847.50),
  ('GH', 'Ghana', 1234.75000000, 1234.75),
  ('US', 'United States', 5678.25000000, 5678.25),
  ('GB', 'United Kingdom', 3456.80000000, 3456.80)
ON CONFLICT (nation_code) DO NOTHING;

-- ============================================================================
-- 7. VERIFICATION QUERY
-- ============================================================================

-- Run this to verify everything is working
SELECT 
  'sentinel_telemetry' as table_name,
  active_sentinels_total,
  total_tributes_vida,
  state_share_vida,
  citizen_share_vida
FROM sentinel_telemetry
WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;


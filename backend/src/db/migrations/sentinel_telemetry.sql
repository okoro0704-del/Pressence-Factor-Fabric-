/**
 * PFF Database Migration — Sentinel Telemetry & Audit Log
 * Architect: Isreal Okoro (mrfundzman)
 * Date: 2026-02-02
 *
 * Purpose:
 * - Create sentinel_telemetry table for Command Center live data
 * - Create sovereign_audit_log table for action execution tracking
 * - Implement 50:50 Economic Split (State vs Citizen)
 */

-- ============================================================================
-- SENTINEL TELEMETRY
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

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_sentinel_telemetry_updated ON sentinel_telemetry(last_updated DESC);

-- ============================================================================
-- SOVEREIGN AUDIT LOG
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

-- Create indexes for audit queries
CREATE INDEX IF NOT EXISTS idx_sovereign_audit_action_type ON sovereign_audit_log(action_type);
CREATE INDEX IF NOT EXISTS idx_sovereign_audit_executed_at ON sovereign_audit_log(executed_at DESC);

-- ============================================================================
-- 50:50 ECONOMIC SPLIT TRIGGER
-- ============================================================================

-- Function to automatically calculate the 50:50 split on the total collected
CREATE OR REPLACE FUNCTION calculate_sovereign_split()
RETURNS TRIGGER AS $$
BEGIN
    NEW.state_share_vida := NEW.total_tributes_vida * 0.50;
    NEW.citizen_share_vida := NEW.total_tributes_vida * 0.50;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger the calculation every time telemetry updates
CREATE TRIGGER trg_calculate_split
BEFORE INSERT OR UPDATE ON sentinel_telemetry
FOR EACH ROW EXECUTE FUNCTION calculate_sovereign_split();

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Insert initial telemetry record (singleton pattern)
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

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE sentinel_telemetry IS 'Real-time Sentinel activation counts and tribute totals for Command Center';
COMMENT ON TABLE sovereign_audit_log IS 'Audit trail for all Architect action executions (broadcast, stasis, etc.)';
COMMENT ON COLUMN sentinel_telemetry.state_share_vida IS '50% of total tributes allocated to State (auto-calculated)';
COMMENT ON COLUMN sentinel_telemetry.citizen_share_vida IS '50% of total tributes allocated to Citizens (auto-calculated)';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify telemetry data
SELECT 
  active_sentinels_total,
  total_tributes_vida,
  state_share_vida,
  citizen_share_vida,
  last_updated
FROM sentinel_telemetry
WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;

-- Verify 50:50 split calculation
SELECT 
  total_tributes_vida,
  state_share_vida,
  citizen_share_vida,
  (state_share_vida + citizen_share_vida) as total_split,
  CASE 
    WHEN state_share_vida = citizen_share_vida THEN 'BALANCED'
    ELSE 'IMBALANCED'
  END as split_status
FROM sentinel_telemetry
WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;


/**
 * PFF Database Migration — Sovereign Sentinel & Identity Authority Deployment
 * Architect: Isreal Okoro (mrfundzman)
 * Date: 2026-02-01
 *
 * Purpose:
 * - Create tables for Deep Truth Feed access tracking
 * - Create tables for Anti-Kill Daemon monitoring
 * - Create tables for protocol change requests
 * - Create tables for business vaults (Deep Truth tribute)
 */

-- ============================================================================
-- BUSINESS VAULTS (Deep Truth Tribute)
-- ============================================================================

CREATE TABLE IF NOT EXISTS business_vaults (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id TEXT NOT NULL,
  amount NUMERIC(20, 8) NOT NULL,
  transaction_type TEXT NOT NULL,
  transaction_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_business_vaults_business_id ON business_vaults(business_id);
CREATE INDEX IF NOT EXISTS idx_business_vaults_transaction_hash ON business_vaults(transaction_hash);

-- ============================================================================
-- DEEP TRUTH FEED ACCESS LOG
-- ============================================================================

CREATE TABLE IF NOT EXISTS deep_truth_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id TEXT NOT NULL,
  business_name TEXT NOT NULL,
  feed_type TEXT NOT NULL,
  data_query TEXT NOT NULL,
  tribute_amount_vida NUMERIC(20, 8) NOT NULL,
  tribute_transaction_hash TEXT NOT NULL,
  access_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deep_truth_access_business ON deep_truth_access_log(business_id);
CREATE INDEX IF NOT EXISTS idx_deep_truth_access_feed_type ON deep_truth_access_log(feed_type);
CREATE INDEX IF NOT EXISTS idx_deep_truth_access_timestamp ON deep_truth_access_log(access_timestamp);

-- ============================================================================
-- SENTINEL DAEMON STATUS
-- ============================================================================

CREATE TABLE IF NOT EXISTS sentinel_daemon_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id TEXT NOT NULL,
  device_uuid TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('RUNNING', 'STOPPED', 'RESTARTING', 'EMERGENCY_STASIS', 'TAMPERED')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_health_check TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  restart_count INTEGER NOT NULL DEFAULT 0,
  kill_attempts INTEGER NOT NULL DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(process_id, device_uuid)
);

CREATE INDEX IF NOT EXISTS idx_sentinel_daemon_process ON sentinel_daemon_status(process_id);
CREATE INDEX IF NOT EXISTS idx_sentinel_daemon_device ON sentinel_daemon_status(device_uuid);
CREATE INDEX IF NOT EXISTS idx_sentinel_daemon_status ON sentinel_daemon_status(status);

-- ============================================================================
-- SENTINEL KILL ATTEMPTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS sentinel_kill_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_hash TEXT NOT NULL UNIQUE,
  process_id TEXT NOT NULL,
  device_uuid TEXT NOT NULL,
  kill_signal TEXT,
  source_process TEXT,
  attempt_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sentinel_kill_attempts_process ON sentinel_kill_attempts(process_id);
CREATE INDEX IF NOT EXISTS idx_sentinel_kill_attempts_device ON sentinel_kill_attempts(device_uuid);
CREATE INDEX IF NOT EXISTS idx_sentinel_kill_attempts_timestamp ON sentinel_kill_attempts(attempt_timestamp);

-- ============================================================================
-- PROTOCOL CHANGE REQUESTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS protocol_change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  change_type TEXT NOT NULL,
  requested_by TEXT NOT NULL,
  genesis_authority_hash TEXT NOT NULL,
  handshake_score NUMERIC(5, 4) NOT NULL,
  liveness_score NUMERIC(5, 4) NOT NULL,
  authorized BOOLEAN NOT NULL,
  vlt_transaction_hash TEXT,
  request_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_protocol_change_type ON protocol_change_requests(change_type);
CREATE INDEX IF NOT EXISTS idx_protocol_change_requester ON protocol_change_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_protocol_change_authorized ON protocol_change_requests(authorized);

-- ============================================================================
-- DEPLOYMENT VALIDATION LOG
-- ============================================================================

CREATE TABLE IF NOT EXISTS deployment_validation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deployment_hash TEXT NOT NULL UNIQUE,
  pricing_tiers_validated BOOLEAN NOT NULL,
  root_pair_binded BOOLEAN NOT NULL,
  deep_truth_feed_active BOOLEAN NOT NULL,
  anti_kill_daemon_active BOOLEAN NOT NULL,
  darknet_mesh_active BOOLEAN NOT NULL,
  deployment_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  validation_message TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deployment_validation_timestamp ON deployment_validation_log(deployment_timestamp);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE business_vaults IS 'Business vault balances for Deep Truth Feed tribute payments';
COMMENT ON TABLE deep_truth_access_log IS 'Audit trail for Deep Truth Feed access with 10% tribute';
COMMENT ON TABLE sentinel_daemon_status IS 'Anti-Kill Daemon process monitoring and health status';
COMMENT ON TABLE sentinel_kill_attempts IS 'Log of all Sentinel process termination attempts';
COMMENT ON TABLE protocol_change_requests IS 'Audit trail for protocol-level change requests requiring Genesis Authority Hash';
COMMENT ON TABLE deployment_validation_log IS 'Deployment validation records for Sovereign Sentinel & Identity Authority';


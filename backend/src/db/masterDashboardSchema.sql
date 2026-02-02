/**
 * PFF Backend — Master Dashboard Database Schema
 * Tables for AI Governance Logs and Heartbeat Sync
 * Architect: Isreal Okoro (mrfundzman)
 */

-- ============================================================================
-- AI GOVERNANCE LOGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_governance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_id TEXT NOT NULL UNIQUE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  decision_type TEXT NOT NULL,
  description TEXT NOT NULL,
  affected_entities TEXT[] NOT NULL DEFAULT '{}',
  outcome TEXT NOT NULL CHECK (outcome IN ('SUCCESS', 'FAILED', 'PENDING')),
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_governance_logs_timestamp ON ai_governance_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_ai_governance_logs_decision_type ON ai_governance_logs(decision_type);
CREATE INDEX IF NOT EXISTS idx_ai_governance_logs_outcome ON ai_governance_logs(outcome);

-- ============================================================================
-- HEARTBEAT SYNC
-- ============================================================================

CREATE TABLE IF NOT EXISTS heartbeat_sync (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL UNIQUE,
  device_uuid TEXT NOT NULL,
  last_heartbeat TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  heartbeat_interval INTEGER NOT NULL DEFAULT 5000,
  missed_heartbeats INTEGER NOT NULL DEFAULT 0,
  override_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_heartbeat_sync_session_id ON heartbeat_sync(session_id);
CREATE INDEX IF NOT EXISTS idx_heartbeat_sync_device_uuid ON heartbeat_sync(device_uuid);
CREATE INDEX IF NOT EXISTS idx_heartbeat_sync_last_heartbeat ON heartbeat_sync(last_heartbeat DESC);

-- ============================================================================
-- SAMPLE DATA (FOR TESTING)
-- ============================================================================

-- Sample AI Governance Log
INSERT INTO ai_governance_logs (log_id, decision_type, description, affected_entities, outcome, metadata)
VALUES (
  'log_' || gen_random_uuid()::text,
  'MESH_SYNC',
  'Synchronized 1,234 truth packets across 45 Sentinel nodes',
  ARRAY['SENTINEL_NETWORK', 'VLT_LEDGER'],
  'SUCCESS',
  '{"packets_synced": 1234, "nodes_affected": 45, "sync_duration_ms": 2340}'::jsonb
)
ON CONFLICT (log_id) DO NOTHING;

INSERT INTO ai_governance_logs (log_id, decision_type, description, affected_entities, outcome, metadata)
VALUES (
  'log_' || gen_random_uuid()::text,
  'VLT_VALIDATION',
  'Validated 567 transactions in VLT block #12345',
  ARRAY['VLT_LEDGER', 'BLOCK_12345'],
  'SUCCESS',
  '{"transactions_validated": 567, "block_number": 12345, "validation_time_ms": 890}'::jsonb
)
ON CONFLICT (log_id) DO NOTHING;

INSERT INTO ai_governance_logs (log_id, decision_type, description, affected_entities, outcome, metadata)
VALUES (
  'log_' || gen_random_uuid()::text,
  'GROWTH_PREDICTION',
  'Predicted 3 new growth nodes in Nigeria, Kenya, and South Africa',
  ARRAY['NG', 'KE', 'ZA'],
  'SUCCESS',
  '{"predicted_nodes": ["NG", "KE", "ZA"], "confidence_score": 0.87, "prediction_horizon_days": 30}'::jsonb
)
ON CONFLICT (log_id) DO NOTHING;

-- ============================================================================
-- CLEANUP (FOR PRODUCTION)
-- ============================================================================

-- Remove heartbeat sessions older than 24 hours
-- Run this as a cron job or scheduled task
-- DELETE FROM heartbeat_sync WHERE created_at < NOW() - INTERVAL '24 hours';

-- Remove AI governance logs older than 90 days (optional)
-- DELETE FROM ai_governance_logs WHERE created_at < NOW() - INTERVAL '90 days';


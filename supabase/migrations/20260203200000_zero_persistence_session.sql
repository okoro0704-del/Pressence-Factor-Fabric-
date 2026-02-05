-- =====================================================
-- ZERO-PERSISTENCE SESSION MANAGEMENT
-- Enforces mandatory 4-layer re-authentication on every entry
-- Session destroyed on tab close, phone lock, or background
-- Architect: Isreal Okoro (mrfundzman)
-- =====================================================

-- Session Destruction Log
-- Tracks when sessions are destroyed and why.
-- phone_number is TEXT only (no FK) so this migration runs without global_identity_registry.
CREATE TABLE IF NOT EXISTS session_destruction_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  layers_passed INTEGER[],
  duration_ms BIGINT,
  destruction_reason TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_session_destruction_log_phone_number 
  ON session_destruction_log(phone_number);
CREATE INDEX IF NOT EXISTS idx_session_destruction_log_timestamp 
  ON session_destruction_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_session_destruction_log_session_id 
  ON session_destruction_log(session_id);

-- Row Level Security (RLS)
ALTER TABLE session_destruction_log ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist so this migration is safe to re-run
DROP POLICY IF EXISTS session_destruction_log_select_policy ON session_destruction_log;
DROP POLICY IF EXISTS session_destruction_log_insert_policy ON session_destruction_log;

-- Users can only see their own session destruction logs
CREATE POLICY session_destruction_log_select_policy 
  ON session_destruction_log 
  FOR SELECT 
  USING (phone_number = current_setting('app.current_user_phone', true));

-- Users can insert their own session destruction logs
CREATE POLICY session_destruction_log_insert_policy 
  ON session_destruction_log 
  FOR INSERT 
  WITH CHECK (phone_number = current_setting('app.current_user_phone', true));

-- =====================================================
-- SESSION ANALYTICS VIEW
-- Provides insights into session behavior
-- =====================================================

CREATE OR REPLACE VIEW session_analytics AS
SELECT
  phone_number,
  COUNT(*) AS total_sessions,
  AVG(duration_ms) AS avg_session_duration_ms,
  AVG(ARRAY_LENGTH(layers_passed, 1)) AS avg_layers_passed,
  COUNT(*) FILTER (WHERE ARRAY_LENGTH(layers_passed, 1) = 4) AS complete_sessions,
  COUNT(*) FILTER (WHERE ARRAY_LENGTH(layers_passed, 1) < 4) AS incomplete_sessions,
  COUNT(*) FILTER (WHERE destruction_reason = 'ZERO_PERSISTENCE_EVENT') AS zero_persistence_destructions,
  MAX(timestamp) AS last_session_timestamp
FROM session_destruction_log
GROUP BY phone_number;

-- Grant access to session analytics view
GRANT SELECT ON session_analytics TO authenticated;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE session_destruction_log IS 
  'Tracks session destruction events for zero-persistence enforcement';

COMMENT ON COLUMN session_destruction_log.session_id IS 
  'Unique session identifier (UUID)';

COMMENT ON COLUMN session_destruction_log.phone_number IS 
  'Phone number of user who created the session';

COMMENT ON COLUMN session_destruction_log.layers_passed IS 
  'Array of layer numbers that were passed before destruction (1-4)';

COMMENT ON COLUMN session_destruction_log.duration_ms IS 
  'Duration of session in milliseconds';

COMMENT ON COLUMN session_destruction_log.destruction_reason IS 
  'Reason for session destruction (ZERO_PERSISTENCE_EVENT, MANUAL_LOGOUT, etc.)';

COMMENT ON COLUMN session_destruction_log.timestamp IS 
  'Timestamp when session was destroyed';

COMMENT ON VIEW session_analytics IS 
  'Analytics view for session behavior and completion rates';


/**
 * PFF Database Migration — Monthly Truth Dividend
 * Creates tables for Global Citizen Block and Verified Truth-Tellers Registry
 * Architect: Isreal Okoro (mrfundzman)
 * Date: 2026-02-01
 */

-- ============================================================================
-- GLOBAL CITIZEN BLOCK
-- Accumulates 0.5% citizen share from Sentinel activations for monthly distribution
-- ============================================================================

CREATE TABLE IF NOT EXISTS global_citizen_block (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amount NUMERIC(20, 8) NOT NULL,
  transaction_type VARCHAR(100) NOT NULL,
  transaction_hash VARCHAR(255) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_global_citizen_block_tx_hash 
  ON global_citizen_block(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_global_citizen_block_created_at 
  ON global_citizen_block(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_global_citizen_block_tx_type 
  ON global_citizen_block(transaction_type);

-- Comments
COMMENT ON TABLE global_citizen_block IS 'Global Citizen Block - Accumulates 0.5% citizen share from Sentinel activations for monthly dividend distribution';
COMMENT ON COLUMN global_citizen_block.amount IS 'Amount in VIDA (can be positive for accumulation or negative for distribution)';
COMMENT ON COLUMN global_citizen_block.transaction_type IS 'Type: dividend_accumulation, dividend_distribution, etc.';
COMMENT ON COLUMN global_citizen_block.transaction_hash IS 'SHA-256 transaction hash for VLT correlation';

-- ============================================================================
-- VERIFIED TRUTH-TELLERS REGISTRY
-- Tracks citizens who performed successful 4-layer PFF handshake in current month
-- ============================================================================

CREATE TABLE IF NOT EXISTS verified_truth_tellers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  citizen_id UUID NOT NULL REFERENCES citizens(id) ON DELETE CASCADE,
  pff_id TEXT NOT NULL,
  verified_month VARCHAR(7) NOT NULL, -- Format: YYYY-MM
  verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  handshake_session_id TEXT,
  metadata JSONB,
  UNIQUE(citizen_id, verified_month)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_verified_truth_tellers_citizen 
  ON verified_truth_tellers(citizen_id);
CREATE INDEX IF NOT EXISTS idx_verified_truth_tellers_month 
  ON verified_truth_tellers(verified_month);
CREATE INDEX IF NOT EXISTS idx_verified_truth_tellers_verified_at 
  ON verified_truth_tellers(verified_at DESC);

-- Comments
COMMENT ON TABLE verified_truth_tellers IS 'Verified Truth-Tellers Registry - Citizens who performed successful 4-layer PFF handshake in current month';
COMMENT ON COLUMN verified_truth_tellers.citizen_id IS 'Citizen UUID';
COMMENT ON COLUMN verified_truth_tellers.pff_id IS 'PFF ID for quick lookup';
COMMENT ON COLUMN verified_truth_tellers.verified_month IS 'Month of verification (YYYY-MM format)';
COMMENT ON COLUMN verified_truth_tellers.handshake_session_id IS 'Session ID from successful handshake';

-- ============================================================================
-- MONTHLY DIVIDEND HISTORY
-- Tracks monthly dividend distributions for audit trail
-- ============================================================================

CREATE TABLE IF NOT EXISTS monthly_dividend_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  distribution_month VARCHAR(7) NOT NULL, -- Format: YYYY-MM
  total_block_value NUMERIC(20, 8) NOT NULL,
  total_truth_tellers INTEGER NOT NULL,
  share_per_citizen NUMERIC(20, 8) NOT NULL,
  distribution_hash VARCHAR(255) NOT NULL,
  distributed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_monthly_dividend_history_month 
  ON monthly_dividend_history(distribution_month);
CREATE INDEX IF NOT EXISTS idx_monthly_dividend_history_distributed_at 
  ON monthly_dividend_history(distributed_at DESC);

-- Comments
COMMENT ON TABLE monthly_dividend_history IS 'Monthly Dividend History - Audit trail of monthly dividend distributions';
COMMENT ON COLUMN monthly_dividend_history.distribution_month IS 'Month of distribution (YYYY-MM format)';
COMMENT ON COLUMN monthly_dividend_history.total_block_value IS 'Total VIDA in Global Citizen Block at distribution time';
COMMENT ON COLUMN monthly_dividend_history.total_truth_tellers IS 'Number of verified truth-tellers who received dividend';
COMMENT ON COLUMN monthly_dividend_history.share_per_citizen IS 'Equal share distributed to each truth-teller';

-- ============================================================================
-- VERIFICATION QUERIES
-- Run these to verify the migration was successful
-- ============================================================================

-- Check if tables exist
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN ('global_citizen_block', 'verified_truth_tellers', 'monthly_dividend_history')
ORDER BY table_name;

-- Check indexes
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('global_citizen_block', 'verified_truth_tellers', 'monthly_dividend_history')
ORDER BY tablename, indexname;

-- ============================================================================
-- SAMPLE QUERIES FOR MONITORING
-- ============================================================================

-- Get total Global Citizen Block balance
SELECT 
  SUM(amount) as total_balance,
  COUNT(*) as transaction_count
FROM global_citizen_block;

-- Get verified truth-tellers for current month
SELECT 
  COUNT(*) as truth_teller_count,
  verified_month
FROM verified_truth_tellers
WHERE verified_month = TO_CHAR(NOW(), 'YYYY-MM')
GROUP BY verified_month;

-- Get monthly dividend history
SELECT 
  distribution_month,
  total_block_value,
  total_truth_tellers,
  share_per_citizen,
  distributed_at
FROM monthly_dividend_history
ORDER BY distributed_at DESC
LIMIT 12;

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================

-- Uncomment to rollback this migration
-- DROP TABLE IF EXISTS monthly_dividend_history CASCADE;
-- DROP TABLE IF EXISTS verified_truth_tellers CASCADE;
-- DROP TABLE IF EXISTS global_citizen_block CASCADE;


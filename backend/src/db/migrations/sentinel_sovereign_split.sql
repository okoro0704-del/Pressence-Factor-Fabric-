/**
 * PFF Database Migration — Sentinel 1% Sovereign Split
 * Creates tables for Sentinel Business Block and National Escrow
 * Architect: Isreal Okoro (mrfundzman)
 * Date: 2026-02-01
 */

-- ============================================================================
-- SENTINEL BUSINESS BLOCK
-- Stores 99% of Sentinel activation revenue for Architect retention
-- ============================================================================

CREATE TABLE IF NOT EXISTS sentinel_business_block (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amount NUMERIC(20, 8) NOT NULL,
  transaction_type VARCHAR(100) NOT NULL,
  transaction_hash VARCHAR(255) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sentinel_business_block_tx_hash 
  ON sentinel_business_block(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_sentinel_business_block_created_at 
  ON sentinel_business_block(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sentinel_business_block_tx_type 
  ON sentinel_business_block(transaction_type);

-- Comments
COMMENT ON TABLE sentinel_business_block IS 'Sentinel Business Block - Stores 99% of Sentinel activation revenue for Architect retention';
COMMENT ON COLUMN sentinel_business_block.amount IS 'Amount in VIDA (can be positive for deposits or negative for pulls)';
COMMENT ON COLUMN sentinel_business_block.transaction_type IS 'Type: sentinel_activation_revenue, sovereign_movement_pull, etc.';
COMMENT ON COLUMN sentinel_business_block.transaction_hash IS 'SHA-256 transaction hash for VLT correlation';

-- ============================================================================
-- NATIONAL ESCROW
-- Stores 0.5% of Sentinel activation revenue for liquidity backing
-- ============================================================================

CREATE TABLE IF NOT EXISTS national_escrow (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amount NUMERIC(20, 8) NOT NULL,
  transaction_type VARCHAR(100) NOT NULL,
  transaction_hash VARCHAR(255) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_national_escrow_tx_hash 
  ON national_escrow(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_national_escrow_created_at 
  ON national_escrow(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_national_escrow_tx_type 
  ON national_escrow(transaction_type);

-- Comments
COMMENT ON TABLE national_escrow IS 'National Escrow - Stores 0.5% of Sentinel activation revenue for liquidity backing';
COMMENT ON COLUMN national_escrow.amount IS 'Amount in VIDA (always positive)';
COMMENT ON COLUMN national_escrow.transaction_type IS 'Type: sovereign_movement_escrow, etc.';
COMMENT ON COLUMN national_escrow.transaction_hash IS 'SHA-256 transaction hash for VLT correlation';

-- ============================================================================
-- UPDATE CITIZEN VAULTS
-- Add transaction_type column if it doesn't exist
-- ============================================================================

ALTER TABLE citizen_vaults
ADD COLUMN IF NOT EXISTS transaction_type VARCHAR(100);

COMMENT ON COLUMN citizen_vaults.transaction_type IS 'Type: sentinel_activation_payment, sovereign_movement_rebate, etc.';

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
  AND table_name IN ('sentinel_business_block', 'national_escrow')
ORDER BY table_name;

-- Check indexes
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('sentinel_business_block', 'national_escrow')
ORDER BY tablename, indexname;

-- ============================================================================
-- SAMPLE QUERIES FOR MONITORING
-- ============================================================================

-- Get total Sentinel Business Block balance
SELECT 
  SUM(amount) as total_balance,
  COUNT(*) as transaction_count
FROM sentinel_business_block;

-- Get total National Escrow balance
SELECT 
  SUM(amount) as total_balance,
  COUNT(*) as transaction_count
FROM national_escrow;

-- Get Sentinel Business Block transactions by type
SELECT 
  transaction_type,
  COUNT(*) as count,
  SUM(amount) as total_amount
FROM sentinel_business_block
GROUP BY transaction_type
ORDER BY total_amount DESC;

-- Get recent Sovereign Movement transactions
SELECT 
  sbb.transaction_hash,
  sbb.amount as business_block_amount,
  ne.amount as national_escrow_amount,
  cv.amount as user_rebate_amount,
  sbb.created_at
FROM sentinel_business_block sbb
LEFT JOIN national_escrow ne ON sbb.transaction_hash = ne.transaction_hash
LEFT JOIN citizen_vaults cv ON sbb.transaction_hash = cv.transaction_hash 
  AND cv.transaction_type = 'sovereign_movement_rebate'
WHERE sbb.transaction_type = 'sovereign_movement_pull'
ORDER BY sbb.created_at DESC
LIMIT 10;

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================

-- Uncomment to rollback this migration
-- DROP TABLE IF EXISTS sentinel_business_block CASCADE;
-- DROP TABLE IF EXISTS national_escrow CASCADE;
-- ALTER TABLE citizen_vaults DROP COLUMN IF EXISTS transaction_type;


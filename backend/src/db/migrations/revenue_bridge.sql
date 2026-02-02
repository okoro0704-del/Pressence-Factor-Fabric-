/**
 * PFF Database Migration — Unified Revenue-to-Dividend Bridge
 * Creates tables for PROT_TRIBUTE_POOL, National Liquidity Vault, and Auto-Split tracking
 * Architect: Isreal Okoro (mrfundzman)
 * Date: 2026-02-01
 */

-- ============================================================================
-- PROT_TRIBUTE_POOL
-- Unified pool consolidating 1% from ALL revenue sources
-- ============================================================================

CREATE TABLE IF NOT EXISTS prot_tribute_pool (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amount NUMERIC(20, 8) NOT NULL,
  revenue_source VARCHAR(100) NOT NULL, -- SENTINEL_TIER_1, SENTINEL_TIER_2, SENTINEL_TIER_3, BUSINESS_TRIBUTE, etc.
  source_transaction_hash VARCHAR(255) NOT NULL,
  transaction_type VARCHAR(100) NOT NULL, -- 'tribute_intake', 'auto_split_deduction'
  transaction_hash VARCHAR(255) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_prot_tribute_pool_revenue_source ON prot_tribute_pool(revenue_source);
CREATE INDEX idx_prot_tribute_pool_transaction_type ON prot_tribute_pool(transaction_type);
CREATE INDEX idx_prot_tribute_pool_created_at ON prot_tribute_pool(created_at);
CREATE INDEX idx_prot_tribute_pool_source_tx ON prot_tribute_pool(source_transaction_hash);

-- ============================================================================
-- NATIONAL_LIQUIDITY_VAULT
-- Stores 50% of PROT_TRIBUTE_POOL for national backing
-- ============================================================================

CREATE TABLE IF NOT EXISTS national_liquidity_vault (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amount NUMERIC(20, 8) NOT NULL,
  source_tribute_hash VARCHAR(255) NOT NULL, -- Links to prot_tribute_pool transaction
  transaction_type VARCHAR(100) NOT NULL, -- 'auto_split_intake', 'liquidity_deployment'
  transaction_hash VARCHAR(255) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_national_liquidity_vault_transaction_type ON national_liquidity_vault(transaction_type);
CREATE INDEX idx_national_liquidity_vault_created_at ON national_liquidity_vault(created_at);
CREATE INDEX idx_national_liquidity_vault_source ON national_liquidity_vault(source_tribute_hash);

-- ============================================================================
-- TRIBUTE_AUTO_SPLIT_LOG
-- Audit trail for every 50/50 split execution
-- ============================================================================

CREATE TABLE IF NOT EXISTS tribute_auto_split_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tribute_pool_transaction_hash VARCHAR(255) NOT NULL,
  total_tribute_amount NUMERIC(20, 8) NOT NULL,
  national_liquidity_amount NUMERIC(20, 8) NOT NULL, -- 50%
  global_citizen_amount NUMERIC(20, 8) NOT NULL, -- 50%
  national_liquidity_hash VARCHAR(255) NOT NULL,
  global_citizen_hash VARCHAR(255) NOT NULL,
  split_percentage_national NUMERIC(5, 4) NOT NULL DEFAULT 0.5000, -- Hardcoded 50%
  split_percentage_global NUMERIC(5, 4) NOT NULL DEFAULT 0.5000, -- Hardcoded 50%
  revenue_source VARCHAR(100) NOT NULL,
  metadata JSONB,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tribute_auto_split_log_tribute_tx ON tribute_auto_split_log(tribute_pool_transaction_hash);
CREATE INDEX idx_tribute_auto_split_log_revenue_source ON tribute_auto_split_log(revenue_source);
CREATE INDEX idx_tribute_auto_split_log_executed_at ON tribute_auto_split_log(executed_at);

-- ============================================================================
-- REVENUE_CONSOLIDATION_LOG
-- Tracks all revenue flowing into PROT_TRIBUTE_POOL
-- ============================================================================

CREATE TABLE IF NOT EXISTS revenue_consolidation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revenue_source VARCHAR(100) NOT NULL,
  total_revenue_amount NUMERIC(20, 8) NOT NULL, -- 100% of revenue
  tribute_amount NUMERIC(20, 8) NOT NULL, -- 1% to PROT_TRIBUTE_POOL
  architect_amount NUMERIC(20, 8) NOT NULL, -- 99% to Architect
  tribute_percentage NUMERIC(5, 4) NOT NULL DEFAULT 0.0100, -- Hardcoded 1%
  architect_percentage NUMERIC(5, 4) NOT NULL DEFAULT 0.9900, -- Hardcoded 99%
  source_transaction_hash VARCHAR(255) NOT NULL,
  tribute_pool_hash VARCHAR(255) NOT NULL,
  architect_vault_hash VARCHAR(255) NOT NULL,
  metadata JSONB,
  consolidated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_revenue_consolidation_log_revenue_source ON revenue_consolidation_log(revenue_source);
CREATE INDEX idx_revenue_consolidation_log_consolidated_at ON revenue_consolidation_log(consolidated_at);
CREATE INDEX idx_revenue_consolidation_log_source_tx ON revenue_consolidation_log(source_transaction_hash);

-- ============================================================================
-- MONTHLY_DIVIDEND_TRIGGER_LOG
-- Tracks automatic dividend distributions from GLOBAL_CITIZEN_BLOCK
-- ============================================================================

CREATE TABLE IF NOT EXISTS monthly_dividend_trigger_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  distribution_month VARCHAR(7) NOT NULL, -- YYYY-MM
  total_global_citizen_balance NUMERIC(20, 8) NOT NULL,
  total_verified_truth_tellers INTEGER NOT NULL,
  share_per_citizen NUMERIC(20, 8) NOT NULL,
  distribution_hash VARCHAR(255) NOT NULL,
  trigger_type VARCHAR(50) NOT NULL, -- 'automatic', 'manual'
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB
);

CREATE INDEX idx_monthly_dividend_trigger_log_month ON monthly_dividend_trigger_log(distribution_month);
CREATE INDEX idx_monthly_dividend_trigger_log_executed_at ON monthly_dividend_trigger_log(executed_at);

-- ============================================================================
-- HELPER QUERIES
-- ============================================================================

-- Get total PROT_TRIBUTE_POOL balance
-- SELECT COALESCE(SUM(amount), 0) as total_balance FROM prot_tribute_pool;

-- Get total National Liquidity Vault balance
-- SELECT COALESCE(SUM(amount), 0) as total_balance FROM national_liquidity_vault;

-- Get revenue consolidation summary by source
-- SELECT 
--   revenue_source,
--   COUNT(*) as transaction_count,
--   SUM(total_revenue_amount) as total_revenue,
--   SUM(tribute_amount) as total_tribute,
--   SUM(architect_amount) as total_architect
-- FROM revenue_consolidation_log
-- GROUP BY revenue_source
-- ORDER BY total_revenue DESC;

-- Get auto-split execution history
-- SELECT 
--   revenue_source,
--   COUNT(*) as split_count,
--   SUM(total_tribute_amount) as total_tribute,
--   SUM(national_liquidity_amount) as total_national,
--   SUM(global_citizen_amount) as total_global
-- FROM tribute_auto_split_log
-- GROUP BY revenue_source
-- ORDER BY total_tribute DESC;

-- Get monthly dividend trigger history
-- SELECT 
--   distribution_month,
--   total_global_citizen_balance,
--   total_verified_truth_tellers,
--   share_per_citizen,
--   executed_at
-- FROM monthly_dividend_trigger_log
-- ORDER BY executed_at DESC
-- LIMIT 12;

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================

-- DROP TABLE IF EXISTS monthly_dividend_trigger_log;
-- DROP TABLE IF EXISTS revenue_consolidation_log;
-- DROP TABLE IF EXISTS tribute_auto_split_log;
-- DROP TABLE IF EXISTS national_liquidity_vault;
-- DROP TABLE IF EXISTS prot_tribute_pool;


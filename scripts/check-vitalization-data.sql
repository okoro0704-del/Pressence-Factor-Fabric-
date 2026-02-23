-- ============================================================================
-- VITALIZATION DATA AUDIT SCRIPT
-- ============================================================================
-- Run this in Supabase Dashboard → SQL Editor to check current data state
-- ============================================================================

-- 1. CHECK USER_PROFILES TABLE
-- ============================================================================
SELECT 
  'user_profiles' as table_name,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE vitalization_status = 'VITALIZED') as vitalized_count,
  COUNT(*) FILTER (WHERE vitalization_status = 'NOT_VITALIZED') as not_vitalized_count,
  COUNT(*) FILTER (WHERE vitalization_status IS NULL) as null_status_count,
  SUM(spendable_vida) as total_spendable_vida,
  SUM(locked_vida) as total_locked_vida
FROM user_profiles;

-- 2. CHECK VITALIZATION_LOG TABLE
-- ============================================================================
SELECT 
  'vitalization_log' as table_name,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE status = 'SUCCESS') as success_count,
  COUNT(*) FILTER (WHERE status = 'FAILED') as failed_count,
  COUNT(*) FILTER (WHERE status = 'PENDING') as pending_count,
  SUM(citizen_vida) as total_citizen_vida,
  SUM(treasury_vida) as total_treasury_vida,
  SUM(foundation_vida) as total_foundation_vida,
  MIN(timestamp) as first_vitalization,
  MAX(timestamp) as last_vitalization
FROM vitalization_log;

-- 3. CHECK VIDA_DISTRIBUTION_LOG TABLE
-- ============================================================================
SELECT 
  'vida_distribution_log' as table_name,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE status = 'SUCCESS') as success_count,
  COUNT(*) FILTER (WHERE status = 'FAILED') as failed_count,
  SUM(citizen_vida) as total_citizen_vida,
  SUM(treasury_vida) as total_treasury_vida,
  SUM(foundation_vida) as total_foundation_vida,
  SUM(total_vida) as total_vida_distributed,
  MIN(timestamp) as first_distribution,
  MAX(timestamp) as last_distribution
FROM vida_distribution_log;

-- 4. SAMPLE VITALIZED USERS (FIRST 10)
-- ============================================================================
SELECT 
  phone_number,
  sovereign_id,
  vitalization_status,
  vitalized_at,
  spendable_vida,
  locked_vida,
  humanity_score,
  is_minted
FROM user_profiles
WHERE vitalization_status = 'VITALIZED'
ORDER BY vitalized_at DESC
LIMIT 10;

-- 5. RECENT VITALIZATION EVENTS (LAST 10)
-- ============================================================================
SELECT 
  phone_number,
  sovereign_id,
  citizen_vida,
  treasury_vida,
  foundation_vida,
  status,
  timestamp,
  error_message
FROM vitalization_log
ORDER BY timestamp DESC
LIMIT 10;

-- 6. RECENT VIDA DISTRIBUTIONS (LAST 10)
-- ============================================================================
SELECT 
  phone_number,
  sovereign_id,
  citizen_vida,
  treasury_vida,
  foundation_vida,
  total_vida,
  status,
  timestamp,
  error_message
FROM vida_distribution_log
ORDER BY timestamp DESC
LIMIT 10;

-- ============================================================================
-- CLEANUP COMMANDS (OPTIONAL - USE WITH CAUTION)
-- ============================================================================
-- Uncomment and run these ONLY if you want to purge all vitalization data

-- PURGE ALL VITALIZATION LOGS (CANNOT BE UNDONE)
-- DELETE FROM vitalization_log;
-- DELETE FROM vida_distribution_log;

-- RESET ALL USER VITALIZATION STATUS (CANNOT BE UNDONE)
-- UPDATE user_profiles 
-- SET 
--   vitalization_status = 'NOT_VITALIZED',
--   vitalized_at = NULL,
--   vitalization_tx_hash = NULL,
--   spendable_vida = 0,
--   locked_vida = 0,
--   is_minted = false,
--   humanity_score = 0
-- WHERE vitalization_status = 'VITALIZED';

-- ============================================================================
-- VERIFICATION AFTER CLEANUP
-- ============================================================================
-- Run this after cleanup to verify all data is purged:
-- SELECT COUNT(*) FROM vitalization_log; -- Should return 0
-- SELECT COUNT(*) FROM vida_distribution_log; -- Should return 0
-- SELECT COUNT(*) FROM user_profiles WHERE vitalization_status = 'VITALIZED'; -- Should return 0


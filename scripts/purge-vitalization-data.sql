-- ============================================================================
-- PURGE VITALIZATION DATA - CLEAN START
-- ============================================================================
-- ⚠️ WARNING: THIS WILL DELETE ALL VITALIZATION DATA
-- ⚠️ THIS OPERATION CANNOT BE UNDONE
-- ============================================================================
-- Run this in Supabase Dashboard → SQL Editor ONLY if you want a clean start
-- ============================================================================

-- STEP 1: BACKUP CHECK (OPTIONAL)
-- ============================================================================
-- Before purging, verify what will be deleted:

SELECT 'BACKUP CHECK - Data to be deleted:' as info;

SELECT 
  'user_profiles' as table_name,
  COUNT(*) FILTER (WHERE vitalization_status = 'VITALIZED') as vitalized_users,
  SUM(spendable_vida) FILTER (WHERE vitalization_status = 'VITALIZED') as total_spendable_vida,
  SUM(locked_vida) FILTER (WHERE vitalization_status = 'VITALIZED') as total_locked_vida
FROM user_profiles;

SELECT 
  'vitalization_log' as table_name,
  COUNT(*) as total_records,
  SUM(citizen_vida) as total_citizen_vida,
  SUM(treasury_vida) as total_treasury_vida,
  SUM(foundation_vida) as total_foundation_vida
FROM vitalization_log;

SELECT 
  'vida_distribution_log' as table_name,
  COUNT(*) as total_records,
  SUM(total_vida) as total_vida_distributed
FROM vida_distribution_log;

-- ============================================================================
-- STEP 2: PURGE ALL VITALIZATION LOGS
-- ============================================================================
-- Delete all vitalization event logs

DELETE FROM vitalization_log;

-- Verify deletion
SELECT 'vitalization_log purged' as status, COUNT(*) as remaining_records 
FROM vitalization_log;

-- ============================================================================
-- STEP 3: PURGE ALL VIDA DISTRIBUTION LOGS
-- ============================================================================
-- Delete all VIDA distribution logs

DELETE FROM vida_distribution_log;

-- Verify deletion
SELECT 'vida_distribution_log purged' as status, COUNT(*) as remaining_records 
FROM vida_distribution_log;

-- ============================================================================
-- STEP 4: RESET ALL USER VITALIZATION STATUS
-- ============================================================================
-- Reset all users to NOT_VITALIZED state

UPDATE user_profiles 
SET 
  vitalization_status = 'NOT_VITALIZED',
  vitalized_at = NULL,
  vitalization_tx_hash = NULL,
  spendable_vida = 0,
  locked_vida = 0,
  is_minted = false,
  humanity_score = 0,
  updated_at = NOW()
WHERE vitalization_status = 'VITALIZED';

-- Verify reset
SELECT 'user_profiles reset' as status, 
  COUNT(*) FILTER (WHERE vitalization_status = 'VITALIZED') as vitalized_count,
  COUNT(*) FILTER (WHERE vitalization_status = 'NOT_VITALIZED') as not_vitalized_count
FROM user_profiles;

-- ============================================================================
-- STEP 5: VERIFICATION
-- ============================================================================
-- Verify all data has been purged

SELECT '=== PURGE VERIFICATION ===' as info;

SELECT 
  'vitalization_log' as table_name,
  COUNT(*) as records,
  CASE WHEN COUNT(*) = 0 THEN '✅ CLEAN' ELSE '❌ NOT CLEAN' END as status
FROM vitalization_log;

SELECT 
  'vida_distribution_log' as table_name,
  COUNT(*) as records,
  CASE WHEN COUNT(*) = 0 THEN '✅ CLEAN' ELSE '❌ NOT CLEAN' END as status
FROM vida_distribution_log;

SELECT 
  'user_profiles (vitalized)' as table_name,
  COUNT(*) FILTER (WHERE vitalization_status = 'VITALIZED') as records,
  CASE WHEN COUNT(*) FILTER (WHERE vitalization_status = 'VITALIZED') = 0 
    THEN '✅ CLEAN' 
    ELSE '❌ NOT CLEAN' 
  END as status
FROM user_profiles;

-- ============================================================================
-- STEP 6: RESET AUTO-INCREMENT SEQUENCES (OPTIONAL)
-- ============================================================================
-- If you want to reset any sequences, uncomment these:

-- ALTER SEQUENCE IF EXISTS vitalization_log_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS vida_distribution_log_id_seq RESTART WITH 1;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

SELECT 
  '✅ VITALIZATION DATA PURGE COMPLETE' as status,
  NOW() as purged_at,
  'Database is ready for clean vitalization testing' as message;

